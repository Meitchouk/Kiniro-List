import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("library", {
    path: "/me/library",
    noIndex: true, // User-specific content shouldn't be indexed
  });
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
