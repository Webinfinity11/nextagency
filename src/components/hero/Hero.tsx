import type { ReactNode } from "react";
import { HeroHeadline } from "./HeroHeadline";
import { HeroMedia } from "./HeroMedia";
import { Partners } from "@/components/partners/Partners";
import type { HeroContent } from "@/content";
import type { Locale } from "@/content/locales";
export function Hero({
  copy,
  locale,
  children,
}: {
  copy: HeroContent;
  locale: Locale;
  children?: ReactNode;
}) {
  return (
    <>
      <HeroHeadline copy={copy} locale={locale} />
      {/* Partner logos fill the white band between the headline and the showreel. */}
      <Partners locale={locale} />
      <HeroMedia copy={copy} />
      {children}
    </>
  );
}
