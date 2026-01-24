"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { Typography, Flex, Stack, Skeleton, Button } from "@/components/ds";
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  Users,
  FileText,
  Settings,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, loading: authLoading } = useAuth();

  const navItems: NavItem[] = [
    {
      href: "/admin-panel",
      label: t("adminPanel.nav.dashboard"),
      icon: LayoutDashboard,
      description: t("adminPanel.nav.dashboardDesc"),
    },
    {
      href: "/admin-panel/feedback",
      label: t("adminPanel.nav.feedback"),
      icon: MessageSquare,
      description: t("adminPanel.nav.feedbackDesc"),
    },
    {
      href: "/admin-panel/users",
      label: t("adminPanel.nav.users"),
      icon: Users,
      description: t("adminPanel.nav.usersDesc"),
    },
    {
      href: "/admin-panel/logs",
      label: t("adminPanel.nav.logs"),
      icon: FileText,
      description: t("adminPanel.nav.logsDesc"),
    },
    {
      href: "/admin-panel/settings",
      label: t("adminPanel.nav.settings"),
      icon: Settings,
      description: t("adminPanel.nav.settingsDesc"),
    },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (!authLoading && userData && !userData.isAdmin) {
      toast.error(t("adminPanel.accessDenied"));
      router.push("/");
      return;
    }
  }, [user, userData, authLoading, router, t]);

  if (authLoading || (user && !userData)) {
    return (
      <div className="flex min-h-screen">
        <div className="bg-muted/30 hidden w-64 border-r p-4 lg:block">
          <Skeleton className="mb-6 h-8 w-32" />
          <Stack gap={2}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </Stack>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="mb-6 h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!userData?.isAdmin) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin-panel") {
      return pathname === "/admin-panel";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Desktop */}
      <aside className="bg-muted/30 hidden w-64 shrink-0 border-r lg:block">
        <div className="sticky top-14 p-4">
          {/* Header */}
          <Flex align="center" gap={2} className="mb-6">
            <Shield className="h-6 w-6 text-amber-500" />
            <Typography variant="h4" className="text-amber-500">
              {t("adminPanel.title")}
            </Typography>
          </Flex>

          {/* Navigation */}
          <Stack gap={1}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </Stack>

          {/* Back to site */}
          <div className="mt-6 border-t pt-4">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("adminPanel.nav.backToSite")}
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="bg-muted/30 sticky top-14 z-40 w-full border-b p-2 lg:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
