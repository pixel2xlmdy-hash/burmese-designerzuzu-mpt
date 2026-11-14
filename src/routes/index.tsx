import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Plus, Receipt, Ruler, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/zuzu/AppHeader";
import { CostVoucherForm } from "@/components/zuzu/CostVoucherForm";
import { CostVoucherList } from "@/components/zuzu/CostVoucherList";
import { CostVoucherView } from "@/components/zuzu/CostVoucherView";
import { FooterCards } from "@/components/zuzu/FooterCards";
import { MeasurementForm } from "@/components/zuzu/MeasurementForm";
import { NoteForm } from "@/components/zuzu/NoteForm";
import { NoteView } from "@/components/zuzu/NoteView";
import { RecordCard } from "@/components/zuzu/RecordCard";
import { SettingsSheet } from "@/components/zuzu/SettingsSheet";
import { SocialBar } from "@/components/zuzu/SocialBar";
import { Splash } from "@/components/zuzu/Splash";
import { VoucherView } from "@/components/zuzu/VoucherView";
import { registerOfflineSupport } from "@/lib/pwa-register";
import { startStore, useStore } from "@/lib/store";
import { filterRecords, type RecordKind } from "@/lib/tailor";
import { AdBanner } from "@/components/zuzu/AdBanner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "မြောက်ပြင်သူ - Designer Zu Zu | Tailor Measurement Book" },
      {
        name: "description",
        content:
          "မြောက်ပြင်သူ Designer Zu Zu — customer ကိုယ်တိုင်း မှတ်တမ်း၊ voucher နှင့် ဖုန်းများကြား Cloud Sync ပါသော အပ်ချုပ်ဆိုင် App။",
      },
      { property: "og:title", content: "မြောက်ပြင်သူ - Designer Zu Zu" },
      {
        property: "og:description",
        content: "Burmese boutique tailor measurement book with A4 vouchers and multi-device cloud sync.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type View =
  | { type: "list" }
  | { type: "editMeasurement"; id: string | null }
  | { type: "viewMeasurement"; id: string }
  | { type: "editNote"; id: string | null }
  | { type: "viewNote"; id: string }
  | { type: "costList" }
  | { type: "editCost"; id: string | null }
  | { type: "viewCost"; id: string };

function Index() {
  const store = useStore();
  const [splash, setSplash] = useState(true);
  const [settings, setSettings] = useState(false);
  const [tab, setTab] = useState<RecordKind>("measurement");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ type: "list" });

  useEffect(() => {
    startStore();
    registerOfflineSupport();
  }, []);
  const endSplash = useCallback(() => setSplash(false), []);

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const live = useMemo(
    () =>
      Object.values(store.records)
        .filter((r) => !r.deleted)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [store.records],
  );
  const counts = useMemo(
    () => ({
      measurement: live.filter((r) => r.kind === "measurement").length,
      note: live.filter((r) => r.kind === "note").length,
      cost: live.filter((r) => r.kind === "cost").length,
    }),
    [live],
  );
  const shown = useMemo(
    () => filterRecords(live.filter((r) => r.kind === tab), query),
    [live, tab, query],
  );

  const current = "id" in view && view.id ? store.records[view.id] : undefined;

  let body: ReactNode;
  let isList = false;
  if (view.type === "costList") {
    body = (
      <CostVoucherList
        onBack={() => go({ type: "list" })}
        onNew={() => go({ type: "editCost", id: null })}
        onOpen={(id) => go({ type: "viewCost", id })}
      />
    );
  } else if (view.type === "editCost") {
    body = (
      <CostVoucherForm
        key={view.id ?? "new"}
        record={current ?? null}
        onDone={(saved) =>
          go(saved ? { type: "viewCost", id: saved.id } : view.id ? { type: "viewCost", id: view.id } : { type: "costList" })
        }
      />
    );
  } else if (view.type === "viewCost" && current && !current.deleted) {
    body = (
      <CostVoucherView
        record={current}
        onBack={() => go({ type: "costList" })}
        onEdit={() => go({ type: "editCost", id: current.id })}
      />
    );
  } else if (view.type === "editMeasurement") {
    body = (
      <MeasurementForm
        key={view.id ?? "new"}
        record={current ?? null}
        onDone={(saved) => go(saved ? { type: "viewMeasurement", id: saved.id } : view.id ? { type: "viewMeasurement", id: view.id } : { type: "list" })}
      />
    );
  } else if (view.type === "editNote") {
    body = <NoteForm key={view.id ?? "new"} record={current ?? null} onDone={() => go({ type: "list" })} />;
  } else if (view.type === "viewMeasurement" && current && !current.deleted) {
    body = (
      <VoucherView
        record={current}
        onBack={() => go({ type: "list" })}
        onEdit={() => go({ type: "editMeasurement", id: current.id })}
      />
    );
  } else if (view.type === "viewNote" && current && !current.deleted) {
    body = (
      <NoteView
        record={current}
        onBack={() => go({ type: "list" })}
        onEdit={() => go({ type: "editNote", id: current.id })}
      />
    );
  } else {
    isList = true;
    body = (
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-3">
        <div className="relative">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Customer အမည် သို့မဟုတ် ဖုန်းနံပါတ်ဖြင့် ရှာရန်..."
            aria-label="Search customers"
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

        <Button
          variant="burgundy"
          size="xl"
          className="w-full"
          onClick={() => go({ type: "editMeasurement", id: null })}
        >
          <Plus className="!size-5" /> တိုင်းတာမှု အသစ် (New Measurement)
        </Button>

        <Button variant="champagne" size="xl" className="w-full" onClick={() => go({ type: "costList" })}>
          <Receipt className="!size-5" /> 🧾 ပြေစာ / ဘောင်ချာ စလစ် ထုတ်မည်
          {counts.cost > 0 && (
            <span className="rounded-full bg-card px-2 text-xs text-primary">{counts.cost}</span>
          )}
        </Button>

        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {(
            [
              { k: "note", label: "အထွေထွေ မှတ်စုများ", en: "General Notes", Icon: NotebookPen },
              { k: "measurement", label: "ကိုယ်တိုင်း မှတ်တမ်းများ", en: "Tailor Measurements", Icon: Ruler },
            ] as const
          ).map(({ k, label, en, Icon }) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "flex flex-col items-center rounded-full px-2 py-2 text-center text-[13px] leading-tight transition",
                tab === k ? "bg-card font-semibold text-primary shadow-soft" : "text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-1">
                <Icon className="h-3.5 w-3.5" /> {label}
                <span className="ml-0.5 rounded-full bg-champagne px-1.5 text-[10px] text-accent-foreground">
                  {counts[k]}
                </span>
              </span>
              <span className="text-[10.5px] opacity-70">{en}</span>
            </button>
          ))}
        </div>

        {tab === "note" && (
          <Button variant="champagne" size="pill" className="w-full" onClick={() => go({ type: "editNote", id: null })}>
            <Plus /> မှတ်စု အသစ်
          </Button>
        )}

        <div className="space-y-2.5">
          {!store.ready ? null : shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gold/50 bg-card/60 px-6 py-10 text-center text-sm text-muted-foreground">
              {query
                ? "ရှာဖွေမှုနှင့် ကိုက်ညီသော မှတ်တမ်း မရှိပါ"
                : tab === "measurement"
                  ? "တိုင်းတာမှု မှတ်တမ်း မရှိသေးပါ — အပေါ်ရှိ ခလုတ်ဖြင့် စတင်ပါ"
                  : "မှတ်စု မရှိသေးပါ"}
            </div>
          ) : (
            shown.map((r) => (
              <RecordCard
                key={r.id}
                record={r}
                onOpen={() =>
                  go(r.kind === "measurement" ? { type: "viewMeasurement", id: r.id } : { type: "viewNote", id: r.id })
                }
              />
            ))
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      {splash && <Splash onDone={endSplash} />}
      <div className="no-print">
        <AppHeader store={store} onSettings={() => setSettings(true)} />
        {isList && <SocialBar />}
      </div>
      {body}
      {isList && (
        <div className="no-print">
          <FooterCards />
        </div>
      )}
      <AdBanner />
      <SettingsSheet open={settings} onOpenChange={setSettings} store={store} />
    </div>
  );
}
