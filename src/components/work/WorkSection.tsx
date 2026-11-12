import type { Locale } from "@/content/locales";
import { getProjects } from "@/content/projects";
import { WorkMotion } from "./WorkMotion";
import { WorkRail } from "./WorkRail";
import { workCopy } from "./copy";
import { display } from "@/lib/mtavruli";
// Rail-only portrait placeholders until a project has real media; projects.ts stays untouched.
const PLACEHOLDER_ASPECTS = [0.78, 0.72, 0.8, 0.75, 0.7, 0.82];
export async function WorkSection({ locale }: { locale: Locale }) {
  const projects = await getProjects();
  const copy = workCopy(locale);
  const items = projects.map((p, i) => ({
    slug: p.slug, href: `/${locale}/work/${p.slug}`, title: p.title[locale], caption: display(p.title[locale], locale),
    feeling: p.feeling[locale], captionFeeling: display(p.feeling[locale], locale),
    aspect: p.cover.kind === "gradient" || !p.cover.src ? PLACEHOLDER_ASPECTS[i % PLACEHOLDER_ASPECTS.length] : p.cover.aspect, kind: p.cover.kind, src: p.cover.src, poster: p.cover.poster,
  }));
  return <section id="work" aria-labelledby="work-title"><WorkMotion>
    <WorkRail items={items} prefix={copy.selected}
      all={{ href: `/${locale}/work`, label: copy.all }} />
  </WorkMotion></section>;
}
