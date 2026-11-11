import { work as ka } from "@/content/ka/work";
import { work as en } from "@/content/en/work";
import type { Locale } from "@/content/locales";
export const workCopy = (locale: Locale) => ({ ka, en })[locale];
