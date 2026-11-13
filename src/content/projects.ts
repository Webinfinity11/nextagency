import "server-only";
import { db } from "@/lib/db";
import type { Project as Row } from "@/generated/prisma/client";
import type { Locale } from "./locales";
export type Localized = Record<Locale, string>;
export type CategoryId = "identity" | "digital";
export type MediaBlock = { kind: "image" | "video"; src: string; poster?: string; aspect: number; wide: boolean; bg?: string };
export type TextBlock = { kind: "text"; ka: string; en: string; bg?: string };
export type Block = MediaBlock | TextBlock;
export type Project = {
  slug: string; title: Localized; summary: Localized; category: CategoryId;
  /** Project page info column. */
  tags: Record<Locale, string[]>; headline: Localized; intro: Localized;
  client: Localized; services: Localized; team: Localized; websiteUrl?: string;
  /** Media panel background on the project page. */
  accent: string;
  cover: { kind: "gradient" | "image" | "video"; src?: string; poster?: string; aspect: number; tone: [string, string] };
  year: number; order: number;
  blocks: Block[];
};
export type Category = { id: CategoryId; title: Localized; description: Localized; theme: "light" | "dark" };
// Projects live in Postgres and are edited at /admin; only published ones reach the site.
function toProject(r: Row): Project {
  return {
    slug: r.slug, title: { ka: r.titleKa, en: r.titleEn }, summary: { ka: r.summaryKa, en: r.summaryEn },
    category: r.category,
    tags: { ka: r.tagsKa, en: r.tagsEn }, headline: { ka: r.headlineKa, en: r.headlineEn }, intro: { ka: r.introKa, en: r.introEn },
    client: { ka: r.clientKa, en: r.clientEn }, services: { ka: r.servicesKa, en: r.servicesEn }, team: { ka: r.teamKa, en: r.teamEn },
    websiteUrl: r.websiteUrl ?? undefined, accent: r.accent,
    cover: { kind: r.coverKind, src: r.coverSrc ?? undefined, poster: r.coverPoster ?? undefined, aspect: r.coverAspect, tone: [r.toneA, r.toneB] },
    year: r.year, order: r.order, blocks: Array.isArray(r.blocks) ? (r.blocks as Block[]) : [],
  };
}
const categories: Category[] = [
  { id: "identity", title: { ka: "იდენტობა", en: "Identity" }, description: { ka: "ვქმნით ვიზუალურ ენას, რომელიც იდეას მკაფიო ფორმას აძლევს.", en: "Visual languages that give an idea a clear and distinctive form." }, theme: "light" },
  { id: "digital", title: { ka: "ციფრული", en: "Digital" }, description: { ka: "ვაკავშირებთ ადამიანებსა და იდეებს მარტივი ციფრული გამოცდილებით.", en: "Connecting people and ideas through considered digital experiences." }, theme: "dark" },
];
export async function getProjects(): Promise<Project[]> {
  return (await db.project.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] })).map(toProject);
}
export async function getProject(slug: string) {
  const row = await db.project.findFirst({ where: { slug, published: true } });
  return row ? toProject(row) : undefined;
}
export async function getCategories(): Promise<Category[]> { return structuredClone(categories); }
export async function getProjectsByCategory(id: CategoryId) { return (await getProjects()).filter(p => p.category === id); }
