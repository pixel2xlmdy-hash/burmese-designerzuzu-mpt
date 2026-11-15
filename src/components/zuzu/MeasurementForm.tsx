import { useState, type ReactNode } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRecord, saveRecord } from "@/lib/store";
import {
  BACK_WAIST_SLOTS,
  BODY_FIELDS,
  fitSlots,
  computeBalance,
  emptyMeasurement,
  formatAmount,
  toDMY,
  type MeasurementData,
  type TailorRecord,
} from "@/lib/tailor";
import DateField from "./DateField";
import SignaturePad from "./SignaturePad";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-card">
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-primary">
        <span className="h-4 w-1 rounded-full bg-gold" />
        {title}
      </h3>
      {children}
    </section>
  );
}

const fieldInput = "h-11 bg-background/60 text-base";
const MY_NUMS = ["ဝ", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

export function MeasurementForm({
  record,
  onDone,
}: {
  record: TailorRecord | null;
  onDone: (saved: TailorRecord | null) => void;
}) {
  const [data, setData] = useState<MeasurementData>(() => {
    const base = emptyMeasurement(toDMY(new Date()));
    if (!record || !record.data) return base;
    const d = record.data as MeasurementData;
    return {
      ...base,
      ...d,
      fields: { ...(base.fields || {}), ...(d.fields || {}) },
      backWait: fitSlots(d.backwait, BACK_WAIST_SLOTS),
      sleeveLength: [...(d.sleeveLength ?? []), ...base.sleeveLength].slice(0, 4),
      sleeveOpening: [...(d.sleeveOpening ?? []), ...base.sleeveOpening].slice(0, 4),
    };
  });

  const set = <K extends keyof MeasurementData>(key: K, value: MeasurementData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };
  const setField = (key: string, value: string) => {
    setData((d) => ({ ...d, fields: { ...d.fields, [key]: value } }));
  };
  const setSlot = (key: "backwait" | "sleeveLength" | "sleeveOpening", i: number, v: string) => {
    setData((d) => {
      const next = [...d[key]];
      next[i] = v;
      return { ...d, [key]: next };
    });
  };

  const balance = computeBalance(data.total, data.deposit);

  const save = () => {
    if (!data.name.trim()) {
      toast.error("Customer အမည် ထည့်ပါ");
      return;
    }
    const next: TailorRecord = record
      ? { ...record, data }
      : createRecord("measurement", data);
    saveRecord(next);
    toast.success("သိမ်းဆည်းပြီးပါပြီ");
    onDone(next);
  };

  const slotRow = (key: "backwait" | "sleeveLength" | "sleeveOpening", label: string) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${data[key].length || 4}, minmax(0, 1fr))` }}>
        {data[key].map((v, i) => (
          <Input
            key={i}
            aria-label={`${label} ${i + 1}`}
            value={v}
            onChange={(e) => setSlot(key, i, e.target.value)}
            className="h-11 bg-background/60 px-1.5 text-center text-base"
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-28 pt-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onDone(null)} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="font-display text-xl font-bold text-primary">
          {record ? "တိုင်းတာမှု ပြင်ရန်" : "တိုင်းတာမှု အသစ်"}
        </h2>
      </div>

      <Section title="Customer အချက်အလက်">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Customer အမည်</Label>
            <Input id="m-name" value={data.name} onChange={(e) => set("name", e.target.value)} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-phone">ဖုန်းနံပါတ်</Label>
            <Input id="m-phone" type="tel" inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} className={fieldInput} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="m-date">ရက်စွဲ</Label>
            <DateField id="m-date" value={data.date} onChange={(v) => set("date", v)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-due">ချိန်ရက်</Label>
            <DateField id="m-due" value={data.dueDate} onChange={(v) => set("dueDate", v)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-event">ပွဲနေ့</Label>
            <DateField id="m-event" value={data.eventDate} onChange={(v) => set("eventDate", v)} />
          </div>
        </div>
      </Section>

      <Section title="ကိုယ်တိုင်း (Body Measurements)">
        <p className="text-xs text-muted-foreground">36 - 38, 34 / 36, 32 * 2, % စသည်ဖြင့် ရေးနိုင်သည်</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
          {BODY_FIELDS.map((f) => (
            f.key === "elbow" ? (
              <div key={f.key} className="col-span-2 space-y-1.5 sm:col-span-3">
                <Label htmlFor="f-elbow">
                  {f.my} <span className="text-xs text-muted-foreground">({f.en})</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input id="f-elbow" value={data.fields["elbow"] ?? ""} onChange={(e) => setField("elbow", e.target.value)} className={fieldInput} />
                  <Input
                    aria-label="တံတောင် +/- Note"
                    placeholder="+/- Note"
                    value={data.elbowNote}
                    onChange={(e) => set("elbowNote", e.target.value)}
                    className="h-11 border-dashed border-gold/60 bg-champagne/30 text-base"
                  />
                </div>
              </div>
            ) : (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`f-${f.key}`} className="block truncate">
                  {f.my} <span className="text-xs text-muted-foreground">({f.en})</span>
                </Label>
                <Input
                  id={`f-${f.key}`}
                  value={data.fields[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className={fieldInput}
                />
              </div>
            )
          ))}
        </div>
      </Section>

      <Section title="အထူး / အဝ (Multi-slot)">
        {slotRow("backwait", "နောက်ကျောရှည် (Back Waist Length)")}
        {slotRow("sleeveLength", "လက်ရှည် (Sleeve Length)")}
        {slotRow("sleeveOpening", "လက်ပတ် (Sleeve Opening / Wrist)")}
      </Section>

      <Section title="မှတ်ချက်">
        <Textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} />
      </Section>

      <Section title="ငွေစာရင်း">
        <div className="space-y-1.5">
          <Label htmlFor="m-total">စုစုပေါင်း ကျသင့်ငွေ (Total Price)</Label>
          <Input id="m-total" inputMode="decimal" value={data.total} onChange={(e) => set("total", e.target.value)} className={fieldInput} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-deposit">စရံငွေ / ပေးပြီးငွေ (Deposit / Paid)</Label>
          <Input id="m-deposit" inputMode="decimal" value={data.deposit} onChange={(e) => set("deposit", e.target.value)} className={fieldInput} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-burgundy/10 p-3">
          <span className="text-sm">လက်ကျန်ငွေ (Balance)</span>
          <span className="font-display text-xl font-bold">{formatAmount(balance)}</span>
        </div>
      </Section>

      <Section title="လက်မှတ်များ">
        <div className="grid gap-4 sm:grid-cols-2">
          <SignaturePad
            label="Designer လက်မှတ်"
            value={data.designerSig}
            onChange={(v) => set("designerSig", v)}
            mode={data.designerSigMode ?? "draw"}
            onModeChange={(m) => set("designerSigMode", m)}
            text={data.designerSigText ?? ""}
            onTextChange={(t) => set("designerSigText", t)}
            placeholder="Designer Zu Zu"
          />
          <SignaturePad
            label="Customer လက်မှတ်"
            value={data.customerSig}
            onChange={(v) => set("customerSig", v)}
            mode={data.customerSigMode ?? "draw"}
            onModeChange={(m) => set("customerSigMode", m)}
            text={data.customerSigText ?? ""}
            onTextChange={(t) => set("customerSigText", t)}
            placeholder="ဖောက်သည်"
          />
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <Button variant="soft" size="xl" className="flex-1" onClick={() => onDone(null)}>
            မလုပ်တော့ပါ
          </Button>
          <Button variant="burgundy" size="xl" className="flex-2" onClick={save}>
            <Save /> သိမ်းမည်
          </Button>
        </div>
      </div>
    </div>
  );
}
