import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, FileDown, FileText, Loader2, Pencil, Printer, SlidersHorizontal, Trash2 } from "lucide-react";
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
import { downloadJson, saveImage, todayForFile } from "@/lib/download";
import { saveNodeAsPhoto } from "@/lib/export-image";
import { deleteRecord, exportBackup, saveRecord } from "@/lib/store";
import { safeFilePart, type MeasurementData, type TailorRecord } from "@/lib/tailor";
import { Voucher } from "./Voucher";
import { VoucherCustomizeDialog, loadSavedVoucherCustom } from "./VoucherCustomizeDialog";

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
    const rawData = record.data as MeasurementData;
  const data: MeasurementData = {
    ...rawData,
    voucher: { ...loadSavedVoucherCustom(), ...rawData.voucher },
  };
  const frameRef = useRef<HTMLDivElement>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [customize, setCustomize] = useState(false);

  const fileBase = `${safeFilePart(data.voucher?.title?.trim() || BRAND_TITLE)}-${safeFilePart(data.name)}`;

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
    await saveNodeAsPhoto(node, `${fileBase}.png`);
    toast.success("ဓာတ်ပုံ သိမ်းပြီးပါပြီ");
  } catch (e) {
    console.error(e);
    toast.error("ဓာတ်ပုံ မသိမ်းနိုင်ပါ ထပ်စမ်းကြည့်ပါ");
  } finally {
    setSaving(false);
  }
};
  const print = () => {
    // The PDF's default file name comes from the page title.
    const prev = document.title;
    document.title = fileBase;
    window.print();
    setTimeout(() => (document.title = prev), 1000);
  };

  const exportThis = () => {
    downloadJson(exportBackup([record]), `${fileBase}-${todayForFile()}.json`);
    toast.success(`${data.name || "Customer"} ၏ မှတ်တမ်းကို သိမ်းပြီးပါပြီ`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-12 pt-3 print:p-0">
      <div className="no-print flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate font-display text-xl font-bold text-primary">
          {data.name || "Voucher"}
        </h2>
      </div>

      <div className="no-print space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="burgundy" size="xl" onClick={savePhoto} disabled={saving} className="col-span-2 sm:col-span-1">
            {saving ? <Loader2 className="animate-spin" /> : <Camera />} 📸 Save as Photo
          </Button>
          <Button variant="champagne" size="xl" onClick={print}>
            <FileText /> 📄 Save as PDF
          </Button>
          <Button variant="champagne" size="xl" onClick={print}>
            <Printer /> 🖨️ Print A4
          </Button>
        </div>
        <Button variant="soft" size="xl" className="w-full whitespace-normal leading-tight" onClick={() => setCustomize(true)}>
          <SlidersHorizontal /> ✏️ ဘောင်ချာ အချက်အလက် ပြင်ဆင်ရန် (Customize Voucher Header)
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="soft" size="xl" onClick={onEdit}>
            <Pencil /> ပြင်မည်
          </Button>
          <Button variant="soft" size="xl" className="text-destructive" onClick={() => setConfirm(true)}>
            <Trash2 /> ဖျက်မည်
          </Button>
          <Button
            variant="ghost"
            size="xl"
            className="col-span-2 whitespace-normal border border-dashed border-gold/50 leading-tight sm:col-span-1"
            onClick={exportThis}
          >
            <FileDown /> 📤 Export This Customer (ဒီတစ်ယောက်တည်း သိမ်းမည်)
          </Button>
        </div>
      </div>

      <div ref={frameRef} className="voucher-frame w-full overflow-hidden rounded-xl shadow-card" style={{ height }}>
        <div
          className="voucher-scaler origin-top-left"
          style={{ transform: `scale(${scale})`, width: DESIGN_WIDTH }}
        >
          <Voucher ref={voucherRef} data={data} />
        </div>
      </div>

      <VoucherCustomizeDialog
        open={customize}
        onOpenChange={setCustomize}
        value={data.voucher}
        onSave={(voucher) => saveRecord({ ...record, data: { ...data, voucher } })}
      />

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
