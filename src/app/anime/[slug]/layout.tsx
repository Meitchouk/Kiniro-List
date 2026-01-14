import type { Metadata } from "next";
import { getAnimeBySlug } from "@/lib/firestore/cache";
import { createAnimeMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo";
import { generateAnimeJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const anime = await getAnimeBySlug(slug);

    if (!anime) {
      return {
        title: "Anime Not Found",
        description: "The requested anime could not be found.",
      };
    }

    const title = anime.title.english || anime.title.romaji || "Unknown Anime";
    const description =
      anime.description ||
      `Watch ${title} on Kiniro List. Track episodes, view details, and manage your watchlist.`;

    return createAnimeMetadata({
      title,
      description,
      coverImage: anime.coverImage?.extraLarge || anime.coverImage?.large || undefined,
      genres: anime.genres || [],
      slug: anime.slug || slug,
    });
  } catch (error) {
    console.error("Error generating anime metadata:", error);
    return {
      title: "Anime | Kiniro List",
      description: "View anime details on Kiniro List.",
    };
  }
}

export default async function AnimeLayout({ params, children }: Props) {
  const { slug } = await params;
  let jsonLdData: string[] = [];

  try {
    const anime = await getAnimeBySlug(slug);

    if (anime) {
      const title = anime.title.english || anime.title.romaji || "Unknown Anime";

      const animeJsonLd = generateAnimeJsonLd({
        title,
        description: anime.description || undefined,
        coverImage: anime.coverImage?.extraLarge || anime.coverImage?.large || undefined,
        genres: anime.genres,
        episodes: anime.episodes || undefined,
        status: anime.status || undefined,
        season: anime.season || undefined,
        seasonYear: anime.seasonYear || undefined,
        slug: anime.slug || slug,
      });

      const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Anime", url: "/search" },
        { name: title, url: `/anime/${slug}` },
      ]);

      jsonLdData = [animeJsonLd, breadcrumbJsonLd];
    }
  } catch (error) {
    console.error("Error generating anime JSON-LD:", error);
  }

  return (
    <>
      {jsonLdData.map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
      {children}
    </>
  );
}
