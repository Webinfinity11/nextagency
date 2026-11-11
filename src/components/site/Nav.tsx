import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { HeroContent } from "@/content";
import type { Locale } from "@/content/locales";
import { LocaleSwitch } from "./LocaleSwitch";
export function Nav({ copy, locale }: { copy: HeroContent; locale: Locale }) {
  return (
    <header className="nav">
      <Link className="nav-brand" href={`/${locale}`} aria-label={copy.home}>
        <Logo className="nav-logo" />
      </Link>
      <nav className="nav-links" aria-label={copy.navLabel}>
        {copy.nav.map((label, index) => (
          <Link key={label} href={index === 0 ? `/${locale}/work` : `/${locale}#next`}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="nav-end">
        <LocaleSwitch
          locale={locale}
          label={copy.langLabel}
          short={copy.langShort}
        />
        <Link className="nav-cta" href={`/${locale}#contact`}>
          {copy.cta}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
