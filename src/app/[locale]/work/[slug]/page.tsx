import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/locales";
import { getProject, getProjects, getCategories } from "@/content/projects";
import { CaseCover, CasePanel } from "@/components/work/case/CaseParts";
import { CaseMotion } from "@/components/work/case/CaseMotion";
import { workCopy } from "@/components/work/copy";
import { workMetadata } from "../metadata";
import { display } from "@/lib/mtavruli";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const project = await getProject(slug); if (!project) notFound();
  return workMetadata(locale, `/work/${slug}`, project.title[locale], project.summary[locale]);
}
// Case study: centred title over a full-width cover, then a card with a sticky info column on the left
// and the project's media stacked on coloured panels on the right.
export default async function ProjectPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale, slug } = await params; if (!isLocale(locale)) notFound();
  const project = await getProject(slug); if (!project) notFound();
  const [projects, categories] = await Promise.all([getProjects(), getCategories()]);
  const category = categories.find(c => c.id === project.category)!;
  const next = projects[(projects.findIndex(p => p.slug === slug) + 1) % projects.length];
  const copy = workCopy(locale);
  const tags = project.tags[locale].length ? project.tags[locale] : [category.title[locale]];
  const team = project.team[locale].split("\n").map(s => s.trim()).filter(Boolean);
  const facts = [[copy.client, project.client[locale]], [copy.services, project.services[locale]], [copy.year, String(project.year)]].filter(([, v]) => v);
  return <main id="main" className="case">
    <CaseMotion>
      <header className="case-hero">
        <p className="case-kicker" data-case-fade><span>{category.title[locale]}</span><span>{project.year}</span></p>
        <h1 className="case-title" data-case-title>{display(project.title[locale], locale)}</h1>
      </header>
      <CaseCover project={project} />
      <section className="case-body" aria-label={copy.about}>
        <aside className="case-info">
          <ul className="case-tags">{tags.map(t => <li key={t}>{t}</li>)}</ul>
          {project.headline[locale] && <h2 className="case-headline">{project.headline[locale]}</h2>}
          {project.websiteUrl && <a className="case-visit" href={project.websiteUrl} target="_blank" rel="noopener noreferrer">{copy.visit} <span aria-hidden="true">→</span></a>}
          <p className="case-text">{project.intro[locale] || copy.note}</p>
          {facts.length > 0 && <dl className="case-facts">{facts.map(([k, v]) => <div key={k}><dt>{k}:</dt> <dd>{v}</dd></div>)}</dl>}
          {team.length > 0 && <div className="case-team"><h3>{copy.team}:</h3><ul>{team.map(m => <li key={m}>{m}</li>)}</ul></div>}
        </aside>
        <CasePanel project={project} locale={locale} />
      </section>
      <footer className="case-footer">
        <Link className="case-back" href={`/${locale}/work`}>{copy.all}</Link>
        <Link className="case-next" href={`/${locale}/work/${next.slug}`}>
          <span>{copy.next}</span>
          <strong>{display(next.title[locale], locale)}</strong>
        </Link>
      </footer>
    </CaseMotion>
  </main>;
}
