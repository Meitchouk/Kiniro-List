// Remove HTML tags and sanitize text
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function getLocalizedTitle(
  title: { romaji: string; english?: string | null; native?: string | null },
  preferEnglish: boolean = true
): string {
  if (preferEnglish && title.english) {
    return title.english;
  }
  return title.romaji;
}

/**
 * Generate a URL-friendly slug from a title
 * Example: "My Hero Academia" -> "my-hero-academia"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Create a SEO-friendly slug for anime URLs (no ID)
 * Example: "My Hero Academia" -> "my-hero-academia"
 */
export function createAnimeSlug(title: string): string {
  return generateSlug(title);
}
