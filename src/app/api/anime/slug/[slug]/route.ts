import { NextRequest, NextResponse } from "next/server";
import { getAnimeBySlug, upsertAnimeCache } from "@/lib/firestore/cache";
import { searchAnime } from "@/lib/anilist/client";
import { generateSlug } from "@/lib/utils/text";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    // 1. Try to find by slug in Firebase cache
    const anime = await getAnimeBySlug(slug);

    if (anime) {
      return NextResponse.json({ animeId: anime.id });
    }

    // 2. Fallback: allow numeric slugs to map directly to the anime ID
    const numericId = Number(slug);
    if (!Number.isNaN(numericId) && Number.isInteger(numericId) && numericId > 0) {
      return NextResponse.json({ animeId: numericId });
    }

    // 3. Fallback: search AniList using the slug as a search term
    // Convert slug back to search-friendly format (replace hyphens with spaces)
    const searchTerm = slug.replace(/-/g, " ");
    const searchResult = await searchAnime(searchTerm, 1, 10);

    if (searchResult.media.length > 0) {
      // Find the best match - one whose generated slug matches the requested slug
      for (const media of searchResult.media) {
        const titleRomaji = media.title?.romaji || "";
        const titleEnglish = media.title?.english || "";

        const generatedSlugRomaji = generateSlug(titleRomaji);
        const generatedSlugEnglish = generateSlug(titleEnglish);

        // Check if either slug matches
        if (generatedSlugRomaji === slug || generatedSlugEnglish === slug) {
          // Cache this anime for future lookups
          await upsertAnimeCache(media);
          return NextResponse.json({ animeId: media.id });
        }
      }

      // If no exact match, return the first result and cache it
      const firstMatch = searchResult.media[0];
      await upsertAnimeCache(firstMatch);
      return NextResponse.json({ animeId: firstMatch.id });
    }

    return NextResponse.json({ error: "Anime not found" }, { status: 404 });
  } catch (error) {
    console.error("Error resolving slug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
