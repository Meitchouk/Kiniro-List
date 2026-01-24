/**
 * Feedback status change email template.
 * Sent to users when the status of their feedback changes.
 */

import { baseLayout, type Locale } from "./base";
import type { FeedbackStatus, FeedbackType } from "@/lib/types";

export interface FeedbackStatusChangeEmailData {
  locale: Locale;
  displayName: string | null;
  feedbackType: FeedbackType;
  originalMessage: string;
  newStatus: FeedbackStatus;
  feedbackUrl: string;
}

const content = {
  en: {
    subject: {
      "in-review": "Your Feedback is Being Reviewed",
      reviewed: "Your Feedback Has Been Reviewed",
      resolved: "Your Feedback Has Been Resolved",
    },
    greeting: (name: string | null) => (name ? `Hi ${name},` : "Hi there,"),
    intro: {
      "in-review": "Good news! We've started reviewing your feedback. Our team is looking into it.",
      reviewed:
        "Your feedback has been reviewed by our team. We appreciate you taking the time to share your thoughts.",
      resolved:
        "Great news! Your feedback has been resolved. Thank you for helping us improve Kiniro List!",
    },
    originalLabel: "Your original message:",
    statusLabel: "Current status:",
    statusNames: {
      new: "New",
      "in-review": "In Review",
      reviewed: "Reviewed",
      resolved: "Resolved",
    },
    cta: "View Your Feedback",
    closing: "Thank you for your patience and for helping us improve!",
    signature: "The Kiniro List Team",
    feedbackTypes: {
      suggestion: "Suggestion",
      bug: "Bug Report",
      comment: "Comment",
    },
  },
  es: {
    subject: {
      "in-review": "Tu Comentario Está Siendo Revisado",
      reviewed: "Tu Comentario Ha Sido Revisado",
      resolved: "Tu Comentario Ha Sido Resuelto",
    },
    greeting: (name: string | null) => (name ? `Hola ${name},` : "Hola,"),
    intro: {
      "in-review":
        "¡Buenas noticias! Hemos comenzado a revisar tu comentario. Nuestro equipo lo está analizando.",
      reviewed:
        "Tu comentario ha sido revisado por nuestro equipo. Agradecemos que te hayas tomado el tiempo de compartir tu opinión.",
      resolved:
        "¡Excelentes noticias! Tu comentario ha sido resuelto. ¡Gracias por ayudarnos a mejorar Kiniro List!",
    },
    originalLabel: "Tu mensaje original:",
    statusLabel: "Estado actual:",
    statusNames: {
      new: "Nuevo",
      "in-review": "En Revisión",
      reviewed: "Revisado",
      resolved: "Resuelto",
    },
    cta: "Ver Tu Comentario",
    closing: "¡Gracias por tu paciencia y por ayudarnos a mejorar!",
    signature: "El Equipo de Kiniro List",
    feedbackTypes: {
      suggestion: "Sugerencia",
      bug: "Reporte de Error",
      comment: "Comentario",
    },
  },
};

const statusColors: Record<FeedbackStatus, string> = {
  new: "#3b82f6",
  "in-review": "#f97316",
  reviewed: "#eab308",
  resolved: "#22c55e",
};

export function feedbackStatusChangeSubject(locale: Locale, status: FeedbackStatus): string {
  const t = content[locale] || content.en;
  return (
    t.subject[status as keyof typeof t.subject] ||
    content.en.subject[status as keyof typeof content.en.subject] ||
    "Feedback Status Update"
  );
}

export function feedbackStatusChangeHtml(data: FeedbackStatusChangeEmailData): string {
  const locale = data.locale ?? "en";
  const t = content[locale] || content.en;
  const feedbackTypeLabel =
    t.feedbackTypes[data.feedbackType as keyof typeof t.feedbackTypes] || data.feedbackType;
  const statusName = t.statusNames[data.newStatus as keyof typeof t.statusNames] || data.newStatus;
  const introText =
    t.intro[data.newStatus as keyof typeof t.intro] ||
    content.en.intro[data.newStatus as keyof typeof content.en.intro] ||
    "";
  const statusColor = statusColors[data.newStatus] || "#6b7280";

  const body = `
    <h2>${feedbackStatusChangeSubject(locale, data.newStatus)}</h2>
    <p>${t.greeting(data.displayName)}</p>
    <p>${introText}</p>
    
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">${t.originalLabel} (${feedbackTypeLabel})</p>
      <p style="margin: 0; color: #52525b;">${data.originalMessage.length > 200 ? data.originalMessage.substring(0, 200) + "..." : data.originalMessage}</p>
    </div>
    
    <div style="margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">${t.statusLabel}</p>
      <span style="display: inline-block; background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
        ${statusName}
      </span>
    </div>
    
    <a href="${data.feedbackUrl}" class="btn">${t.cta}</a>
    
    <p style="margin-top: 24px;">${t.closing}</p>
    <p>— ${t.signature}</p>
  `;

  return baseLayout(body, feedbackStatusChangeSubject(locale, data.newStatus), locale);
}

export function feedbackStatusChangeText(data: FeedbackStatusChangeEmailData): string {
  const locale = data.locale ?? "en";
  const t = content[locale] || content.en;
  const feedbackTypeLabel =
    t.feedbackTypes[data.feedbackType as keyof typeof t.feedbackTypes] || data.feedbackType;
  const statusName = t.statusNames[data.newStatus as keyof typeof t.statusNames] || data.newStatus;
  const introText =
    t.intro[data.newStatus as keyof typeof t.intro] ||
    content.en.intro[data.newStatus as keyof typeof content.en.intro] ||
    "";

  return `
${feedbackStatusChangeSubject(locale, data.newStatus)}

${t.greeting(data.displayName)}

${introText}

${t.originalLabel} (${feedbackTypeLabel})
---
${data.originalMessage.length > 200 ? data.originalMessage.substring(0, 200) + "..." : data.originalMessage}

${t.statusLabel} ${statusName}

${t.cta}: ${data.feedbackUrl}

${t.closing}

— ${t.signature}
`.trim();
}
