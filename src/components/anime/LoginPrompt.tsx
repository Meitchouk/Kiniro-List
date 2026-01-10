"use client";

import { useTranslations } from "next-intl";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Card, CardContent, CardHeader, CardTitle, Center } from "@/components/ds";

export function LoginPrompt() {
  const t = useTranslations("common");

  return (
    <Center className="min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t("loginRequired")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <GoogleButton />
        </CardContent>
      </Card>
    </Center>
  );
}
