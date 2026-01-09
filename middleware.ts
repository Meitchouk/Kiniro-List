import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "es"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  
  // Get locale from cookie
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
  
  // If no cookie, try Accept-Language header
  let locale = localeCookie;
  if (!locale || !locales.includes(locale)) {
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(",")
        .map((lang) => lang.split(";")[0].trim().substring(0, 2))
        .find((lang) => locales.includes(lang));
      locale = preferredLocale || defaultLocale;
    } else {
      locale = defaultLocale;
    }
  }
  
  const response = NextResponse.next();
  
  // Set cookie if not present
  if (!localeCookie) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });
  }
  
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
