"use client";

import { useTranslations } from "next-intl";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPrompt() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t("loginRequired")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <GoogleButton />
        </CardContent>
      </Card>
    </div>
  );
}
