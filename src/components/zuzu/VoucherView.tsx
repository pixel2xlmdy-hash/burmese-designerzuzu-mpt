import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BRAND_TITLE } from "@/lib/brand";
import { deleteRecord } from "@/lib/store";
import { safeFilePart, toDMY, type MeasurementData, type TailorRecord } from "@/lib/tailor";
import { Voucher } from "./Voucher";

const DESIGN_WIDTH = 760;

export function VoucherView({
  record,
  onBack,
  onEdit,
}: {
  record: TailorRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  const data = record.data as MeasurementData;
  const frameRef = useRef<HTMLDivElement>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Scale the fixed-width voucher down to fit phone screens.
  useLayoutEffect(() => {
    const fit = () => {
      const w = frameRef.current?.clientWidth ?? DESIGN_WIDTH;
      const s = Math.min(1, w / DESIGN_WIDTH);
      setScale(s);
      setHeight((voucherRef.current?.offsetHeight ?? 0) * s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (frameRef.current) ro.observe(frameRef.current);
    if (voucherRef.current) ro.observe(voucherRef.current);
    return () => ro.disconnect();
  }, []);

  const savePhoto = async () => {
    const node = voucherRef.current;
    if (!node) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      await document.fonts.ready;
      const opts = {
        pixelRatio: 2,
        width: node.offsetWidth,
        height: node.offsetHeight,
        backgroundColor: getComputedStyle(node).backgroundColor,
      };
      let url: string;
      try {
        url = await toPng(node, opts);
      } catch {
        url = await toPng(node, { ...opts, skipFonts: true });
      }
      const date = (data.date || toDMY(new Date())).replace(/\//g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${BRAND_TITLE}-${safeFilePart(data.name)}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("ဓာတ်ပုံ သိမ်းပြီးပါပြီ");
    } catch (e) {
      console.error(e);
      toast.error("ဓာတ်ပုံ မသိမ်းနိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-12 pt-3">
      <div className="no-print flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate font-display text-xl font-bold text-primary">
          {data.name || "Voucher"}
        </h2>
      </div>

      <div className="no-print grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button variant="burgundy" size="xl" onClick={savePhoto} disabled={saving} className="col-span-2 sm:col-span-1">
          {saving ? <Loader2 className="animate-spin" /> : <Camera />} 📸 Save as Photo
        </Button>
        <Button variant="champagne" size="xl" onClick={() => window.print()}>
          <Printer /> Print A4
        </Button>
        <Button variant="soft" size="xl" onClick={onEdit}>
          <Pencil /> ပြင်မည်
        </Button>
        <Button variant="soft" size="xl" className="col-span-2 text-destructive sm:col-span-1" onClick={() => setConfirm(true)}>
          <Trash2 /> ဖျက်မည်
        </Button>
      </div>

      <div ref={frameRef} className="w-full overflow-hidden rounded-xl shadow-card" style={{ height }}>
        <div
          className="voucher-scaler origin-top-left"
          style={{ transform: `scale(${scale})`, width: DESIGN_WIDTH }}
        >
          <Voucher ref={voucherRef} data={data} />
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ဖျက်မှာ သေချာပါသလား?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.name} ၏ တိုင်းတာမှု မှတ်တမ်းကို ချိတ်ဆက်ထားသော ဖုန်းအားလုံးမှ ဖျက်ပါမည်။
            </AlertDialogDescription>
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
