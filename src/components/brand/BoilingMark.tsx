import { useId } from "react";
import { BRAND_RED, KANJI_LOCAL, MARK } from "./Logo";

// The 改 square from Logo.tsx in square-local units (0–228 × 0–218): the textures fill the square and 改 stays cut out.
const square = `M0 0H${MARK.width}V${MARK.height}H0Z`;
const silhouette = `${square}${KANJI_LOCAL}`;
export const markStyles = ["charcoal", "hatch", "wireframe", "circles", "white", "sketch", "grey", "noise", "horizontal", "halftone", "double", "dither"];
export function BoilingMark() {
  const id = useId().replace(/:/g, "");
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <svg viewBox="-10 -10 248 238" aria-hidden="true" focusable="false">
      <defs>
        <path id={`${id}-n`} d={silhouette} fillRule="evenodd" />
        <clipPath id={`${id}-clip`}><path d={silhouette} clipRule="evenodd" /></clipPath>
        <pattern id={`${id}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)"><path d="M1 0V5" stroke="white" strokeWidth="1.3" /></pattern>
        <pattern id={`${id}-horizontal`} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 2H6" stroke="white" strokeWidth="2" /></pattern>
        <pattern id={`${id}-halftone`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="white" /></pattern>
        <pattern id={`${id}-circles`} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="6" fill="none" stroke="white" strokeWidth="1.2" /></pattern>
        <pattern id={`${id}-dither`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0H2V2H0ZM2 2H4V4H2Z" fill="#ccc" /></pattern>
        <pattern id={`${id}-wireframe`} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0H12V12H0ZM0 0L12 12M12 0L0 12" stroke="#ddd" strokeWidth=".55" fill="none" /></pattern>
        <filter id={`${id}-noise`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="3" seed="8" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncR type="discrete" tableValues="0 0 1" /><feFuncG type="discrete" tableValues="0 0 1" /><feFuncB type="discrete" tableValues="0 0 1" /></feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`${id}-sketch`} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence baseFrequency=".06" numOctaves="2" seed="3" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" /></filter>
      </defs>
      {markStyles.map((style, i) => (
        <g key={style} data-mark-style={style} className="mark-style" style={{ opacity: i === 0 ? 1 : 0 }}>
          <use href={`#${id}-n`} fill={style === "white" ? "white" : style === "grey" ? "#858585" : ["sketch", "double"].includes(style) ? "none" : style === "charcoal" ? "#555" : style === "noise" ? "white" : url(style)}
            stroke={["sketch", "double", "wireframe"].includes(style) ? "#eee" : "none"} strokeWidth="1.2"
            filter={["noise", "charcoal"].includes(style) ? url("noise") : style === "sketch" ? url("sketch") : undefined} opacity={style === "charcoal" ? .32 : 1} />
          {style === "double" && <g clipPath={url("clip")}><path d={silhouette} fill="none" stroke="white" strokeWidth="7" /><path d={silhouette} fill="none" stroke="black" strokeWidth="4" /></g>}
        </g>
      ))}
      {/* The resolved state: the real red square and white 改, identical to the lockup's. */}
      <g className="mark-solid" style={{ opacity: 0 }}>
        <path d={square} fill={BRAND_RED} />
        <path d={KANJI_LOCAL} fill="#fff" />
      </g>
    </svg>
  );
}
