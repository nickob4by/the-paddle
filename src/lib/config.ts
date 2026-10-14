export interface SiteConfig {
  brandName: string;
  brandTagline: string;
  shortName: string;
  logoLight: string;
  logoDark: string;
  defaultCurrency: string;
  defaultOpenTime: string;
  defaultCloseTime: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export const siteConfig: SiteConfig = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'The Paddle',
  brandTagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Recreational Hub & Pickleball Club',
  shortName: process.env.NEXT_PUBLIC_SHORT_NAME || 'The Paddle',
  logoLight: process.env.NEXT_PUBLIC_LOGO_LIGHT || '/the-paddle-logo-light.png',
  logoDark: process.env.NEXT_PUBLIC_LOGO_DARK || '/the-paddle-logo-dark.png',
  defaultCurrency: process.env.NEXT_PUBLIC_CURRENCY || '₱',
  defaultOpenTime: process.env.NEXT_PUBLIC_DEFAULT_OPEN_TIME || '05:00',
  defaultCloseTime: process.env.NEXT_PUBLIC_DEFAULT_CLOSE_TIME || '03:00',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '0917-888-PADL (7235)',
  address: process.env.NEXT_PUBLIC_ADDRESS || 'Cebu City, Philippines',
};
