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
  Grid,
  TextArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ds";
import {
  MessageSquare,
  Lightbulb,
  Bug,
  MessageCircle,
  Clock,
  CheckCircle,
  Eye,
  Send,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { FeedbackEntry, FeedbackStatus, FeedbackType } from "@/lib/types";

interface FeedbackCounts {
  total: number;
  new: number;
  reviewed: number;
  resolved: number;
}

const typeIcons: Record<FeedbackType, typeof Lightbulb> = {
  suggestion: Lightbulb,
  bug: Bug,
  comment: MessageCircle,
};

const typeColors: Record<FeedbackType, string> = {
  suggestion: "text-yellow-500 bg-yellow-500/10",
  bug: "text-red-500 bg-red-500/10",
  comment: "text-blue-500 bg-blue-500/10",
};

const statusColors: Record<FeedbackStatus, string> = {
  new: "bg-blue-500",
  reviewed: "bg-yellow-500",
  resolved: "bg-green-500",
};

export default function AdminFeedbackPage() {
  const t = useTranslations();
  const { user, getAuthHeaders } = useAuth();

  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [counts, setCounts] = useState<FeedbackCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedback = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      if (filterType !== "all") {
        params.set("type", filterType);
      }

      const response = await fetch(`/api/admin/feedback?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }

      const data = await response.json();
      setFeedback(data.feedback);
      setCounts(data.counts);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, filterStatus, filterType]);

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user, fetchFeedback]);

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: feedbackId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status updated");
      fetchFeedback();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSubmitResponse = async (feedbackId: string) => {
    if (!responseText.trim()) {
      toast.error("Response cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: feedbackId,
          adminResponse: responseText,
          status: "reviewed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit response");
      }

      toast.success("Response sent successfully");
      setRespondingTo(null);
      setResponseText("");
      setExpandedRow(null);
      fetchFeedback();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
      setRespondingTo(null);
      setResponseText("");
    } else {
      setExpandedRow(id);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading && !feedback.length) {
    return (
      <div className="p-6">
        <Stack gap={6}>
          <Skeleton className="h-10 w-64" />
          <Grid cols={4} gap={4}>
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
            <Typography variant="h2">{t("admin.feedback.title")}</Typography>
            <Typography variant="body2" colorScheme="secondary">
              {counts
                ? t("admin.feedback.totalCount", { count: counts.total })
                : t("admin.feedback.description")}
            </Typography>
          </Stack>
          <Button variant="outline" onClick={fetchFeedback} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </Button>
        </Flex>

        {/* Stats Cards */}
        {counts && (
          <Grid cols={2} mdCols={4} gap={4}>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="bg-muted rounded-full p-2">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{counts.total}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("admin.feedback.total")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="rounded-full bg-blue-500/10 p-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{counts.new}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("feedback.status.new")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="rounded-full bg-yellow-500/10 p-2">
                    <Eye className="h-5 w-5 text-yellow-500" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{counts.reviewed}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("feedback.status.reviewed")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flex align="center" gap={3}>
                  <div className="rounded-full bg-green-500/10 p-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <Stack gap={0}>
                    <Typography variant="h3">{counts.resolved}</Typography>
                    <Typography variant="caption" colorScheme="secondary">
                      {t("feedback.status.resolved")}
                    </Typography>
                  </Stack>
                </Flex>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <Flex align="center" gap={4} wrap="wrap">
              <Flex align="center" gap={2}>
                <Filter className="text-muted-foreground h-4 w-4" />
                <Typography variant="body2" weight="medium">
                  {t("admin.feedback.filters")}:
                </Typography>
              </Flex>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as FeedbackStatus | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.feedback.allStatus")}</SelectItem>
                  <SelectItem value="new">{t("feedback.status.new")}</SelectItem>
                  <SelectItem value="reviewed">{t("feedback.status.reviewed")}</SelectItem>
                  <SelectItem value="resolved">{t("feedback.status.resolved")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as FeedbackType | "all")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.feedback.allTypes")}</SelectItem>
                  <SelectItem value="suggestion">{t("feedback.types.suggestion")}</SelectItem>
                  <SelectItem value="bug">{t("feedback.types.bug")}</SelectItem>
                  <SelectItem value="comment">{t("feedback.types.comment")}</SelectItem>
                </SelectContent>
              </Select>
            </Flex>
          </CardContent>
        </Card>

        {/* Feedback Table */}
        <Card>
          <CardContent className="p-0">
            {feedback.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <Typography variant="body1" colorScheme="secondary">
                  {t("admin.feedback.noFeedback")}
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("admin.feedback.type")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("admin.feedback.user")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("admin.feedback.message")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("admin.feedback.status")}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {t("admin.feedback.date")}
                      </th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {feedback.map((item) => {
                      const TypeIcon = typeIcons[item.type];
                      const isExpanded = expandedRow === item.id;

                      return (
                        <Fragment key={item.id}>
                          <tr
                            className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                              isExpanded ? "bg-muted/20" : ""
                            }`}
                            onClick={() => toggleRow(item.id)}
                          >
                            <td className="px-4 py-3">
                              <Flex align="center" gap={2}>
                                <div className={`rounded-full p-1.5 ${typeColors[item.type]}`}>
                                  <TypeIcon className="h-3 w-3" />
                                </div>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {t(`feedback.types.${item.type}`)}
                                </Badge>
                              </Flex>
                            </td>
                            <td className="px-4 py-3">
                              <Stack gap={0}>
                                <Typography variant="body2" weight="medium">
                                  {item.userDisplayName || "Anonymous"}
                                </Typography>
                                <Typography variant="caption" colorScheme="secondary">
                                  {item.userEmail || "-"}
                                </Typography>
                              </Stack>
                            </td>
                            <td className="max-w-xs px-4 py-3">
                              <Typography
                                variant="body2"
                                colorScheme="secondary"
                                className="line-clamp-2"
                              >
                                {item.message}
                              </Typography>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`${statusColors[item.status]} text-xs`}>
                                {t(`feedback.status.${item.status}`)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Typography variant="caption" colorScheme="secondary">
                                {formatDate(item.createdAt)}
                              </Typography>
                            </td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/10">
                              <td colSpan={6} className="px-4 py-4">
                                <Stack gap={4}>
                                  {/* Full message */}
                                  <div>
                                    <Typography
                                      variant="caption"
                                      weight="medium"
                                      className="text-muted-foreground mb-1 block"
                                    >
                                      {t("admin.feedback.fullMessage")}
                                    </Typography>
                                    <div className="bg-muted rounded-lg p-4">
                                      <Typography variant="body2" className="whitespace-pre-wrap">
                                        {item.message}
                                      </Typography>
                                    </div>
                                  </div>

                                  {/* Admin response if exists */}
                                  {item.adminResponse && (
                                    <div>
                                      <Typography
                                        variant="caption"
                                        weight="medium"
                                        className="text-muted-foreground mb-1 block"
                                      >
                                        {t("admin.feedback.adminResponse")}
                                      </Typography>
                                      <div className="border-primary/20 bg-primary/5 rounded-lg border-l-4 p-4">
                                        <Typography variant="body2" className="whitespace-pre-wrap">
                                          {item.adminResponse.message}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          colorScheme="secondary"
                                          className="mt-2 block"
                                        >
                                          {item.adminResponse.respondedByEmail} -{" "}
                                          {new Date(
                                            item.adminResponse.respondedAt
                                          ).toLocaleString()}
                                        </Typography>
                                      </div>
                                    </div>
                                  )}

                                  {/* Response form */}
                                  {respondingTo === item.id ? (
                                    <Stack gap={3}>
                                      <TextArea
                                        placeholder={t("admin.feedback.responsePlaceholder")}
                                        value={responseText}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                          setResponseText(e.target.value)
                                        }
                                        rows={3}
                                      />
                                      <Flex gap={2}>
                                        <Button
                                          onClick={() => handleSubmitResponse(item.id)}
                                          disabled={submitting || !responseText.trim()}
                                          size="sm"
                                        >
                                          <Send className="mr-2 h-4 w-4" />
                                          {t("admin.feedback.sendResponse")}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setRespondingTo(null);
                                            setResponseText("");
                                          }}
                                        >
                                          <X className="mr-2 h-4 w-4" />
                                          {t("common.cancel")}
                                        </Button>
                                      </Flex>
                                    </Stack>
                                  ) : (
                                    <Flex gap={2} wrap="wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRespondingTo(item.id);
                                          setResponseText(item.adminResponse?.message || "");
                                        }}
                                      >
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        {item.adminResponse
                                          ? t("admin.feedback.editResponse")
                                          : t("admin.feedback.respond")}
                                      </Button>
                                      {item.status !== "resolved" && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(item.id, "resolved");
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          {t("admin.feedback.markResolved")}
                                        </Button>
                                      )}
                                      {item.status === "new" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(item.id, "reviewed");
                                          }}
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          {t("admin.feedback.markReviewed")}
                                        </Button>
                                      )}
                                    </Flex>
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
      </Stack>
    </div>
  );
}
