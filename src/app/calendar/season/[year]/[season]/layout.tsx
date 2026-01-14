import type { Metadata } from "next";
import { createSeasonMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo";
import { generateCollectionPageJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ year: string; season: string }>;
  children: React.ReactNode;
};

const VALID_SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year: yearStr, season: seasonStr } = await params;

  const year = parseInt(yearStr, 10);
  const season = seasonStr.toUpperCase();

  const isValidSeason = VALID_SEASONS.includes(season);
  const isValidYear = !isNaN(year) && year >= 1970 && year <= 2100;

  if (!isValidSeason || !isValidYear) {
    return {
      title: "Season Not Found",
      description: "The requested anime season could not be found.",
    };
  }

  return createSeasonMetadata(season, year);
}

export default async function SeasonLayout({ params, children }: Props) {
  const { year: yearStr, season: seasonStr } = await params;

  const year = parseInt(yearStr, 10);
  const season = seasonStr.toUpperCase();
  const seasonName = season.charAt(0) + season.slice(1).toLowerCase();

  const isValidSeason = VALID_SEASONS.includes(season);
  const isValidYear = !isNaN(year) && year >= 1970 && year <= 2100;

  if (!isValidSeason || !isValidYear) {
    return <>{children}</>;
  }

  const title = `${seasonName} ${year} Anime`;
  const description = `Complete list of anime from ${seasonName} ${year}. Browse all series with details, ratings, and more.`;
  const url = `/calendar/season/${year}/${seasonStr.toLowerCase()}`;

  const collectionJsonLd = generateCollectionPageJsonLd({
    name: title,
    description,
    url,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Calendar", url: "/calendar/now" },
    { name: title, url },
  ]);

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
