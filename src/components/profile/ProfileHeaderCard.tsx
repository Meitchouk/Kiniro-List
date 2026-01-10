"use client";

import { useTranslations } from "next-intl";
import { User } from "firebase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Typography,
  Grid,
  Stack,
} from "@/components/ds";
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
          <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
          <AvatarFallback>
            <UserIcon className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-2xl">{user?.displayName || t("profile.anonymous")}</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Grid cols={2} gap={4}>
          <Stack>
            <Typography variant="caption" colorScheme="secondary">
              {t("settings.timezone")}
            </Typography>
            <Typography variant="body2" weight="medium">
              {userData?.timezone || "UTC"}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" colorScheme="secondary">
              {t("settings.language")}
            </Typography>
            <Typography variant="body2" weight="medium">
              {userData?.locale === "es" ? "Español" : "English"}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" colorScheme="secondary">
              {t("settings.theme")}
            </Typography>
            <Typography variant="body2" weight="medium" className="capitalize">
              {userData?.theme || "system"}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="caption" colorScheme="secondary">
              {t("settings.calendarView")}
            </Typography>
            <Typography variant="body2" weight="medium" className="capitalize">
              {userData?.calendarView || "weekly"}
            </Typography>
          </Stack>
        </Grid>
      </CardContent>
    </Card>
  );
}
