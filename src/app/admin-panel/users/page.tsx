"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Typography,
  Card,
  CardContent,
  Button,
  Badge,
  Flex,
  Stack,
  Grid,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ds";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  Search,
  RefreshCw,
  UserPlus,
  Mail,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface UserEntry {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  provider: string;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  verifiedUsers: number;
  newUsers: number;
  monthlyUsers: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "verified">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/users/stats", { headers });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [user, getAuthHeaders]);

  const fetchUsers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        filter,
      });

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("adminPanel.users.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, currentPage, filter, search, t]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUsers();
    }
  }, [user, fetchStats, fetchUsers]);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    setUpdatingUser(userId);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isAdmin: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      toast.success(
        !currentStatus ? t("adminPanel.users.adminGranted") : t("adminPanel.users.adminRevoked")
      );
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error instanceof Error ? error.message : t("adminPanel.users.updateError"));
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  if (loading && !users.length) {
    return (
      <div className="p-6">
        <Stack gap={6}>
          <Skeleton className="h-10 w-64" />
          <Grid cols={2} mdCols={4} gap={4}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </Grid>
          <Skeleton className="h-96" />
        </Stack>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="between" align="center" wrap="wrap" gap={4}>
          <Stack gap={1}>
            <Typography variant="h2">{t("adminPanel.users.title")}</Typography>
            <Typography variant="body2" colorScheme="secondary">
              {pagination
                ? t("adminPanel.users.totalCount", { count: pagination.total })
                : t("adminPanel.users.description")}
            </Typography>
          </Stack>
          <Button
            variant="outline"
            onClick={() => {
              fetchStats();
              fetchUsers();
            }}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </Button>
        </Flex>

        {/* Stats Cards */}
        {stats && (
          <Grid cols={2} mdCols={4} gap={4}>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="bg-muted rounded-full p-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{stats.totalUsers}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.users.totalUsers")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="rounded-full bg-purple-500/10 p-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{stats.adminUsers}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.users.adminUsers")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="rounded-full bg-green-500/10 p-2">
                    <Mail className="h-5 w-5 text-green-500" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{stats.verifiedUsers}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.users.verifiedUsers")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="rounded-full bg-blue-500/10 p-2">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{stats.newUsers}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("adminPanel.users.newUsers")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch}>
              <Flex align="center" gap={4} wrap="wrap">
                <Flex align="center" gap={2}>
                  <Filter className="text-muted-foreground h-4 w-4" />
                  <Typography variant="body2" weight="medium">
                    {t("adminPanel.users.filters")}:
                  </Typography>
                </Flex>
                <div className="relative min-w-50 flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t("adminPanel.users.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filter}
                  onValueChange={(v) => {
                    setFilter(v as "all" | "admin" | "verified");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("adminPanel.users.allUsers")}</SelectItem>
                    <SelectItem value="admin">{t("adminPanel.users.adminsOnly")}</SelectItem>
                    <SelectItem value="verified">{t("adminPanel.users.verifiedOnly")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  {t("common.search")}
                </Button>
              </Flex>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <Typography variant="body1" colorScheme="secondary">
                  {t("adminPanel.users.noUsers")}
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.users.user")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.users.email")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.users.status")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.users.provider")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.users.created")}
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        {t("adminPanel.users.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Flex align="center" gap={3}>
                            <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                              {userItem.photoURL ? (
                                <Image
                                  src={userItem.photoURL}
                                  alt={userItem.displayName || "User"}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Users className="h-5 w-5" />
                              )}
                            </div>
                            <Typography variant="body2" weight="medium">
                              {userItem.displayName || t("adminPanel.users.anonymous")}
                            </Typography>
                          </Flex>
                        </td>
                        <td className="px-4 py-3">
                          <Typography variant="body2" colorScheme="secondary">
                            {userItem.email || t("adminPanel.users.noEmail")}
                          </Typography>
                        </td>
                        <td className="px-4 py-3">
                          <Flex gap={1} wrap="wrap">
                            {userItem.isAdmin && (
                              <Badge className="bg-purple-500 text-xs">
                                <Shield className="mr-1 h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                            {userItem.emailVerified && (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-xs text-green-500"
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                {t("adminPanel.users.verified")}
                              </Badge>
                            )}
                            {!userItem.isAdmin && !userItem.emailVerified && (
                              <Typography variant="caption" colorScheme="secondary">
                                -
                              </Typography>
                            )}
                          </Flex>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {userItem.provider}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Flex align="center" gap={1}>
                            <Calendar className="text-muted-foreground h-3 w-3" />
                            <Typography variant="caption" colorScheme="secondary">
                              {formatDate(userItem.createdAt)}
                            </Typography>
                          </Flex>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant={userItem.isAdmin ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleToggleAdmin(userItem.id, userItem.isAdmin)}
                            disabled={updatingUser === userItem.id}
                          >
                            {userItem.isAdmin ? (
                              <>
                                <ShieldOff className="mr-1 h-3 w-3" />
                                {t("adminPanel.users.removeAdmin")}
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                {t("adminPanel.users.makeAdmin")}
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Flex justify="between" align="center" wrap="wrap" gap={4}>
            <Typography variant="body2" colorScheme="secondary">
              {t("adminPanel.users.showing", {
                from: (currentPage - 1) * 20 + 1,
                to: Math.min(currentPage * 20, pagination.total),
                total: pagination.total,
              })}
            </Typography>
            <Flex gap={2}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Typography variant="body2" className="flex items-center px-2">
                {currentPage} / {pagination.totalPages}
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Flex>
          </Flex>
        )}
      </Stack>
    </div>
  );
}
