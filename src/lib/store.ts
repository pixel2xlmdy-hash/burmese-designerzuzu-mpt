// Local-first record store: localStorage is the source of truth on the device,
// and Lovable Cloud keeps every signed-in device in sync (push pending → pull → realtime).
import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { pickNewer, type TailorRecord } from "./tailor";

const RECORDS_KEY = "zuzu.records.v1";
const PENDING_KEY = "zuzu.pending.v1";
const LAST_SYNC_KEY = "zuzu.lastSync.v1";

export interface StoreState {
  ready: boolean;
  records: Record<string, TailorRecord>;
  pending: string[];
  userId: string | null;
  email: string | null;
  online: boolean;
  syncing: boolean;
  lastSync: string | null;
  error: string | null;
}

const initialState: StoreState = {
  ready: false,
  records: {},
  pending: [],
  userId: null,
  email: null,
  online: true,
  syncing: false,
  lastSync: null,
  error: null,
};

let state: StoreState = initialState;
const listeners = new Set<() => void>();
let started = false;
let channel: RealtimeChannel | null = null;
let syncQueued = false;

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(state.records));
    localStorage.setItem(PENDING_KEY, JSON.stringify(state.pending));
    if (state.lastSync) localStorage.setItem(LAST_SYNC_KEY, state.lastSync);
  } catch (e) {
    console.error("Could not save to this device", e);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore(): StoreState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initialState,
  );
}

/* ---------- local mutations ---------- */

function newId(): string {
  return crypto.randomUUID();
}

export function createRecord(kind: TailorRecord["kind"], data: TailorRecord["data"]): TailorRecord {
  const now = new Date().toISOString();
  return { id: newId(), kind, data, deleted: false, createdAt: now, updatedAt: now };
}

function writeLocal(records: TailorRecord[]) {
  const next = { ...state.records };
  const pending = new Set(state.pending);
  for (const r of records) {
    next[r.id] = r;
    pending.add(r.id);
  }
  setState({ records: next, pending: [...pending] });
  persist();
  void syncNow();
}

export function saveRecord(record: TailorRecord) {
  writeLocal([{ ...record, updatedAt: new Date().toISOString() }]);
}

export function deleteRecord(id: string) {
  const r = state.records[id];
  if (!r) return;
  writeLocal([{ ...r, deleted: true, updatedAt: new Date().toISOString() }]);
}

export function exportBackup(): string {
  const records = Object.values(state.records).filter((r) => !r.deleted);
  return JSON.stringify(
    { app: "myauk-pyin-thu", version: 1, exportedAt: new Date().toISOString(), records },
    null,
    2,
  );
}

/** Imports a JSON backup; newer copies win. Returns how many records were added/updated. */
export function importBackup(json: string): number {
  const parsed = JSON.parse(json) as { records?: TailorRecord[] } | TailorRecord[];
  const list = Array.isArray(parsed) ? parsed : (parsed.records ?? []);
  const valid = list.filter(
    (r) => r && typeof r.id === "string" && (r.kind === "measurement" || r.kind === "note") && r.data,
  );
  const changed: TailorRecord[] = [];
  for (const r of valid) {
    const merged = pickNewer(state.records[r.id], {
      ...r,
      deleted: !!r.deleted,
      createdAt: r.createdAt ?? new Date().toISOString(),
      updatedAt: r.updatedAt ?? new Date().toISOString(),
    });
    if (merged !== state.records[r.id]) changed.push(merged);
  }
  if (changed.length) writeLocal(changed);
  return changed.length;
}

/* ---------- cloud sync ---------- */

