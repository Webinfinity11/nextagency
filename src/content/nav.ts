import type { Locale } from "./locales";
// Where each main navigation label goes, in the order of `nav` in content/{ka,en}/hero.ts.
export const NAV_PATHS = ["/work", "/services", "/blog", "/contact"] as const;
export const navHref = (locale: Locale, index: number) => `/${locale}${NAV_PATHS[index] ?? ""}`;
