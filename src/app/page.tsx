import { getTranslations } from "next-intl/server";
import { Calendar, Clock, Search, Library, Star, Globe } from "lucide-react";
import { HeroSection, FeatureCard, QuickLinkCard } from "@/components/home";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <HeroSection
        appName={t("common.appName")}
        subtitle={t("home.subtitle")}
        browseCalendar={t("home.browseCalendar")}
        viewSchedule={t("home.viewSchedule")}
        searchAnime={t("home.searchAnime")}
      />

      {/* Features Section */}
      <section className="py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Library}
            title={t("home.features.track")}
            description={t("home.features.trackDesc")}
          />
          <FeatureCard
            icon={Calendar}
            title={t("home.features.calendar")}
            description={t("home.features.calendarDesc")}
          />
          <FeatureCard
            icon={Star}
            title={t("home.features.discover")}
            description={t("home.features.discoverDesc")}
          />
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <h2 className="mb-6 text-2xl font-bold">{t("nav.calendar")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLinkCard
            href="/calendar/now"
            icon={Calendar}
            title={t("calendar.now")}
            subtitle={`${t("calendar.WINTER")} / ${t("calendar.SPRING")} / ${t("calendar.SUMMER")} / ${t("calendar.FALL")}`}
          />
          <QuickLinkCard
            href="/calendar/upcoming"
            icon={Globe}
            title={t("calendar.upcoming")}
            subtitle={t("nav.calendarUpcoming")}
          />
          <QuickLinkCard
            href="/schedule/weekly"
            icon={Clock}
            title={t("schedule.title")}
            subtitle={t("nav.schedule")}
          />
          <QuickLinkCard
            href="/search"
            icon={Search}
            title={t("search.title")}
            subtitle={t("common.search")}
          />
        </div>
      </section>
    </div>
  );
}
