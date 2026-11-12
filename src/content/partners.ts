import type { Locale } from "./locales";
// Monochrome copies of the logos shown on infinity.ge (public/partners); `scale` evens out optical weight.
export type Partner = { name: string; src: string; scale?: number };
export const partners: Partner[] = [
  { name: "Toyota", src: "/partners/toyota.png", scale: 1.05 },
  { name: "New Balance", src: "/partners/new-balance.png" },
  { name: "EA7 Emporio Armani", src: "/partners/ea7.png" },
  { name: "Axis", src: "/partners/axis.svg", scale: .8 },
  { name: "Teka", src: "/partners/teka.png", scale: .8 },
  { name: "Oto Motors", src: "/partners/otomotors.svg", scale: .7 },
  { name: "Synevo", src: "/partners/synevo.png" },
  { name: "Diplomat Georgia", src: "/partners/diplomat.png", scale: .85 },
  { name: "Georgian Railway", src: "/partners/georgian-railway.png", scale: .85 },
  { name: "Ministry of Culture of Georgia", src: "/partners/ministry-of-culture.png", scale: .85 },
  { name: "Alliance Group", src: "/partners/alliance.png", scale: 1.15 },
  { name: "L'Occitane", src: "/partners/loccitane.png", scale: .6 },
];
const copy: Record<Locale, { title: string }> = { ka: { title: "პარტნიორები" }, en: { title: "Partners" } };
export const partnersCopy = (locale: Locale) => copy[locale];
