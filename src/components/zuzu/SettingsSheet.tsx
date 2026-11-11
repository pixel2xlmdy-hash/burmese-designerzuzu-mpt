import { useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  disconnectCloud,
  exportBackup,
  importBackup,
  passwordSignIn,
  passwordSignUp,
  readOtpGate,
  sendEmailCode,
  setAccountPassword,
  syncNow,
  verifyEmailCode,
  type StoreState,
} from "@/lib/store";
import {
  accountLabel,
  loginIdentity,
  MIN_PASSWORD,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  otpLockRemaining,
  type OtpGate,
} from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";
import { downloadJson, todayForFile } from "@/lib/download";

function errorText(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/otp locked/i.test(msg)) return "Code အကြိမ်များစွာ မှားသွားပါသဖြင့် ခဏစောင့်ပြီးမှ ထပ်ကြိုးစားပါ။";
  if (/invalid identity/i.test(msg)) return "Email သို့မဟုတ် ဖုန်းနံပါတ် မှန်ကန်စွာ ထည့်ပါ";
  if (/invalid login credentials/i.test(msg)) return "Email/ဖုန်း သို့မဟုတ် Password မှားနေပါသည်";
  if (/already registered|already exists/i.test(msg)) return "ဤ Email/ဖုန်းဖြင့် အကောင့် ရှိပြီးသားပါ — “ဝင်မည်” ကို နှိပ်ပါ";
  if (/email not confirmed/i.test(msg)) return "Email ကို အတည်ပြုရန် လိုပါသေးသည် — 6-Digit Code ဖြင့် ဝင်ပါ";
  if (/weak|pwned|known to be|easy to guess/i.test(msg)) return "ဤ Password သည် လွယ်လွန်းပါသည်။ ပိုခက်သော Password ရွေးပါ။";
  if (/password should be|at least 6/i.test(msg)) return "Password အနည်းဆုံး ၆ လုံး ထည့်ပါ";
  if (/rate limit|security purposes|too many/i.test(msg)) return "ခဏစောင့်ပြီးမှ ထပ်ကြိုးစားပါ။";
  if (/expired|invalid|token/i.test(msg)) return "Code မှားနေသည် သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။";
  if (/failed to fetch|network/i.test(msg)) return "အင်တာနက် ချိတ်ဆက်မှု မရှိပါ";
  return msg;
}

type Method = "password" | "code";

