/**
 * Feedback response email template.
 * Sent to users when an admin responds to their feedback.
 */

import { baseLayout, type Locale } from "./base";

export interface FeedbackThreadMessage {
  message: string;
  isAdmin: boolean;
  authorName: string | null;
  createdAt: string;
}

export interface FeedbackResponseEmailData {
  locale: Locale;
  displayName: string | null;
  feedbackType: string;
  originalMessage: string;
  adminResponse: string;
  feedbackUrl: string;
  thread?: FeedbackThreadMessage[];
}

const content = {
  en: {
    subject: "Response to Your Feedback",
    greeting: (name: string | null) => (name ? `Hi ${name},` : "Hi there,"),
    intro: "We have responded to your feedback:",
    originalLabel: "Your original message:",
    responseLabel: "Our response:",
    conversationLabel: "Conversation History:",
    adminLabel: "Admin",
    youLabel: "You",
    cta: "View Conversation",
    closing: "Thank you for helping us improve Kiniro List!",
    signature: "The Kiniro List Team",
    feedbackTypes: {
      suggestion: "Suggestion",
      bug: "Bug Report",
      comment: "Comment",
    },
  },
  es: {
    subject: "Respuesta a Tu Comentario",
    greeting: (name: string | null) => (name ? `Hola ${name},` : "Hola,"),
    intro: "Hemos respondido a tu comentario:",
    originalLabel: "Tu mensaje original:",
    responseLabel: "Nuestra respuesta:",
    conversationLabel: "Historial de Conversación:",
    adminLabel: "Admin",
    youLabel: "Tú",
    cta: "Ver Conversación",
    closing: "¡Gracias por ayudarnos a mejorar Kiniro List!",
    signature: "El Equipo de Kiniro List",
    feedbackTypes: {
      suggestion: "Sugerencia",
      bug: "Reporte de Error",
      comment: "Comentario",
    },
  },
};

export function feedbackResponseSubject(locale: Locale): string {
  return content[locale]?.subject || content.en.subject;
}

function formatDate(dateStr: string, locale: Locale): string {
  try {
    return new Date(dateStr).toLocaleString(locale === "es" ? "es-ES" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

export function feedbackResponseHtml(data: FeedbackResponseEmailData): string {
  const locale = data.locale ?? "en";
  const t = content[locale] || content.en;
  const feedbackTypeLabel =
    t.feedbackTypes[data.feedbackType as keyof typeof t.feedbackTypes] || data.feedbackType;

  // Build thread HTML if available
  let threadHtml = "";
  if (data.thread && data.thread.length > 0) {
    const threadMessages = data.thread
      .map((msg) => {
        const authorLabel = msg.isAdmin ? t.adminLabel : t.youLabel;
        const bgColor = msg.isAdmin ? "#fef3c7" : "#f4f4f5";
        const borderColor = msg.isAdmin ? "#f59e0b" : "#d4d4d8";
        const labelColor = msg.isAdmin ? "#92400e" : "#71717a";
        const textColor = msg.isAdmin ? "#451a03" : "#52525b";

        return `
          <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 4px; padding: 12px; margin: 8px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 600; color: ${labelColor};">${authorLabel}</span>
              <span style="font-size: 11px; color: #a1a1aa;">${formatDate(msg.createdAt, locale)}</span>
            </div>
            <p style="margin: 0; color: ${textColor}; white-space: pre-wrap;">${msg.message}</p>
          </div>
        `;
      })
      .join("");

    threadHtml = `
      <div style="margin: 24px 0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #3f3f46;">${t.conversationLabel}</p>
        ${threadMessages}
      </div>
    `;
  }

  // If no thread, show legacy format (original message + response)
  const legacyHtml =
    !data.thread || data.thread.length === 0
      ? `
    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">${t.originalLabel} (${feedbackTypeLabel})</p>
      <p style="margin: 0; color: #52525b;">${data.originalMessage}</p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; text-transform: uppercase;">${t.responseLabel}</p>
      <p style="margin: 0; color: #451a03;">${data.adminResponse}</p>
    </div>
  `
      : "";

  const body = `
    <h2>${t.subject}</h2>
    <p>${t.greeting(data.displayName)}</p>
    <p>${t.intro}</p>
    
    ${threadHtml || legacyHtml}
    
    <a href="${data.feedbackUrl}" class="btn">${t.cta}</a>
    
    <p style="margin-top: 24px;">${t.closing}</p>
    <p>— ${t.signature}</p>
  `;

  return baseLayout(body, t.subject, locale);
}

export function feedbackResponseText(data: FeedbackResponseEmailData): string {
  const locale = data.locale ?? "en";
  const t = content[locale] || content.en;
  const feedbackTypeLabel =
    t.feedbackTypes[data.feedbackType as keyof typeof t.feedbackTypes] || data.feedbackType;

  // Build thread text if available
  let threadText = "";
  if (data.thread && data.thread.length > 0) {
    threadText = `${t.conversationLabel}\n${"=".repeat(30)}\n\n`;
    threadText += data.thread
      .map((msg) => {
        const authorLabel = msg.isAdmin ? t.adminLabel : t.youLabel;
        return `[${authorLabel}] ${formatDate(msg.createdAt, locale)}\n${msg.message}\n`;
      })
      .join("\n---\n\n");
  }

  // If no thread, show legacy format
  const legacyText =
    !data.thread || data.thread.length === 0
      ? `
${t.originalLabel} (${feedbackTypeLabel})
---
${data.originalMessage}

${t.responseLabel}
---
${data.adminResponse}
`
      : "";

  return `
${t.subject}

${t.greeting(data.displayName)}

${t.intro}

${threadText || legacyText}

${t.cta}: ${data.feedbackUrl}

${t.closing}

— ${t.signature}
`.trim();
}
