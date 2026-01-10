"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, Library, Calendar } from "lucide-react";

interface QuickNavItem {
  href: string;
  icon: React.ReactNode;
  labelKey: string;
}

const navItems: Omit<QuickNavItem, "icon">[] = [
  { href: "/me/library", labelKey: "nav.library" },
  { href: "/me/calendar", labelKey: "nav.myCalendar" },
  { href: "/me/settings", labelKey: "nav.settings" },
];

const icons: Record<string, React.ReactNode> = {
  "/me/library": <Library className="h-6 w-6" />,
  "/me/calendar": <Calendar className="h-6 w-6" />,
  "/me/settings": <Settings className="h-6 w-6" />,
};

export function ProfileQuickNav() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
            {icons[item.href]}
            <span>{t(item.labelKey)}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
