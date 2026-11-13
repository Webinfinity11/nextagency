import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/locales";
import { servicesCopy } from "@/content/services";
import { ServicesIndex } from "@/components/services/ServicesIndex";
import { WorkMotion } from "@/components/work/WorkMotion";
import { workMetadata } from "../work/metadata";
import { display } from "@/lib/mtavruli";
export async function generateMetadata({ params }: PageProps<"/[locale]/services">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const c = servicesCopy(locale);
  return workMetadata(locale, "/services", c.label, c.title);
}
// Services page: filterable list, a projects call-to-action, "which service" guide, FAQ, then the shared contact form.
export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const c = servicesCopy(locale);
  const accordion = (items: { title: string; text: string }[]) => <div className="svc-accordion">
    {items.map((q, i) => <details key={q.title}>
      <summary><span className="svc-num">{String(i + 1).padStart(2, "0")}</span><span className="svc-q">{q.title}</span><i aria-hidden="true" /></summary>
      <p>{q.text}</p>
    </details>)}
  </div>;
  return <main id="main" className="svc">
    <WorkMotion>
      <header className="svc-hero">
        <p className="svc-eyebrow">{c.eyebrow}</p>
        <h1 className="svc-title" data-work-reveal>{display(c.title, locale)}</h1>
      </header>
      <ServicesIndex services={c.services} categories={c.categories} all={c.all} />
      <section className="svc-cta">
        <div><h2 data-work-reveal>{display(c.cta.title, locale)}</h2><p>{c.cta.text}</p></div>
        <Link className="svc-button is-light" href={`/${locale}/work`}>{c.cta.button}</Link>
      </section>
      <section className="svc-split">
        <h2 className="svc-h2" data-work-reveal>{display(c.guide.title, locale)}</h2>
        {accordion(c.guide.items)}
      </section>
      <section className="svc-split">
        <div className="svc-faq-intro">
          <h2 className="svc-h2" data-work-reveal>{display(c.faq.title, locale)}</h2>
          <p>{c.faq.text}</p>
          <div className="svc-more"><strong>{c.faq.more}</strong><p>{c.faq.moreText}</p><a className="svc-button" href="#contact">{c.faq.button}</a></div>
        </div>
        {accordion(c.faq.items)}
      </section>
      <section className="svc-start">
        <h2 data-work-reveal>{display(c.start.title, locale)}</h2>
        <p>{c.start.text}</p>
        <a className="svc-button" href="#contact">{c.start.button}</a>
      </section>
    </WorkMotion>
  </main>;
}
