import type { Metadata } from "next";
import { Manrope, Noto_Sans_Georgian } from "next/font/google";
import "./admin.css";
// Separate root layout: the admin shares nothing with the public site's loader, nav or smooth scroll.
const latin = Manrope({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const georgian = Noto_Sans_Georgian({ subsets: ["georgian"], variable: "--font-georgian", display: "swap" });
export const metadata: Metadata = { title: "ადმინი — NEXT AGENCY", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <html lang="ka" className={`${latin.variable} ${georgian.variable}`}><body className="admin">{children}</body></html>;
}
