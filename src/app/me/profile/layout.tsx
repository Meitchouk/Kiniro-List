import type { Metadata } from "next";
import { createPageMetadataFromKey } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadataFromKey("profile", {
    path: "/me/profile",
    noIndex: true, // User-specific content shouldn't be indexed
  });
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
