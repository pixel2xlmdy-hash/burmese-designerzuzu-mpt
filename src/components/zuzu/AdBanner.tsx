import { useEffect, useState } from "react";
import { Crown, X, Check, ExternalLink, Copy, KeyRound, ShieldCheck, Eye, EyeOff, ClipboardPaste, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

const VIP_STORAGE_KEY = "mpt_tailor_vip_v3";
const ADMIN_LOCK_KEY = "mpt_admin_lock_until";
const TIKTOK_CONTACT_URL = "https://www.tiktok.com/@myinzulwin7?_r=1&_t=ZS-900AAD2pDFd";

// App ပိုင်ရှင် Email (Code ထည့်စရာမလိုဘဲ အလိုအလျောက် ကြော်ငြာပိတ်ပေးမည်)
const OWNER_EMAILS: string[] = [];
const ALLOWED_HOSTS = ["zu-mpt.lovable.app", "burmese-designerzuzu-mpt.lovable.app", "localhost", "127.0.0.1"];

const PLAN_OPTIONS = [
  { id: "1M", name: "1 Month (၁ လစာ)", price: "3,500 Ks" },
  { id: "3M", name: "3 Months (၃ လစာ)", price: "10,000 Ks" },
  { id: "6M", name: "6 Months (၆ လစာ)", price: "20,000 Ks" },
  { id: "1Y", name: "1 Year (၁ နှစ်စာ)", price: "36,000 Ks" },
];

function isAuthorizedOrigin(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname.toLowerCase();
  if (!host) return true;
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com"));
}

function hashDeviceFingerprint(raw: string): string {
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, "0");
}

