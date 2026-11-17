"use client";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/content/locales";
type Props = { locale: Locale; label: string; short: string };
export function LocaleSwitch({ locale, label, short }: Props) {
  const pathname = usePathname();
  const target = locales.find((l) => l !== locale)!;
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  // A plain link, not <Link>: switching locale swaps the root layout (<html lang>, the loader bootstrap script),
  // which only a full page load renders cleanly. The loader is skipped on that load (sessionStorage).
  return (
    <a
      className="nav-locale"
      href={`/${target}${rest}`}
      hrefLang={target}
      aria-label={label}
    >
      <span lang={target}>{short}</span>
    </a>
  );
}
