import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | မြောက်ပြင်သူ - MYAUK PYIN THU FIT TAILOR PRO" },
      {
        name: "description",
        content: "Privacy Policy for MYAUK PYIN THU FIT TAILOR PRO (မြောက်ပြင်သူ) mobile and web application.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          App ပင်မစာမျက်နှာသို့ ပြန်သွားရန်
        </Link>

        <div className="mt-4 flex items-center gap-2.5 border-b border-border pb-4">
          <ShieldCheck className="h-7 w-7 shrink-0 text-primary" />
          <div>
            <h1 className="font-display text-xl font-bold text-primary sm:text-2xl">
              Privacy Policy (ကိုယ်ရေးအချက်အလက် မူဝါဒ)
            </h1>
            <p className="text-xs text-muted-foreground">
              MYAUK PYIN THU FIT TAILOR PRO (မြောက်ပြင်သူ) • Last Updated: November 2026
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-1.5">
            <h2 className="font-bold text-primary">1. Overview (အကျဉ်းချုပ်)</h2>
            <p>
              <strong>MYAUK PYIN THU FIT TAILOR PRO (မြောက်ပြင်သူ)</strong> is developed by Designer Zu Zu to help tailors and fashion designers manage garment measurements, customer orders, and voucher slips. We respect your privacy and are committed to protecting your shop and customer data.
            </p>
            <p className="text-xs text-muted-foreground">
              မြောက်ပြင်သူ (MPT Fit Tailor Pro) App သည် စက်ချုပ်ဆိုင်များနှင့် ဖက်ရှင်ဒီဇိုင်နာများအတွက် ကိုယ်တိုင်းမှတ်တမ်းနှင့် ဘောက်ချာစလစ်များ စီမံခန့်ခွဲရန် ဖန်တီးထားခြင်းဖြစ်ပြီး အသုံးပြုသူများ၏ အချက်အလက် လုံခြုံရေးကို အထူးအလေးထားပါသည်။
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-primary">2. Information We Collect (ကောက်ယူသိမ်းဆည်းသော အချက်အလက်များ)</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Account Information:</strong> Username, Email address or Phone number, encrypted password, and a 4-digit recovery PIN solely for multi-device Cloud Sync authentication.
              </li>
              <li>
                <strong>Tailoring & Shop Records:</strong> Customer names, phone numbers, garment measurements, design notes, and voucher pricing entered by you. These records are stored locally on your device and securely synced to your private cloud account.
              </li>
              <li>
                <strong>Device & License Verification:</strong> Non-personal device identifiers used strictly to verify VIP Ad-Free subscriptions (1-device license protection).
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-primary">3. Advertising & Third-Party Services (ကြော်ငြာနှင့် ပြင်ပဝန်ဆောင်မှုများ)</h2>
            <p>
              The free version of this application may display advertisements provided by third-party ad networks such as <strong>Google AdMob</strong> or <strong>Meta (Facebook) Audience Network</strong>. These services may collect anonymous advertising identifiers (such as Google Advertising ID) to serve relevant ads. Users who activate a VIP Ad-Free plan will not see advertisements.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-primary">4. Data Security & User Control (ဒေတာလုံခြုံရေးနှင့် ထိန်းချုပ်ခွင့်)</h2>
            <p>
              We do not sell, rent, or trade your customer measurement lists or personal information to any third party. You can export, back up, or delete your shop records at any time from the Settings menu.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-primary">5. Children&apos;s Privacy (ကလေးသူငယ်ဆိုင်ရာ မူဝါဒ)</h2>
            <p>
              This application is intended for business and tailoring professionals and does not knowingly collect personal data from children under the age of 13.
            </p>
          </section>

          <section className="space-y-1.5 rounded-xl bg-secondary/60 p-4">
            <h2 className="font-bold text-primary">6. Contact Us (ဆက်သွယ်ရန်)</h2>
            <p className="text-xs">
              If you have any questions regarding this Privacy Policy or wish to request account/data deletion, please contact the developer:
            </p>
            <p className="text-xs font-semibold">
              Developer: Designer Zu Zu (MYAUK PYIN THU FIT TAILOR PRO)
              <br />
              Email: pixel2xl.mdy@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
