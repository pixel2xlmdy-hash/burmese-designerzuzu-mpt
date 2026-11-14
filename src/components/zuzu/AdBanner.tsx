import { useEffect, useState } from "react";
import { Crown, X, Check, ExternalLink } from "lucide-react";

const VIP_STORAGE_KEY = "mpt_tailor_vip_data";

const TIKTOK_CONTACT_URL = "https://www.tiktok.com/@myinzulwin7?_r=1&_t=ZS-900AAD2pDFd";

const VIP_PLANS: Record<string, { label: string; days: number }> = {
  MPT1M2026: { label: "1 Month Plan (၁ လစာ)", days: 30 },
  MPT6M2026: { label: "6 Months Plan (၆ လစာ)", days: 180 },
  MPT1Y2026: { label: "1 Year Plan (၁ နှစ်စာ)", days: 365 },
};

export function AdBanner() {
  const [isVip, setIsVip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIP_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.expiresAt === "number" && Date.now() < parsed.expiresAt) {
        setIsVip(true);
      } else {
        localStorage.removeItem(VIP_STORAGE_KEY);
        setIsVip(false);
      }
    } catch {}
  }, []);

  const handleUnlockVip = () => {
    const trimmed = code.trim().toUpperCase();
    const plan = VIP_PLANS[trimmed];
    if (plan) {
      const expiresAt = Date.now() + plan.days * 24 * 60 * 60 * 1000;
      try {
        localStorage.setItem(
          VIP_STORAGE_KEY,
          JSON.stringify({ plan: plan.label, expiresAt })
        );
      } catch {}
      setIsVip(true);
      setShowModal(false);
      setError("");
    } else {
      setError("VIP ကုဒ် မှားယွင်းနေပါသည် (TikTok မှတစ်ဆင့် ဆက်သွယ်မေးမြန်းပါ)");
    }
  };

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
                VIP Plan များ (ကြော်ငြာမပါ)
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

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2">
                <span className="font-medium">1 Month (၁ လစာ)</span>
                <span className="font-bold text-primary">3,500 Ks</span>
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
