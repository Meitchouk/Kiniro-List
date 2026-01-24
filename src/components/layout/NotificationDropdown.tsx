"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Bell, Tv, MessageSquare, Info, ChevronRight, Loader2 } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Typography,
} from "@/components/ds";
import { useAuth } from "@/components/providers/AuthProvider";
import type { UserNotification } from "@/lib/types";

interface NotificationDropdownProps {
  unreadCount: number;
  onUnreadCountChange: () => void;
}

export function NotificationDropdown({
  unreadCount,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const t = useTranslations();
  const { getAuthHeaders } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/me/notifications?limit=5", { headers });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const headers = await getAuthHeaders();
      await fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      onUnreadCountChange();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "anime_airing":
        return <Tv className="h-4 w-4 text-blue-500" />;
      case "feedback_response":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: UserNotification) => {
    if (notification.type === "anime_airing" && notification.data?.animeId) {
      return `/anime/${notification.data.animeId}`;
    }
    if (notification.type === "feedback_response") {
      return "/feedback";
    }
    return "/me/notifications";
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("notifications.justNow");
    if (diffMins < 60) return t("notifications.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("notifications.hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("notifications.daysAgo", { count: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary relative"
        >
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? "text-primary animate-pulse" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">{t("nav.notifications")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <span className="text-muted-foreground text-xs font-normal">
              {t("notifications.unreadCount", { count: unreadCount })}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center">
            <Bell className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <Typography variant="body2" colorScheme="secondary">
              {t("notifications.empty")}
            </Typography>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild className="cursor-pointer p-0">
                <Link
                  href={getNotificationLink(notification)}
                  className="flex w-full items-start gap-3 p-3"
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id, {
                        preventDefault: () => {},
                        stopPropagation: () => {},
                      } as React.MouseEvent);
                    }
                    setOpen(false);
                  }}
                >
                  {/* Icon or cover */}
                  {notification.data?.animeCover ? (
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded">
                      <Image
                        src={notification.data.animeCover}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-1 text-sm ${!notification.read ? "font-semibold" : "font-normal"}`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {notification.message}
                    </p>
                    <p className="text-muted-foreground/70 mt-1 text-[10px]">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="bg-primary h-2 w-2 shrink-0 rounded-full" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/me/notifications"
            className="flex items-center justify-center gap-1 py-2 text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            {t("notifications.viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
