"use client";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { HeroContent } from "@/content";
import type { Locale } from "@/content/locales";
import { LocaleSwitch } from "./LocaleSwitch";
import { navHref } from "@/content/nav";
export function Nav({ copy, locale }: { copy: HeroContent; locale: Locale }) {
  return (
    <header className="nav">
      <div className="nav-start">
      <Link className="nav-brand" href={`/${locale}`} aria-label={copy.home}>
        <Logo className="nav-logo" variant="stacked" />
      </Link>
      <nav className="nav-links" aria-label={copy.navLabel}>
        {copy.nav.map((label, index) => (
          <Link key={label} href={navHref(locale, index)}>
            {label}
          </Link>
        ))}
      </nav>
      <details className="nav-menu"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) event.currentTarget.open = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary aria-label={copy.navLabel}><span /><span /></summary>
        <nav aria-label={copy.navLabel}>
          {copy.nav.map((label, index) => (
            <Link key={label} href={navHref(locale, index)}>{label}</Link>
          ))}
        </nav>
      </details>
      </div>
      <div className="nav-end">
        <LocaleSwitch
          locale={locale}
          label={copy.langLabel}
          short={copy.langShort}
        />
      </div>
    </header>
  );
}
