"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { Typography, Card, CardContent, Flex, Stack, Grid, Skeleton } from "@/components/ds";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  users: {
    total: number;
    newThisWeek: number;
  };
  feedback: {
    total: number;
    new: number;
    pending: number;
  };
  activity: {
    activeToday: number;
    pageViews: number;
  };
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();

      // Fetch feedback stats
      const feedbackRes = await fetch("/api/admin/feedback", { headers });
      const feedbackData = feedbackRes.ok ? await feedbackRes.json() : null;

      // Fetch user stats
      const usersRes = await fetch("/api/admin/users/stats", { headers });
      const usersData = usersRes.ok ? await usersRes.json() : null;

      setStats({
        users: {
          total: usersData?.stats?.totalUsers || 0,
          newThisWeek: usersData?.stats?.newUsers || 0,
        },
        feedback: {
          total: feedbackData?.counts?.total || 0,
          new: feedbackData?.counts?.new || 0,
          pending: (feedbackData?.counts?.new || 0) + (feedbackData?.counts?.["in-review"] || 0),
        },
        activity: {
          activeToday: 0, // TODO: Implement activity tracking
          pageViews: 0, // TODO: Implement page views tracking
        },
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: t("adminPanel.dashboard.totalUsers"),
      value: stats?.users.total || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      href: "/admin-panel/users",
    },
    {
      title: t("adminPanel.dashboard.newUsersWeek"),
      value: stats?.users.newThisWeek || 0,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      href: "/admin-panel/users",
    },
    {
      title: t("adminPanel.dashboard.totalFeedback"),
      value: stats?.feedback.total || 0,
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      href: "/admin-panel/feedback",
    },
    {
      title: t("adminPanel.dashboard.pendingFeedback"),
      value: stats?.feedback.pending || 0,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      href: "/admin-panel/feedback",
    },
  ];

  const quickActions = [
    {
      title: t("adminPanel.dashboard.reviewFeedback"),
      description: t("adminPanel.dashboard.reviewFeedbackDesc"),
      icon: MessageSquare,
      href: "/admin-panel/feedback",
      badge: stats?.feedback.new || 0,
    },
    {
      title: t("adminPanel.dashboard.viewUsers"),
      description: t("adminPanel.dashboard.viewUsersDesc"),
      icon: Users,
      href: "/admin-panel/users",
    },
    {
      title: t("adminPanel.dashboard.viewLogs"),
      description: t("adminPanel.dashboard.viewLogsDesc"),
      icon: Activity,
      href: "/admin-panel/logs",
    },
    {
      title: t("adminPanel.dashboard.systemSettings"),
      description: t("adminPanel.dashboard.systemSettingsDesc"),
      icon: BarChart3,
      href: "/admin-panel/settings",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <Stack gap={6}>
        {/* Header */}
        <div>
          <Typography variant="h2">{t("adminPanel.dashboard.title")}</Typography>
          <Typography variant="body2" colorScheme="secondary">
            {t("adminPanel.dashboard.description")}
          </Typography>
        </div>

        {/* Stats Grid */}
        <Grid cols={2} lgCols={4} gap={4}>
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
            : statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link key={card.title} href={card.href}>
                    <Card className="transition-all hover:-translate-y-1 hover:shadow-md">
                      <CardContent className="p-4">
                        <Flex align="start" justify="between">
                          <Stack gap={1}>
                            <Typography variant="caption" colorScheme="secondary">
                              {card.title}
                            </Typography>
                            <Typography variant="h2">{card.value}</Typography>
                          </Stack>
                          <div className={`${card.bgColor} rounded-full p-2`}>
                            <Icon className={`h-5 w-5 ${card.color}`} />
                          </div>
                        </Flex>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </Grid>

        {/* Quick Actions */}
        <div>
          <Typography variant="h4" className="mb-4">
            {t("adminPanel.dashboard.quickActions")}
          </Typography>
          <Grid cols={1} mdCols={2} gap={4}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-4">
                      <Flex align="start" gap={4}>
                        <div className="bg-primary/10 rounded-full p-3">
                          <Icon className="text-primary h-5 w-5" />
                        </div>
                        <Stack gap={1} className="flex-1">
                          <Flex align="center" gap={2}>
                            <Typography variant="subtitle2">{action.title}</Typography>
                            {action.badge !== undefined && action.badge > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                                {action.badge}
                              </span>
                            )}
                          </Flex>
                          <Typography variant="caption" colorScheme="secondary">
                            {action.description}
                          </Typography>
                        </Stack>
                      </Flex>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </Grid>
        </div>

        {/* System Status */}
        <div>
          <Typography variant="h4" className="mb-4">
            {t("adminPanel.dashboard.systemStatus")}
          </Typography>
          <Card>
            <CardContent className="p-4">
              <Grid cols={1} mdCols={3} gap={4}>
                <Flex align="center" gap={3}>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Stack gap={0}>
                    <Typography variant="body2" weight="medium">
                      {t("adminPanel.dashboard.apiStatus")}
                    </Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.dashboard.operational")}
                    </Typography>
                  </Stack>
                </Flex>
                <Flex align="center" gap={3}>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Stack gap={0}>
                    <Typography variant="body2" weight="medium">
                      {t("adminPanel.dashboard.databaseStatus")}
                    </Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.dashboard.operational")}
                    </Typography>
                  </Stack>
                </Flex>
                <Flex align="center" gap={3}>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Stack gap={0}>
                    <Typography variant="body2" weight="medium">
                      {t("adminPanel.dashboard.authStatus")}
                    </Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.dashboard.operational")}
                    </Typography>
                  </Stack>
                </Flex>
              </Grid>
            </CardContent>
          </Card>
        </div>
      </Stack>
    </div>
  );
}
