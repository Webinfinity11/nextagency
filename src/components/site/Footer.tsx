"use client";
import Link from "next/link";
import { useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import type { HeroContent } from "@/content";
import { footerCopy } from "@/content/footer";
import type { Locale } from "@/content/locales";
import { gsap, useGSAP, reducedMotion } from "@/lib/gsap";
// After tinywins.com's footer: contact lead top-left, two link columns top-right, full-bleed wordmark at the foot.
export function Footer({ copy, locale }: { copy: HeroContent; locale: Locale }) {
  const f = footerCopy(locale);
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const root = scope.current!;
    // Letters rise out of the baseline one after another as the wordmark scrolls in.
    gsap.fromTo(root.querySelectorAll(".footer-mark [data-letter]"), { yPercent: 105 }, {
      yPercent: 0, duration: 1.1, ease: "expo.out", stagger: .045,
      scrollTrigger: { trigger: root.querySelector(".footer-mark"), start: "top 98%", toggleActions: "play none none reverse" },
    });
    gsap.fromTo(root.querySelectorAll("[data-footer-reveal]"), { yPercent: 100 }, {
      yPercent: 0, duration: .9, ease: "power3.out", stagger: .06,
      scrollTrigger: { trigger: root, start: "top 85%", once: true },
    });
  }, { scope });
  return (
    <footer className="footer" ref={scope}>
      <div className="footer-top">
        <div className="footer-contact">
          <p className="footer-mask"><span data-footer-reveal className="footer-lead">{f.lead}</span></p>
          <p className="footer-mask"><a data-footer-reveal className="footer-email" href={`mailto:${f.email}`}>{f.email}</a></p>
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
      <Link className="footer-mark" href={`/${locale}`} aria-label={copy.home}><Logo className="footer-wide" /><Logo className="footer-stacked" variant="stacked" /></Link>
    </footer>
  );
}
