"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { contactCopy } from "@/content/contact";
import type { Locale } from "@/content/locales";
import { sendMessage } from "./actions";
import { createContactScene } from "./contactScene";
// Contact: the whole form on the left; on the right only the animation (contactScene): a postcard in front of a
// dot-matrix globe. The message prints on the card as it is typed; Send folds the card into a paper plane that
// loops the globe and lands on Tbilisi. Messages are stored and read in /admin/messages.
const ACCENT = "#5b7cff";
const TBILISI = { lat: 41.72, lon: 44.79 };
type Phase = "idle" | "sending" | "flying" | "landed" | "error";

export function Contact({ locale }: { locale: Locale }) {
  const c = contactCopy(locale);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<keyof typeof c.errors | null>(null);
  const [label, setLabel] = useState<{ x: number; y: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createContactScene> | null>(null);
  const timer = useRef(0);

  useEffect(() => {
    scene.current = createContactScene(canvas.current!, { accent: ACCENT, target: TBILISI, locale, placeholder: c.messagePh, airmail: c.airmail });
    return () => { scene.current?.destroy(); clearTimeout(timer.current); };
  }, [locale, c.messagePh, c.airmail]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "sending" || phase === "flying") return;
    const form = e.currentTarget, data = new FormData(form);
    clearTimeout(timer.current);
    setPhase("sending"); setError(null); setLabel(null);
    // Save first: the card only folds and flies once the message is stored.
    const result = await sendMessage(data);
    if (!result.ok) { setError(result.error); setPhase("error"); return; }
    setPhase("flying");
    const landed = await scene.current!.send();
    setLabel(landed); setPhase("landed");
    (form.elements.namedItem("message") as HTMLTextAreaElement).value = ""; scene.current?.setText("");
    // A fresh card rises back in after a moment.
    timer.current = window.setTimeout(() => { scene.current?.reset(); setLabel(null); }, 3200);
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
          <label>{c.message}<textarea name="message" required maxLength={5000} rows={5} placeholder={c.messagePh} disabled={busy} onChange={e => scene.current?.setText(e.target.value)} onFocus={() => scene.current?.setFocus(true)} onBlur={() => scene.current?.setFocus(false)} /></label>
          <input type="hidden" name="locale" value={locale} />
          <label className="contact-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <button type="submit" disabled={busy}>{busy ? c.sending : c.submit}</button>
          <p className={`contact-status${error ? " is-error" : ""}`} role="status">{error ? c.errors[error] : phase === "landed" ? c.sent : ""}</p>
        </div>
        <div className="contact-stage" aria-hidden="true">
          <canvas className="contact-globe" ref={canvas} />
          {label && <p className="contact-landed" style={{ left: label.x, top: label.y }}>{c.landed}</p>}
        </div>
      </form>
    </section>
  );
}
