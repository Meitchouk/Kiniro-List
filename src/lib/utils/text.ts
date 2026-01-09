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
