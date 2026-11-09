import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FACEBOOK_URL, PHONE_1, PHONE_2, TIKTOK_HANDLE, TIKTOK_URL } from "@/lib/brand";
import { FacebookIcon, TikTokIcon } from "./BrandIcons";

export function SocialBar() {
  return (
    <nav
      aria-label="Contact"
      className="no-scrollbar flex gap-2 overflow-x-auto whitespace-nowrap px-4 py-1.5"
    >
      <Button asChild variant="call" size="pill" className="shrink-0">
        <a href={`tel:${PHONE_1}`}>
          <Phone /> Call {PHONE_1}
        </a>
      </Button>
      <Button asChild variant="call" size="pill" className="shrink-0">
        <a href={`tel:${PHONE_2}`}>
          <Phone /> Call {PHONE_2}
        </a>
      </Button>
      <Button asChild variant="tiktok" size="pill" className="shrink-0">
        <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer">
          <TikTokIcon /> {TIKTOK_HANDLE}
        </a>
      </Button>
      <Button asChild variant="facebook" size="pill" className="shrink-0">
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
          <FacebookIcon /> Facebook Page
        </a>
      </Button>
    </nav>
  );
}
