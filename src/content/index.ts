import type { Locale } from "./locales";
import type { HeroContent } from "./types";
import { hero as ka } from "./ka/hero";
import { hero as en } from "./en/hero";
export type { HeroContent } from "./types";
const content: Record<Locale, HeroContent> = { ka, en };
export const getContent = (locale: Locale) => content[locale];
