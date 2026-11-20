export interface ShopBrandProfile {
  shopName: string;
  logoUrl: string;
  designerName: string;
  phone: string;
  address: string;
  thankYouMessage: string;
}

const STORAGE_KEY = "mpt_fit_tailor_brand_profile_v1";

export const DEFAULT_BRAND_PROFILE: ShopBrandProfile = {
  shopName: "MPT FIT TAILOR PRO",
  logoUrl: "",
  designerName: "Designer Zu Zu",
  phone: "",
  address: "",
  thankYouMessage: "အားပေးမှုကို အထူးကျေးဇူးတင်ပါသည်။",
};

export function getShopBrandProfile(): ShopBrandProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRAND_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      shopName: parsed.shopName?.trim() || DEFAULT_BRAND_PROFILE.shopName,
      logoUrl: parsed.logoUrl || "",
      designerName: parsed.designerName?.trim() || DEFAULT_BRAND_PROFILE.designerName,
      phone: parsed.phone || "",
      address: parsed.address || "",
      thankYouMessage: parsed.thankYouMessage?.trim() || DEFAULT_BRAND_PROFILE.thankYouMessage,
    };
  } catch {
    return DEFAULT_BRAND_PROFILE;
  }
}

export function saveShopBrandProfile(profile: ShopBrandProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
