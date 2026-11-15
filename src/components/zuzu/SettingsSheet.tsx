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
  ArrowLeft,
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
import { supabase } from "@/integrations/supabase/client";

function errorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/otp_locked/i.test(msg)) return "Code အကြိမ်များစွာ မှားယွင်းသဖြင့် ခဏစောင့်ပြီးမှ ထပ်ကြိုးစားပါ";
  if (/invalid identity/i.test(msg)) return "Email သို့မဟုတ် ဖုန်းနံပါတ် မှန်ကန်စွာ ထည့်ပါ";
  if (/invalid login credentials/i.test(msg)) return "အကောင့် သို့မဟုတ် Password မှားနေပါသည်";
  if (/already registered|already exists/i.test(msg)) return "ဤ Email/ဖုန်းဖြင့် အကောင့် ရှိပြီးသားပါ — ဝင်မည် ကို နှိပ်ပါ";
  if (/email not confirmed/i.test(msg)) return "Email ကို အတည်ပြုရန် လိုပါသေးသည် — 6-Digit Code ဖြင့် ဝင်ပါ";
  if (/weak|pwned|known to be|easy to guess/i.test(msg)) return "Password သည် လွယ်ကူလွန်းပါသည် ပိုခက်သော Password ရွေးပါ";
  if (/password should be|at least 6/i.test(msg)) return "Password အနည်းဆုံး ၆ လုံး ထည့်ပါ";
  if (/rate limit|security purposes|too many/i.test(msg)) return "ခဏစောင့်ပြီးမှ ထပ်ကြိုးစားပါ";
  if (/expired|invalid|token/i.test(msg)) return "Code မှားနေသည် သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ";
  if (/failed to fetch|network/i.test(msg)) return "အင်တာနက် ချိတ်ဆက်မှု မရှိပါ";
  return msg;
}

type AuthScreen = "signin" | "register" | "forgot" | "code";

