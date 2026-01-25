"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu,
  Search,
  Calendar,
  Clock,
  BookOpen,
  MessageSquarePlus,
  Shield,
  Bell,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
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
  Badge,
} from "@/components/ds";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { NotificationDropdown } from "./NotificationDropdown";
import { useAuth } from "@/components/providers/AuthProvider";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, userData, loading, getAuthHeaders } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [adminNeedsAttention, setAdminNeedsAttention] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Use refs to store the latest values without causing effect re-runs
  const getAuthHeadersRef = useRef(getAuthHeaders);
  const userRef = useRef(user);
  const userDataRef = useRef(userData);

  // Keep refs updated
  useEffect(() => {
    getAuthHeadersRef.current = getAuthHeaders;
    userRef.current = user;
    userDataRef.current = userData;
  });

  // Check for unread feedback responses (for regular users)
  // Using refs to avoid recreating these functions and triggering effect re-runs
  const checkUnreadFeedback = useCallback(async () => {
    if (!userRef.current) {
      setUnreadFeedbackCount(0);
      return;
    }

    try {
      const headers = await getAuthHeadersRef.current();
      const response = await fetch("/api/feedback?countOnly=true", { headers });
      if (response.ok) {
        const data = await response.json();
        setUnreadFeedbackCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to check unread feedback:", error);
    }
  }, []); // No dependencies - uses refs

  // Check for unread notifications (anime airing, etc.)
  const checkUnreadNotifications = useCallback(async () => {
    if (!userRef.current) {
      setUnreadNotifications(0);
      return;
    }

    try {
      const headers = await getAuthHeadersRef.current();
      const response = await fetch("/api/me/notifications?countOnly=true", { headers });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  }, []); // No dependencies - uses refs

  // Check for feedback needing admin attention
  const checkAdminNotifications = useCallback(async () => {
    if (!userRef.current || !userDataRef.current?.isAdmin) {
      setAdminNeedsAttention(0);
      return;
    }

    try {
      const headers = await getAuthHeadersRef.current();
      const response = await fetch("/api/admin/feedback?countOnly=true", { headers });
      if (response.ok) {
        const data = await response.json();
        setAdminNeedsAttention(data.needsAttention || 0);
      }
    } catch (error) {
      console.error("Failed to check admin notifications:", error);
    }
  }, []); // No dependencies - uses refs

  // Adaptive polling: more frequent when active, less when inactive
  useEffect(() => {
    // Initial check
    checkUnreadFeedback();
    checkUnreadNotifications();
    checkAdminNotifications();

    const ACTIVE_INTERVAL = 60000; // 60 seconds when active
    const INACTIVE_INTERVAL = 300000; // 5 minutes when inactive
    const INACTIVITY_THRESHOLD = 300000; // 5 minutes of no activity

    let lastActivity = Date.now();
    let currentInterval = ACTIVE_INTERVAL;
    let intervalId: NodeJS.Timeout;

    const checkAll = () => {
      checkUnreadFeedback();
      checkUnreadNotifications();
      checkAdminNotifications();
    };

    // Update last activity on user interaction
    const updateActivity = () => {
      const wasInactive = Date.now() - lastActivity > INACTIVITY_THRESHOLD;
      lastActivity = Date.now();

      // If was inactive and now active, check immediately and reset to active interval
      if (wasInactive && currentInterval === INACTIVE_INTERVAL) {
        currentInterval = ACTIVE_INTERVAL;
        clearInterval(intervalId);
        checkAll();
        intervalId = setInterval(checkAll, currentInterval);
      }
    };

    // Check if should switch to inactive mode
    const checkActivityAndPoll = () => {
      const isInactive = Date.now() - lastActivity > INACTIVITY_THRESHOLD;

      if (isInactive && currentInterval === ACTIVE_INTERVAL) {
        // Switch to inactive polling
        currentInterval = INACTIVE_INTERVAL;
        clearInterval(intervalId);
        intervalId = setInterval(checkAll, currentInterval);
      }

      checkAll();
    };

    // Start with active polling
    intervalId = setInterval(checkActivityAndPoll, currentInterval);

    // Track user activity
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => document.addEventListener(event, updateActivity, { passive: true }));

    // Check immediately when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastActivity = Date.now();
        checkAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      events.forEach((event) => document.removeEventListener(event, updateActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkUnreadFeedback, checkUnreadNotifications, checkAdminNotifications]);

  // Refresh count when navigating away from feedback/admin pages
  useEffect(() => {
    if (pathname !== "/feedback") {
      checkUnreadFeedback();
    }
    if (pathname !== "/me/notifications") {
      checkUnreadNotifications();
    }
    if (!pathname.startsWith("/admin-panel/feedback")) {
      checkAdminNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only depend on pathname, functions are stable (use refs)

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
            {/* Notifications dropdown for logged in users */}
            {user && (
              <NotificationDropdown
                unreadCount={unreadNotifications}
                onUnreadCountChange={checkUnreadNotifications}
              />
            )}
            <SimpleTooltip content={t("footer.feedback")} side="bottom">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-primary relative"
              >
                <Link href="/feedback">
                  <MessageSquarePlus
                    className={`h-5 w-5 ${unreadFeedbackCount > 0 ? "text-primary animate-pulse" : ""}`}
                  />
                  {unreadFeedbackCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadFeedbackCount > 9 ? "9+" : unreadFeedbackCount}
                    </span>
                  )}
                  <span className="sr-only">{t("footer.feedback")}</span>
                </Link>
              </Button>
            </SimpleTooltip>
            {userData?.isAdmin && (
              <SimpleTooltip
                content={
                  adminNeedsAttention > 0
                    ? t("nav.adminWithNotifications", { count: adminNeedsAttention })
                    : t("nav.admin")
                }
                side="bottom"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative text-amber-500 hover:text-amber-400"
                >
                  <Link href="/admin-panel/feedback">
                    <Shield
                      className={`h-5 w-5 ${adminNeedsAttention > 0 ? "animate-pulse" : ""}`}
                    />
                    {adminNeedsAttention > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {adminNeedsAttention > 9 ? "9+" : adminNeedsAttention}
                      </span>
                    )}
                    <span className="sr-only">{t("nav.admin")}</span>
                  </Link>
                </Button>
              </SimpleTooltip>
            )}
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

                    {/* Notifications button for mobile */}
                    {user && (
                      <Button
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/10 h-11 w-full justify-start text-sm"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/me/notifications">
                          <div className="flex items-center gap-2">
                            <Bell
                              className={`h-4 w-4 ${unreadNotifications > 0 ? "animate-pulse" : ""}`}
                            />
                            <span>{t("nav.notifications")}</span>
                            {unreadNotifications > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto h-5 px-1.5 text-[10px]"
                              >
                                {unreadNotifications > 9 ? "9+" : unreadNotifications}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="border-muted-foreground/30 hover:bg-muted/50 h-11 w-full justify-start text-sm"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/feedback">
                        <div className="flex items-center gap-2">
                          <MessageSquarePlus
                            className={`h-4 w-4 ${unreadFeedbackCount > 0 ? "animate-pulse" : ""}`}
                          />
                          <span>{t("footer.feedback")}</span>
                          {unreadFeedbackCount > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">
                              {unreadFeedbackCount > 9 ? "9+" : unreadFeedbackCount}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </Button>

                    {userData?.isAdmin && (
                      <Button
                        variant="outline"
                        className="h-11 w-full justify-start border-amber-500/30 text-sm text-amber-500 hover:bg-amber-500/10"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/admin-panel/feedback">
                          <div className="flex items-center gap-2">
                            <Shield
                              className={`h-4 w-4 ${adminNeedsAttention > 0 ? "animate-pulse" : ""}`}
                            />
                            <span>{t("nav.admin")}</span>
                            {adminNeedsAttention > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto h-5 px-1.5 text-[10px]"
                              >
                                {adminNeedsAttention > 9 ? "9+" : adminNeedsAttention}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </Button>
                    )}

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
