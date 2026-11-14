import { useEffect, useState } from "react";
import { Crown, X, Check, ExternalLink, Copy, KeyRound, ShieldCheck } from "lucide-react";

const VIP_STORAGE_KEY = "mpt_tailor_vip_v2";
const TIKTOK_CONTACT_URL = "https://www.tiktok.com/@myinzulwin7?_r=1&_t=ZS-900AAD2pDFd";

// အဆင့် (၁) လျှို့ဝှက်တံခါးဖွင့် Passcode
const ADMIN_GATE_PASS = "ZUZUADMIN888";

// အဆင့် (၂) Admin Login Email နှင့် Password
const ADMIN_USERNAME = "aungkyaw.ariya92@gmail.com";
const ADMIN_PASSWORD = "ADMINMAUNGKYAW@#$92";

const SIGN_SALT = "MPT_ZUZU_2026_PRO_KEY";

function makeSignature(payload: string): string {
  let hash = 5381;
  const full = `${SIGN_SALT}:${payload}`;
  for (let i = 0; i < full.length; i++) {
    hash = ((hash << 5) + hash + full.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

function generateVipCode(planTag: string, days: number): string {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const expMs = Date.now() + days * 24 * 60 * 60 * 1000;
  const expHex = Math.floor(expMs / 60000).toString(36).toUpperCase();
  const body = `${planTag}-${rand}-${expHex}`;
  const sig = makeSignature(body);
  return `MPT-${body}-${sig}`;
}

function verifyVipCode(rawCode: string): { valid: boolean; expired?: boolean; planLabel?: string; expiresAt?: number } {
  const parts = rawCode.trim().toUpperCase().split("-");
  if (parts.length !== 5 || parts[0] !== "MPT") return { valid: false };
  const [, planTag, rand, expHex, sig] = parts;
  const body = `${planTag}-${rand}-${expHex}`;
  if (makeSignature(body) !== sig) return { valid: false };

  const expMinutes = parseInt(expHex, 36);
  if (isNaN(expMinutes)) return { valid: false };
  const expiresAt = expMinutes * 60000;

  if (Date.now() >= expiresAt) {
    return { valid: false, expired: true };
  }

  const labels: Record<string, string> = {
    "1M": "1 Month VIP",
    "3M": "3 Months VIP",
    "6M": "6 Months VIP",
    "1Y": "1 Year VIP",
  };
  return { valid: true, planLabel: labels[planTag] || "VIP Plan", expiresAt };
}

export function AdBanner() {
  const [vipInfo, setVipInfo] = useState<{ planLabel: string; expiresAt: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminStep, setAdminStep] = useState<"none" | "login" | "generator">("none");
  const [adminUserInput, setAdminUserInput] = useState("");
  const [adminPassInput, setAdminPassInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIP_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.expiresAt && Date.now() < parsed.expiresAt) {
        setVipInfo(parsed);
      } else {
        localStorage.removeItem(VIP_STORAGE_KEY);
        setVipInfo(null);
      }
    } catch {}
  }, []);
  const handleUnlockOrGate = () => {
    const trimmed = code.trim();
    if (trimmed === ADMIN_GATE_PASS) {
      setAdminStep("login");
      setError("");
      setCode("");
      return;
    }

    const res = verifyVipCode(trimmed.toUpperCase());
    if (res.valid && res.expiresAt && res.planLabel) {
      const data = { planLabel: res.planLabel, expiresAt: res.expiresAt };
      try {
        localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(data));
      } catch {}
      setVipInfo(data);
      setShowModal(false);
      setError("");
    } else if (res.expired) {
      setError("ဤ VIP Code သည် သက်တမ်းကုန်ဆုံးသွားပါပြီ (Code အသစ် ထပ်မံဝယ်ယူပါ)");
    } else {
      setError("VIP ကုဒ် မှားယွင်းနေပါသည် (TikTok မှတစ်ဆင့် ဆက်သွယ်ဝယ်ယူပါ)");
    }
  };

  const handleAdminLogin = () => {
    if (
      adminUserInput.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
      adminPassInput === ADMIN_PASSWORD
    ) {
      setAdminStep("generator");
      setError("");
      setAdminUserInput("");
      setAdminPassInput("");
    } else {
      setError("Username သို့မဟုတ် Password မှားယွင်းနေပါသည်");
    }
  };

  const handleCreateCode = (tag: string, days: number) => {
    setGeneratedCode(generateVipCode(tag, days));
    setCopied(false);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard?.writeText(generatedCode);
    setCopied(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setAdminStep("none");
    setError("");
    setAdminUserInput("");
    setAdminPassInput("");
  };

  if (vipInfo) {
    const expDateStr = new Date(vipInfo.expiresAt).toLocaleDateString("en-GB");
    return (
      <div className="no-print mx-auto max-w-3xl px-4 pb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
          <Crown className="h-3 w-3 text-gold" />
          {vipInfo.planLabel} • သက်တမ်းကုန်ရက်: {expDateStr}
        </span>
      </div>
    );
  }

  return (
    <div className="no-print mx-auto max-w-3xl px-4 pb-6">
      <div className="rounded-2xl border border-gold/40 bg-card p-3 shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sponsored • ကြော်ငြာ
          </span>
          <button
            type="button"
            onClick={() => { setShowModal(true); setAdminStep("none"); setError(""); }}
            className="inline-flex items-center gap-1 rounded-full bg-burgundy px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm"
          >
            <Crown className="h-3 w-3" />
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
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-primary">
                <Crown className="h-4 w-4 text-gold" />
                {adminStep === "login"
                  ? "Admin အတည်ပြုရန်"
                  : adminStep === "generator"
                  ? "Admin VIP Code ထုတ်ရန်"
                  : "VIP Plan များ (ကြော်ငြာမပါ)"}
              </h3>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {adminStep === "login" ? (
              <div className="mt-3 space-y-2.5 text-xs">
                <p className="text-muted-foreground">
                  ဆက်လက်လုပ်ဆောင်ရန် Admin Email နှင့် Password ကို ရိုက်ထည့်ပါ-
                </p>
                <input
                  type="text"
                  value={adminUserInput}
                  onChange={(e) => setAdminUserInput(e.target.value)}
                  placeholder="Admin Email"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                />
                <input
                  type="password"
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="Admin Password"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-burgundy text-sm font-semibold text-primary-foreground"
                >
                  <ShieldCheck className="h-4 w-4" />
                  ဝင်ရောက်မည်
                </button>
              </div>
            ) : adminStep === "generator" ? (
              <div className="mt-3 space-y-2.5 text-xs">
                <p className="text-muted-foreground">
                  ဝယ်ယူသူအတွက် သက်တမ်းအလိုက် Random VIP Code အသစ် ထုတ်ယူပါ-
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleCreateCode("1M", 30)} className="rounded-xl border border-border bg-secondary py-2 font-semibold hover:bg-secondary/80">
                    + 1 Month (၃၀ ရက်)
                  </button>
                  <button type="button" onClick={() => handleCreateCode("3M", 90)} className="rounded-xl border border-border bg-secondary py-2 font-semibold hover:bg-secondary/80">
                    + 3 Months (၉၀ ရက်)
                  </button>
                  <button type="button" onClick={() => handleCreateCode("6M", 180)} className="rounded-xl border border-border bg-secondary py-2 font-semibold hover:bg-secondary/80">
                    + 6 Months (၁၈၀ ရက်)
                  </button>
                  <button type="button" onClick={() => handleCreateCode("1Y", 365)} className="rounded-xl border border-gold bg-gold/15 py-2 font-bold text-primary">
                    + 1 Year (၃၆၅ ရက်)
                  </button>
                </div>

                {generatedCode && (
                  <div className="mt-2 rounded-xl border border-gold bg-background p-3">
                    <div className="break-all font-mono text-xs font-bold text-primary">
                      {generatedCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-burgundy text-xs font-semibold text-primary-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copy ကူးပြီးပါပြီ ✓" : "Code ကို Copy ကူးမည်"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2">
                    <span className="font-medium">1 Month (၁ လစာ)</span>
                    <span className="font-bold text-primary">3,500 Ks</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2">
                    <span className="font-medium">3 Months (၃ လစာ)</span>
                    <span className="font-bold text-primary">10,000 Ks</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2">
                    <span className="font-medium">6 Months (၆ လစာ)</span>
                    <span className="font-bold text-primary">20,000 Ks</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border-2 border-gold bg-gold/10 px-3 py-2">
                    <span className="flex items-center gap-1 font-bold text-primary">
                      <Check className="h-3.5 w-3.5 text-gold" />
                      1 Year (၁ နှစ်စာ)
                    </span>
                    <span className="font-bold text-burgundy">36,000 Ks</span>
                  </div>
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

                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    TikTok မှ ရရှိထားသော VIP Code ကို အောက်တွင် ရိုက်ထည့်ပါ-
                  </p>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ဥပမာ - MPT-1M-XXXX-XXXXXX-XXXXXX"
                    className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                  />
                  {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
                  <button
                    type="button"
                    onClick={handleUnlockOrGate}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-burgundy text-sm font-semibold text-primary-foreground"
                  >
                    <KeyRound className="h-4 w-4" />
                    VIP အတည်ပြုမည်
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
