import { useRef, useState } from "react";
import { CloudUpload, Download, Loader2, LogOut, Mail, RefreshCw, ShieldCheck, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  disconnectCloud,
  exportBackup,
  importBackup,
  sendEmailCode,
  syncNow,
  verifyEmailCode,
  type StoreState,
} from "@/lib/store";
import { downloadJson, todayForFile } from "@/lib/download";

function errorText(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/rate limit|security purposes/i.test(msg)) return "ခဏစောင့်ပြီးမှ Code ထပ်ပို့ပါ။";
  if (/expired|invalid/i.test(msg)) return "Code မှားနေသည် သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။";
  return msg;
}

export function SettingsSheet({
  open,
  onOpenChange,
  store,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  store: StoreState;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const singleRef = useRef<HTMLInputElement>(null);

  const liveCount = Object.values(store.records).filter((r) => !r.deleted).length;

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      toast.error("Email လိပ်စာ မှန်ကန်စွာ ထည့်ပါ");
      return;
    }
    if (!store.online) {
      toast.error("အင်တာနက် ချိတ်ဆက်ပြီးမှ Code ပို့ပါ");
      return;
    }
    setBusy("send");
    try {
      await sendEmailCode(e);
      setSent(true);
      toast.success("Code ကို Email သို့ ပို့လိုက်ပါပြီ");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      toast.error("Code ဂဏန်း ၆ လုံး ထည့်ပါ");
      return;
    }
    setBusy("verify");
    try {
      const n = await verifyEmailCode(email.trim().toLowerCase(), token);
      setCode("");
      setSent(false);
      toast.success(`Cloud Sync ချိတ်ဆက်ပြီးပါပြီ — မှတ်တမ်း ${n} ခု`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const doExport = () => {
    downloadJson(exportBackup(), `မြောက်ပြင်သူ-All-Backup-${todayForFile()}.json`);
    toast.success(`Customer မှတ်တမ်း ${liveCount} ခု သိမ်းပြီးပါပြီ`);
  };

  const doImport = async (file: File, single: boolean) => {
    try {
      const { found } = importBackup(await file.text());
      if (found === 0) {
        toast.error("ဤဖိုင်ထဲတွင် Customer မှတ်တမ်း မတွေ့ပါ");
        return;
      }
      toast.success(
        single
          ? `Customer မှတ်တမ်း (${found}) ခု ထည့်သွင်းပြီးပါပြီ။ အခြား Customer များ မပျက်ပါ။`
          : `Customer မှတ်တမ်းအားလုံး (${found}) ခု အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။`,
      );
    } catch {
      toast.error("Backup ဖိုင် မမှန်ကန်ပါ");
    }
  };

  const fileInput = (ref: typeof fileRef, single: boolean) => (
    <input
      ref={ref}
      type="file"
      accept="application/json,.json"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void doImport(f, single);
        e.target.value = "";
      }}
    />
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-primary">⚙️ Settings</SheetTitle>
          <SheetDescription>မှတ်တမ်း {liveCount} ခု ဤဖုန်းတွင် သိမ်းထားပါသည်</SheetDescription>
        </SheetHeader>

        <section className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-primary">
            <CloudUpload className="h-5 w-5" /> Email Cloud Sync
          </h3>

          {store.userId ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-event p-3 text-sm text-event-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">{store.email}</div>
                  <div className="text-xs">
                    ဤ Email ဖြင့် ချိတ်ထားသော ဖုန်းအားလုံး အလိုအလျောက် Sync ဖြစ်ပါသည်
                  </div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <dt>Status</dt>
                  <dd className="font-medium text-foreground">
                    {!store.online ? "Offline" : store.syncing ? "Syncing…" : "Connected"}
                  </dd>
                </div>
                <div>
                  <dt>ပို့ရန်ကျန်</dt>
                  <dd className="font-medium text-foreground">{store.pending.length}</dd>
                </div>
                <div className="col-span-2">
                  <dt>နောက်ဆုံး Sync</dt>
                  <dd className="font-medium text-foreground">
                    {store.lastSync ? new Date(store.lastSync).toLocaleString() : "—"}
                  </dd>
                </div>
              </dl>
              {store.error && <p className="text-xs text-destructive">{store.error}</p>}
              <div className="flex gap-2">
                <Button variant="soft" className="flex-1" onClick={() => void syncNow()} disabled={store.syncing || !store.online}>
                  <RefreshCw className={store.syncing ? "animate-spin" : ""} /> Sync now
                </Button>
                <Button variant="ghost" onClick={() => void disconnectCloud()}>
                  <LogOut /> Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sync-email">Shop Gmail / Email Address</Label>
                <Input
                  id="sync-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="shop@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 text-base"
                />
              </div>
              <Button variant="burgundy" size="xl" className="w-full" onClick={send} disabled={busy !== null}>
                {busy === "send" ? <Loader2 className="animate-spin" /> : <Mail />}
                Send Verification Code / Code ပို့ပါ
              </Button>

              {sent && (
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sync-code">Enter 6-Digit Code</Label>
                    <Input
                      id="sync-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      placeholder="••••••"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="h-12 text-center font-display text-2xl tracking-[0.5em]"
                    />
                  </div>
                  <Button variant="champagne" size="xl" className="w-full" onClick={verify} disabled={busy !== null}>
                    {busy === "verify" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    Verify & Connect
                  </Button>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Email ထဲတွင် Code မတွေ့ပါက Spam ကို စစ်ပါ။ Email ထဲရှိ ဂဏန်း Code ကို ဤနေရာတွင် ရိုက်ထည့်ပါ။
                  </p>
                </div>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                ဖုန်း A တွင် ချိတ်ပြီးနောက် ဖုန်း B တွင် Email တူတူဖြင့် Code ထပ်တောင်းပါက မှတ်တမ်းအားလုံး ချက်ချင်း ရောက်လာပါမည်။
              </p>
            </div>
          )}
        </section>

        <section className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <h3 className="font-display text-base font-bold text-primary">Data Backup</h3>
          <div className="grid gap-2">
            <Button variant="soft" size="xl" className="h-auto justify-start whitespace-normal py-3 text-left leading-snug" onClick={doExport}>
              <Download /> 📥 Export All Customers (ဆိုင်ရှိ Customer အားလုံး သိမ်းမည်)
            </Button>
            <Button
              variant="soft"
              size="xl"
              className="h-auto justify-start whitespace-normal py-3 text-left leading-snug"
              onClick={() => fileRef.current?.click()}
            >
              <Upload /> 📤 Import All Customers (Customer အားလုံး ပြန်သွင်းမည်)
            </Button>
            <Button
              variant="ghost"
              className="h-auto justify-start whitespace-normal border border-dashed border-gold/50 py-2.5 text-left leading-snug"
              onClick={() => singleRef.current?.click()}
            >
              <UserPlus /> Customer တစ်ယောက်ချင်း ဖိုင် ပြန်သွင်းမည် (Import One Customer)
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            ပြန်သွင်းသည့်အခါ ရှိပြီးသား Customer များကို မဖျက်ပါ။ Customer တစ်ယောက်ချင်း ဖိုင်ကို ဘောင်ချာ စာမျက်နှာမှ ထုတ်နိုင်ပါသည်။
          </p>
          {fileInput(fileRef, false)}
          {fileInput(singleRef, true)}
        </section>
      </SheetContent>
    </Sheet>
  );
}
