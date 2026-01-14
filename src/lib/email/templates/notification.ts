/**
 * Generic notification email template.
 * Used for various system notifications and announcements.
 */

import { baseLayout, type NotificationEmailData } from "./base";

const content = {
  en: {
    greeting: (name: string | null) => (name ? `Hi ${name},` : "Hi there,"),
    closing: "Best regards,",
    signature: "The Kiniro List Team",
  },
  es: {
    greeting: (name: string | null) => (name ? `Hola ${name},` : "Hola,"),
    closing: "Saludos,",
    signature: "El Equipo de Kiniro List",
  },
};

export function notificationEmailHtml(data: NotificationEmailData): string {
  const locale = data.locale ?? "en";
  const t = content[locale];

  const actionButton = data.actionUrl
    ? `<a href="${data.actionUrl}" class="btn">${data.actionText || (locale === "es" ? "Ver Detalles" : "View Details")}</a>`
    : "";

  const body = `
    <h2>${data.title}</h2>
    <p>${t.greeting(data.displayName)}</p>
    <p>${data.message}</p>
    ${actionButton}
    <p>${t.closing}<br>— ${t.signature}</p>
  `;

  return baseLayout(body, data.message.slice(0, 100), locale);
}

export function notificationEmailText(data: NotificationEmailData): string {
  const t = content[data.locale ?? "en"];

  const actionLine = data.actionUrl
    ? `\n${data.actionText || "View Details"}: ${data.actionUrl}\n`
    : "";

  return `
${data.title}

${t.greeting(data.displayName)}

${data.message}
${actionLine}
${t.closing}
— ${t.signature}
  `.trim();
}
