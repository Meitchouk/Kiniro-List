import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // 1. Try cookie
  let locale = cookieStore.get("NEXT_LOCALE")?.value;
  
  // 2. Try Accept-Language header
  if (!locale || !locales.includes(locale as Locale)) {
    const acceptLanguage = headersList.get("accept-language");
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(",")
        .map((lang) => lang.split(";")[0].trim().substring(0, 2))
        .find((lang) => locales.includes(lang as Locale));
      locale = preferredLocale;
    }
  }
  
  // 3. Fallback to default
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
  
  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
