import { NextRequest, NextResponse } from "next/server";
import { getAnimeBySlug } from "@/lib/firestore/cache";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const anime = await getAnimeBySlug(slug);

    if (anime) {
      return NextResponse.json({ animeId: anime.id });
    }

    // Fallback: allow numeric slugs to map directly to the anime ID
    const numericId = Number(slug);
    if (!Number.isNaN(numericId) && Number.isInteger(numericId) && numericId > 0) {
      return NextResponse.json({ animeId: numericId });
    }

    return NextResponse.json({ error: "Anime not found" }, { status: 404 });
  } catch (error) {
    console.error("Error resolving slug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
