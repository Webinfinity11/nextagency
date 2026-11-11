import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/content/locales";
import { getProject, getProjects, getCategories } from "@/content/projects";
import { ProjectCover } from "@/components/work/ProjectCard";
import { workCopy } from "@/components/work/copy";
import { workMetadata } from "../metadata";
import { display } from "@/lib/mtavruli";
export const dynamicParams = false;
export async function generateStaticParams() { const projects = await getProjects(); return locales.flatMap(locale => projects.map(p => ({ locale, slug: p.slug }))); }
export async function generateMetadata({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const project = await getProject(slug); if (!project) notFound();
  return workMetadata(locale, `/work/${slug}`, project.title[locale], project.summary[locale]);
}
export default async function ProjectPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const project = await getProject(slug); if (!project) notFound();
  const [projects, categories] = await Promise.all([getProjects(), getCategories()]);
  const category = categories.find(c => c.id === project.category)!;
  const next = projects[(projects.findIndex(p => p.slug === slug) + 1) % projects.length];
  const copy = workCopy(locale);
  return <main id="main" className="work-detail">
    <Link className="work-back" href={`/${locale}/work`}>↖ {copy.back}</Link>
    <header className="work-page-heading"><span className="work-eyebrow">{copy.placeholder} / {String(project.order).padStart(2, "0")}</span><h1 className="work-heading">{display(project.title[locale], locale)}</h1><p>{project.summary[locale]}</p></header>
    <dl className="work-facts"><div><dt>{copy.year}</dt><dd>{project.year}</dd></div><div><dt>{copy.category}</dt><dd>{category.title[locale]}</dd></div></dl>
    <ProjectCover project={project} />
    <footer className="work-detail-footer"><p>{copy.note}</p><Link className="work-all" href={`/${locale}/work/${next.slug}`}><span>{copy.next}: {next.title[locale]}</span><i aria-hidden="true">↗</i></Link></footer>
  </main>;
}
