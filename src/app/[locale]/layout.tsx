import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import { Loader } from "@/components/loader/Loader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { getContent } from "@/content";
import { defaultLocale, isLocale, locales } from "@/content/locales";
import "../globals.css";
const latin = Manrope({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});
const georgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  variable: "--font-georgian",
  display: "swap",
});
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getContent(locale);
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries([
        ...locales.map((l) => [l, `/${l}`]),
        ["x-default", `/${defaultLocale}`],
      ]),
    },
  };
}
const bootstrap = `try{if(sessionStorage.getItem('next-agency:loaded'))document.documentElement.dataset.loader='skip'}catch(e){}`;
export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getContent(locale);
  return (
    <html lang={locale} data-loader="running" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
        <noscript>
          <style>{`.loader{display:none!important}html,body{overflow:auto!important}.nav-logo,.nav-links,.nav-locale{visibility:visible!important}html .word{transform:none!important}`}</style>
        </noscript>
      </head>
      <body className={`${latin.variable} ${georgian.variable}`}>
        <div id="top">
          <a className="skip-link" href="#main">
            {copy.skip}
          </a>
          <SmoothScroll />
          <Nav copy={copy} locale={locale} />
          {children}
          <Footer copy={copy} locale={locale} />
          <Loader />
        </div>
      </body>
    </html>
  );
}
