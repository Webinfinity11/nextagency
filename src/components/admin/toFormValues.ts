import type { Project } from "@/generated/prisma/client";
import type { ProjectFormValues } from "./ProjectForm";
import type { Block } from "@/content/projects";
export function toFormValues(p: Project): ProjectFormValues {
  const blocks = (Array.isArray(p.blocks) ? p.blocks as Block[] : []).map((b, i): ProjectFormValues["blocks"][number] =>
    b.kind === "text" ? { key: `s${i}`, kind: "text", ka: b.ka, en: b.en, bg: b.bg ?? "" } : { key: `s${i}`, kind: "media", src: b.src, poster: b.poster ?? "", aspect: b.aspect, wide: b.wide, bg: b.bg ?? "" });
  return {
    id: p.id, slug: p.slug, titleKa: p.titleKa, titleEn: p.titleEn, summaryKa: p.summaryKa, summaryEn: p.summaryEn,
    introKa: p.introKa, introEn: p.introEn, category: p.category, year: p.year,
    headlineKa: p.headlineKa, headlineEn: p.headlineEn, tagsKa: p.tagsKa.join(", "), tagsEn: p.tagsEn.join(", "),
    clientKa: p.clientKa, clientEn: p.clientEn, servicesKa: p.servicesKa, servicesEn: p.servicesEn, teamKa: p.teamKa, teamEn: p.teamEn,
    websiteUrl: p.websiteUrl ?? "", accent: p.accent,
    published: p.published, coverSrc: p.coverSrc ?? "", coverPoster: p.coverPoster ?? "", coverAspect: p.coverAspect, toneA: p.toneA, toneB: p.toneB, blocks,
  };
}