// Uninstall လုပ်ပြီး ပြန်သွင်းလည်း မပြောင်းလဲသော Hardware + Email Hybrid ID
function getHybridDeviceId(userEmail: string): string {
  if (userEmail) {
    return `email:${userEmail.trim().toLowerCase()}`;
  }
  if (typeof window === "undefined") return "hw:unknown";
  const rawHw = [
    navigator.platform || "",
    navigator.language || "",
    navigator.hardwareConcurrency || "",
    `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ].join("|");
  return `hw:${hashDeviceFingerprint(rawHw)}`;
}

export function AdBanner() {
  const store = useStore();
  const userEmail = (store as { email?: string | null; user?: { email?: string } })?.email?.toLowerCase()
    || (store as { user?: { email?: string } })?.user?.email?.toLowerCase()
    || "";
  const isOwner = OWNER_EMAILS.includes(userEmail);

  const [vipInfo, setVipInfo] = useState<{ planLabel: string; expiresAt: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("1Y");
  const [adminStep, setAdminStep] = useState<"none" | "login" | "generator">("none");
  const [adminTab, setAdminTab] = useState<"vip" | "reset">("vip");
  const [adminUserInput, setAdminUserInput] = useState("");
  const [adminPassInput, setAdminPassInput] = useState("");
  const [verifiedAdminCreds, setVerifiedAdminCreds] = useState<{ email: string; password: string } | null>(null);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [activeGenTag, setActiveGenTag] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetTargetInput, setResetTargetInput] = useState("");
  const [generatedResetCode, setGeneratedResetCode] = useState("");
  const [copiedReset, setCopiedReset] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkVipStatus = async () => {
      try {
        const currentDeviceId = getHybridDeviceId(userEmail);
        const { data: rows } = await (supabase as any).rpc("check_vip_by_device", {
          p_device_id: currentDeviceId,
        });

        if (rows && rows.length > 0 && isAuthorizedOrigin()) {
          const restored = { planLabel: rows[0].plan_label || "VIP Plan", expiresAt: Number(rows[0].expires_at) };
          localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(restored));
          setVipInfo(restored);
          return;
        }

        const raw = localStorage.getItem(VIP_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.expiresAt && Date.now() < parsed.expiresAt && isAuthorizedOrigin()) {
            setVipInfo(parsed);
          } else {
            localStorage.removeItem(VIP_STORAGE_KEY);
            setVipInfo(null);
          }
        }
      } catch {}
    };
    checkVipStatus();
  }, [userEmail]);
  const readClipboardText = async (): Promise<string> => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return "";
    }
  };

  const handlePasteVipCode = async () => {
    const text = await readClipboardText();
    if (text) {
      setCode(text.trim());
      setError("");
    }
  };

  const handlePasteAdminPass = async () => {
    const text = await readClipboardText();
    if (text) {
      setAdminPassInput(text.trim());
      setError("");
    }
  };

  const getLockRemainingSec = (): number => {
    try {
      const until = Number(localStorage.getItem(ADMIN_LOCK_KEY) || 0);
      return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0;
    } catch {
      return 0;
    }
  };

  const handleUnlockOrGate = async () => {
    if (!isAuthorizedOrigin()) {
      setError("တရားဝင် App မဟုတ်ပါ (Unauthorized Copy)");
      return;
    }

    const trimmed = code.trim();
    if (!trimmed) {
      setError("VIP ကုဒ် ထည့်သွင်းပါ");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // 1. Admin Gate ဟုတ်/မဟုတ် Server တွင် စစ်ဆေးခြင်း
      const { data: isGate } = await (supabase as any).rpc("verify_admin_gate", {
        input_gate: trimmed,
      });

      if (isGate === true) {
        const lockSec = getLockRemainingSec();
        if (lockSec > 0) {
          setError(`လုံခြုံရေးအရ ${lockSec} စက္ကန့် စောင့်ဆိုင်းပြီးမှ ပြန်ဝင်ပါ`);
          setLoading(false);
          return;
        }
        setAdminStep("login");
        setError("");
        setCode("");
        setLoading(false);
        return;
      }

      // 2. VIP Code ကို Server တွင် အတည်ပြုပြီး 1-Device Lock ချခြင်း
      const currentDeviceId = getHybridDeviceId(userEmail);
      const { data: res, error: rpcErr } = await (supabase as any).rpc("redeem_server_vip_code", {
        p_code: trimmed,
        p_device_id: currentDeviceId,
      });

      if (rpcErr || !res) {
        setError("အင်တာနက် ချိတ်ဆက်မှု စစ်ဆေးပြီး ပြန်လည်အတည်ပြုပါ");
        setLoading(false);
        return;
      }

      if (res.status === "EXPIRED") {
        setError("ဤ VIP Code သည် သက်တမ်းကုန်ဆုံးသွားပါပြီ (Code အသစ် ထပ်မံဝယ်ယူပါ)");
        setLoading(false);
        return;
      }

      if (res.status === "TAKEN") {
        setError("ဤ VIP Code ကို အခြားဖုန်း/အကောင့်တွင် အသုံးပြုပြီးဖြစ်ပါသည် (1 Device Only)");
        setLoading(false);
        return;
      }

      if (res.status !== "OK") {
        setError("VIP ကုဒ် မှားယွင်းနေပါသည် (TikTok မှတစ်ဆင့် ဆက်သွယ်ဝယ်ယူပါ)");
        setLoading(false);
        return;
      }

      const vipData = { planLabel: res.planLabel || "VIP Plan", expiresAt: Number(res.expiresAt) };
      try {
        localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(vipData));
      } catch {}
      setVipInfo(vipData);
      setShowModal(false);
      setError("");
    } catch {
      setError("ချိတ်ဆက်မှု အဆင်မပြေပါ — အင်တာနက်ဖွင့်ပြီး ပြန်စမ်းကြည့်ပါ");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    const lockSec = getLockRemainingSec();
    if (lockSec > 0) {
      setError(`Password မှားယွင်းမှုများသဖြင့် ${lockSec} စက္ကန့် Lock ချထားပါသည်`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const cleanEmail = adminUserInput.trim();
      const cleanPass = adminPassInput.trim();
      const { data: isValid } = await (supabase as any).rpc("verify_admin_credentials", {
        input_email: cleanEmail,
        input_password: cleanPass,
      });

      if (isValid === true) {
        setVerifiedAdminCreds({ email: cleanEmail, password: cleanPass });
        setAdminStep("generator");
        setFailCount(0);
        setError("");
        setAdminUserInput("");
        setAdminPassInput("");
      } else {
        const nextFail = failCount + 1;
        setFailCount(nextFail);
        if (nextFail >= 3) {
          try {
            localStorage.setItem(ADMIN_LOCK_KEY, String(Date.now() + 5 * 60 * 1000));
          } catch {}
          setAdminStep("none");
          setFailCount(0);
          setError("Password ၃ ကြိမ် မှားယွင်းသဖြင့် ၅ မိနစ် Lock ချလိုက်ပါပြီ");
        } else {
          setError(`Email သို့မဟုတ် Password မှားယွင်းနေပါသည် (${3 - nextFail} ကြိမ်သာ ကျန်ပါတော့သည်)`);
        }
      }
    } catch {
      setError("Server ချိတ်ဆက်မှု မအောင်မြင်ပါ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (tag: string, days: number) => {
    if (!verifiedAdminCreds) return;
    setActiveGenTag(tag);
    setLoading(true);
    try {
      const { data: newCode } = await (supabase as any).rpc("generate_server_vip_code", {
        admin_email: verifiedAdminCreds.email,
        admin_password: verifiedAdminCreds.password,
        plan_tag: tag,
        days_valid: days,
      });
      if (newCode && newCode !== "UNAUTHORIZED") {
        setGeneratedCode(newCode);
        setCopied(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResetCode = async () => {
    if (!verifiedAdminCreds || !resetTargetInput.trim()) return;
    setLoading(true);
    try {
      const { data: newRst } = await (supabase as any).rpc("generate_server_reset_code", {
        admin_email: verifiedAdminCreds.email,
        admin_password: verifiedAdminCreds.password,
        target_identifier: resetTargetInput.trim(),
      });
      if (newRst && newRst !== "UNAUTHORIZED") {
        setGeneratedResetCode(newRst);
        setCopiedReset(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyTextSafely = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const el = document.createElement("textarea");
      el.value = txt;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    await copyTextSafely(generatedCode);
    setCopied(true);
  };

  const handleCopyResetCode = async () => {
    if (!generatedResetCode) return;
    await copyTextSafely(generatedResetCode);
    setCopiedReset(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setAdminStep("none");
    setVerifiedAdminCreds(null);
    setError("");
    setAdminUserInput("");
    setAdminPassInput("");
    setShowAdminPass(false);
  };

  if (isOwner) {
    return (
      <div className="no-print mx-auto max-w-3xl px-4 pb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm">
          <Crown className="h-3 w-3 text-amber-500" />
          Owner VIP • Ad-Free Mode
        </span>
      </div>
    );
  }

  if (vipInfo) {
    const expDateStr = new Date(vipInfo.expiresAt).toLocaleDateString("en-GB");
    return (
      <div className="no-print mx-auto max-w-3xl px-4 pb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
          <Crown className="h-3 w-3 text-amber-500" />
          {vipInfo.planLabel} • သက်တမ်းကုန်ရက်: {expDateStr}
        </span>
      </div>
    );
  }

  return (
    <div className="no-print mx-auto max-w-3xl px-4 pb-6">
      <div className="rounded-2xl border border-amber-400/50 bg-card p-3 shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sponsored • ကြော်ငြာ
          </span>
          <button
            type="button"
            onClick={() => { setShowModal(true); setAdminStep("none"); setError(""); }}
            style={{ backgroundColor: "#7c1d2e", color: "#ffffff" }}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm hover:opacity-90"
          >
            <Crown className="h-3 w-3 text-amber-300" />
            VIP ဝယ်ယူရန် (Ad-Free)
          </button>
        </div>

        <div
          id="mpt-ad-slot"
          className="mt-2 flex min-h-[60px] items-center justify-center rounded-xl bg-secondary/70 px-3 py-2 text-center text-xs text-muted-foreground"
        >
          မြောက်ပြင်သူ (MPT) Tailor Pro — Free Version (ကြော်ငြာနေရာ)
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-5 text-neutral-900 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 style={{ color: "#7c1d2e" }} className="flex items-center gap-1.5 font-display text-base font-bold">
                <Crown className="h-4 w-4 text-amber-500" />
                {adminStep === "login"
                  ? "Admin အတည်ပြုရန်"
                  : adminStep === "generator"
                  ? "Admin Code ထုတ်ရန်"
                  : "VIP Plan များ (ကြော်ငြာမပါ)"}
              </h3>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adminStep === "login" ? (
              <div className="mt-3 space-y-2.5 text-xs">
                <p className="flex items-center gap-1 text-neutral-600">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Admin Email နှင့် Password ကို ရိုက်ထည့်ပါ (၃ ကြိမ်မှားလျှင် Lock ကျပါမည်)-
                </p>
                <input
                  type="text"
                  autoComplete="off"
                  value={adminUserInput}
                  onChange={(e) => setAdminUserInput(e.target.value)}
                  placeholder="Admin Email"
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 text-xs text-neutral-900"
                />
                <div className="relative flex items-center">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    autoComplete="off"
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    placeholder="Admin Password"
                    className="h-10 w-full rounded-xl border border-neutral-300 bg-neutral-50 pl-3 pr-24 text-xs text-neutral-900"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePasteAdminPass}
                      className="inline-flex items-center gap-0.5 rounded-lg bg-neutral-200 px-2 py-1 text-[10px] font-bold text-neutral-800 hover:bg-neutral-300"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      Paste
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdminPass((v) => !v)}
                      className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-200"
                    >
                      {showAdminPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleAdminLogin()}
                  style={{ backgroundColor: "#7c1d2e", color: "#ffffff" }}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {loading ? "စစ်ဆေးနေပါသည်..." : "ဝင်ရောက်မည်"}
                </button>
              </div>
            ) : adminStep === "generator" ? (
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-neutral-100 p-1">
                  <button
                    type="button"
                    onClick={() => setAdminTab("vip")}
                    className={`rounded-lg py-1.5 font-bold transition ${
                      adminTab === "vip" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
                    }`}
                  >
                    👑 VIP Code ထုတ်ရန်
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTab("reset")}
                    className={`rounded-lg py-1.5 font-bold transition ${
                      adminTab === "reset" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
                    }`}
                  >
                    🔑 Pw Reset Code
                  </button>
                </div>

                {adminTab === "vip" ? (
                  <>
                    <p className="text-neutral-600">
                      ဝယ်ယူသူအတွက် သက်တမ်းအလိုက် Random VIP Code အသစ် ထုတ်ယူပါ-
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { tag: "1M", days: 30, label: "+ 1 Month (၃၀ ရက်)" },
                        { tag: "3M", days: 90, label: "+ 3 Months (၉၀ ရက်)" },
                        { tag: "6M", days: 180, label: "+ 6 Months (၁၈၀ ရက်)" },
                        { tag: "1Y", days: 365, label: "+ 1 Year (၃၆၅ ရက်)" },
                      ].map((item) => {
                        const isSelected = activeGenTag === item.tag;
                        return (
                          <button
                            key={item.tag}
                            type="button"
                            disabled={loading}
                            onClick={() => void handleCreateCode(item.tag, item.days)}
                            className={`rounded-xl py-2 transition ${
                              isSelected
                                ? "border-2 border-amber-400 bg-amber-50 font-bold text-amber-900 shadow-sm"
                                : "border border-neutral-300 bg-neutral-100 font-semibold text-neutral-800 hover:bg-neutral-200"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {generatedCode && (
                      <div className="mt-2 rounded-xl border-2 border-amber-400 bg-amber-50/50 p-3">
                        <div className="select-all break-all font-mono text-xs font-bold text-neutral-900">
                          {generatedCode}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-black text-xs font-semibold text-white shadow-sm active:scale-95"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? "Copy ကူးပြီးပါပြီ ✓" : "Code ကို Copy ကူးမည်"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-neutral-600">
                      Password မေ့သွားသော User ၏ User Name / Email သို့မဟုတ် ဖုန်းနံပါတ်ကို ထည့်ပြီး Reset Code ထုတ်ပေးပါ-
                    </p>
                    <input
                      type="text"
                      value={resetTargetInput}
                      onChange={(e) => setResetTargetInput(e.target.value)}
                      placeholder="User Name / Email / 09xxxxxxxx"
                      className="h-10 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 text-xs text-neutral-900"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleCreateResetCode()}
                      style={{ backgroundColor: "#7c1d2e", color: "#ffffff" }}
                      className="flex h-9 w-full items-center justify-center rounded-xl text-xs font-bold disabled:opacity-60"
                    >
                      {loading ? "ထုတ်ယူနေပါသည်..." : "Reset Code ထုတ်မည် (၂၄ နာရီသုံး)"}
                    </button>
                    {generatedResetCode && (
                      <div className="rounded-xl border-2 border-amber-400 bg-amber-50/50 p-3">
                        <div className="select-all break-all font-mono text-xs font-bold text-neutral-900">
                          {generatedResetCode}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyResetCode}
                          className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-black text-xs font-semibold text-white"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedReset ? "Copy ကူးပြီးပါပြီ ✓" : "Reset Code ကို Copy ကူးမည်"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-1.5 text-xs">
                  {PLAN_OPTIONS.map((p) => {
                    const active = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                          active
                            ? "border-2 border-amber-500 bg-amber-50 font-bold"
                            : "border border-neutral-200 bg-neutral-50 font-medium hover:bg-neutral-100"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-neutral-900">
                          {active && <Check className="h-3.5 w-3.5 text-amber-600" />}
                          {p.name}
                        </span>
                        <span style={{ color: "#7c1d2e" }} className="font-bold">
                          {p.price}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <a
                  href={TIKTOK_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-black text-xs font-semibold text-white shadow-sm"
                >
                  <span>TikTok မှတစ်ဆင့် ဝယ်ယူဆက်သွယ်ရန်</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <div className="mt-3 border-t border-neutral-200 pt-3">
                  <p className="text-[11px] leading-relaxed text-neutral-600">
                    TikTok မှ ရရှိထားသော VIP Code ကို အောက်တွင် ရိုက်ထည့်ပါ (1 Device Only)-
                  </p>
                  <div className="relative mt-2 flex items-center">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="MPT-1M-XXXX-XXXXXXXXXXXXX-XXXXXXXX"
                      className="h-10 w-full rounded-xl border border-neutral-300 bg-neutral-50 pl-3 pr-20 text-xs text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={handlePasteVipCode}
                      className="absolute right-1.5 inline-flex items-center gap-0.5 rounded-lg bg-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-800 hover:bg-neutral-300"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      Paste
                    </button>
                  </div>
                  {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleUnlockOrGate()}
                    style={{ backgroundColor: "#7c1d2e", color: "#ffffff" }}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-60"
                  >
                    <KeyRound className="h-4 w-4" />
                    {loading ? "စစ်ဆေးနေပါသည်..." : "VIP အတည်ပြုမည်"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
