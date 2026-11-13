"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "@/lib/gsap";
import { contactCopy } from "@/content/contact";
import type { Locale } from "@/content/locales";
import { sendMessage } from "./actions";
import { createGlobe } from "./globe";
// Contact: details on the left; on the right a postcard in front of a dot-matrix globe. What you type prints on
// the card; Send folds it away and a paper plane flies it to Tbilisi. Messages are stored and read in /admin.
const ACCENT = "#5b7cff";
const TBILISI = { lat: 41.72, lon: 44.79 };
// Georgian month names spelled out: not every browser ships Georgian date formatting.
const KA_MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const today = (locale: Locale) => { const d = new Date(); return locale === "ka" ? `${d.getDate()} ${KA_MONTHS[d.getMonth()]}, ${d.getFullYear()}` : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); };
type Phase = "idle" | "sending" | "flying" | "landed" | "error";

export function Contact({ locale }: { locale: Locale }) {
  const c = contactCopy(locale);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<keyof typeof c.errors | null>(null);
  const [text, setText] = useState("");
  const [label, setLabel] = useState<{ x: number; y: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const postcard = useRef<HTMLDivElement>(null);
  const globe = useRef<ReturnType<typeof createGlobe> | null>(null);

  useEffect(() => {
    globe.current = createGlobe(canvas.current!, { accent: ACCENT, target: TBILISI });
    return () => globe.current?.destroy();
  }, [locale]);

  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "sending" || phase === "flying") return;
    const form = e.currentTarget, data = new FormData(form);
    setPhase("sending"); setError(null);
    const pcEl = postcard.current!, d = still() ? 0 : 1;
    // Fold: the card tips away and shrinks to a point, where the plane takes over.
    const fold = gsap.to(pcEl, { rotateX: 70, scale: .12, y: -40, opacity: 0, duration: .75 * d, ease: "power3.in", transformPerspective: 900, transformOrigin: "50% 40%" }).then();
    const [result] = await Promise.all([sendMessage(data), fold]);
    if (!result.ok) {
      setError(result.error); setPhase("error");
      gsap.to(pcEl, { rotateX: 0, scale: 1, y: 0, opacity: 1, duration: .6 * d, ease: "power3.out" });
      return;
    }
    setPhase("flying");
    const box = canvas.current!.getBoundingClientRect(), pc = pcEl.getBoundingClientRect();
    const landed = await globe.current!.send({ x: pc.left + pc.width / 2 - box.left, y: pc.top + pc.height * .4 - box.top });
    setLabel(landed); setPhase("landed"); setText("");
    (form.elements.namedItem("message") as HTMLTextAreaElement).value = "";
  };
  const again = () => {
    globe.current?.reset(); setLabel(null); setPhase("idle");
    gsap.fromTo(postcard.current, { rotateX: 0, scale: .96, y: 24, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: still() ? 0 : .6, ease: "power3.out" });
  };
  const busy = phase === "sending" || phase === "flying";

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <form className="contact-grid" onSubmit={submit}>
        <div className="contact-form">
          <h2 id="contact-title">{c.title}</h2>
          <p className="contact-intro">{c.intro}</p>
          <label>{c.name}<input name="name" required maxLength={120} autoComplete="name" placeholder={c.namePh} /></label>
          <label>{c.email}<input name="email" type="email" required maxLength={200} autoComplete="email" placeholder={c.emailPh} /></label>
          <label>{c.company}<input name="company" maxLength={160} autoComplete="organization" placeholder={c.companyPh} /></label>
          <input type="hidden" name="locale" value={locale} />
          <label className="contact-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div className="contact-card">
          <canvas className="contact-globe" ref={canvas} aria-hidden="true" />
          {label && <p className="contact-landed" style={{ left: label.x, top: label.y }} role="status">{c.landed}</p>}
          <div className="contact-postcard" ref={postcard} aria-hidden="true">
            <div className="contact-postcard-text">
              <time suppressHydrationWarning>{today(locale)}</time>
              <p>{text || <span>{c.messagePh}</span>}<i className="contact-caret" /></p>
            </div>
            <div className="contact-postcard-side">
              <span className="contact-stamp"><b>N</b></span>
              <span className="contact-postmark" />
              <span className="contact-address"><strong>NEXT AGENCY</strong>{c.city}<br />{c.country}</span>
            </div>
          </div>
          <div className="contact-composer">
            <p className="contact-to"><span>{c.to}:</span> NEXT AGENCY <svg viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.2A2.2 2.2 0 1 1 6 3.8a2.2 2.2 0 0 1 0 4.4Z" fill="currentColor" /></svg> {c.city}</p>
            {phase === "landed"
              ? <div className="contact-done" role="status"><p>{c.sent}</p><button type="button" onClick={again}>{c.again}</button></div>
              : <>
                  <label className="sr-only" htmlFor="contact-message">{c.message}</label>
                  <textarea id="contact-message" name="message" required maxLength={5000} rows={3} placeholder={c.messagePh} disabled={busy} onChange={e => setText(e.target.value)} />
                  <div className="contact-send">
                    <p className="contact-error" role="alert">{error ? c.errors[error] : ""}</p>
                    <button type="submit" disabled={busy}>{busy ? c.sending : c.submit}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 7.4 15 1l-3.6 14-3.7-5.4L1 7.4Zm6.7 2.2L15 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg></button>
                  </div>
                </>}
          </div>
        </div>
      </form>
    </section>
  );
}
