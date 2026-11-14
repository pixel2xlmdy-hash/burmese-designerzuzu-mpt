import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";

const VIP_STORAGE_KEY = "mpt_tailor_vip_status";
// ကိုကြီး ငွေရှင်းပြီးသား User တွေကို ပေးမယ့် လျှို့ဝှက် VIP ကုဒ် (နောက်ပိုင်း ပြောင်းလို့ရပါတယ်)
const VALID_VIP_CODES = ["MPTVIP2026", "ZUZUVIP888", "TAILORPRO99"];

export function AdBanner() {
  const [isVip, setIsVip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem(VIP_STORAGE_KEY) === "true") {
        setIsVip(true);
      }
    } catch {}
  }, []);

  const handleUnlockVip = () => {
    const trimmed = code.trim().toUpperCase();
    if (VALID_VIP_CODES.includes(trimmed)) {
      try {
        localStorage.setItem(VIP_STORAGE_KEY, "true");
      } catch {}
      setIsVip(true);
      setShowModal(false);
      setError("");
    } else {
      setError("VIP ကုဒ် မှားယွင်းနေပါသည် (Admin ထံ ဆက်သွယ်ပါ)");
    }
  };

  // VIP ဖြစ်ပြီးသား User ဆိုရင် ကြော်ငြာ လုံးဝ မပြတော့ပါ
  if (isVip) return null;

  return (
    <div className="no-print mx-auto max-w-3xl px-4 pb-6">
      <div className="rounded-2xl border border-gold/40 bg-card p-3 shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sponsored • ကြော်ငြာ
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1 rounded-full bg-burgundy px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm"
          >
            <Crown className="h-3 w-3" />
            ကြော်ငြာဖြုတ်ရန် (VIP)
          </button>
        </div>

        {/* နောက်ပိုင်း Google AdSense / AdMob Banner ကုဒ် ထည့်မည့် နေရာ */}
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
                VIP (ကြော်ငြာမပါ) ဖွင့်ရန်
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              ကြော်ငြာများ ဖျောက်ပြီး သန့်ရှင်းစွာ အသုံးပြုရန် Admin ထံမှ ရရှိထားသော VIP Activation Code ကို ထည့်သွင်းပါ။
            </p>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VIP Code ထည့်ပါ (ဥပမာ - MPTVIP2026)"
              className="mt-3 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm uppercase"
            />

            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}

            <button
              type="button"
              onClick={handleUnlockVip}
              className="mt-4 h-10 w-full rounded-xl bg-burgundy text-sm font-semibold text-primary-foreground"
            >
              VIP အတည်ပြုမည်
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
