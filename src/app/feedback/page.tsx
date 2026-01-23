"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Bug, Lightbulb, CheckCircle } from "lucide-react";
import { z } from "zod";

import {
  Button,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ds";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoginButton } from "@/components/auth";

const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "comment"]),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

interface FeedbackEntry {
  id: string;
  type: "suggestion" | "bug" | "comment";
  message: string;
  status: "new" | "reviewed" | "resolved";
  createdAt: string | null;
}

export default function FeedbackPage() {
  const t = useTranslations();
  const { user, userData, getAuthHeaders } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackEntry[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "suggestion",
      message: "",
    },
  });

  const selectedType = form.watch("type");

  // Fetch user's previous feedback
  useEffect(() => {
    if (!user) return;

    const fetchFeedback = async () => {
      setLoadingFeedback(true);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch("/api/feedback", { headers });
        if (response.ok) {
          const data = await response.json();
          setMyFeedback(data.feedback || []);
        }
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
      } finally {
        setLoadingFeedback(false);
      }
    };

    fetchFeedback();
  }, [user, getAuthHeaders]);

  const onSubmit = async (data: FeedbackForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      form.reset();
      toast.success(t("feedback.submitSuccess"));

      // Refresh feedback list
      const listResponse = await fetch("/api/feedback", { headers });
      if (listResponse.ok) {
        const listData = await listResponse.json();
        setMyFeedback(listData.feedback || []);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(t("feedback.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    {
      value: "suggestion" as const,
      label: t("feedback.types.suggestion"),
      icon: Lightbulb,
      color: "text-yellow-500",
    },
    {
      value: "bug" as const,
      label: t("feedback.types.bug"),
      icon: Bug,
      color: "text-red-500",
    },
    {
      value: "comment" as const,
      label: t("feedback.types.comment"),
      icon: MessageSquare,
      color: "text-blue-500",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {t("feedback.status.new")}
          </span>
        );
      case "reviewed":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
            {t("feedback.status.reviewed")}
          </span>
        );
      case "resolved":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
            {t("feedback.status.resolved")}
          </span>
        );
      default:
        return null;
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("feedback.title")}</CardTitle>
            <CardDescription>{t("feedback.loginRequired")}</CardDescription>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("feedback.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("feedback.description")}</p>
      </div>

      {/* Feedback Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("feedback.formTitle")}</CardTitle>
          <CardDescription>{t("feedback.formDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-xl font-semibold">{t("feedback.thankYou")}</h3>
              <p className="text-muted-foreground mt-2">{t("feedback.thankYouDescription")}</p>
              <Button className="mt-6" onClick={() => setSubmitted(false)}>
                {t("feedback.sendAnother")}
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>{t("feedback.typeLabel")}</Label>
                <div className="grid grid-cols-3 gap-3">
                  {typeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => form.setValue("type", option.value)}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${option.color}`} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">{t("feedback.messageLabel")}</Label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder={t("feedback.messagePlaceholder")}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("message")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.message && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.message.message}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {form.watch("message")?.length || 0} / 2000
                </p>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t("feedback.submit")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      {myFeedback.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">{t("feedback.myFeedback")}</h2>
          <div className="space-y-4">
            {myFeedback.map((item) => {
              const typeOption = typeOptions.find((o) => o.value === item.type);
              const Icon = typeOption?.icon || MessageSquare;
              return (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-1 h-5 w-5 ${typeOption?.color}`} />
                        <div>
                          <p className="text-sm">{item.message}</p>
                          {item.createdAt && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {new Date(item.createdAt).toLocaleDateString(userData?.locale, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {loadingFeedback && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
}
