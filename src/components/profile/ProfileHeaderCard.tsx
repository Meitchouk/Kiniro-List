"use client";

import { useTranslations } from "next-intl";
import { User } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

interface UserSettings {
  timezone?: string;
  locale?: string;
  theme?: string;
  calendarView?: string;
}

interface ProfileHeaderCardProps {
  user: User | null;
  userData?: UserSettings | null;
}

export function ProfileHeaderCard({ user, userData }: ProfileHeaderCardProps) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage 
            src={user?.photoURL || undefined} 
            alt={user?.displayName || "User"} 
          />
          <AvatarFallback>
            <UserIcon className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-2xl">
            {user?.displayName || t("profile.anonymous")}
          </CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.timezone")}</p>
            <p className="font-medium">{userData?.timezone || "UTC"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.language")}</p>
            <p className="font-medium">
              {userData?.locale === "es" ? "Español" : "English"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.theme")}</p>
            <p className="font-medium capitalize">{userData?.theme || "system"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.calendarView")}</p>
            <p className="font-medium capitalize">{userData?.calendarView || "weekly"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
