import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, FileText, Loader2, Pencil, Printer, SlidersHorizontal, Trash2 } from "lucide-react";
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
import { saveNodeAsPdf, saveNodeAsPhoto } from "@/lib/export-image";
import { deleteRecord, saveRecord, useStore } from "@/lib/store";
import { normalizeCost, safeFilePart, shopCostBrand, type CostVoucherData, type TailorRecord } from "@/lib/tailor";
import { CostBrandDialog } from "./CostBrandDialog";
import { CostVoucher } from "./CostVoucher";

const DESIGN_WIDTH = 760;

/** Preview of one cost voucher with Photo / PDF / Print, customize, edit and delete. */
export function CostVoucherView({
  record,
  onBack,
  onEdit,
}: {
  record: TailorRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  const store = useStore();
  const data = normalizeCost(record.data as CostVoucherData);
  const brand = useMemo(() => shopCostBrand(Object.values(store.records)), [store.records]);
  const frameRef = useRef<HTMLDivElement>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>();
  const [busy, setBusy] = useState<"photo" | "pdf" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [customize, setCustomize] = useState(false);

  const fileBase = `မြောက်ပြင်သူ-Cost-${safeFilePart(data.customerName)}`;

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

  const run = async (kind: "photo" | "pdf") => {
    const node = voucherRef.current;
    if (!node) return;
    setBusy(kind);
    try {
      if (kind === "photo") {
        await saveNodeAsPhoto(node, `${fileBase}.png`);
        toast.success("ဓာတ်ပုံ သိမ်းပြီးပါပြီ");
      } else {
        await saveNodeAsPdf(node, `${fileBase}.pdf`);
        toast.success("PDF သိမ်းပြီးပါပြီ");
      }
    } catch (e) {
      console.error(e);
      toast.error("မသိမ်းနိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။");
    } finally {
      setBusy(null);
    }
  };

  const print = () => {
    const prev = document.title;
    document.title = fileBase;
    window.print();
    setTimeout(() => (document.title = prev), 1000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 pb-12 pt-3 print:p-0">
      <div className="no-print flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ArrowLeft className="!size-5" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate font-display text-xl font-bold text-primary">
          {data.customerName || "Cost Voucher"}
          <span className="ml-2 text-sm font-normal text-muted-foreground">No. {data.voucherNo}</span>
        </h2>
      </div>

      <div className="no-print space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button
            variant="burgundy"
            size="xl"
            onClick={() => run("photo")}
            disabled={!!busy}
            className="col-span-2 sm:col-span-1"
          >
            {busy === "photo" ? <Loader2 className="animate-spin" /> : <Camera />} 📸 Save as Photo
          </Button>
          <Button variant="champagne" size="xl" onClick={() => run("pdf")} disabled={!!busy}>
            {busy === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />} 📄 Download PDF
          </Button>
          <Button variant="champagne" size="xl" onClick={print}>
            <Printer /> 🖨️ Print A4
          </Button>
        </div>
        <Button
          variant="soft"
          size="xl"
          className="w-full whitespace-normal leading-tight"
          onClick={() => setCustomize(true)}
        >
          <SlidersHorizontal /> ⚙️ ဘောင်ချာ ပြင်ဆင်ရန် (Customize Voucher)
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" size="xl" onClick={onEdit}>
            <Pencil /> ပြင်မည်
          </Button>
          <Button variant="soft" size="xl" className="text-destructive" onClick={() => setConfirm(true)}>
            <Trash2 /> ဖျက်မည်
          </Button>
        </div>
      </div>

      <div ref={frameRef} className="voucher-frame w-full overflow-hidden rounded-xl shadow-card" style={{ height }}>
        <div className="voucher-scaler origin-top-left" style={{ transform: `scale(${scale})`, width: DESIGN_WIDTH }}>
          <CostVoucher ref={voucherRef} data={data} brand={brand} />
        </div>
      </div>

      <CostBrandDialog
        open={customize}
        onOpenChange={setCustomize}
        value={brand}
        onSave={(b) =>
          saveRecord({ ...record, data: { ...data, brand: b, brandAt: new Date().toISOString() } })
        }
      />

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ဖျက်မှာ သေချာပါသလား?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.customerName} ၏ ဘောင်ချာ (No. {data.voucherNo}) ကို ချိတ်ဆက်ထားသော ဖုန်းအားလုံးမှ ဖျက်ပါမည်။
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
