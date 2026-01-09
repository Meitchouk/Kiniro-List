import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Search, Library, Star, Globe } from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-6 py-12 text-center md:py-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-primary">{t("common.appName")}</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          {t("home.subtitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/calendar/now">
              <Calendar className="mr-2 h-5 w-5" />
              {t("home.browseCalendar")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/schedule/weekly">
              <Clock className="mr-2 h-5 w-5" />
              {t("home.viewSchedule")}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/search">
              <Search className="mr-2 h-5 w-5" />
              {t("home.searchAnime")}
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Library className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">{t("home.features.track")}</CardTitle>
              <CardDescription>{t("home.features.trackDesc")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">{t("home.features.calendar")}</CardTitle>
              <CardDescription>{t("home.features.calendarDesc")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Star className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">{t("home.features.discover")}</CardTitle>
              <CardDescription>{t("home.features.discoverDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <h2 className="mb-6 text-2xl font-bold">{t("nav.calendar")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/calendar/now">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-6">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{t("calendar.now")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("calendar.WINTER")} / {t("calendar.SPRING")} / {t("calendar.SUMMER")} / {t("calendar.FALL")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/calendar/upcoming">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-6">
                <Globe className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{t("calendar.upcoming")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("nav.calendarUpcoming")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/schedule/weekly">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-6">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{t("schedule.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("nav.schedule")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/search">
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-6">
                <Search className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{t("search.title")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("common.search")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
