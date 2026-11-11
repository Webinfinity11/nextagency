"use client";
import { useRef } from "react";
import { gsap, useGSAP, afterLoader, reducedMotion } from "@/lib/gsap";
import type { HeroContent } from "@/content";
import type { Locale } from "@/content/locales";
import { display } from "@/lib/mtavruli";
export function HeroHeadline({
  copy,
  locale,
}: {
  copy: HeroContent;
  locale: Locale;
}) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    (_context, contextSafe) => {
      if (reducedMotion()) return;
      const root = scope.current!;
      const phrases = root.querySelectorAll(".headline-phrase");
      const words = (index: number) => phrases[index].querySelectorAll(".word");
      gsap.set(root.querySelectorAll(".word"), { y: 0, yPercent: 105 });
      gsap.set(phrases, { visibility: "visible" });
      const loop = gsap.timeline({ paused: true, repeat: -1 });
      [0, 1].forEach((index) => {
        const at = index * 6.1;
        loop
          .to(
            words(index),
            {
              yPercent: -105,
              duration: 0.5,
              stagger: { amount: 0.2 },
              ease: "power3.in",
            },
            at + 4.4,
          )
          .fromTo(
            words(1 - index),
            { yPercent: 105 },
            {
              yPercent: 0,
              duration: 1,
              stagger: { amount: 0.4 },
              ease: "expo.out",
              immediateRender: false,
            },
            at + 5.1,
          );
      });
      let visible = true;
      let ready = false;
      const sync = () => loop.paused(!ready || !visible || document.hidden);
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });
      observer.observe(root);
      document.addEventListener("visibilitychange", sync);
      const start = contextSafe!(() => {
        const entrance = gsap.timeline({
          onComplete: () => {
            ready = true;
            sync();
          },
        });
        [0, 1].forEach((index) =>
          entrance.to(
            phrases[0].querySelectorAll(`[data-group="${index}"] .word`),
            { yPercent: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" },
            0.3 + index * 0.1,
          ),
        );
        root
          .querySelectorAll(".stat")
          .forEach((stat, index) =>
            entrance.fromTo(
              stat.querySelectorAll(".stat-word"),
              { yPercent: 105 },
              {
                yPercent: 0,
                duration: 0.55,
                stagger: 0.025,
                ease: "power3.out",
              },
              1.05 + index * 0.12,
            ),
          );
      });
      const remove = afterLoader(start);
      return () => {
        remove();
        observer.disconnect();
        document.removeEventListener("visibilitychange", sync);
      };
    },
    { scope },
  );
  return (
    <div className="hero-intro" ref={scope}>
      <h1 aria-label={copy.phrases[0].flat().join(" ")}>
        {copy.phrases.map((phrase, index) => (
          <span
            className={`headline-phrase phrase-${index}`}
            key={index}
            aria-hidden="true"
          >
            {phrase.map((lines, group) => (
              <span className="headline-group" data-group={group} key={group}>
                {lines.map((line) => (
                  <span className="headline-line" key={line}>
                    {line.split(" ").map((word, i) => (
                      <span className="word-mask" key={i}>
                        <span className="word">{display(word, locale)}</span>
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <div className="stats">
        {copy.stats.map((stat) => (
          <p className="stat" key={stat}>
            {stat.split(" ").map((word, i) => (
              <span className="word-mask" key={i}>
                <span className="stat-word">{word}</span>
              </span>
            ))}
          </p>
        ))}
      </div>
      <p className="stat-note">{copy.statNote}</p>
    </div>
  );
}
