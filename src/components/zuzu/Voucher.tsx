import { forwardRef } from "react";

import { BRAND_SUBTITLE, BRAND_TITLE, PHONE_1, PHONE_2 } from "@/lib/brand";
import { BODY_FIELDS, computeBalance, formatAmount, parseAmount, type MeasurementData } from "@/lib/tailor";
import { Logo } from "./Logo";

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-dotted border-border py-[3px]">
      <span className="truncate text-[11.5px] text-muted-foreground">{label}</span>
      <span className="shrink-0 text-[13px] font-semibold text-ink">
        {value || "—"}
        {sub ? <span className="ml-1 text-[11px] font-normal text-primary">({sub})</span> : null}
      </span>
    </div>
  );
}

function Slots({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[150px] shrink-0 text-[11.5px] text-muted-foreground">{label}</span>
      <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0,1fr))` }}>
        {values.map((v, i) => (
          <span key={i} className="rounded border border-border px-1 py-[2px] text-center text-[12.5px] font-semibold text-ink">
            {v || "\u00a0"}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Compact A4 voucher. Fixed 760px design width; printing and photo export use this node. */
export const Voucher = forwardRef<HTMLDivElement, { data: MeasurementData }>(function Voucher(
  { data },
  ref,
) {
  const balance = computeBalance(data.total, data.deposit);
  return (
    <div
      ref={ref}
      className="print-voucher-container w-[760px] bg-paper p-6 text-ink"
      style={{ lineHeight: 1.45 }}
    >
      <div className="rounded-xl border-2 border-gold/70 p-4">
        {/* Header */}
        <div className="flex items-center gap-3 border-b-2 border-primary/80 pb-3">
          <Logo className="h-16 w-16" />
          <div className="flex-1">
            <div className="font-display text-[26px] font-bold leading-tight text-primary">{BRAND_TITLE}</div>
            <div className="font-script text-[17px] italic leading-none text-gold">{BRAND_SUBTITLE}</div>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed text-muted-foreground">
            <div>📞 {PHONE_1}</div>
            <div>📞 {PHONE_2}</div>
            <div className="mt-0.5 font-semibold text-primary">ကိုယ်တိုင်း မှတ်တမ်း</div>
          </div>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-5 gap-2 border-b border-border py-2.5 text-[12px]">
          <div className="col-span-2">
            <div className="text-muted-foreground">Customer အမည်</div>
            <div className="text-[15px] font-bold">{data.name || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ဖုန်း</div>
            <div className="font-semibold">{data.phone || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ရက်စွဲ</div>
            <div className="font-semibold">{data.date || "—"}</div>
          </div>
          <div className="space-y-0.5">
            <div>
              <span className="text-muted-foreground">ချိန်းရက် </span>
              <span className="font-semibold">{data.dueDate || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ပွဲနေ့ </span>
              <span className="font-semibold">{data.eventDate || "—"}</span>
            </div>
          </div>
        </div>

        {/* Body measurements */}
        <div className="grid grid-cols-3 gap-x-5 py-2">
          {BODY_FIELDS.map((f) => (
            <Cell
              key={f.key}
              label={f.my}
              value={data.fields[f.key] ?? ""}
              sub={f.key === "elbow" && data.elbowNote ? data.elbowNote : undefined}
            />
          ))}
        </div>

        {/* Multi-slots */}
        <div className="space-y-1.5 border-t border-border py-2.5">
          <Slots label="နောက်ခါးရှည်" values={data.backWaist} />
          <Slots label="လက်ရှည်" values={data.sleeveLength} />
          <Slots label="လက်ဝ" values={data.sleeveOpening} />
        </div>

        {data.notes && (
          <div className="border-t border-border py-2 text-[12px]">
            <span className="text-muted-foreground">မှတ်ချက်: </span>
            <span className="whitespace-pre-wrap">{data.notes}</span>
          </div>
        )}

        {/* Finance + signatures */}
        <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-4 border-t border-border pt-2.5">
          <div className="space-y-1 rounded-lg bg-secondary p-2.5 text-[12px]">
            <div className="flex justify-between">
              <span>စုစုပေါင်း ကျသင့်ငွေ</span>
              <span className="font-semibold">{formatAmount(parseAmount(data.total))}</span>
            </div>
            <div className="flex justify-between">
              <span>စရံငွေ / အကြေ</span>
              <span className="font-semibold">{formatAmount(parseAmount(data.deposit))}</span>
            </div>
            <div className="flex justify-between border-t border-primary/40 pt-1 text-[13.5px] font-bold text-primary">
              <span>လက်ကျန်ငွေ</span>
              <span>{formatAmount(balance)} ကျပ်</span>
            </div>
          </div>
          {(["designerSig", "customerSig"] as const).map((k) => (
            <div key={k} className="flex flex-col justify-end">
              <div className="flex h-[62px] items-end justify-center">
                {data[k] ? <img src={data[k]} alt="" className="max-h-[62px] max-w-full object-contain" /> : null}
              </div>
              <div className="border-t border-ink/60 pt-0.5 text-center text-[11px] text-muted-foreground">
                {k === "designerSig" ? "Designer လက်မှတ်" : "Customer လက်မှတ်"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2.5 text-center text-[10.5px] text-muted-foreground">
          👗 ပွဲတက်၊ ရိုးရာ၊ မင်္ဂလာဝတ်စုံ အပ်ထည်များ လက်ခံပါသည်။
        </div>
      </div>
    </div>
  );
});
