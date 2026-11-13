import Image from "next/image";
import type { CSSProperties } from "react";
import type { Block, Project } from "@/content/projects";
import type { Locale } from "@/content/locales";
/** Dark or light text, whichever reads on this background. */
function inkOn(hex: string) {
  const n = parseInt(hex.slice(1), 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(c => { const s = c / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b > .4 ? "#111" : "#fff";
}
function Media({ kind, src, poster, sizes, priority }: { kind: "image" | "video"; src: string; poster?: string; sizes: string; priority?: boolean }) {
  return kind === "video"
    ? <video src={src} poster={poster} muted loop playsInline autoPlay preload="metadata" aria-hidden="true" />
    : <Image src={src} alt="" fill sizes={sizes} priority={priority} />;
}
export function CaseCover({ project }: { project: Project }) {
  const { cover } = project;
  return <div className="case-cover" data-case-cover>
    <div className="case-cover-inner" data-case-parallax style={{ "--tone-a": cover.tone[0], "--tone-b": cover.tone[1] } as CSSProperties}>
      {cover.src && cover.kind !== "gradient"
        ? <Media kind={cover.kind} src={cover.src} poster={cover.poster} sizes="100vw" priority />
        : <div className="case-cover-placeholder" aria-hidden="true" />}
    </div>
  </div>;
}
/** Consecutive blocks that share a background sit on one coloured panel. */
export function CasePanel({ project, locale }: { project: Project; locale: Locale }) {
  const blocks: Block[] = project.blocks.length ? project.blocks
    : project.cover.src && project.cover.kind !== "gradient" ? [{ kind: project.cover.kind, src: project.cover.src, poster: project.cover.poster, aspect: project.cover.aspect, wide: true }] : [];
  const groups: { bg: string; blocks: Block[] }[] = [];
  for (const b of blocks) {
    const bg = b.bg ?? project.accent;
    if (groups.at(-1)?.bg === bg) groups.at(-1)!.blocks.push(b); else groups.push({ bg, blocks: [b] });
  }
  if (!groups.length) return <div className="case-panel"><div className="case-group case-group-empty" style={{ background: `linear-gradient(145deg, ${project.cover.tone[0]}, ${project.cover.tone[1]})` }} /></div>;
  return <div className="case-panel">
    {groups.map((g, gi) => <div className="case-group" key={gi} style={{ background: g.bg, color: inkOn(g.bg) }}>
      {g.blocks.map((b, i) => b.kind === "text"
        ? (b[locale] || b.ka || b.en) && <p className="case-block-text" data-case-block key={i}>{b[locale] || b.ka || b.en}</p>
        : <figure className={`case-block${b.wide ? " is-wide" : ""}`} data-case-block key={i} style={{ aspectRatio: b.aspect }}>
            <Media kind={b.kind} src={b.src} poster={b.poster} sizes={b.wide ? "(max-width: 900px) 92vw, 58vw" : "(max-width: 900px) 92vw, 29vw"} />
          </figure>)}
    </div>)}
  </div>;
}
