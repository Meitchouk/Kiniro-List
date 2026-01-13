import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { TranslationProvider } from "@/components/providers/TranslationProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { LoadingBar } from "@/components/ui/loading-bar";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import "./styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kiniro List - Anime Calendar & Tracker",
  description: "Track your anime, never miss an episode with Kiniro List",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              <TranslationProvider>
                <LoadingProvider>
                  <AuthProvider>
                    <LoadingBar />
                    <div className="relative flex min-h-screen flex-col">
                      <GoogleOneTap />
                      <Header />
                      <main className="flex-1">{children}</main>
                      <Footer />
                    </div>
                    <Toaster />
                  </AuthProvider>
                </LoadingProvider>
              </TranslationProvider>
            </NextIntlClientProvider>
          </QueryProvider>
        </ThemeProvider>

        {/* Vercel Analytics */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
