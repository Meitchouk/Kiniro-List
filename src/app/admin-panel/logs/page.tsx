"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ds";
import {
  FileText,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Server,
  Monitor,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "trace" | "fatal";
  message: string;
  source?: "server" | "client";
  context?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

const levelColors: Record<string, string> = {
  trace: "bg-slate-400 text-white",
  debug: "bg-slate-500 text-white",
  info: "bg-blue-500 text-white",
  warn: "bg-yellow-500 text-black",
  error: "bg-red-500 text-white",
  fatal: "bg-red-700 text-white",
};

const levelTextColors: Record<string, string> = {
  trace: "text-slate-500",
  debug: "text-slate-600",
  info: "text-blue-600",
  warn: "text-yellow-600",
  error: "text-red-600",
  fatal: "text-red-700",
};

export default function AdminLogsPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (levelFilter !== "all") {
        params.set("level", levelFilter);
      }

      if (sourceFilter !== "all") {
        params.set("source", sourceFilter);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/system-logs?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setLogs(data.entries || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalEntries(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error(t("adminPanel.logs.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, currentPage, levelFilter, sourceFilter, search, limit, t]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleClearLogs = async () => {
    if (!confirm(t("adminPanel.logs.clearConfirm"))) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/system-logs?confirm=true", {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to clear logs");

      const data = await response.json();
      toast.success(t("adminPanel.logs.cleared", { count: data.deleted }));
      fetchLogs();
    } catch (error) {
      console.error("Error clearing logs:", error);
      toast.error(t("adminPanel.logs.clearError"));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const hasDetails = (log: LogEntry) => {
    return log.stack || (log.metadata && Object.keys(log.metadata).length > 0);
  };

  if (loading && !logs.length) {
    return (
      <div className="p-6">
        <Stack gap={6}>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-16" />
          <Skeleton className="h-96" />
        </Stack>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Stack gap={4}>
        {/* Header */}
        <Flex justify="between" align="center" wrap="wrap" gap={4}>
          <Stack gap={1}>
            <Typography variant="h2">{t("adminPanel.logs.title")}</Typography>
            <Typography variant="body2" colorScheme="secondary">
              {totalEntries > 0
                ? t("adminPanel.logs.entriesCount", { count: totalEntries })
                : t("adminPanel.logs.description")}
            </Typography>
          </Stack>
          <Flex gap={2}>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={handleClearLogs}
              disabled={loading || logs.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("adminPanel.logs.clearAll")}
            </Button>
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </Flex>
        </Flex>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch}>
              <Flex align="center" gap={3} wrap="wrap">
                <Flex align="center" gap={2} className="shrink-0">
                  <Filter className="text-muted-foreground h-4 w-4" />
                  <Typography variant="body2" weight="medium">
                    {t("adminPanel.logs.filters")}:
                  </Typography>
                </Flex>

                {/* Search */}
                <div className="relative min-w-[200px] flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t("adminPanel.logs.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Level Filter */}
                <Select
                  value={levelFilter}
                  onValueChange={(v) => {
                    setLevelFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t("adminPanel.logs.level")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("adminPanel.logs.allLevels")}</SelectItem>
                    <SelectItem value="trace">Trace</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select
                  value={sourceFilter}
                  onValueChange={(v) => {
                    setSourceFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t("adminPanel.logs.source")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("adminPanel.logs.allSources")}</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>

                {/* Rows per page */}
                <Select
                  value={limit.toString()}
                  onValueChange={(v) => {
                    setLimit(parseInt(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  {t("common.search")}
                </Button>
              </Flex>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <Typography variant="body1" colorScheme="secondary">
                  {t("adminPanel.logs.noLogs")}
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.logs.timestamp")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.logs.level")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.logs.source")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.logs.message")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("adminPanel.logs.context")}
                      </th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log, index) => {
                      const { date, time } = formatTimestamp(log.timestamp);
                      const isExpanded = expandedRow === index;
                      const canExpand = hasDetails(log);

                      return (
                        <Fragment key={index}>
                          <tr
                            className={`hover:bg-muted/30 transition-colors ${
                              canExpand ? "cursor-pointer" : ""
                            } ${isExpanded ? "bg-muted/20" : ""}`}
                            onClick={() => canExpand && toggleRow(index)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">{date}</span>
                                <span className="font-mono text-xs">{time}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`${levelColors[log.level] || "bg-gray-500"} text-xs font-medium`}
                              >
                                {log.level.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {log.source === "server" ? (
                                <Flex align="center" gap={1} className="text-muted-foreground">
                                  <Server className="h-3 w-3" />
                                  <span className="text-xs">Server</span>
                                </Flex>
                              ) : (
                                <Flex align="center" gap={1} className="text-muted-foreground">
                                  <Monitor className="h-3 w-3" />
                                  <span className="text-xs">Client</span>
                                </Flex>
                              )}
                            </td>
                            <td className="max-w-md px-4 py-3">
                              <p
                                className={`truncate font-mono text-xs ${levelTextColors[log.level] || ""}`}
                                title={log.message}
                              >
                                {log.message}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              {log.context && (
                                <Badge variant="outline" className="text-xs">
                                  {log.context}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {canExpand && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && canExpand && (
                            <tr key={`details-${index}`} className="bg-muted/10">
                              <td colSpan={6} className="px-4 py-4">
                                <Stack gap={3}>
                                  {/* Full message */}
                                  <div>
                                    <Typography
                                      variant="caption"
                                      weight="medium"
                                      className="text-muted-foreground mb-1 block"
                                    >
                                      {t("adminPanel.logs.fullMessage")}
                                    </Typography>
                                    <pre className="bg-muted overflow-auto rounded p-3 font-mono text-xs whitespace-pre-wrap">
                                      {log.message}
                                    </pre>
                                  </div>

                                  {/* Stack trace */}
                                  {log.stack && (
                                    <div>
                                      <Typography
                                        variant="caption"
                                        weight="medium"
                                        className="text-muted-foreground mb-1 block"
                                      >
                                        Stack Trace
                                      </Typography>
                                      <pre className="max-h-64 overflow-auto rounded bg-red-950/20 p-3 font-mono text-xs whitespace-pre-wrap text-red-400">
                                        {log.stack}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <Typography
                                        variant="caption"
                                        weight="medium"
                                        className="text-muted-foreground mb-1 block"
                                      >
                                        {t("adminPanel.logs.metadata")}
                                      </Typography>
                                      <pre className="bg-muted max-h-48 overflow-auto rounded p-3 font-mono text-xs">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {/* User ID if present */}
                                  {log.userId && (
                                    <Typography variant="caption" colorScheme="secondary">
                                      {t("adminPanel.logs.userId")}: {log.userId}
                                    </Typography>
                                  )}
                                </Stack>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 0 && (
          <Flex justify="between" align="center" wrap="wrap" gap={4}>
            <Typography variant="body2" colorScheme="secondary">
              {t("adminPanel.logs.showing", {
                start: (currentPage - 1) * limit + 1,
                end: Math.min(currentPage * limit, totalEntries),
                total: totalEntries,
              })}
            </Typography>
            <Flex align="center" gap={2}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                {t("adminPanel.logs.first")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Typography variant="body2" className="px-2">
                {currentPage} / {totalPages}
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                {t("adminPanel.logs.last")}
              </Button>
            </Flex>
          </Flex>
        )}
      </Stack>
    </div>
  );
}
