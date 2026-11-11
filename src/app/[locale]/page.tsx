import { notFound } from "next/navigation";
import { WorkSection } from "@/components/work/WorkSection";
import { Hero } from "@/components/hero/Hero";
import { getContent } from "@/content";
import { isLocale } from "@/content/locales";
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main">
      <Hero copy={getContent(locale)} locale={locale}><WorkSection locale={locale} /></Hero>
    </main>
  );
}
