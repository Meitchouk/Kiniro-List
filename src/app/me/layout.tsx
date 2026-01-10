"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { LoginPrompt } from "@/components/anime/LoginPrompt";
import { Skeleton } from "@/components/ui/skeleton";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return <>{children}</>;
}
