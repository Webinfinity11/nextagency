import type { Metadata } from "next";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import { ACTIVE_LOCALE, copy } from "@/content/hero";
import "./globals.css";
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
export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
};
const bootstrap = `try{if(sessionStorage.getItem('next-agency:loaded'))document.documentElement.dataset.loader='skip'}catch(e){}`;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={ACTIVE_LOCALE} data-loader="running" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
        <noscript>
          <style>{`.loader{display:none!important}html,body{overflow:auto!important}.nav-logo,.nav-links,.nav-cta{visibility:visible!important}html .word,html .stat-word{transform:none!important}`}</style>
        </noscript>
      </head>
      <body className={`${latin.variable} ${georgian.variable}`}>
        {children}
      </body>
    </html>
  );
}
