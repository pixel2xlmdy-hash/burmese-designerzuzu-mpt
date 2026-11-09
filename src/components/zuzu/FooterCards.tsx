import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FACEBOOK_URL, PHONE_1, PHONE_2, TIKTOK_URL } from "@/lib/brand";
import { FacebookIcon, TikTokIcon } from "./BrandIcons";

export function FooterCards() {
  return (
    <footer className="mx-auto max-w-3xl space-y-3 px-4 pb-10 pt-8">
      <div className="rounded-2xl border border-gold/40 bg-champagne-gradient p-4 text-center text-[15px] leading-loose text-accent-foreground shadow-card">
        👗 ပွဲတက်၊ ရိုးရာ၊ မင်္ဂလာဝတ်စုံ အပ်ထည်များ လက်ခံပါသည်။
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 text-center text-[15px] leading-loose shadow-card">
        🙏 App အသုံးပြုပေးသည့်အတွက် အထူးပင် ကျေးဇူးတင်ရှိပါသည်။
      </div>
      <div className="flex flex-col items-center gap-3 pt-4">
        <p className="font-display text-sm text-muted-foreground">
          မြောက်ပြင်သူ <span className="text-gold">•</span>{" "}
          <span className="font-script text-base italic">Designer Zu Zu</span>
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