export function SettingsSheet({
  open,
  onOpenChange,
  store,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  store: StoreState;
}) {
  const [screen, setScreen] = useState<AuthScreen>("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regIdentifier, setRegIdentifier] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPw, setRegConfirmPw] = useState("");
  const [regPin, setRegPin] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  const [forgotId, setForgotId] = useState("");
  const [forgotSecret, setForgotSecret] = useState("");
  const [forgotNewPw, setForgotNewPw] = useState("");
  const [forgotConfirmPw, setForgotConfirmPw] = useState("");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);

  const [showSetPw, setShowSetPw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const singleRef = useRef<HTMLInputElement>(null);

  const liveCount = Object.values(store.records).filter((r) => !r.deleted).length;

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
  const handleSignIn = async () => {
    const rawId = identifier.trim();
    if (!rawId) {
      toast.error("User Name / Email သို့မဟုတ် ဖုန်းနံပါတ် ထည့်ပါ");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      toast.error("Password အနည်းဆုံး ၆ လုံး ထည့်ပါ");
      return;
    }
    if (!needOnline()) return;

    setBusy("signin");
    try {
      let loginTarget = rawId;
      if (!loginIdentity(rawId)) {
        const { data: foundIdentifier } = await (supabase as any).rpc("get_login_identifier", {
          input_username: rawId,
        });
        if (!foundIdentifier) {
          toast.error("ဤ User Name ဖြင့် အကောင့် မတွေ့ပါ");
          setBusy(null);
          return;
        }
        loginTarget = foundIdentifier;
      }

      const n = await passwordSignIn(loginTarget, password);
      setPassword("");
      toast.success(`Cloud Sync ချိတ်ဆက်ပြီးပါပြီ — မှတ်တမ်း ${n} ခု`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const handleRegister = async () => {
    const uName = regUsername.trim();
    const idVal = regIdentifier.trim();
    const pinVal = regPin.replace(/\D/g, "");

    if (uName.length < 2) {
      toast.error("User Name အနည်းဆုံး ၂ လုံး ထည့်ပါ");
      return;
    }
    const parsed = loginIdentity(idVal);
    if (!parsed) {
      toast.error("Email သို့မဟုတ် ဖုန်းနံပါတ် မှန်ကန်စွာ ထည့်ပါ");
      return;
    }
    if (regPassword.length < MIN_PASSWORD) {
      toast.error("Password အနည်းဆုံး ၆ လုံး ထည့်ပါ");
      return;
    }
    if (regPassword !== regConfirmPw) {
      toast.error("Password ၂ ခါ ရိုက်ထည့်တာ မတူညီပါ (ပြန်စစ်ပါ)");
      return;
    }
    if (pinVal.length !== 4) {
      toast.error("Password မေ့လျှင် ပြန်ယူရန် PIN ဂဏန်း ၄ လုံး ထည့်ပါ");
      return;
    }
    if (!needOnline()) return;

    setBusy("signup");
    try {
      const { data: exists } = await (supabase as any).rpc("check_username_exists", {
        input_username: uName,
      });
      if (exists) {
        toast.error("ဤ User Name ကို အခြားသူ အသုံးပြုပြီးဖြစ်ပါသည်");
        setBusy(null);
        return;
      }

      const n = await passwordSignUp(idVal, regPassword);
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes?.session?.user?.id;
      if (uid) {
        await (supabase as any).from("user_profiles").upsert({
          user_id: uid,
          username: uName,
          identifier: idVal.toLowerCase(),
          auth_email: parsed.email.toLowerCase(),
          recovery_pin: pinVal,
        });
      }

      setRegPassword("");
      setRegConfirmPw("");
      setRegPin("");
      setScreen("signin");
      if (n === null) {
        toast.success("အကောင့် ဖွင့်ပြီးပါပြီ! Email ကို အတည်ပြုပြီးမှ ဝင်ပါ");
      } else {
        toast.success(`အကောင့်သစ် ဖွင့်ပြီးပါပြီ — မှတ်တမ်း ${n} ခု Sync လုပ်ပြီးပါပြီ`);
      }
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const handleForgotReset = async () => {
    const rawId = forgotId.trim();
    const secret = forgotSecret.trim();

    if (!rawId) {
      toast.error("User Name / Email သို့မဟုတ် ဖုန်းနံပါတ် ထည့်ပါ");
      return;
    }
    if (!secret) {
      toast.error("PIN ၄ လုံး သို့မဟုတ် Admin Reset Code ထည့်ပါ");
      return;
    }
    if (forgotNewPw.length < MIN_PASSWORD) {
      toast.error("Password အသစ် အနည်းဆုံး ၆ လုံး ထည့်ပါ");
      return;
    }
    if (forgotNewPw !== forgotConfirmPw) {
      toast.error("Password အသစ် ၂ ခါ ထည့်တာ မတူညီပါ");
      return;
    }
    if (!needOnline()) return;

    setBusy("forgot");
    try {
      const { data: status, error: rpcErr } = await (supabase as any).rpc("recover_user_password_v2", {
        input_id: rawId,
        input_secret: secret,
        new_password: forgotNewPw,
      });

      if (rpcErr || status === "NOT_FOUND") {
        toast.error("အကောင့် အချက်အလက် ရှာမတွေ့ပါ");
        setBusy(null);
        return;
      }

      if (status === "INVALID_SECRET") {
        toast.error("PIN ၄ လုံး သို့မဟုတ် Admin Reset Code မှားယွင်းနေပါသည်");
        setBusy(null);
        return;
      }

      toast.success("Password အသစ် ပြောင်းလဲပြီးပါပြီ — ယခု ဝင်ရောက်နိုင်ပါပြီ");
      setIdentifier(rawId);
      setForgotSecret("");
      setForgotNewPw("");
      setForgotConfirmPw("");
      setScreen("signin");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const savePassword = async () => {
    if (!oldPw) {
      toast.error("လက်ရှိ Password အဟောင်းကို အရင်ထည့်ပါ");
      return;
    }
    if (newPw.length < MIN_PASSWORD) {
      toast.error("Password အသစ် အနည်းဆုံး ၆ လုံး ထည့်ပါ");
      return;
    }
    if (newPw !== confirmNewPw) {
      toast.error("Password အသစ် ၂ ခါ ရိုက်ထည့်တာ မတူညီပါ");
      return;
    }
    if (!needOnline()) return;

    setBusy("setpw");
    try {
      if (store.email) {
        const { error: checkErr } = await supabase.auth.signInWithPassword({
          email: store.email,
          password: oldPw,
        });
        if (checkErr) {
          toast.error("Password အဟောင်း မှားယွင်းနေပါသည်");
          setBusy(null);
          return;
        }
      }

      await setAccountPassword(newPw);
      setOldPw("");
      setNewPw("");
      setConfirmNewPw("");
      setShowSetPw(false);
      toast.success("Password အသစ် ပြောင်းလဲပြီးပါပြီ");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
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
      toast.error(`Code အကြိမ်များစွာ မှားထားပါသည် ${Math.ceil(lockLeft / 1000)} စက္ကန့် စောင့်ပါ`);
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
        toast.error("Code ၅ ကြိမ် မှားထားပါသည် ၂ မိနစ် စောင့်ပြီးမှ ထပ်ကြိုးစားပါ");
      } else if (gate) {
        toast.error(`Code မှားနေပါသည် ကျန်ရှိသော အကြိမ် — ${OTP_MAX_ATTEMPTS - gate.failures}`);
      } else {
        toast.error(errorText(err));
      }
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
          ? `Customer မှတ်တမ်း ${found} ခု ထည့်သွင်းပြီးပါပြီ အခြား Customer များ မပျက်ပါ`
          : `Customer မှတ်တမ်းအားလုံး ${found} ခု အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ`,
      );
    } catch {
      toast.error("Backup ဖိုင် ဖတ်မရပါ");
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
          <SheetTitle className="font-display text-xl text-primary">Settings</SheetTitle>
          <SheetDescription>မှတ်တမ်း {liveCount} ခု ဤဖုန်းတွင် သိမ်းထားပါသည်</SheetDescription>
        </SheetHeader>

        <section className="mt-6 space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-card">
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
                <div className="space-y-2.5 border-t border-border pt-3">
                  <div className="text-xs font-bold text-primary">Password ပြောင်းလဲရန်</div>
                  <div className="space-y-1">
                    <Label htmlFor="old-pw" className="text-xs">Password အဟောင်း (Current Password)</Label>
                    <div className="relative">
                      <Input
                        id="old-pw"
                        type={showOldPw ? "text" : "password"}
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        placeholder="လက်ရှိ Password ထည့်ပါ"
                        className="h-10 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      >
                        {showOldPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-pw" className="text-xs">Password အသစ် (အနည်းဆုံး ၆ လုံး)</Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Password အသစ် ထည့်ပါ"
                        className="h-10 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-new-pw" className="text-xs">Password အသစ် ထပ်မံအတည်ပြုပါ</Label>
                    <Input
                      id="confirm-new-pw"
                      type={showNewPw ? "text" : "password"}
                      value={confirmNewPw}
                      onChange={(e) => setConfirmNewPw(e.target.value)}
                      placeholder="Password အသစ် ထပ်ရိုက်ပါ"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={() => { setShowSetPw(false); setOldPw(""); setNewPw(""); setConfirmNewPw(""); }}>
                      ပယ်ဖျက်မည်
                    </Button>
                    <Button variant="champagne" className="flex-1" onClick={savePassword} disabled={busy !== null}>
                      {busy === "setpw" ? <Loader2 className="animate-spin" /> : <KeyRound />} Password ပြောင်းမည်
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSetPw(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Password ပြောင်းလဲရန် (Change Password)
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div role="tablist" className="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1">
                {[
                  { k: "signin" as const, label: "🔑 ဝင်မည်" },
                  { k: "register" as const, label: "📝 အကောင့်သစ်" },
                  { k: "code" as const, label: "✉️ 6-Digit" },
                ].map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={screen === k}
                    onClick={() => setScreen(k)}
                    className={cn(
                      "rounded-full px-2 py-2 text-[12px] leading-tight transition",
                      screen === k ? "bg-card font-semibold text-primary shadow-soft" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {screen === "signin" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sync-id">User Name / Email သို့မဟုတ် ဖုန်းနံပါတ်</Label>
                    <Input
                      id="sync-id"
                      autoComplete="username"
                      placeholder="User Name / shop@gmail.com / 09xxxxxxxx"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-pw">Password</Label>
                      <button
                        type="button"
                        onClick={() => { setForgotId(identifier); setScreen("forgot"); }}
                        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        Password မေ့နေပါသလား?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="sync-pw"
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void handleSignIn()}
                        className="h-11 pr-11 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button variant="burgundy" size="xl" className="w-full" onClick={() => void handleSignIn()} disabled={busy !== null}>
                    {busy === "signin" ? <Loader2 className="animate-spin" /> : <LogIn />} ဝင်မည် (Sign In)
                  </Button>
                  <Button variant="champagne" size="xl" className="w-full" onClick={() => setScreen("register")}>
                    <UserPlus /> အကောင့်သစ် ဖွင့်မည် (Register)
                  </Button>
                </div>
              )}

              {screen === "register" && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="reg-user">User Name (အမည် / ဆိုင်နာမည်)</Label>
                    <Input
                      id="reg-user"
                      placeholder="ဥပမာ - ZuZuTailor"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-id">Email သို့မဟုတ် ဖုန်းနံပါတ်</Label>
                    <Input
                      id="reg-id"
                      placeholder="shop@gmail.com သို့မဟုတ် 09xxxxxxxx"
                      value={regIdentifier}
                      onChange={(e) => setRegIdentifier(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-pw">Password (အနည်းဆုံး ၆ လုံး)</Label>
                    <div className="relative">
                      <Input
                        id="reg-pw"
                        type={showRegPw ? "text" : "password"}
                        placeholder="Password အသစ် ထည့်ပါ"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="h-10 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      >
                        {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-confirm-pw">Confirm Password (Password ထပ်ထည့်ပါ)</Label>
                    <Input
                      id="reg-confirm-pw"
                      type={showRegPw ? "text" : "password"}
                      placeholder="အပေါ်က Password အတိုင်း ပြန်ရိုက်ပါ"
                      value={regConfirmPw}
                      onChange={(e) => setRegConfirmPw(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-pin">Recovery PIN (ဂဏန်း ၄ လုံး — Password မေ့လျှင် ပြန်ယူရန်)</Label>
                    <Input
                      id="reg-pin"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="ဥပမာ - 1995 (မှတ်မိလွယ်သော ဂဏန်း ၄ လုံး)"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-10 text-sm tracking-widest"
                    />
                  </div>
                  <Button variant="burgundy" size="xl" className="mt-1 w-full" onClick={() => void handleRegister()} disabled={busy !== null}>
                    {busy === "signup" ? <Loader2 className="animate-spin" /> : <UserPlus />} အကောင့်သစ် အတည်ပြုဖွင့်မည်
                  </Button>
                </div>
              )}

              {screen === "forgot" && (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setScreen("signin")}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> ဝင်မည် စာမျက်နှာသို့ ပြန်သွားရန်
                  </button>
                  <div className="rounded-xl bg-secondary/70 p-2.5 text-xs text-muted-foreground">
                    Password မေ့သွားပါက အကောင့်ဖွင့်စဉ်က သတ်မှတ်ထားသော <b>PIN ဂဏန်း ၄ လုံး</b> (သို့မဟုတ် Admin ထံမှ ရရှိသော <b>RST-... Code</b>) ဖြင့် Password အသစ် ပြန်ပြောင်းနိုင်ပါသည်။
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fg-id">User Name / Email သို့မဟုတ် ဖုန်းနံပါတ်</Label>
                    <Input
                      id="fg-id"
                      placeholder="User Name / shop@gmail.com / 09xxxxxxxx"
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fg-secret">PIN ၄ လုံး (သို့) Admin Reset Code</Label>
                    <Input
                      id="fg-secret"
                      placeholder="1234 သို့မဟုတ် RST-XXXX-XXXXXXXXXXXXX-XXXXXXXX"
                      value={forgotSecret}
                      onChange={(e) => setForgotSecret(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fg-new-pw">Password အသစ် (အနည်းဆုံး ၆ လုံး)</Label>
                    <Input
                      id="fg-new-pw"
                      type="password"
                      placeholder="Password အသစ် ထည့်ပါ"
                      value={forgotNewPw}
                      onChange={(e) => setForgotNewPw(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fg-confirm-pw">Password အသစ် ထပ်မံအတည်ပြုပါ</Label>
                    <Input
                      id="fg-confirm-pw"
                      type="password"
                      placeholder="Password အသစ် ထပ်ရိုက်ပါ"
                      value={forgotConfirmPw}
                      onChange={(e) => setForgotConfirmPw(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <Button variant="burgundy" size="xl" className="w-full" onClick={() => void handleForgotReset()} disabled={busy !== null}>
                    {busy === "forgot" ? <Loader2 className="animate-spin" /> : <KeyRound />} Password အသစ် ပြန်သတ်မှတ်မည်
                  </Button>
                </div>
              )}

              {screen === "code" && (
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
                    Send Verification Code / Code ပို့ရန်
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
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
        {/* Shop Profile Settings Section */}
<section className="mt-4 space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-card">
  <h3 className="font-display text-base font-bold text-primary">🛠️ ဆိုင်ပရိုဖိုင်နှင့် ဘောက်ချာပြင်ဆင်ရန် (Shop Profile)</h3>
  <div className="space-y-3 text-sm">
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">ဆိုင်အမည် (Shop Name)</label>
      <input 
        type="text"
        defaultValue={localStorage.getItem('mpt_shop_name') || "မြောက်ပြင်သူ (Designer Zu Zu)"}
        onChange={(e) => localStorage.setItem('mpt_shop_name', e.target.value)}
        className="w-full p-2 border rounded-lg bg-background text-foreground text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">ဖုန်းနံပါတ် (Phone Number)</label>
      <input 
        type="text"
        defaultValue={localStorage.getItem('mpt_shop_phone') || "09-XXXXXXXXX"}
        onChange={(e) => localStorage.setItem('mpt_shop_phone', e.target.value)}
        className="w-full p-2 border rounded-lg bg-background text-foreground text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">ဆိုင်လိပ်စာ (Address)</label>
      <input 
        type="text"
        defaultValue={localStorage.getItem('mpt_shop_address') || "မန္တလေးမြို့"}
        onChange={(e) => localStorage.setItem('mpt_shop_address', e.target.value)}
        className="w-full p-2 border rounded-lg bg-background text-foreground text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">ဘောက်ချာအောက်ခြေ မေတ္တာစာစကား (Footer Message)</label>
      <textarea 
        rows={2}
        defaultValue={localStorage.getItem('mpt_shop_footer') || "👗 ပုံစံက်၊ ရိုးရာ၊ မင်္ဂလာဝတ်စုံ အပ်ထည်များကို လက်ခံပါသည်။"}
        onChange={(e) => localStorage.setItem('mpt_shop_footer', e.target.value)}
        className="w-full p-2 border rounded-lg bg-background text-foreground text-xs"
      />
    </div>
  </div>
</section>


        <section className="mt-4 space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <h3 className="font-display text-base font-bold text-primary">Data Backup</h3>
          <div className="grid gap-2">
            <Button variant="soft" size="xl" className="h-auto justify-start whitespace-normal py-3 text-left leading-snug" onClick={doExport}>
              <Download /> Export All Customers (ဆိုင်ရှိ Customer အားလုံး သိမ်းမည်)
            </Button>
            <Button
              variant="soft"
              size="xl"
              className="h-auto justify-start whitespace-normal py-3 text-left leading-snug"
              onClick={() => fileRef.current?.click()}
            >
              <Upload /> Import All Customers (Customer အားလုံး ပြန်သွင်းမည်)
            </Button>
            <Button
              variant="ghost"
              size="xl"
              className="h-auto justify-start whitespace-normal border border-dashed border-gold/50 py-2.5 text-left leading-snug"
              onClick={() => singleRef.current?.click()}
            >
              <UserPlus /> Customer တစ်ယောက်ချင်း ဖိုင် ပြန်သွင်းမည် (Import One Customer)
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            ပြန်သွင်းသည့်အခါ ရှိပြီးသား Customer များကို မဖျက်ဘဲ Customer တစ်ယောက်ချင်းစီ ပိုမို နောက်ကျသော အချက်အလက်များ ထည့်သွင်းပါသည်။
          </p>
          {fileInput(fileRef, false)}
          {fileInput(singleRef, true)}
        </section>
      </SheetContent>
    </Sheet>
  );
}
