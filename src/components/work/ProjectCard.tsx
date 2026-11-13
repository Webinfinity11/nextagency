import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/content/projects";
import type { Locale } from "@/content/locales";
export function ProjectCover({ project }: { project: Project }) {
  const { cover } = project;
  return <div className="work-frame" style={{ aspectRatio: cover.aspect, "--tone-a": cover.tone[0], "--tone-b": cover.tone[1] } as CSSProperties}>
    <div className="work-parallax">
      {cover.kind === "image" && cover.src ? <Image src={cover.src} alt="" fill sizes="(max-width: 767px) 88vw, 76vw" /> : cover.kind === "video" && cover.src ? <video src={cover.src} poster={cover.poster} muted loop playsInline autoPlay preload="none" aria-hidden="true" /> : <div className={`work-placeholder work-placeholder-${(((project.order - 1) % 6) + 6) % 6 + 1}`} aria-hidden="true"><span>{String(project.order).padStart(2, "0")}</span><i /></div>}
    </div>
  </div>;
}
export function ProjectCard({ project, locale }: { project: Project; locale: Locale }) {
  return <Link className="work-card" href={`/${locale}/work/${project.slug}`} draggable={false}>
    <ProjectCover project={project} />
    <div className="work-meta"><h3>{project.title[locale]}</h3><p>{project.summary[locale]}</p><span aria-hidden="true">↗</span></div>
  </Link>;
}
