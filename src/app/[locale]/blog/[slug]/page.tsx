import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/locales";
import { blogCopy, formatDate, getPost } from "@/content/blog";
import { PostBody } from "@/components/blog/PostBody";
import { workMetadata } from "../../work/metadata";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const p = await getPost(slug, locale); if (!p) notFound();
  return workMetadata(locale, `/blog/${slug}`, p.title, p.excerpt);
}
export default async function Post({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const p = await getPost(slug, locale); if (!p) notFound();
  const c = blogCopy(locale);
  return <main id="main" className="post">
    <article>
      <header className="post-head">
        <Link className="post-back" href={`/${locale}/blog`}>{c.back}</Link>
        <time dateTime={p.date.toISOString()}>{formatDate(p.date, locale)}</time>
        <h1 className="post-title">{p.title}</h1>
        {p.excerpt && <p className="post-lead">{p.excerpt}</p>}
      </header>
      {p.coverSrc && <figure className="post-cover" style={{ aspectRatio: p.coverAspect }}><Image src={p.coverSrc} alt="" fill sizes="(max-width: 900px) 92vw, 1100px" priority /></figure>}
      <PostBody text={p.body} />
    </article>
  </main>;
}
