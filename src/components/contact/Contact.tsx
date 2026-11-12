"use client";
import { useEffect, useState, type FormEvent } from "react";
import { contactCopy } from "@/content/contact";
import { footerCopy } from "@/content/footer";
import type { Locale } from "@/content/locales";
import { CloudShader } from "./CloudShader";
// After Aceternity's "Contact Section With Shader", mirrored: form on the left, shader card with
// rotating testimonials (no avatars) on the right. No backend yet: submitting opens a prefilled email.
export function Contact({ locale }: { locale: Locale }) {
  const c = contactCopy(locale), to = footerCopy(locale).email;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI(v => (v + 1) % c.testimonials.length), 5000);
    return () => clearInterval(id);
  }, [paused, c.testimonials.length]);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim();
    const body = `${v("message")}\n\n${v("name")}${v("company") ? `, ${v("company")}` : ""}\n${v("email")}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(`${c.subject} — ${v("name")}`)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <form className="contact-form" onSubmit={submit}>
        <h2 id="contact-title">{c.title}</h2>
        <p className="contact-intro">{c.intro}</p>
        <label>{c.name}<input name="name" required autoComplete="name" placeholder={c.namePh} /></label>
        <label>{c.email}<input name="email" type="email" required autoComplete="email" placeholder={c.emailPh} /></label>
        <label>{c.company}<input name="company" autoComplete="organization" placeholder={c.companyPh} /></label>
        <label>{c.message}<textarea name="message" required rows={5} placeholder={c.messagePh} /></label>
        <button type="submit">{c.submit}</button>
      </form>
      <div className="contact-card" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <CloudShader className="contact-shader" />
        <div className="contact-quotes" role="region" aria-roledescription="carousel" aria-label={c.quotesLabel}>
          {c.testimonials.map((t, k) => (
            <figure key={k} className="contact-quote" data-active={k === i || undefined} aria-hidden={k !== i}>
              <svg viewBox="0 0 32 24" aria-hidden><path d="M0 24V13.7C0 5.9 4.4 1.3 12 0l1.4 3.6C9 5 7 7.7 7 11.4h6V24H0Zm18.6 0V13.7C18.6 5.9 23 1.3 30.6 0L32 3.6c-4.4 1.4-6.4 4.1-6.4 7.8h6V24H18.6Z" fill="currentColor" /></svg>
              <blockquote>{t.quote}</blockquote>
              <figcaption><strong>{t.name}</strong><span>{t.role}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="contact-dots">
          {c.testimonials.map((t, k) => (
            <button key={k} type="button" aria-label={`${k + 1} / ${c.testimonials.length}: ${t.name}`} aria-current={k === i || undefined} onClick={() => setI(k)} />
          ))}
        </div>
      </div>
    </section>
  );
}
