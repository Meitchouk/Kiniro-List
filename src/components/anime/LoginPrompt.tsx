"use client";

import { useTranslations } from "next-intl";
import { LoginButton } from "@/components/auth";
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
          <LoginButton />
        </CardContent>
      </Card>
    </Center>
  );
}
