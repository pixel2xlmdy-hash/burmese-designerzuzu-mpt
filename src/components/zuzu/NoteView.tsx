import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteRecord } from "@/lib/store";
import type { NoteData, TailorRecord } from "@/lib/tailor";

export function NoteView({
  record,
  onBack,
  onEdit,
}: {
  record: TailorRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  const n = record.data as NoteData;
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-12 pt-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate font-display text-xl font-bold text-primary">
          {n.title || "မှတ်စု"}
        </h2>
        <Button variant="soft" size="icon-lg" onClick={onEdit} aria-label="Edit">
          <Pencil />
        </Button>
        <Button variant="soft" size="icon-lg" className="text-destructive" onClick={() => setConfirm(true)} aria-label="Delete">
          <Trash2 />
        </Button>
      </div>
      <article className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-card">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {n.name && <span>👤 {n.name}</span>}
          {n.phone && <a href={`tel:${n.phone}`}>📞 {n.phone}</a>}
          {n.date && <span>📅 {n.date}</span>}
        </div>
        <p className="whitespace-pre-wrap text-base leading-loose">{n.body}</p>
      </article>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ဤမှတ်စုကို ဖျက်မှာ သေချာပါသလား?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>မဖျက်ပါ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteRecord(record.id);
                toast.success("ဖျက်ပြီးပါပြီ");
                onBack();
              }}
            >
              ဖျက်မည်
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
