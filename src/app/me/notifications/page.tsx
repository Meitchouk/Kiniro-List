"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Tv,
  MessageSquare,
  Info,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Typography,
} from "@/components/ds";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoginButton } from "@/components/auth";
import type { UserNotification } from "@/lib/types";

export default function NotificationsPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [deletingRead, setDeletingRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/me/notifications?limit=100", { headers });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
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
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      const headers = await getAuthHeaders();
      await fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/me/notifications?id=${notificationId}`, {
        method: "DELETE",
        headers,
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const deleteReadNotifications = async () => {
    setDeletingRead(true);
    try {
      const headers = await getAuthHeaders();
      await fetch("/api/me/notifications?deleteRead=true", {
        method: "DELETE",
        headers,
      });
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (error) {
      console.error("Failed to delete read notifications:", error);
    } finally {
      setDeletingRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "anime_airing":
        return <Tv className="h-5 w-5 text-blue-500" />;
      case "feedback_response":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("notifications.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("notifications.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0
              ? t("notifications.unreadCount", { count: unreadCount })
              : t("notifications.allRead")}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={markingAllRead}>
              {markingAllRead ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              {t("notifications.markAllRead")}
            </Button>
          )}
          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={deleteReadNotifications}
              disabled={deletingRead}
            >
              {deletingRead ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t("notifications.deleteRead")}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Bell className="text-muted-foreground mb-4 h-12 w-12" />
            <Typography variant="h4">{t("notifications.empty")}</Typography>
            <Typography variant="body2" className="text-muted-foreground mt-2">
              {t("notifications.emptyDescription")}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${!notification.read ? "ring-primary/30 ring-2" : "opacity-75"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Notification icon or anime cover */}
                  {notification.data?.animeCover ? (
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded">
                      <OptimizedImage
                        src={notification.data.animeCover}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-muted-foreground text-sm">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <Badge variant="default" className="shrink-0">
                          {t("notifications.new")}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      {notification.type === "anime_airing" &&
                        typeof notification.data?.animeSlug === "string" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/anime/${notification.data.animeSlug}`}>
                              {t("notifications.viewAnime")}
                            </Link>
                          </Button>
                        )}
                      {typeof notification.data?.crunchyrollUrl === "string" &&
                      notification.data.crunchyrollUrl.length > 0 ? (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={notification.data.crunchyrollUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Crunchyroll
                          </a>
                        </Button>
                      ) : null}
                      {notification.type === "feedback_response" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/feedback">{t("notifications.viewFeedback")}</Link>
                        </Button>
                      )}

                      <div className="ml-auto flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-muted-foreground mt-2 text-xs">
                      {new Date(notification.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