type Row = {
  id: string;
  user_id: string;
  kind: string;
  data: unknown;
  deleted: boolean;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: Row): TailorRecord {
  return {
    id: row.id,
    kind: row.kind === "note" ? "note" : "measurement",
    data: row.data as TailorRecord["data"],
    deleted: row.deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mergeRemote(rows: Row[]) {
  if (!rows.length) return;
  const next = { ...state.records };
  let changed = false;
  for (const row of rows) {
    const incoming = rowToRecord(row);
    const picked = pickNewer(next[incoming.id], incoming);
    if (picked !== next[incoming.id]) {
      next[incoming.id] = picked;
      changed = true;
    }
  }
  if (changed) {
    setState({ records: next });
    persist();
  }
}

export async function syncNow(): Promise<void> {
  if (!state.userId || !state.online) return;
  if (state.syncing) {
    syncQueued = true;
    return;
  }
  setState({ syncing: true, error: null });
  try {
    // 1) push pending local changes
    const pendingIds = [...state.pending];
    const toPush = pendingIds
      .map((id) => state.records[id])
      .filter((r): r is TailorRecord => !!r);
    if (toPush.length) {
      const rows = toPush.map((r) => ({
        id: r.id,
        user_id: state.userId!,
        kind: r.kind,
        data: r.data as never,
        deleted: r.deleted,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      }));
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase
          .from("tailor_records")
          .upsert(rows.slice(i, i + 200), { onConflict: "id" });
        if (error) throw error;
      }
      // Clear only records that did not change while we were pushing.
      const pushed = new Map(toPush.map((r) => [r.id, r.updatedAt]));
      setState({
        pending: state.pending.filter((id) => pushed.get(id) !== state.records[id]?.updatedAt),
      });
    }

    // 2) pull everything for this account
    const all: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("tailor_records")
        .select("*")
        .order("updated_at", { ascending: true })
        .range(from, from + 999);
      if (error) throw error;
      all.push(...((data ?? []) as Row[]));
      if (!data || data.length < 1000) break;
    }
    mergeRemote(all);
    setState({ lastSync: new Date().toISOString() });
    persist();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    setState({ error: message });
  } finally {
    setState({ syncing: false });
    if (syncQueued) {
      syncQueued = false;
      void syncNow();
    }
  }
}

function subscribeRealtime(userId: string) {
  unsubscribeRealtime();
  channel = supabase
    .channel(`tailor-${userId}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tailor_records", filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as Row | undefined;
        if (row && row.id) mergeRemote([row]);
      },
    )
    .subscribe();
}

function unsubscribeRealtime() {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
}

function onSignedIn(userId: string, email: string | null) {
  const firstForThisUser = state.userId !== userId;
  // Upload everything already on this device the first time an account connects.
  const pending = firstForThisUser ? Object.keys(state.records) : state.pending;
  setState({ userId, email, pending });
  persist();
  subscribeRealtime(userId);
  void syncNow();
}

/* ---------- lifecycle ---------- */

/** Call once from a useEffect on the client. */
export function startStore() {
  if (started || typeof window === "undefined") return;
  started = true;

  let records: Record<string, TailorRecord> = {};
  let pending: string[] = [];
  try {
    records = JSON.parse(localStorage.getItem(RECORDS_KEY) || "{}");
    pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    /* corrupted storage: start empty */
  }
  setState({
    ready: true,
    records,
    pending,
    online: navigator.onLine,
    lastSync: localStorage.getItem(LAST_SYNC_KEY),
  });

  window.addEventListener("online", () => {
    setState({ online: true });
    void syncNow();
  });
  window.addEventListener("offline", () => setState({ online: false }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow();
  });

  void supabase.auth.getSession().then(({ data }) => {
    const u = data.session?.user;
    if (u) onSignedIn(u.id, u.email ?? null);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    // Defer: never await other Supabase calls inside this callback.
    setTimeout(() => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        if (state.userId !== session.user.id) onSignedIn(session.user.id, session.user.email ?? null);
      } else if (event === "SIGNED_OUT") {
        unsubscribeRealtime();
        setState({ userId: null, email: null, error: null });
      }
    }, 0);
  });
}

export async function sendEmailCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
  const u = data.user ?? data.session?.user;
  if (u) onSignedIn(u.id, u.email ?? email);
}

export async function disconnectCloud() {
  await supabase.auth.signOut();
  unsubscribeRealtime();
  setState({ userId: null, email: null });
}