export function SettingsSheet({
  open,
  onOpenChange,
  store,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  store: StoreState;
}) {
  const [method, setMethod] = useState<Method>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"signin" | "signup" | "send" | "verify" | "setpw" | null>(null);
  const [lockLeft, setLockLeft] = useState(0);
  const [newPw, setNewPw] = useState("");
  const [showSetPw, setShowSetPw] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const singleRef = useRef<HTMLInputElement>(null);

  const liveCount = Object.values(store.records).filter((r) => !r.deleted).length;

  // Count down the code cooldown while it is running.
  useEffect(() => {
    if (!open) return;
    const tick = () => setLockLeft(otpLockRemaining(readOtpGate(), Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [open]);

  const needOnline = () => {
    if (store.online) return true;
    toast.error("အင်တာနက် ချိတ်ဆက်ပြီးမှ ပြန်ကြိုးစားပါ");
    return false;
  };

  const passwordAction = async (kind: "signin" | "signup") => {
    if (!loginIdentity(identifier)) {
      toast.error("Email သို့မဟုတ် ဖုန်းနံပါတ် မှန်ကန်စွာ ထည့်ပါ");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      toast.error("Password အနည်းဆုံး ၆ လုံး ထည့်ပါ");
      return;
    }
    if (!needOnline()) return;
    setBusy(kind);
    try {
      const n = kind === "signin" ? await passwordSignIn(identifier, password) : await passwordSignUp(identifier, password);
      if (n === null) {
        toast.success("အကောင့် ဖွင့်ပြီးပါပြီ။ Email ကို အတည်ပြုပြီးမှ ဝင်ပါ။");
        return;
      }
      setPassword("");
      toast.success(`Cloud Sync ချိတ်ဆက်ပြီးပါပြီ — မှတ်တမ်း ${n} ခု`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) {
      toast.error("Email လိပ်စာ မှန်ကန်စွာ ထည့်ပါ");
      return;
    }
    if (!needOnline()) return;
    setBusy("send");
    try {
      await sendEmailCode(e);
      setSent(true);
      toast.success("ဂဏန်း ၆ လုံး Code ကို Email သို့ ပို့လိုက်ပါပြီ");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    const token = code.replace(/\D/g, "");
    if (token.length !== OTP_LENGTH) {
      toast.error("Code ဂဏန်း ၆ လုံး အပြည့် ထည့်ပါ");
      return;
    }
    if (lockLeft > 0) {
      toast.error(`Code အကြိမ်များစွာ မှားသွားပါသည်။ ${Math.ceil(lockLeft / 1000)} စက္ကန့် စောင့်ပါ။`);
      return;
    }
    setBusy("verify");
    try {
      const n = await verifyEmailCode(email.trim().toLowerCase(), token);
      setCode("");
      setSent(false);
      toast.success(`Cloud Sync ချိတ်ဆက်ပြီးပါပြီ — မှတ်တမ်း ${n} ခု`);
    } catch (err) {
      const gate = (err as { otpGate?: OtpGate }).otpGate;
      setCode("");
      if (gate && gate.lockedUntil > Date.now()) {
        setLockLeft(gate.lockedUntil - Date.now());
        toast.error("Code ၅ ကြိမ် မှားသွားပါသည်။ ၂ မိနစ် စောင့်ပြီးမှ ထပ်ကြိုးစားပါ။");
      } else if (gate) {
        toast.error(`Code မှားနေပါသည်။ ကျန်ရှိသော အကြိမ် — ${OTP_MAX_ATTEMPTS - gate.failures}`);
      } else {
        toast.error(errorText(err));
      }
    } finally {
      setBusy(null);
    }
  };

  const savePassword = async () => {
    if (newPw.length < MIN_PASSWORD) {
      toast.error("Password အနည်းဆုံး ၆ လုံး ထည့်ပါ");
      return;
    }
    setBusy("setpw");
    try {
      await setAccountPassword(newPw);
      setNewPw("");
      setShowSetPw(false);
      toast.success("Password သတ်မှတ်ပြီးပါပြီ — အခြားဖုန်းများတွင် Password ဖြင့် ဝင်နိုင်ပါပြီ");
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
            <CloudUpload className="h-5 w-5" /> Cloud Sync (ဖုန်းအားလုံး ချိတ်ဆက်ရန်)
          </h3>

          {store.userId ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-event p-3 text-sm text-event-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="break-all font-semibold">{accountLabel(store.email)}</div>
                  <div className="text-xs">
                    ဤအကောင့်ဖြင့် ဝင်ထားသော ဖုန်း/ကွန်ပျူတာ အားလုံး အလိုအလျောက် Sync ဖြစ်ပါသည်
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
              {showSetPw ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <Label htmlFor="new-pw">Password အသစ် (အနည်းဆုံး ၆ လုံး)</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    autoComplete="new-password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="h-11 text-base"
                  />
                  <Button variant="champagne" className="w-full" onClick={savePassword} disabled={busy !== null}>
                    {busy === "setpw" ? <Loader2 className="animate-spin" /> : <KeyRound />} Password သိမ်းမည်
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSetPw(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Password သတ်မှတ် / ပြောင်းမည်
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
                {(
                  [
                    { k: "password", label: "🔑 Password ဖြင့်" },
                    { k: "code", label: "✉️ 6-Digit Code" },
                  ] as const
                ).map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={method === k}
                    onClick={() => setMethod(k)}
                    className={cn(
                      "rounded-full px-2 py-2 text-[13px] leading-tight transition",
                      method === k ? "bg-card font-semibold text-primary shadow-soft" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {method === "password" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sync-id">Email သို့မဟုတ် ဖုန်းနံပါတ်</Label>
                    <Input
                      id="sync-id"
                      autoComplete="username"
                      placeholder="shop@gmail.com / 09xxxxxxxxx"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sync-pw">Password (အနည်းဆုံး ၆ လုံး)</Label>
                    <div className="relative">
                      <Input
                        id="sync-pw"
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void passwordAction("signin")}
                        className="h-11 pr-11 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button variant="burgundy" size="xl" className="w-full" onClick={() => void passwordAction("signin")} disabled={busy !== null}>
                    {busy === "signin" ? <Loader2 className="animate-spin" /> : <LogIn />} ဝင်မည် (Sign In)
                  </Button>
                  <Button variant="champagne" size="xl" className="w-full" onClick={() => void passwordAction("signup")} disabled={busy !== null}>
                    {busy === "signup" ? <Loader2 className="animate-spin" /> : <UserPlus />} အကောင့်သစ် ဖွင့်မည် (Register)
                  </Button>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    ပထမဆုံး ဖုန်းတွင် “အကောင့်သစ် ဖွင့်မည်” ကို တစ်ကြိမ်သာ နှိပ်ပါ။ အခြားဖုန်း/ကွန်ပျူတာများတွင် Email (သို့) ဖုန်းနံပါတ်နှင့် Password တူတူဖြင့် “ဝင်မည်” နှိပ်ပါက မှတ်တမ်းအားလုံး ချက်ချင်း ရောက်လာပါမည်။
                  </p>
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
                          pattern="[0-9]*"
                          maxLength={OTP_LENGTH}
                          placeholder="••••••"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                          className="h-12 text-center font-display text-2xl tracking-[0.5em]"
                        />
                      </div>
                      <Button
                        variant="champagne"
                        size="xl"
                        className="w-full"
                        onClick={verify}
                        disabled={busy !== null || lockLeft > 0}
                      >
                        {busy === "verify" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                        {lockLeft > 0 ? `${Math.ceil(lockLeft / 1000)} စက္ကန့် စောင့်ပါ` : "Verify & Connect"}
                      </Button>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Email ထဲတွင် Code မတွေ့ပါက Spam ကို စစ်ပါ။ ဂဏန်း ၆ လုံး Code ကို ဤနေရာတွင် ရိုက်ထည့်ပါ (၅ ကြိမ်အထိ ကြိုးစားနိုင်ပါသည်)။
                      </p>
                    </div>
                  )}
                </div>
              )}
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
