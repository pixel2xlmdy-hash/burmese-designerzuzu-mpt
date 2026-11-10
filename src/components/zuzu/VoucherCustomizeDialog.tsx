import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, RotateCcw, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND_TITLE } from "@/lib/brand";
import { imageFileToDataUrl, urlToDataUrl } from "@/lib/download";
import type { VoucherCustom } from "@/lib/tailor";
import { DEFAULT_VOUCHER_CONTACT, DEFAULT_VOUCHER_FOOTER } from "./Voucher";

const empty: VoucherCustom = { title: "", logo: "", contact: "", footer: "" };

/** Edits only this voucher's header title, logo, contact info and footer note. App branding stays locked. */
export function VoucherCustomizeDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: Partial<VoucherCustom> | undefined;
  onSave: (v: Partial<VoucherCustom>) => void;
}) {
  const [form, setForm] = useState<VoucherCustom>(empty);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm({ ...empty, ...value });
  }, [open, value]);

  const set = (k: keyof VoucherCustom, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isData = form.logo.startsWith("data:");

  const upload = async (file: File) => {
    try {
      set("logo", await imageFileToDataUrl(file));
    } catch {
      toast.error("ပုံ ဖွင့်မရပါ");
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const logo = form.logo.trim();
      const next: Partial<VoucherCustom> = {
        title: form.title.trim(),
        logo: logo && !logo.startsWith("data:") ? await urlToDataUrl(logo) : logo,
        contact: form.contact.trim(),
        footer: form.footer.trim(),
      };
      onSave(next);
      onOpenChange(false);
      toast.success("ဘောင်ချာ အချက်အလက် သိမ်းပြီးပါပြီ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-primary">✏️ ဘောင်ချာ အချက်အလက် ပြင်ဆင်ရန်</DialogTitle>
          <DialogDescription>
            ဤဘောင်ချာ တစ်ခုတည်းအတွက်သာ ပြောင်းလဲမည်။ App ၏ အမှတ်တံဆိပ် မပြောင်းပါ။ ကွက်လပ်ထားပါက မူလအတိုင်း ပြပါမည်။
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vc-title">1) ဘောင်ချာ ခေါင်းစဉ် (Header Title)</Label>
            <Input
              id="vc-title"
              value={form.title}
              placeholder={BRAND_TITLE}
              onChange={(e) => set("title", e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vc-logo">2) Logo (URL သို့မဟုတ် ပုံတင်ရန်)</Label>
            <div className="flex items-center gap-2">
              {form.logo ? (
                <img src={form.logo} alt="" className="h-11 w-11 shrink-0 rounded-full bg-card object-cover" />
              ) : null}
              <Input
                id="vc-logo"
                value={isData ? "📷 ဖုန်းထဲမှ ပုံ" : form.logo}
                readOnly={isData}
                placeholder="https://..."
                onChange={(e) => set("logo", e.target.value)}
                className="h-11 min-w-0 flex-1 text-base"
              />
              {form.logo ? (
                <Button type="button" variant="ghost" size="icon" aria-label="Remove logo" onClick={() => set("logo", "")}>
                  <X />
                </Button>
              ) : null}
            </div>
            <Button type="button" variant="soft" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> ပုံ ရွေးမည်
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vc-contact">3) ဖုန်း / ဆက်သွယ်ရန်</Label>
            <Textarea
              id="vc-contact"
              rows={2}
              value={form.contact}
              placeholder={DEFAULT_VOUCHER_CONTACT}
              onChange={(e) => set("contact", e.target.value)}
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vc-footer">4) အောက်ခြေ မှတ်ချက် (Footer Note)</Label>
            <Textarea
              id="vc-footer"
              rows={2}
              value={form.footer}
              placeholder={DEFAULT_VOUCHER_FOOTER}
              onChange={(e) => set("footer", e.target.value)}
              className="text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setForm(empty)}>
            <RotateCcw /> မူလအတိုင်း
          </Button>
          <Button type="button" variant="burgundy" className="flex-1 sm:flex-none" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Save />} သိမ်းမည်
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
