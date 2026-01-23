"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, Search, Calendar, Clock, BookOpen, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
  Typography,
  SimpleTooltip,
} from "@/components/ds";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/components/providers/AuthProvider";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/calendar/now", label: t("nav.calendarNow"), icon: Calendar },
    { href: "/calendar/upcoming", label: t("nav.calendarUpcoming"), icon: Clock },
    { href: "/schedule/weekly", label: t("nav.schedule"), icon: Clock },
  ];

  const userLinks = [
    { href: "/me/library", label: t("nav.library"), icon: BookOpen },
    { href: "/me/calendar", label: t("nav.myCalendar"), icon: Calendar },
  ];

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Typography variant="h3" as="span" className="text-primary">
            {t("common.appName")}
          </Typography>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-primary flex items-center gap-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
          {user &&
            userLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`hover:text-primary flex items-center gap-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
        </nav>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <SimpleTooltip content={t("common.search")} side="bottom">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/search">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">{t("common.search")}</span>
                </Link>
              </Button>
            </SimpleTooltip>
            <SimpleTooltip content={t("footer.feedback")} side="bottom">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-primary"
              >
                <Link href="/feedback">
                  <MessageSquarePlus className="h-5 w-5" />
                  <span className="sr-only">{t("footer.feedback")}</span>
                </Link>
              </Button>
            </SimpleTooltip>
            <LanguageSwitcher />
            <ThemeToggle />
            {!loading && <UserMenu />}
          </div>

          {/* Mobile drawer menu */}
          <div className="md:hidden">
            <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("nav.menu")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background fixed top-0 right-0 bottom-0 left-auto z-50 flex h-full w-80 max-w-full translate-y-0 flex-col overflow-y-auto rounded-none border-l p-0 transition-transform duration-300 ease-out data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 sm:max-w-sm">
                <DialogHeader className="bg-background sticky top-0 border-b p-4 pb-3">
                  <DialogTitle className="text-lg font-semibold">{t("common.appName")}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 space-y-3 p-4">
                  <div className="space-y-1.5">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Button
                          key={link.href}
                          variant="ghost"
                          className="h-11 w-full justify-start text-sm"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href={link.href}>
                            <Icon className="mr-3 h-4 w-4" />
                            {link.label}
                          </Link>
                        </Button>
                      );
                    })}
                  </div>

                  {user && (
                    <div className="space-y-1.5">
                      <Separator className="my-2" />
                      {userLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Button
                            key={link.href}
                            variant="ghost"
                            className="h-11 w-full justify-start text-sm"
                            asChild
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Link href={link.href}>
                              <Icon className="mr-3 h-4 w-4" />
                              {link.label}
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      className="h-11 w-full justify-start text-sm"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/search">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          <span>{t("common.search")}</span>
                        </div>
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 h-11 w-full justify-start text-sm"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/feedback">
                        <div className="flex items-center gap-2">
                          <MessageSquarePlus className="h-4 w-4" />
                          <span>{t("footer.feedback")}</span>
                        </div>
                      </Link>
                    </Button>

                    <div className="flex items-center justify-between gap-3">
                      <Typography variant="body2" weight="medium">
                        {t("language.select")}
                      </Typography>
                      <LanguageSwitcher />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Typography variant="body2" weight="medium">
                        {t("theme.toggle")}
                      </Typography>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile user menu stays outside drawer */}
          <div className="md:hidden">{!loading && <UserMenu />}</div>
        </div>
      </div>
    </header>
  );
}
