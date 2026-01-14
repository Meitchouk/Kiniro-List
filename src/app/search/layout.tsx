import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("search", {
    path: "/search",
    additionalKeywords: ["anime search", "find anime"],
  });
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
