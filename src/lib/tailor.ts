// Pure, browser-safe helpers for tailor records: types, money, dates, search, merging.

export type RecordKind = "measurement" | "note" | "cost";

export interface MeasurementData {
  name: string;
  phone: string;
  date: string; // DD/MM/YYYY
  dueDate: string;
  eventDate: string;
  fields: Record<string, string>;
  elbowNote: string;
  backWaist: string[]; // 6 slots (older records may hold 5)
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
  data: MeasurementData | NoteData | CostVoucherData;
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
    backWaist: ["", "", "", "", "", ""],
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

/** Pads or trims a slot list to exactly `n` entries. */
export function fitSlots(values: string[] | undefined, n: number): string[] {
  return [...(values ?? []), ...Array<string>(n).fill("")].slice(0, n);
}

export const BACK_WAIST_SLOTS = 6;

/* ---------- cost voucher ---------- */

export interface SigSlot {
  mode: SigMode;
  img: string; // data URL when drawn
  text: string; // typed name
}

/** One billing line. `label` is the editable description. */
export interface CostRow {
  id: string;
  label: string;
  qty: string;
  unitPrice: string;
  remark: string;
}

/** Shop-wide cost voucher branding (logo, designer, phones, motto). */
export interface CostBrand {
  logo: string; // URL or data URL
  designer: string;
  phones: string;
  motto: string;  
title?: string;
  subtitle?: string;
}

export type CostSigKey = "received" | "prepared" | "checked" | "approved";

/** A Tailoring & Fashion Design Cost Voucher (its own record, kind "cost"). */
export interface CostVoucherData {
  voucherNo: string;
  date: string; // DD/MM/YYYY
  customerId: string; // linked measurement record, "" for a new customer
  customerName: string;
  phone: string;
  designName: string;
  garmentType: string;
  rows: CostRow[];
  note: string;
  advance: string;
  profitPercent: string;
  signatures: Record<CostSigKey, SigSlot>;
  /** Set when the shop branding was last saved from this voucher; the newest one is used everywhere. */
  brand?: Partial<CostBrand>;
  brandAt?: string; // ISO
}

/** Default description labels for rows 1–10, in the shop's required order. Every label is editable. */
export const COST_PRESETS: string[] = [
  "🧵 Fabric Cost (ပိတ်စ)",
  "📐 Interlining / Fusing (ကော်ပိတ်ဖိုး)",
  "📿 Beads & Stones (ပုတီး၊ ကျောက်မြတ်)",
  "🎀 Accessories (ထုပ်သီး၊ ဇစ်၊ ကြယ်သီး၊ အုံခွက်)",
  "💎 Sequins (စီးကွင့်)",
  "🪡 Handmade / Hand Embroidery (လက်ခ)",
  "🌸 Decorative Work (အလှဆင်လုပ်အားခ)",
  "✏️ Design Fee (ဒီဇိုင်းဖန်တီးခ)",
  "✂️ Other Expenses (အခြားအထွေထွေကုန်ကျစရိတ်)",
  "👗 Tailoring Charges (အထည်ချုပ်ခ)",
];

export const COST_NOTE_LABEL = "Additional Note (အထွေထွေမှတ်ချက်)";
export const COST_TOTAL_LABEL = "🧵 Tailoring Charges + Materials Total (အထည်ချုပ်ခ + ပစ္စည်းဖိုး စုစုပေါင်း)";

export const COST_SIGNATURES: { key: CostSigKey; en: string; my: string }[] = [
  { key: "received", en: "Received By", my: "လက်ခံသူ" },
  { key: "prepared", en: "Prepared By", my: "အပ်ချုပ်သူ" },
  { key: "checked", en: "Checked By", my: "စစ်ဆေးသူ" },
  { key: "approved", en: "Approved By", my: "ခွင့်ပြုသူ" },
];

export const DEFAULT_COST_BRAND: CostBrand = {
  logo: "/brand-logo.jpg",
  designer: "Designer: Zu Zu",
  phones: "09789104156 | 09940744566",
  motto: "Fashion is not just clothing, it's an art of life.",
    title: "MPT FIT TAILOR PRO",
  subtitle: "Designer Zu Zu",
};

let rowSeq = 0;
export function newCostRow(label = ""): CostRow {
  rowSeq += 1;
  return { id: `r${Date.now().toString(36)}${rowSeq}`, label, qty: "", unitPrice: "", remark: "" };
}

const emptySig = (): SigSlot => ({ mode: "draw", img: "", text: "" });

export function emptyCost(voucherNo: string, date: string): CostVoucherData {
  return {
    voucherNo,
    date,
    customerId: "",
    customerName: "",
    phone: "",
    designName: "",
    garmentType: "",
    rows: COST_PRESETS.map((l) => newCostRow(l)),
    note: "",
    advance: "",
    profitPercent: "",
    signatures: { received: emptySig(), prepared: emptySig(), checked: emptySig(), approved: emptySig() },
  };
}

/** Fills in anything missing from an older or partial cost voucher. */
export function normalizeCost(c: Partial<CostVoucherData>): CostVoucherData {
  const base = emptyCost(c.voucherNo ?? "", c.date ?? "");
  return {
    ...base,
    ...c,
    rows: Array.isArray(c.rows) ? c.rows.map((r) => ({ ...newCostRow(), ...r })) : base.rows,
    signatures: { ...base.signatures, ...(c.signatures ?? {}) },
  };
}

/** Amount = Qty × Unit Price. A blank Qty counts as 1; no unit price means no amount. */
export function costRowAmount(row: Pick<CostRow, "qty" | "unitPrice"> | undefined): number {
  if (!row || !row.unitPrice?.trim()) return 0;
  const qty = row.qty?.trim() ? parseAmount(row.qty) : 1;
  return qty * parseAmount(row.unitPrice);
}

export interface CostTotals {
  /** The "Tailoring Charges + Materials Total" row and "Total Cost": sum of every item row. */
  total: number;
  advance: number;
  /** Total − Advance Payment. */
  balance: number;
  profitPercent: number;
  /** Total Cost + Total Cost × Profit% / 100. */
  sellingPrice: number;
}

export function costTotals(c: Pick<CostVoucherData, "rows" | "advance" | "profitPercent">): CostTotals {
  const total = c.rows.reduce((sum, r) => sum + costRowAmount(r), 0);
  const advance = parseAmount(c.advance);
  const profitPercent = parseAmount(c.profitPercent);
  return {
    total,
    advance,
    balance: total - advance,
    profitPercent,
    sellingPrice: total + (total * profitPercent) / 100,
  };
}

/** Next 6-digit voucher number: one more than the highest number already used. */
export function nextVoucherNo(records: TailorRecord[]): string {
  let max = 0;
  for (const r of records) {
    if (r.kind !== "cost") continue;
    const no = (r.data as CostVoucherData).voucherNo;
    const n = no ? Number.parseInt(toAsciiDigits(no).replace(/\D/g, ""), 10) : 0;
    if (Number.isFinite(n) && n > max) max = n;
  }
  return String(max + 1).padStart(6, "0");
}

/** Shop branding for cost vouchers: the most recently saved branding (synced through any voucher), else defaults. */
export function shopCostBrand(records: TailorRecord[]): CostBrand {
  let latest: CostVoucherData | null = null;
  for (const r of records) {
    if (r.kind !== "cost") continue;
    const d = r.data as CostVoucherData;
    if (d.brandAt && (!latest || d.brandAt > (latest.brandAt ?? ""))) latest = d;
  }
  const b = latest?.brand ?? {};
  return {
    logo: b.logo?.trim() || DEFAULT_COST_BRAND.logo,
    designer: b.designer?.trim() || DEFAULT_COST_BRAND.designer,
    phones: b.phones?.trim() || DEFAULT_COST_BRAND.phones,
    motto: b.motto?.trim() || DEFAULT_COST_BRAND.motto,
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
  if (r.kind === "cost") return (r.data as CostVoucherData).customerName;
  const n = r.data as NoteData;
  return n.name || n.title;
}

export function recordPhone(r: TailorRecord): string {
  return (r.data as { phone?: string }).phone ?? "";
}

/** Filters records by customer name or phone number (case-insensitive, Burmese digits ok). */
export function filterRecords(records: TailorRecord[], query: string): TailorRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records;
  const qDigits = toAsciiDigits(q).replace(/\D/g, "");
  return records.filter((r) => {
    const name = recordName(r).toLowerCase();
    const title =
      r.kind === "note"
        ? (r.data as NoteData).title.toLowerCase()
        : r.kind === "cost"
          ? `${(r.data as CostVoucherData).voucherNo} ${(r.data as CostVoucherData).designName}`.toLowerCase()
          : "";
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
      (r) => !!r && typeof r.id === "string" && (r.kind === "measurement" || r.kind === "note" || r.kind === "cost") && !!r.data,
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
