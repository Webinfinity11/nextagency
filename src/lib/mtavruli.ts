import type { Locale } from "@/content/locales";
/** Mkhedruli (U+10D0–U+10FA) → Mtavruli (U+1C90–U+1CBA); everything else unchanged. */
export function toMtavruli(text: string) {
  return text.replace(/[ა-ჺ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0xbc0),
  );
}
/** Display headings render Georgian in Mtavruli; content stays Mkhedruli. */
export const display = (text: string, locale: Locale) =>
  locale === "ka" ? toMtavruli(text) : text;
