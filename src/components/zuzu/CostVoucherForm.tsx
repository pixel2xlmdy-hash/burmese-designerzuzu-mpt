import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRecord, saveRecord, useStore } from "@/lib/store";
import {
  COST_NOTE_LABEL,
  COST_SIGNATURES,
  COST_TOTAL_LABEL,
  costRowAmount,
  costTotals,
  emptyCost,
  formatAmount,
  newCostRow,
  nextVoucherNo,
  normalizeCost,
  toDMY,
  type CostRow,
  type CostSigKey,
  type CostVoucherData,
  type MeasurementData,
  type SigSlot,
  type TailorRecord,
} from "@/lib/tailor";
import { DateField } from "./DateField";
import { SignaturePad } from "./SignaturePad";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-primary">
        <span className="h-4 w-1 rounded-full bg-gold" />
        {title}
      </h3>
      {children}
    </section>
  );
}

const fieldInput = "h-11 bg-background/60 text-base";

export function CostVoucherForm({
  record,
  customerId,
  onDone,
}: {
  record: TailorRecord | null;
  /** Pre-select this measurement customer for a new voucher. */
  customerId?: string;
  onDone: (saved: TailorRecord | null) => void;
}) {
  const store = useStore();
  const customers = useMemo(
    () =>
      Object.values(store.records)
        .filter((r) => r.kind === "measurement" && !r.deleted)
        .map((r) => ({ id: r.id, ...(r.data as MeasurementData) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [store.records],
  );

  const [data, setData] = useState<CostVoucherData>(() => {
    if (record) return normalizeCost(record.data as CostVoucherData);
    const base = emptyCost(nextVoucherNo(Object.values(store.records)), toDMY(new Date()));
    const c = customerId ? store.records[customerId] : undefined;
    if (c && c.kind === "measurement") {
      const m = c.data as MeasurementData;
      return { ...base, customerId: c.id, customerName: m.name, phone: m.phone };
    }
    return base;
  });

  const set = <K extends keyof CostVoucherData>(key: K, value: CostVoucherData[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setRow = (id: string, patch: Partial<CostRow>) =>
    setData((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const setSig = (key: CostSigKey, patch: Partial<SigSlot>) =>
    setData((d) => ({ ...d, signatures: { ...d.signatures, [key]: { ...d.signatures[key], ...patch } } }));

  const pickCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    setData((d) =>
      c ? { ...d, customerId: c.id, customerName: c.name, phone: c.phone } : { ...d, customerId: "" },
    );
  };

  const t = costTotals(data);
  const n = data.rows.length;

  const save = () => {
    if (!data.customerName.trim()) {
      toast.error("Customer အမည် ထည့်ပါ");
      return;
    }
    const next: TailorRecord = record ? { ...record, data } : createRecord("cost", data);
    saveRecord(next);
    toast.success("ဘောင်ချာ သိမ်းဆည်းပြီးပါပြီ");
    onDone(next);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-28 pt-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onDone(null)} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="font-display text-xl font-bold text-primary">
          {record ? "ဘောင်ချာ ပြင်ရန်" : "🧾 ဘောင်ချာ စလစ် အသစ်"}
        </h2>
      </div>

      <Section title="ဘောင်ချာ အချက်အလက်">
        <div className="space-y-1.5">
          <Label htmlFor="c-customer">သိမ်းထားသော Customer ရွေးရန်</Label>
          <select
            id="c-customer"
            value={data.customerId}
            onChange={(e) => pickCustomer(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Customer အသစ် (ကိုယ်တိုင်ရိုက်ထည့်မည်) —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "—"}
                {c.phone ? ` · ${c.phone}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-no">Voucher No.</Label>
            <Input id="c-no" inputMode="numeric" value={data.voucherNo} onChange={(e) => set("voucherNo", e.target.value)} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-date">Date</Label>
            <DateField id="c-date" value={data.date} onChange={(v) => set("date", v)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Customer Name</Label>
            <Input id="c-name" value={data.customerName} onChange={(e) => set("customerName", e.target.value)} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Phone Number</Label>
            <Input id="c-phone" type="tel" inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-design">Designer Name</Label>
            <Input id="c-design" value={data.designName} onChange={(e) => set("designName", e.target.value)} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-garment">Garment Type</Label>
            <Input id="c-garment" value={data.garmentType} onChange={(e) => set("garmentType", e.target.value)} className={fieldInput} />
          </div>
        </div>
      </Section>

      <Section title="ပစ္စည်း စာရင်း (Items)">
        <p className="text-xs text-muted-foreground">
          ပစ္စည်းအမည် တိုင်းကို ပြင်ရေးနိုင်ပါသည်။ Qty မထည့်ပါက ၁ ဟု တွက်ပါမည်။
        </p>
        <div className="space-y-2.5">
          {data.rows.map((r, i) => (
            <div key={r.id} className="space-y-2 rounded-xl border border-border bg-background/50 p-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <Input
                  aria-label={`Row ${i + 1} description`}
                  value={r.label}
                  placeholder="ပစ္စည်းအမျိုးအမည်"
                  onChange={(e) => setRow(r.id, { label: e.target.value })}
                  className="h-10 min-w-0 flex-1 bg-card text-[15px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  aria-label={`Delete row ${i + 1}`}
                  onClick={() => setData((d) => ({ ...d, rows: d.rows.filter((x) => x.id !== r.id) }))}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-[0.7fr_1.2fr_1.2fr] gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Qty</span>
                  <Input
                    aria-label={`Row ${i + 1} qty`}
                    inputMode="decimal"
                    value={r.qty}
                    onChange={(e) => setRow(r.id, { qty: e.target.value })}
                    className="h-10 bg-card px-2 text-center text-base"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Unit Price (Kyat)</span>
                  <Input
                    aria-label={`Row ${i + 1} unit price`}
                    inputMode="decimal"
                    value={r.unitPrice}
                    onChange={(e) => setRow(r.id, { unitPrice: e.target.value })}
                    className="h-10 bg-card px-2 text-right text-base"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Amount (Kyat)</span>
                  <div className="flex h-10 items-center justify-end rounded-md bg-secondary px-2 font-semibold text-primary">
                    {formatAmount(costRowAmount(r))}
                  </div>
                </div>
              </div>
              <Input
                aria-label={`Row ${i + 1} remark`}
                value={r.remark}
                placeholder="Remark"
                onChange={(e) => setRow(r.id, { remark: e.target.value })}
                className="h-9 bg-card text-sm"
              />
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="champagne"
          size="pill"
          className="w-full"
          onClick={() => setData((d) => ({ ...d, rows: [...d.rows, newCostRow()] }))}
        >
          <Plus /> Row အသစ် ထည့်မည် (Add Item)
        </Button>

        <div className="space-y-1.5 pt-1">
          <Label htmlFor="c-note">
            {n + 1}. {COST_NOTE_LABEL}
          </Label>
          <Textarea id="c-note" rows={2} value={data.note} onChange={(e) => set("note", e.target.value)} className="bg-background/60 text-base" />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-burgundy-gradient px-4 py-3 text-primary-foreground">
          <span className="text-[13px] leading-snug">
            {n + 2}. {COST_TOTAL_LABEL}
          </span>
          <span className="shrink-0 font-display text-xl font-bold">{formatAmount(t.total)} ကျပ်</span>
        </div>
      </Section>

      <Section title="ငွေစာရင်း">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-advance">Advance Payment (ကြိုတင်ငွေ)</Label>
            <Input id="c-advance" inputMode="decimal" value={data.advance} onChange={(e) => set("advance", e.target.value)} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Balance (လက်ကျန်ငွေ)</span>
            <div className="flex h-11 items-center justify-end rounded-md bg-secondary px-3 font-display text-lg font-bold text-primary">
              {formatAmount(t.balance)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium">Total Cost</span>
            <div className="flex h-11 items-center justify-end rounded-md bg-secondary px-2 font-semibold">{formatAmount(t.total)}</div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-profit" className="text-xs">
              Profit (%)
            </Label>
            <Input id="c-profit" inputMode="decimal" value={data.profitPercent} onChange={(e) => set("profitPercent", e.target.value)} className="h-11 bg-background/60 text-center text-base" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium">Selling Price</span>
            <div className="flex h-11 items-center justify-end rounded-md bg-champagne px-2 font-bold text-primary">
              {formatAmount(t.sellingPrice)}
            </div>
          </div>
        </div>
      </Section>

      <Section title="လက်မှတ်များ">
        <div className="grid gap-4 sm:grid-cols-2">
          {COST_SIGNATURES.map((s) => (
            <SignaturePad
              key={s.key}
              label={`${s.en} (${s.my})`}
              value={data.signatures[s.key].img}
              onChange={(img) => setSig(s.key, { img })}
              mode={data.signatures[s.key].mode}
              onModeChange={(mode) => setSig(s.key, { mode })}
              text={data.signatures[s.key].text}
              onTextChange={(text) => setSig(s.key, { text })}
            />
          ))}
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <Button variant="soft" size="xl" className="flex-1" onClick={() => onDone(null)}>
            မလုပ်တော့ပါ
          </Button>
          <Button variant="burgundy" size="xl" className="flex-[2]" onClick={save}>
            <Save /> သိမ်းမည်
          </Button>
        </div>
      </div>
    </div>
  );
}
