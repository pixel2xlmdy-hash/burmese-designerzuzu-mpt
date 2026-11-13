import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Receipt, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { costTotals, filterRecords, formatAmount, type CostVoucherData } from "@/lib/tailor";

/** Cost voucher hub: every saved cost voucher, newest first, plus a "new" button. */
export function CostVoucherList({
  onBack,
  onNew,
  onOpen,
}: {
  onBack: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const vouchers = useMemo(
    () =>
      Object.values(store.records)
        .filter((r) => r.kind === "cost" && !r.deleted)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [store.records],
  );
  const shown = useMemo(() => filterRecords(vouchers, query), [vouchers, query]);

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12 pt-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate font-display text-xl font-bold text-primary">
          🧾 ဘောင်ချာ စလစ်များ
          <span className="ml-2 rounded-full bg-champagne px-2 align-middle text-xs text-accent-foreground">
            {vouchers.length}
          </span>
        </h2>
      </div>

      <Button variant="burgundy" size="xl" className="w-full" onClick={onNew}>
        <Plus className="!size-5" /> ဘောင်ချာ စလစ် အသစ် (New Cost Voucher)
      </Button>

      <div className="relative">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Customer အမည်၊ ဖုန်း သို့မဟုတ် Voucher No. ဖြင့် ရှာရန်..."
          aria-label="Search cost vouchers"
          className="h-12 rounded-full border-border bg-card pl-5 pr-10 text-[15px] shadow-soft"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {!store.ready ? null : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold/50 bg-card/60 px-6 py-10 text-center text-sm text-muted-foreground">
            {query ? "ရှာဖွေမှုနှင့် ကိုက်ညီသော ဘောင်ချာ မရှိပါ" : "ဘောင်ချာ မရှိသေးပါ — အပေါ်ရှိ ခလုတ်ဖြင့် စတင်ပါ"}
          </div>
        ) : (
          shown.map((r) => {
            const d = r.data as CostVoucherData;
            const t = costTotals(d);
            return (
              <button
                key={r.id}
                onClick={() => onOpen(r.id)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-card transition active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-burgundy-gradient text-primary-foreground">
                  <Receipt className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block truncate text-[17px] font-semibold text-foreground">
                    {d.customerName || "အမည်မသိ"}
                  </span>
                  <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>No. {d.voucherNo || "—"}</span>
                    {d.date && <span>{d.date}</span>}
                    {d.designName && <span className="truncate">{d.designName}</span>}
                  </span>
                  <span className="block text-sm font-semibold text-primary">{formatAmount(t.total)} ကျပ်</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </button>
            );
          })
        )}
      </div>
    </main>
  );
}
