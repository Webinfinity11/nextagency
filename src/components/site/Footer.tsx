"use client";
import Link from "next/link";
import { useRef } from "react";
import type { HeroContent } from "@/content";
import { footerCopy } from "@/content/footer";
import { DotMark } from "./DotMark";
import type { Locale } from "@/content/locales";
import { gsap, useGSAP, reducedMotion } from "@/lib/gsap";
// After tinywins.com's footer: contact email top-left, two link columns top-right, full-bleed wordmark at the foot.
export function Footer({ copy, locale }: { copy: HeroContent; locale: Locale }) {
  const f = footerCopy(locale);
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const root = scope.current!;
    gsap.fromTo(root.querySelectorAll("[data-footer-reveal]"), { yPercent: 100 }, {
      yPercent: 0, duration: .9, ease: "power3.out", stagger: .06,
      scrollTrigger: { trigger: root, start: "top 85%", once: true },
    });
  }, { scope });
  return (
    <footer className="footer" ref={scope}>
      <div className="footer-top">
        <div className="footer-contact">
          <p className="footer-mask">
            <a data-footer-reveal className="footer-email" href={`mailto:${f.email}`} aria-label={f.email}>
              <span className="footer-roll">
                {[...f.email].map((ch, i) => <span key={i} aria-hidden style={{ "--i": i } as React.CSSProperties}>{ch}</span>)}
              </span>
              <span className="footer-arrow" aria-hidden>
                <svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </span>
            </a>
          </p>
        </div>
        <div className="footer-cols">
          <nav aria-label={copy.navLabel}>
            <p className="footer-label">{f.siteLabel}</p>
            {copy.nav.map((label, i) => (
              <Link key={label} className="footer-link" href={i === 0 ? `/${locale}/work` : `/${locale}#services`}>{label}</Link>
            ))}
          </nav>
          <nav aria-label={f.socialLabel}>
            <p className="footer-label">{f.socialLabel}</p>
            {f.socials.map(s => <a key={s.label} className="footer-link" href={s.href} target="_blank" rel="noreferrer">{s.label}</a>)}
          </nav>
        </div>
      </div>
      <div className="footer-meta"><span>© {new Date().getFullYear()} NEXT AGENCY — {f.rights}</span><span>{f.place}</span></div>
      <Link className="footer-mark" href={`/${locale}`} aria-label={copy.home}><DotMark /></Link>
    </footer>
  );
}
