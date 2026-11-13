import { notFound } from "next/navigation";
import { isLocale } from "@/content/locales";
import { contactCopy } from "@/content/contact";
import { footerCopy } from "@/content/footer";
import { Contact } from "@/components/contact/Contact";
import { WorkMotion } from "@/components/work/WorkMotion";
import { workMetadata } from "../work/metadata";
import { display } from "@/lib/mtavruli";
export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const c = contactCopy(locale); return workMetadata(locale, "/contact", c.title, c.intro);
}
// Contact page: big heading, direct details, then the postcard form (the shared copy before the footer hides here).
export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const c = contactCopy(locale), f = footerCopy(locale);
  return <main id="main" className="contact-page">
    <WorkMotion>
      <header className="contact-hero">
        <h1 id="contact-title" className="contact-hero-title" data-work-reveal>{display(c.title, locale)}</h1>
        <p>{c.intro}</p>
        <dl className="contact-details">
          <div><dt>{c.email}</dt><dd><a href={`mailto:${f.email}`}>{f.email}</a></dd></div>
          <div><dt>{c.where}</dt><dd>{f.place}</dd></div>
          <div><dt>{f.socialLabel}</dt><dd>{f.socials.map(s => <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>)}</dd></div>
        </dl>
      </header>
    </WorkMotion>
    <Contact locale={locale} standalone />
  </main>;
}
