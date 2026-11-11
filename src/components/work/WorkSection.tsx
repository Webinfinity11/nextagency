import Link from "next/link";
import type { Locale } from "@/content/locales";
import { getCategories, getFeaturedProjects, getProjects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { WorkMotion } from "./WorkMotion";
import { workCopy } from "./copy";
import { display } from "@/lib/mtavruli";
export async function WorkSection({ locale }: { locale: Locale }) {
  const [featured, projects, categories] = await Promise.all([getFeaturedProjects(), getProjects(), getCategories()]);
  const copy = workCopy(locale);
  return <section id="work" aria-labelledby="work-title"><WorkMotion>
    <div className="work-featured">
      <header className="work-section-heading"><span className="work-eyebrow">NEXT / 01—06</span><h2 id="work-title" className="work-heading" data-work-reveal>{display(copy.selected, locale)}</h2></header>
      <div className="work-pair" data-large="0">{featured.slice(0, 2).map(project => <div className="work-column" key={project.slug}><ProjectCard project={project} locale={locale} /></div>)}</div>
      <div className="work-wide"><ProjectCard project={featured[2]} locale={locale} /></div>
      <div className="work-pair work-pair-reverse" data-large="1">{featured.slice(3, 5).map((project, i) => <div className="work-column" key={project.slug}><ProjectCard project={project} locale={locale} />{i === 0 && <Link className="work-all" href={`/${locale}/work`}><span data-work-reveal>{copy.all}</span><sup>{String(projects.length).padStart(2, "0")}</sup><i aria-hidden="true">↗</i></Link>}</div>)}</div>
    </div>
    {categories.map(category => <section className={`work-category work-theme-${category.theme}`} key={category.id} aria-labelledby={`category-${category.id}`}>
      <header className="work-category-heading"><h2 className="work-heading" id={`category-${category.id}`} data-work-reveal>{display(category.title[locale], locale)}</h2><p data-work-reveal>{category.description[locale]}</p></header>
      <div className="work-drag"><div className="work-track">{projects.filter(p => p.category === category.id).map(project => <ProjectCard project={project} locale={locale} key={project.slug} />)}</div></div>
      <p className="work-drag-hint">{copy.drag}<span aria-hidden="true">↔</span></p>
    </section>)}
  </WorkMotion></section>;
}
