import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRecord, saveRecord } from "@/lib/store";
import { emptyNote, toDMY, type NoteData, type TailorRecord } from "@/lib/tailor";
import { DateField } from "./DateField";

export function NoteForm({
  record,
  onDone,
}: {
  record: TailorRecord | null;
  onDone: () => void;
}) {
  const [data, setData] = useState<NoteData>(() => ({
    ...emptyNote(toDMY(new Date())),
    ...((record?.data as NoteData) ?? {}),
  }));
  const set = <K extends keyof NoteData>(k: K, v: NoteData[K]) => setData((d) => ({ ...d, [k]: v }));

  const save = () => {
    if (!data.title.trim() && !data.body.trim()) {
      toast.error("ခေါင်းစဉ် သို့မဟုတ် မှတ်စု ရေးပါ");
      return;
    }
    saveRecord(record ? { ...record, data } : createRecord("note", data));
    toast.success("မှတ်စု သိမ်းပြီးပါပြီ");
    onDone();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-28 pt-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onDone} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="font-display text-xl font-bold text-primary">
          {record ? "မှတ်စု ပြင်ရန်" : "မှတ်စု အသစ်"}
        </h2>
      </div>
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <div className="space-y-1.5">
          <Label htmlFor="n-title">ခေါင်းစဉ်</Label>
          <Input id="n-title" value={data.title} onChange={(e) => set("title", e.target.value)} className="h-11 text-base" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="n-name">Customer အမည်</Label>
            <Input id="n-name" value={data.name} onChange={(e) => set("name", e.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-phone">ဖုန်းနံပါတ်</Label>
            <Input id="n-phone" type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-date">ရက်စွဲ</Label>
            <DateField id="n-date" value={data.date} onChange={(v) => set("date", v)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="n-body">မှတ်စု</Label>
          <Textarea id="n-body" rows={8} value={data.body} onChange={(e) => set("body", e.target.value)} className="text-base" />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <Button variant="soft" size="xl" className="flex-1" onClick={onDone}>
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
