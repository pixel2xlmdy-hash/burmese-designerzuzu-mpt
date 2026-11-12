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
import { imageFileToDataUrl, urlToDataUrl } from "@/lib/download";
import { DEFAULT_COST_BRAND, type CostBrand } from "@/lib/tailor";

/** Edits the shop's cost voucher branding. Applies to every cost voucher and syncs to all signed-in phones. */
export function CostBrandDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: CostBrand;
  onSave: (v: CostBrand) => void;
}) {
  const [form, setForm] = useState<CostBrand>(value);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(value);
  }, [open, value]);

  const set = (k: keyof CostBrand, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isData = form.logo.startsWith("data:");

  const upload = async (file: File) => {
    try {
      set("logo", await imageFileToDataUrl(file, 480));
    } catch {
      toast.error("ပုံ ဖွင့်မရပါ");
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const logo = form.logo.trim();
      // Web images are copied in so photo export and offline use keep working.
      const keep = !logo || logo.startsWith("data:") || logo.startsWith("/");
      onSave({
        logo: keep ? logo || DEFAULT_COST_BRAND.logo : await urlToDataUrl(logo),
        designer: form.designer.trim() || DEFAULT_COST_BRAND.designer,
        phones: form.phones.trim() || DEFAULT_COST_BRAND.phones,
        motto: form.motto.trim() || DEFAULT_COST_BRAND.motto,
      });
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
          <DialogTitle className="font-display text-lg text-primary">⚙️ ဘောင်ချာ အချက်အလက် ပြင်ဆင်ရန်</DialogTitle>
          <DialogDescription>
            Cost Voucher အားလုံးတွင် ပြောင်းလဲမည်ဖြစ်ပြီး ချိတ်ဆက်ထားသော ဖုန်းအားလုံးသို့ Sync ဖြစ်ပါမည်။
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cb-logo">1) Shop Logo (URL သို့မဟုတ် ပုံတင်ရန်)</Label>
            <div className="flex items-center gap-2">
              {form.logo ? (
                <img src={form.logo} alt="" className="h-11 w-14 shrink-0 rounded-md bg-ink object-cover" />
              ) : null}
              <Input
                id="cb-logo"
                value={isData ? "📷 ဖုန်းထဲမှ ပုံ" : form.logo}
                readOnly={isData}
                placeholder="https://..."
                onChange={(e) => set("logo", e.target.value)}
                className="h-11 min-w-0 flex-1 text-base"
              />
              {form.logo !== DEFAULT_COST_BRAND.logo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Use default logo"
                  onClick={() => set("logo", DEFAULT_COST_BRAND.logo)}
                >
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
            <Label htmlFor="cb-designer">2) Designer Name</Label>
            <Input
              id="cb-designer"
              value={form.designer}
              placeholder={DEFAULT_COST_BRAND.designer}
              onChange={(e) => set("designer", e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cb-phones">3) Contact Phone Numbers</Label>
            <Input
              id="cb-phones"
              inputMode="tel"
              value={form.phones}
              placeholder={DEFAULT_COST_BRAND.phones}
              onChange={(e) => set("phones", e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cb-motto">4) Bottom Motto / Greeting</Label>
            <Input
              id="cb-motto"
              value={form.motto}
              placeholder={DEFAULT_COST_BRAND.motto}
              onChange={(e) => set("motto", e.target.value)}
              className="h-11 text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setForm(DEFAULT_COST_BRAND)}>
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
