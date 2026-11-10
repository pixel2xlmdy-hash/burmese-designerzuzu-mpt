import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BRAND_SUBTITLE, BRAND_TITLE } from "@/lib/brand";
import type { StoreState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export function AppHeader({ store, onSettings }: { store: StoreState; onSettings: () => void }) {
  const status = !store.online
    ? { label: "Offline", dot: "bg-offline" }
    : store.userId
      ? { label: store.syncing ? "Syncing…" : "Cloud Sync Active", dot: "bg-online", active: !store.syncing }
      : { label: "Local", dot: "bg-muted-foreground/50" };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <Logo className="h-12 w-12 shrink-0 gold-ring" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-tight text-primary">{BRAND_TITLE}</h1>
          <p className="font-script text-base italic leading-none tracking-wide text-gold">
            {BRAND_SUBTITLE}
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] shadow-soft",
            "active" in status && status.active ? "bg-event font-semibold text-event-foreground" : "bg-card text-muted-foreground",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", status.dot, store.syncing && "animate-pulse")} />
          {status.label}
        </span>
        <Button variant="soft" size="icon-lg" onClick={onSettings} aria-label="Settings">
          <Settings className="!size-5" />
        </Button>
      </div>
    </header>
  );
}
