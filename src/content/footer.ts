import type { Locale } from "./locales";
// Placeholder contact details: the owner will replace email and social URLs.
type FooterCopy = { email: string; siteLabel: string; socialLabel: string; socials: { label: string; href: string }[]; rights: string; place: string };
const socials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Facebook", href: "https://facebook.com" },
];
const copy: Record<Locale, FooterCopy> = {
  ka: { email: "hello@nextagency.ge", siteLabel: "NEXT AGENCY", socialLabel: "გამოგვყევი", socials, rights: "ყველა უფლება დაცულია", place: "თბილისი, საქართველო" },
  en: { email: "hello@nextagency.ge", siteLabel: "NEXT AGENCY", socialLabel: "Connect on", socials, rights: "All rights reserved", place: "Tbilisi, Georgia" },
};
export const footerCopy = (locale: Locale) => copy[locale];
