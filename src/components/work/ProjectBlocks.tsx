import Image from "next/image";
import type { Block } from "@/content/projects";
import type { Locale } from "@/content/locales";
// Project page body from /admin: media full width or two side by side, text blocks as a narrow column.
export function ProjectBlocks({ blocks, locale }: { blocks: Block[]; locale: Locale }) {
  if (!blocks.length) return null;
  return <div className="work-blocks">
    {blocks.map((b, i) => b.kind === "text"
      ? (b[locale] || b.ka || b.en) && <p className="work-block-text" key={i}>{b[locale] || b.ka || b.en}</p>
      : <figure className={`work-block-media${b.wide ? " is-wide" : ""}`} key={i} style={{ aspectRatio: b.aspect }}>
          {b.kind === "video"
            ? <video src={b.src} poster={b.poster} muted loop playsInline autoPlay preload="metadata" />
            : <Image src={b.src} alt="" fill sizes={b.wide ? "94vw" : "(max-width: 767px) 94vw, 47vw"} />}
        </figure>)}
  </div>;
}
