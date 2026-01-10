"use client";

import {
  ProfileHeaderCard,
  LibraryStatsCard,
  ProfileQuickNav,
  ProfileSkeleton,
} from "@/components/profile";
import { useProfile } from "@/lib/hooks/useProfile";

export default function ProfilePage() {
  const { user, userData, libraryStats, isLoading } = useProfile();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <ProfileHeaderCard user={user} userData={userData} />
        <LibraryStatsCard stats={libraryStats} />
        <ProfileQuickNav />
      </div>
    </div>
  );
}
