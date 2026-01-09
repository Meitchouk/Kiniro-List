"use client";

import { useTranslations } from "next-intl";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/AuthProvider";

export function LoginPrompt() {
  const t = useTranslations("common");
  const { signIn } = useAuth();

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t("loginRequired")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={signIn}>
            <LogIn className="mr-2 h-4 w-4" />
            {t("loginWithGoogle")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
