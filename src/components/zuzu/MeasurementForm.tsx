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
  emptyMeasurementToDay,
  formatAmount,
  codeMY,
  type MeasurementData,
  type TailorRecord,
} from "@/lib/tailor";
import { DateField } from "./DateField";
import { SignaturePad } from "./SignaturePad";

// Extended interface for local form state safety
interface ExtendedMeasurementData extends MeasurementData {
  elbowNote?: string;
  designerSigMode?: "draw" | "text";
  designerSigText?: string;
  customerSigMode?: "draw" | "text";
  customerSigText?: string;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 font-display text-base font-bold text-primary">
        <span className="h-4 w-1 rounded-full bg-gold" />
        {title}
      </div>
      {children}
    </section>
  );
}

const fieldInput = "h-11 bg-background/60 text-base";

export function MeasurementForm({
  record,
  onDone,
}: {
  record: TailorRecord | null;
  onDone: (saved: TailorRecord | null) => void;
}) {
  const [data, setData] = useState<ExtendedMeasurementData>(() => {
    const base = emptyMeasurementToDay(new Date()) as ExtendedMeasurementData;
    if (!record || !record.data) return base;
    const d = record.data as ExtendedMeasurementData;
    return {
      ...base,
      ...d,
      fields: { ...base.fields, ...(d.fields || {}) },
      backwait: fitSlots(d.backwait || [], BACK_WAIST_SLOTS),
      sleeveLength: [...(d.sleeveLength ?? base.sleeveLength || ["", "", "", ""])].slice(0, 4),
      sleeveOpening: [...(d.sleeveOpening ?? base.sleeveOpening || ["", "", "", ""])].slice(0, 4),
    };
  });

  const setSlot = (key: "backwait" | "sleeveLength" | "sleeveOpening", index: number, value: string) => {
    setData((d) => {
      const targetArr = d[key] || ["", "", "", ""];
      const next = [...targetArr];
      next[index] = value;
      return { ...d, [key]: next };
    });
  };

  const setField = (key: string, value: string) => {
    setData((d) => ({ ...d, fields: { ...(d.fields || {}), [key]: value } }));
  };

  const balance = computeBalance(data.total || "0", data.deposit || "0");

  const save = () => {
    if (!data.name || !data.name.trim()) {
      toast.error("Customer နာမည် ထည့်ပါ");
      return;
    }
    const next: TailorRecord = record
      ? { ...record, data: data as MeasurementData }
      : createRecord("measurement", data as MeasurementData);
    saveRecord(next);
    toast.success("သိမ်းဆည်းပြီးပါပြီ");
    onDone(next);
  };

  const slotRow = (key: "backwait" | "sleeveLength" | "sleeveOpening", label: string) => (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(4, minmax(0, 1fr))` }}>
        {(data[key] || ["", "", "", ""]).map((v, i) => (
          <Input
            key={i}
            aria-label={`${label} ${i + 1}`}
            value={v || ""}
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
          {record ? "တိုင်းတာချက် ပြင်ဆင်ရန်" : "တိုင်းတာချက် အသစ်"}
        </h2>
      </div>

      <Section title="Customer အချက်အလက်">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="m-name">Customer နာမည်</label>
            <Input id="m-name" value={data.name || ""} onChange={(e) => setData({ ...data, name: e.target.value })} className={fieldInput} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-phone">ဖုန်းနံပါတ်</label>
            <Input id="m-phone" type="tel" inputMode="tel" value={data.phone || ""} onChange={(e) => setData({ ...data, phone: e.target.value })} className={fieldInput} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="m-date">တိုင်းသည့်ရက်စွဲ</label>
              <DateField id="m-date" value={data.date} onChange={(v) => setData({ ...data, date: v })} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="m-due">Fitting ရက်စွဲ</label>
              <DateField id="m-due" value={data.dueDate} onChange={(v) => setData({ ...data, dueDate: v })} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="m-event">ပွဲရက်စွဲ</label>
              <DateField id="m-event" value={data.eventDate} onChange={(v) => setData({ ...data, eventDate: v })} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="ကိုယ်ထည် (Body Measurements)">
        <p className="text-xs text-muted-foreground">36, 38, 34 / 36, 32 ^ 2, % စသည်ဖြင့် ထည့်နိုင်သည်</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
          {BODY_FIELDS.map((f) => {
            if (f.key === "elbow") {
              return (
                <div key={f.key} className="col-span-2 space-y-1.5 sm:col-span-3">
                  <label htmlFor="f-elbow" className="text-xs text-muted-foreground">
                    {f.my} <span className="text-xs text-muted-foreground">({f.en})</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="f-elbow"
                      value={data.fields?.["elbow"] ?? ""}
                      onChange={(e) => setField("elbow", e.target.value)}
                      placeholder="တံတောင် တိုင်းချက်"
                      className={fieldInput}
                    />
                    <Input
                      aria-label="တံတောင် Note"
                      placeholder="-/- Note"
                      value={data.elbowNote || ""}
                      onChange={(e) => setData({ ...data, elbowNote: e.target.value })}
                      className="h-11 border-dashed border-gold/50 bg-champagne/30 text-base"
                    />
                  </div>
                </div>
              );
            }
            return (
              <div key={f.key} className="space-y-1.5">
                <label htmlFor={`f-${f.key}`} className="block truncate">
                  {f.my} <span className="text-xs text-muted-foreground">({f.en})</span>
                </label>
                <Input
                  id={`f-${f.key}`}
                  value={data.fields?.[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className={fieldInput}
                />
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="လက် / ကာ (Multi-slot)">
        {slotRow("backwait", "ကျောကုန်းအရှည် (Back Waist Length)")}
        {slotRow("sleeveLength", "လက်အရှည် (Sleeve Length)")}
        {slotRow("sleeveOpening", "လက်ပတ်ဝိုင်း (Sleeve Opening / Wrist)")}
      </Section>

      <Section title="မှတ်ချက်များ">
        <Textarea value={data.notes || ""} onChange={(e) => setData({ ...data, notes: e.target.value })} />
      </Section>

      <Section title="ငွေစာရင်း">
        <div className="space-y-1.5">
          <label htmlFor="m-total">စုစုပေါင်း ကျသင့်ငွေ (Total Price)</label>
          <Input id="m-total" inputMode="decimal" value={data.total || ""} onChange={(e) => setData({ ...data, total: e.target.value })} className={fieldInput} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-deposit">စပေါ်ငွေ / ပေးပြီးငွေ (Deposit / Paid)</label>
          <Input id="m-deposit" inputMode="decimal" value={data.deposit || ""} onChange={(e) => setData({ ...data, deposit: e.target.value })} className={fieldInput} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-burgundy/10 p-3">
          <span className="text-sm">ကျန်ငွေ (Balance)</span>
          <span className="font-display text-xl font-bold">{formatAmount(balance)}</span>
        </div>
      </Section>

      <Section title="လက်မှတ်ထိုးရန်">
        <div className="grid gap-4 sm:grid-cols-2">
          <SignaturePad
            label="Designer လက်မှတ်"
            value={data.designerSig || ""}
            onChange={(v) => setData({ ...data, designerSig: v })}
            mode={data.designerSigMode ?? "draw"}
            onModeChange={(m) => setData({ ...data, designerSigMode: m })}
            text={data.designerSigText ?? ""}
            onTextChange={(t) => setData({ ...data, designerSigText: t })}
            placeholder="Designer Zu Zu"
          />
          <SignaturePad
            label="Customer လက်မှတ်"
            value={data.customerSig || ""}
            onChange={(v) => setData({ ...data, customerSig: v })}
            mode={data.customerSigMode ?? "draw"}
            onModeChange={(m) => setData({ ...data, customerSigMode: m })}
            text={data.customerSigText ?? ""}
            onTextChange={(t) => setData({ ...data, customerSigText: t })}
            placeholder="ဖောက်သည်"
          />
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <Button variant="soft" size="xl" className="flex-1" onClick={() => onDone(null)}>
            မလုပ်တော့ပါ
          </Button>
          <Button variant="burgundy" size="xl" className="flex-2" onClick={save}>
            <Save className="size-5" /> သိမ်းမည်
          </Button>
        </div>
      </div>
    </div>
  );
}
