import type { ReactNode } from "react";
import { HeroHeadline } from "./HeroHeadline";
import { HeroMedia } from "./HeroMedia";
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
      <HeroMedia copy={copy} />
      {children}
    </>
  );
}
