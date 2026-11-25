import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale, locales } from "@/lib/locale";

const COOKIE = "NEXT_LOCALE";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeInPath = locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (localeInPath) {
    const response = NextResponse.next();
    response.cookies.set(COOKIE, localeInPath, { path: "/" });
    return response;
  }

  const saved = request.cookies.get(COOKIE)?.value;
  const locale = saved && isLocale(saved) ? saved : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "/products" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
