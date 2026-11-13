"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "@/lib/gsap";
import { contactCopy } from "@/content/contact";
import type { Locale } from "@/content/locales";
import { sendMessage } from "./actions";
import { createGlobe } from "./globe";
// Contact: the whole form on the left; on the right only the animation, a postcard in front of a dot-matrix
// globe. The message prints on the card as it is typed; Send folds the card into a paper plane that loops the
// globe and lands on Tbilisi. Messages are stored and read in /admin/messages.
const ACCENT = "#5b7cff";
const TBILISI = { lat: 41.72, lon: 44.79 };
// Georgian month names spelled out: not every browser ships Georgian date formatting.
const KA_MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const today = (locale: Locale) => { const d = new Date(); return locale === "ka" ? `${d.getDate()} ${KA_MONTHS[d.getMonth()]}, ${d.getFullYear()}` : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); };
const FULL = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
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
  const timer = useRef(0);

  useEffect(() => {
    globe.current = createGlobe(canvas.current!, { accent: ACCENT, target: TBILISI });
    return () => { globe.current?.destroy(); clearTimeout(timer.current); };
  }, []);

  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const restore = (d: number) => gsap.fromTo(postcard.current, { clipPath: FULL, scaleY: 1, scale: .96, x: 0, y: 18, rotate: 0, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: .6 * d, ease: "power3.out" });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "sending" || phase === "flying") return;
    const form = e.currentTarget, data = new FormData(form), card = postcard.current!, d = still() ? 0 : 1;
    clearTimeout(timer.current);
    setPhase("sending"); setError(null); setLabel(null); globe.current?.reset();
    gsap.set(card, { clipPath: FULL, opacity: 1, scale: 1, scaleY: 1, x: 0, y: 0, rotate: 0 });
    // Fold: in half, then the corners come to a point — a paper plane — which shrinks into the drawn plane.
    const fold = gsap.timeline()
      .to(card, { scaleY: .5, duration: .32 * d, ease: "power2.inOut" })
      .to(card, { clipPath: "polygon(0% 0%, 100% 50%, 100% 50%, 0% 100%)", duration: .36 * d, ease: "power2.inOut" })
      .to(card, { scale: .1, rotate: -8, opacity: 0, duration: .32 * d, ease: "power3.in" })
      .then();
    const [result] = await Promise.all([sendMessage(data), fold]);
    if (!result.ok) { setError(result.error); setPhase("error"); restore(d); return; }
    setPhase("flying");
    const box = canvas.current!.getBoundingClientRect(), pc = card.getBoundingClientRect();
    const landed = await globe.current!.send({ x: pc.left + pc.width / 2 - box.left, y: pc.top + pc.height / 2 - box.top });
    setLabel(landed); setPhase("landed"); setText("");
    (form.elements.namedItem("message") as HTMLTextAreaElement).value = "";
    // A fresh card comes back after a moment.
    timer.current = window.setTimeout(() => { globe.current?.reset(); setLabel(null); restore(still() ? 0 : 1); }, 3200);
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
          <label>{c.message}<textarea name="message" required maxLength={5000} rows={5} placeholder={c.messagePh} disabled={busy} onChange={e => setText(e.target.value)} /></label>
          <input type="hidden" name="locale" value={locale} />
          <label className="contact-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <button type="submit" disabled={busy}>{busy ? c.sending : c.submit}</button>
          <p className={`contact-status${error ? " is-error" : ""}`} role="status">{error ? c.errors[error] : phase === "landed" ? c.sent : ""}</p>
        </div>
        <div className="contact-stage" aria-hidden="true">
          <canvas className="contact-globe" ref={canvas} />
          {label && <p className="contact-landed" style={{ left: label.x, top: label.y }}>{c.landed}</p>}
          <div className="contact-postcard" ref={postcard}>
            <div className="contact-postcard-text">
              <time suppressHydrationWarning>{today(locale)}</time>
              <p>{text || <span>{c.messagePh}</span>}<i className="contact-caret" /></p>
            </div>
            <div className="contact-postcard-side">
              <span className="contact-stamp"><b>N</b></span>
              <span className="contact-address"><strong>NEXT AGENCY</strong>{c.city}, {c.country}</span>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
