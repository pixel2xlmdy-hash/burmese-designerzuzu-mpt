import { ChevronRight, NotebookPen, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { MeasurementData, NoteData, TailorRecord } from "@/lib/tailor";

export function RecordCard({ record, onOpen }: { record: TailorRecord; onOpen: () => void }) {
  if (record.kind === "note") {
    const n = record.data as NoteData;
    return (
      <button
        onClick={onOpen}
        className="group flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-card transition active:scale-[0.99]"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <NotebookPen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">
            {n.title || n.name || "မှတ်စု"}
          </span>
          {n.body && (
            <span className="line-clamp-2 text-sm text-muted-foreground">{n.body}</span>
          )}
          <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {n.name && n.title && <span>{n.name}</span>}
            {n.phone && <span>{n.phone}</span>}
            {n.date && <span>{n.date}</span>}
          </span>
        </span>
        <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
      </button>
    );
  }

  const m = record.data as MeasurementData;
  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-card transition active:scale-[0.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-burgundy-gradient font-display text-lg font-bold text-primary-foreground">
        {(m.name || "?").slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block truncate text-[17px] font-semibold text-foreground">
          {m.name || "အမည်မသိ"}
        </span>
        {m.phone && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> {m.phone}
          </span>
        )}
        {(m.dueDate || m.eventDate) && (
          <span className="flex flex-wrap gap-1.5 pt-0.5">
            {m.dueDate && <Badge variant="due">Due {m.dueDate}</Badge>}
            {m.eventDate && <Badge variant="event">Event {m.eventDate}</Badge>}
          </span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
    </button>
  );
}
