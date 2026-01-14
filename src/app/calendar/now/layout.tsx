import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("calendarNow", {
    path: "/calendar/now",
    additionalKeywords: ["airing now", "current anime"],
  });
}

export default function CalendarNowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
