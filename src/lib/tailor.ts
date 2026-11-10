// Pure, browser-safe helpers for tailor records: types, money, dates, search, merging.

export type RecordKind = "measurement" | "note";

export interface MeasurementData {
  name: string;
  phone: string;
  date: string; // DD/MM/YYYY
  dueDate: string;
  eventDate: string;
  fields: Record<string, string>;
  elbowNote: string;
  backWaist: string[]; // 5 slots
  sleeveLength: string[]; // 4 slots
  sleeveOpening: string[]; // 4 slots
  notes: string;
  total: string;
  deposit: string;
  designerSig: string; // data URL
  customerSig: string;
  /** "draw" = canvas signature, "type" = typed name. Missing means "draw" (older records). */
  designerSigMode?: SigMode;
  customerSigMode?: SigMode;
  designerSigText?: string;
  customerSigText?: string;
  /** Per-voucher header/footer overrides; empty values fall back to the shop defaults. */
  voucher?: Partial<VoucherCustom>;
}

export type SigMode = "draw" | "type";

export interface VoucherCustom {
  title: string;
  logo: string; // URL or data URL
  contact: string;
  footer: string;
}

export interface NoteData {
  title: string;
  body: string;
  name: string;
  phone: string;
  date: string;
}

export interface TailorRecord {
  id: string;
  kind: RecordKind;
  data: MeasurementData | NoteData;
  deleted: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export const BODY_FIELDS: { key: string; my: string; en: string }[] = [
  { key: "neck", my: "လည်ပင်း", en: "Neck" },
  { key: "shoulder", my: "ပခုံး", en: "Shoulder" },
  { key: "bust", my: "ရင်", en: "Bust" },
  { key: "chestDistance", my: "ရင်ကွာ", en: "Chest Distance" },
  { key: "chestDrop", my: "ရင်ကျ", en: "Chest Drop" },
  { key: "bustPointDrop", my: "ရင်ထိပ်ကျ", en: "Bust Point Drop" },
  { key: "frontChestWidth", my: "ရှေ့ရင်ကျယ်", en: "Front Chest Width" },
  { key: "frontWaistLength", my: "ရှေ့ခါးရှည်", en: "Front Waist Length" },
  { key: "waist", my: "ခါး", en: "Waist" },
  { key: "backWidth", my: "နောက်ကျောကျယ်", en: "Back Width" },
  { key: "armhole", my: "ဂျိုင်း", en: "Armhole" },
  { key: "bicep", my: "လက်မောင်း", en: "Bicep" },
  { key: "elbow", my: "လက်အိုး", en: "Elbow" },
  { key: "hip", my: "တင်", en: "Hip" },
  { key: "hipDrop", my: "တင်ကျ", en: "Hip Drop" },
  { key: "highHip", my: "တင်သေး", en: "High Hip" },
  { key: "lengthFromWaist", my: "ခါးမှအောက်ရှည်", en: "Length from Waist" },
];

export function emptyMeasurement(today: string): MeasurementData {
  return {
    name: "",
    phone: "",
    date: today,
    dueDate: "",
    eventDate: "",
    fields: {},
    elbowNote: "",
    backWaist: ["", "", "", "", ""],
    sleeveLength: ["", "", "", ""],
    sleeveOpening: ["", "", "", ""],
    notes: "",
    total: "",
    deposit: "",
    designerSig: "",
    customerSig: "",
    designerSigMode: "draw",
    customerSigMode: "draw",
    designerSigText: "",
    customerSigText: "",
    voucher: {},
  };
}

export function emptyNote(today: string): NoteData {
  return { title: "", body: "", name: "", phone: "", date: today };
}

/* ---------- digits & money ---------- */

const MY_DIGITS = "၀၁၂၃၄၅၆၇၈၉";

/** Converts Burmese digits (၀-၉) to ASCII digits. */
export function toAsciiDigits(value: string): string {
  return value.replace(/[၀-၉]/g, (d) => String(MY_DIGITS.indexOf(d)));
}

/** Parses a money string such as "150,000" or "၁၅၀၀၀၀" into a number (0 when empty/invalid). */
export function parseAmount(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = toAsciiDigits(String(value)).replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Balance remaining = Total price minus Deposit / Paid. */
export function computeBalance(total: string, deposit: string): number {
  return parseAmount(total) - parseAmount(deposit);
}

export function formatAmount(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/* ---------- dates (DD/MM/YYYY) ---------- */

const pad = (n: number) => String(n).padStart(2, "0");

export function toDMY(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Parses DD/MM/YYYY (also accepts - or . separators). Returns null for invalid dates. */
export function parseDMY(value: string): Date | null {
  const m = toAsciiDigits(value.trim()).match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Auto-inserts slashes while typing a DD/MM/YYYY date. */
export function maskDMY(raw: string): string {
  const digits = toAsciiDigits(raw).replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/* ---------- search ---------- */

export function recordName(r: TailorRecord): string {
  if (r.kind === "measurement") return (r.data as MeasurementData).name;
  const n = r.data as NoteData;
  return n.name || n.title;
}

export function recordPhone(r: TailorRecord): string {
  return (r.data as MeasurementData | NoteData).phone ?? "";
}

/** Filters records by customer name or phone number (case-insensitive, Burmese digits ok). */
export function filterRecords(records: TailorRecord[], query: string): TailorRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records;
  const qDigits = toAsciiDigits(q).replace(/\D/g, "");
  return records.filter((r) => {
    const name = recordName(r).toLowerCase();
    const title = r.kind === "note" ? (r.data as NoteData).title.toLowerCase() : "";
    if (name.includes(q) || title.includes(q)) return true;
    if (qDigits.length > 0) {
      const phone = toAsciiDigits(recordPhone(r)).replace(/\D/g, "");
      if (phone.includes(qDigits)) return true;
    }
    return false;
  });
}

/* ---------- sync merge ---------- */

/** Last-write-wins: returns the incoming record only if it is newer than the local one. */
export function pickNewer(local: TailorRecord | undefined, incoming: TailorRecord): TailorRecord {
  if (!local) return incoming;
  return Date.parse(incoming.updatedAt) > Date.parse(local.updatedAt) ? incoming : local;
}

/* ---------- backup import ---------- */

/** Reads a backup file (full shop backup, single-customer file, or a bare array). Throws on bad JSON. */
export function parseBackupRecords(json: string): TailorRecord[] {
  const parsed = JSON.parse(json) as { records?: unknown } | unknown[];
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { records?: unknown }).records)
      ? ((parsed as { records: unknown[] }).records)
      : [];
  const now = new Date().toISOString();
  return (list as Partial<TailorRecord>[])
    .filter(
      (r) => !!r && typeof r.id === "string" && (r.kind === "measurement" || r.kind === "note") && !!r.data,
    )
    .map((r) => ({
      id: r.id!,
      kind: r.kind!,
      data: r.data!,
      deleted: !!r.deleted,
      createdAt: r.createdAt ?? now,
      updatedAt: r.updatedAt ?? now,
    }));
}

/**
 * Decides what an imported record does to the local copy. Returns the record to save, or null for no change.
 * Never touches other customers; a newer local copy wins; a locally deleted customer is restored.
 */
export function mergeImported(
  local: TailorRecord | undefined,
  incoming: TailorRecord,
  now: string,
): TailorRecord | null {
  if (incoming.deleted) return null;
  if (!local) return incoming;
  if (local.deleted) return { ...incoming, deleted: false, updatedAt: now };
  const picked = pickNewer(local, incoming);
  return picked === local ? null : picked;
}

export function safeFilePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "customer";
}
