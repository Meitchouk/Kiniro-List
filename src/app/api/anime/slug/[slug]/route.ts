import { NextRequest, NextResponse } from "next/server";
import { getAnimeBySlug } from "@/lib/firestore/cache";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const anime = await getAnimeBySlug(slug);

    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json({ animeId: anime.id });
  } catch (error) {
    console.error("Error resolving slug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
