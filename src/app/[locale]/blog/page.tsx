import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/locales";
import { blogCopy, formatDate, getPosts } from "@/content/blog";
import { WorkMotion } from "@/components/work/WorkMotion";
import { workMetadata } from "../work/metadata";
import { display } from "@/lib/mtavruli";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const c = blogCopy(locale); return workMetadata(locale, "/blog", c.title, c.description);
}
export default async function Blog({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const c = blogCopy(locale), posts = await getPosts(locale);
  return <main id="main" className="blog">
    <WorkMotion>
      <header className="blog-hero"><h1 className="blog-title" data-work-reveal>{display(c.title, locale)}</h1><p>{c.description}</p></header>
      {posts.length === 0 ? <p className="blog-empty">{c.empty}</p> :
      <ol className="blog-grid">
        {posts.map((p, i) => <li key={p.slug} className={i === 0 ? "is-lead" : undefined}>
          <Link className="blog-card" href={`/${locale}/blog/${p.slug}`}>
            <div className="blog-cover">{p.coverSrc ? <Image src={p.coverSrc} alt="" fill sizes={i === 0 ? "(max-width: 900px) 92vw, 60vw" : "(max-width: 900px) 92vw, 30vw"} /> : <span aria-hidden="true" />}</div>
            <time dateTime={p.date.toISOString()}>{formatDate(p.date, locale)}</time>
            <h2>{p.title}</h2>
            {p.excerpt && <p>{p.excerpt}</p>}
          </Link>
        </li>)}
      </ol>}
    </WorkMotion>
  </main>;
}
