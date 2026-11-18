import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/content/locales";
// Any path without a locale prefix goes to the default locale: "/" → "/ka", "/work" → "/ka/work".
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split("/")[1])) return;
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}
export const config = {
  // Skip Next internals, API routes, the admin panel, uploaded media, the standalone /presentation deck
  // and any file with an extension (public/brand/*, icon.svg…).
  matcher: ["/((?!_next|api|admin|media|presentation(?:/|$)|.*\\..*).*)"],
};
