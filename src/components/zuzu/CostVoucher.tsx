import { forwardRef, useEffect, useState } from "react";

import { LOGO_FALLBACK } from "@/lib/brand";
import {
  COST_NOTE_LABEL,
  COST_SIGNATURES,
  COST_TOTAL_LABEL,
  costRowAmount,
  costTotals,
  formatAmount,
  parseAmount,
  type CostBrand,
  type CostVoucherData,
  type SigSlot,
} from "@/lib/tailor";

const isBurmese = (t: string) => /[\u1000-\u109F]/.test(t);

function BrandLogo({ src }: { src: string }) {
  const [cur, setCur] = useState(src);
  useEffect(() => setCur(src), [src]);
  return (
    <img
      src={cur || LOGO_FALLBACK}
      alt=""
      crossOrigin={cur.startsWith("data:") || cur.startsWith("/") ? undefined : "anonymous"}
      onError={() => setCur(LOGO_FALLBACK)}
      className="h-[78px] w-[104px] shrink-0 rounded-lg bg-ink object-cover"
      draggable={false}
    />
  );
}

function Sig({ slot }: { slot: SigSlot }) {
  const text = slot.text?.trim() ?? "";
  if (slot.mode === "type") {
    if (!text) return null;
    return (
      <span
        className={
          isBurmese(text)
            ? "font-display text-[16px] font-semibold leading-tight text-ink"
            : "font-script text-[22px] italic leading-none text-ink"
        }
      >
        {text}
      </span>
    );
  }
  return slot.img ? <img src={slot.img} alt="" className="max-h-[52px] max-w-full object-contain" /> : null;
}

const money = (n: number) => (n ? formatAmount(n) : "");

/** Tailoring & Fashion Design Cost Voucher. Fixed 760px design width; printing and exports use this node. */
export const CostVoucher = forwardRef<HTMLDivElement, { data: CostVoucherData; brand: CostBrand }>(
  function CostVoucher({ data, brand }, ref) {
    const t = costTotals(data);
    const n = data.rows.length;
    const th = "border border-primary/40 px-1.5 py-1 font-semibold";
    const td = "border border-border px-1.5 py-[3px] align-middle";
    return (
      <div
        ref={ref}
        className="print-voucher-container voucher-card w-[760px] bg-paper p-6 text-ink"
        style={{ lineHeight: 1.4 }}
      >
        <div className="rounded-xl border-2 border-gold/70 p-4">
          {/* Header */}
          <div className="flex items-center gap-3 border-b-2 border-primary/80 pb-3">
            <BrandLogo src={brand.logo} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[24px] font-bold leading-tight text-primary">
                မြောက်ပြင်သူ <span className="font-script text-[20px] italic text-gold">MAUK PYIN THU</span>
              </div>
              <div className="font-script text-[17px] italic leading-tight text-primary">Clothing Designer</div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                Traditional • Event • Wedding Wear
              </div>
            </div>
            <div className="max-w-[220px] text-right text-[11px] leading-relaxed text-muted-foreground">
              <div className="font-display text-[12.5px] font-bold leading-snug text-primary">
                Tailoring &amp; Fashion Design Cost Voucher
              </div>
              <div className="font-semibold text-ink">{brand.designer}</div>
              <div>📞 {brand.phones}</div>
            </div>
          </div>

          {/* Voucher details */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 border-b border-border py-2 text-[12px]">
            {(
              [
                ["Voucher No.", data.voucherNo],
                ["Date", data.date],
                ["Customer Name", data.customerName],
                ["Phone", data.phone],
                ["Design Name", data.designName],
                ["Garment Type", data.garmentType],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-1.5 border-b border-dotted border-border py-[2px]">
                <span className="shrink-0 text-muted-foreground">{label}:</span>
                <span className="min-w-0 truncate font-semibold">{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Items */}
          <table className="mt-2.5 w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="bg-secondary text-primary">
                <th className={`${th} w-[34px]`}>No.</th>
                <th className={`${th} text-left`}>Description (ပစ္စည်းအမျိုးအမည်)</th>
                <th className={`${th} w-[46px]`}>Qty</th>
                <th className={`${th} w-[92px]`}>Unit Price (Kyat)</th>
                <th className={`${th} w-[100px]`}>Amount (Kyat)</th>
                <th className={`${th} w-[110px]`}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={r.id}>
                  <td className={`${td} text-center`}>{i + 1}</td>
                  <td className={td}>{r.label || "—"}</td>
                  <td className={`${td} text-center`}>{r.qty}</td>
                  <td className={`${td} text-right`}>{r.unitPrice ? formatAmount(parseAmount(r.unitPrice)) : ""}</td>
                  <td className={`${td} text-right font-semibold`}>{money(costRowAmount(r))}</td>
                  <td className={`${td} text-[10.5px]`}>{r.remark}</td>
                </tr>
              ))}
              <tr>
                <td className={`${td} text-center`}>{n + 1}</td>
                <td className={td} colSpan={5}>
                  <span className="text-muted-foreground">{COST_NOTE_LABEL}: </span>
                  <span className="whitespace-pre-wrap">{data.note}</span>
                </td>
              </tr>
              <tr className="bg-champagne/60 font-bold text-primary">
                <td className={`${td} text-center`}>{n + 2}</td>
                <td className={td} colSpan={3}>
                  {COST_TOTAL_LABEL}
                </td>
                <td className={`${td} text-right text-[13px]`}>{formatAmount(t.total)}</td>
                <td className={td}>Kyat</td>
              </tr>
            </tbody>
          </table>

          {/* Financials */}
          <div className="mt-2.5 grid grid-cols-2 gap-3 text-[12px]">
            <div className="space-y-1 rounded-lg bg-secondary p-2.5">
              <div className="flex justify-between">
                <span>Advance Payment (ကြိုတင်ငွေ)</span>
                <span className="font-semibold">{formatAmount(t.advance)} Kyat</span>
              </div>
              <div className="flex justify-between border-t border-primary/40 pt-1 text-[13.5px] font-bold text-primary">
                <span>Balance Amount (လက်ကျန်ငွေ)</span>
                <span>{formatAmount(t.balance)} Kyat</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-gold/60 p-2 text-center">
              <div>
                <div className="text-[10.5px] text-muted-foreground">Total Cost</div>
                <div className="font-semibold">{formatAmount(t.total)}</div>
              </div>
              <div className="border-x border-border">
                <div className="text-[10.5px] text-muted-foreground">Profit (%)</div>
                <div className="font-semibold">{formatAmount(t.profitPercent)}%</div>
              </div>
              <div>
                <div className="text-[10.5px] text-muted-foreground">Selling Price</div>
                <div className="font-bold text-primary">{formatAmount(t.sellingPrice)}</div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center font-script text-[22px] italic text-primary">
            Thank You for your trust <span className="not-italic">❤️</span>
          </div>

          {/* Signatures */}
          <div className="mt-1 grid grid-cols-4 gap-3">
            {COST_SIGNATURES.map((s) => (
              <div key={s.key} className="flex flex-col justify-end">
                <div className="flex h-[54px] items-end justify-center pb-1">
                  <Sig slot={data.signatures[s.key]} />
                </div>
                <div className="border-t border-ink/60 pt-0.5 text-center text-[10.5px] leading-tight text-muted-foreground">
                  {s.en}
                  <br />({s.my})
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 border-t border-border pt-1.5 text-center font-script text-[14px] italic text-gold">
            {brand.motto}
          </div>
        </div>
      </div>
    );
  },
);
