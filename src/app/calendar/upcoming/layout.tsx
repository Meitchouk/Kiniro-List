import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("calendarUpcoming", {
    path: "/calendar/upcoming",
    additionalKeywords: ["upcoming anime", "future anime"],
  });
}

export default function CalendarUpcomingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
