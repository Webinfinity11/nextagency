import { notFound } from "next/navigation";
import { isLocale } from "@/content/locales";
import { getCategories, getProjectsByCategory } from "@/content/projects";
import { ProjectCard } from "@/components/work/ProjectCard";
import { WorkMotion } from "@/components/work/WorkMotion";
import { workCopy } from "@/components/work/copy";
import { workMetadata } from "./metadata";
import { display } from "@/lib/mtavruli";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[locale]/work">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const copy = workCopy(locale); return workMetadata(locale, "/work", copy.title, copy.description);
}
export default async function WorkIndex({ params }: PageProps<"/[locale]/work">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const categories = await getCategories();
  const groups = (await Promise.all(categories.map(async category => ({ category, projects: await getProjectsByCategory(category.id) })))).filter(g => g.projects.length);
  const copy = workCopy(locale);
  return <main id="main" className="work-index"><WorkMotion>
    <header className="work-page-heading"><h1 className="work-heading" data-work-reveal>{display(copy.title, locale)}</h1><p>{copy.description}</p></header>
    {groups.map(({ category, projects }) => <section className={`work-index-group work-theme-${category.theme}`} key={category.id}>
      <header className="work-category-heading"><h2 className="work-heading" data-work-reveal>{display(category.title[locale], locale)}</h2><p data-work-reveal>{category.description[locale]}</p></header>
      <div className="work-index-grid">{projects.map(project => <ProjectCard project={project} locale={locale} key={project.slug} />)}</div>
    </section>)}
  </WorkMotion></main>;
}
