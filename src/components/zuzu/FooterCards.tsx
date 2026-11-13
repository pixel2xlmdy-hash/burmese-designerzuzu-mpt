import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FACEBOOK_URL, PHONE_1, PHONE_2, TIKTOK_URL } from "@/lib/brand";
import { FacebookIcon, TikTokIcon } from "./BrandIcons";

export function FooterCards() {
  return (
    <footer className="mx-auto max-w-3xl space-y-3 px-4 pb-10 pt-8">
      <div className="rounded-2xl border border-gold/40 bg-champagne-gradient p-4 text-center text-[15px] leading-loose text-accent-foreground shadow-card">
        "မင်္ဂလာပါ" Designer Zu Zu မှ ဖန်တီးထားသော MPT FIT TAILOR PRO ကို အသုံးပြုပေးသည့် အတွက် ကျေးဇူးအထူး တင်ရှိပါတယ်ရှင့် 🙏
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 text-center text-[15px] leading-loose shadow-card">
        သင့်ရဲ့ ဒီဇိုင်းလုပ်ငန်းနဲ့ အထည်ချုပ်လုပ်ငန်းတွေကို ပိုမိုလွယ်ကူစွာ စီမံခန့်ခွဲနိုင်ပါစေ။ 🙏

      </div>
      <div className="flex flex-col items-center gap-3 pt-4">
        <p className="font-display text-sm text-muted-foreground">
            Designed & Developed by Ko Gyi (နက္ခတ်)
            <br />
            <span className="font-script text-base italic">Specially Created with Love for Zu Zu ❤️</span>
          </p>
        <div className="flex gap-3">
          <Button asChild variant="call" size="icon-lg" aria-label={`Call ${PHONE_1}`}>
            <a href={`tel:${PHONE_1}`}>
              <Phone />
            </a>
          </Button>
          <Button asChild variant="call" size="icon-lg" aria-label={`Call ${PHONE_2}`}>
            <a href={`tel:${PHONE_2}`}>
              <Phone />
            </a>
          </Button>
          <Button asChild variant="tiktok" size="icon-lg" aria-label="TikTok">
            <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer">
              <TikTokIcon />
            </a>
          </Button>
          <Button asChild variant="facebook" size="icon-lg" aria-label="Facebook">
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
              <FacebookIcon />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
