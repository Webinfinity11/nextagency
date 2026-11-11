"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/content/locales";
type Props = { locale: Locale; label: string; short: string };
export function LocaleSwitch({ locale, label, short }: Props) {
  const pathname = usePathname();
  const target = locales.find((l) => l !== locale)!;
  const rest = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  return (
    <Link
      className="nav-locale"
      href={`/${target}${rest}`}
      hrefLang={target}
      aria-label={label}
    >
      <span lang={target}>{short}</span>
    </Link>
  );
}
