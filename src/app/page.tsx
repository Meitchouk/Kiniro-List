import { getTranslations } from "next-intl/server";
import { Calendar, Clock, Search, Library, Star, Globe, Flame } from "lucide-react";
import { HeroSection, FeatureCard, QuickLinkCard } from "@/components/home";
import { AnimeCarouselSection } from "@/components/anime/AnimeCarouselSection";
import { Section, Grid } from "@/components/ds";
import { getTrendingAnime } from "@/lib/redis/metrics";
import { getManyAnimeFromCache, upsertManyAnimeCache } from "@/lib/firestore/cache";
import { getBatchAnimeInfo, getAllSeasonAnime, getGlobalPopularAnime } from "@/lib/anilist/client";
import { getCurrentSeason } from "@/lib/utils/date";
import type { AnimeCache } from "@/lib/types";

async function getTrending() {
  try {
    const ids = await getTrendingAnime(50, "day");
    if (!ids.length) {
      // Fallback: show current season popular items
      const { season, year } = getCurrentSeason();
      const allMedia = await getAllSeasonAnime(season, year);
      const top = allMedia.slice(0, 50);
      if (top.length) {
        await upsertManyAnimeCache(top);
        const cachedTop = await getManyAnimeFromCache(top.map((m) => m.id));
        return top.map((m) => cachedTop.get(m.id)).filter((a): a is AnimeCache => Boolean(a));
      }
      return [];
    }
    let cached = await getManyAnimeFromCache(ids);
    const missing = ids.filter((id) => !cached.get(id));
    if (missing.length) {
      const media = await getBatchAnimeInfo(missing);
      if (media.length) {
        await upsertManyAnimeCache(media);
        cached = await getManyAnimeFromCache(ids);
      }
    }
    return ids.map((id) => cached.get(id)).filter((a): a is AnimeCache => Boolean(a));
  } catch (error) {
    console.error("Trending fetch error", error);
    return [];
  }
}

async function getPopular(limit: number = 50) {
  try {
    const media = await getGlobalPopularAnime(limit);
    if (media.length) {
      await upsertManyAnimeCache(media);
      const cached = await getManyAnimeFromCache(media.map((m) => m.id));
      return media.map((m) => cached.get(m.id)).filter((a): a is AnimeCache => Boolean(a));
    }
    return [];
  } catch (error) {
    console.error("Popular fetch error", error);
    return [];
  }
}

export default async function HomePage() {
  const t = await getTranslations();
  const [trending, popular] = await Promise.all([getTrending(), getPopular(50)]);

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
      <Section spacing="lg">
        <Grid cols={1} mdCols={3} gap={6}>
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
        </Grid>
      </Section>

      {/* Trending Section */}
      {trending.length > 0 && (
        <AnimeCarouselSection
          title={t("home.trendingTitle")}
          subtitle={t("home.trendingSubtitle")}
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          items={trending}
          autoIntervalMs={4800}
        />
      )}

      {popular.length > 0 && (
        <AnimeCarouselSection
          title={t("home.popularTitle")}
          subtitle={t("home.popularSubtitle")}
          badgeLabel={t("home.popularBadge")}
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          items={popular}
          autoIntervalMs={5200}
        />
      )}

      {/* Quick Links */}
      <Section spacing="lg" title={t("nav.calendar")}>
        <Grid cols={1} smCols={2} lgCols={4} gap={4}>
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
        </Grid>
      </Section>
    </div>
  );
}
