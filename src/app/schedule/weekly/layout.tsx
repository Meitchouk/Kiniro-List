import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("scheduleWeekly", {
    path: "/schedule/weekly",
    additionalKeywords: ["weekly anime", "anime schedule"],
  });
}

export default function WeeklyScheduleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
