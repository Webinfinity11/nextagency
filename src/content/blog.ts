import "server-only";
import { db } from "@/lib/db";
import type { Locale } from "./locales";
// Blog posts live in Postgres and are edited at /admin/posts; only published ones reach the site.
export type PostCard = { slug: string; title: string; excerpt: string; date: Date; coverSrc?: string; coverAspect: number };
export type PostFull = PostCard & { body: string };
const pick = (r: { slug: string; titleKa: string; titleEn: string; excerptKa: string; excerptEn: string; publishedAt: Date; coverSrc: string | null; coverAspect: number }, l: Locale): PostCard => ({
  slug: r.slug, title: (l === "ka" ? r.titleKa : r.titleEn) || r.titleKa, excerpt: (l === "ka" ? r.excerptKa : r.excerptEn) || r.excerptKa,
  date: r.publishedAt, coverSrc: r.coverSrc ?? undefined, coverAspect: r.coverAspect,
});
export async function getPosts(locale: Locale): Promise<PostCard[]> {
  return (await db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } })).map(r => pick(r, locale));
}
export async function getPost(slug: string, locale: Locale): Promise<PostFull | undefined> {
  const r = await db.post.findFirst({ where: { slug, published: true } });
  return r ? { ...pick(r, locale), body: (locale === "ka" ? r.bodyKa : r.bodyEn) || r.bodyKa } : undefined;
}
const copy = {
  ka: { title: "ბლოგი", description: "ფიქრები დიზაინზე, ტექნოლოგიასა და ციფრულ ბრენდებზე.", empty: "პირველი სტატია მალე გამოჩნდება.", back: "ყველა სტატია", read: "წაკითხვა" },
  en: { title: "Blog", description: "Notes on design, technology and digital brands.", empty: "The first article is coming soon.", back: "All articles", read: "Read" },
};
export const blogCopy = (locale: Locale) => copy[locale];
const KA_MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
export const formatDate = (d: Date, locale: Locale) => locale === "ka" ? `${d.getDate()} ${KA_MONTHS[d.getMonth()]}, ${d.getFullYear()}` : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
