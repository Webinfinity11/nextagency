import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/content/locales";
export function workMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return { title: `${title} — NEXT AGENCY`, description, alternates: { canonical: `/${locale}${path}`, languages: Object.fromEntries([...locales.map(l => [l, `/${l}${path}`]), ["x-default", `/${defaultLocale}${path}`]]) } };
}
