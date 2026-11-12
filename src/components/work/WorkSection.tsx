import type { Locale } from "@/content/locales";
import { getCategories, getProjects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { WorkMotion } from "./WorkMotion";
import { WorkRail } from "./WorkRail";
import { workCopy } from "./copy";
import { display } from "@/lib/mtavruli";
export async function WorkSection({ locale }: { locale: Locale }) {
  const [projects, categories] = await Promise.all([getProjects(), getCategories()]);
  const copy = workCopy(locale);
  const items = projects.map(p => ({
    slug: p.slug, href: `/${locale}/work/${p.slug}`, title: p.title[locale], caption: display(p.title[locale], locale),
    feeling: p.feeling[locale], captionFeeling: display(p.feeling[locale], locale),
    aspect: p.cover.aspect, kind: p.cover.kind, src: p.cover.src, poster: p.cover.poster,
  }));
  return <section id="work" aria-labelledby="work-title"><WorkMotion>
    <WorkRail items={items} heading={display(copy.selected, locale)} prefix={copy.feel}
      all={{ href: `/${locale}/work`, label: copy.all, count: String(projects.length).padStart(2, "0") }} />
    {categories.map(category => <section className={`work-category work-theme-${category.theme}`} key={category.id} aria-labelledby={`category-${category.id}`}>
      <header className="work-category-heading"><h2 className="work-heading" id={`category-${category.id}`} data-work-reveal>{display(category.title[locale], locale)}</h2><p data-work-reveal>{category.description[locale]}</p></header>
      <div className="work-drag"><div className="work-track">{projects.filter(p => p.category === category.id).map(project => <ProjectCard project={project} locale={locale} key={project.slug} />)}</div></div>
      <p className="work-drag-hint">{copy.drag}<span aria-hidden="true">↔</span></p>
    </section>)}
  </WorkMotion></section>;
}
