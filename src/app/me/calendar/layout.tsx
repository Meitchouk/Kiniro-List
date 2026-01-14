import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("myCalendar", {
    path: "/me/calendar",
    noIndex: true, // User-specific content shouldn't be indexed
  });
}

export default function MyCalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
