/**
 * Daily Digest Email Template
 * Sends a summary of anime episodes airing today for the user
 */

import { baseLayout, type BaseEmailData } from "./base";
import type { DigestAnimeItem } from "@/lib/types";
import { app } from "@/lib/config";
import { DateTime } from "luxon";

export interface DailyDigestEmailData extends BaseEmailData {
  displayName: string | null;
  date: DateTime; // DateTime object for proper localization
  episodes: DigestAnimeItem[];
  timezone: string;
}

const translations = {
  en: {
    subject: (count: number, date: string) =>
      `${count} episode${count !== 1 ? "s" : ""} airing today - ${date}`,
    greeting: (name: string | null) => (name ? `Hey ${name}!` : "Hey!"),
    intro: "Here's what's airing today from your watchlist:",
    episode: "Episode",
    watchNow: "View Details",
    watchOnCrunchyroll: "Watch",
    noEpisodes: "No episodes scheduled for today.",
    viewCalendar: "View Full Calendar",
    footer: "You're receiving this because you have daily digest enabled.",
    unsubscribe: "Manage notification settings",
    timezone: "Times shown in",
  },
  es: {
    subject: (count: number, date: string) =>
      `${count} episodio${count !== 1 ? "s" : ""} hoy - ${date}`,
    greeting: (name: string | null) => (name ? `¡Hola ${name}!` : "¡Hola!"),
    intro: "Esto es lo que se emite hoy de tu lista:",
    episode: "Episodio",
    watchNow: "Ver Detalles",
    watchOnCrunchyroll: "Ver",
    noEpisodes: "No hay episodios programados para hoy.",
    viewCalendar: "Ver Calendario Completo",
    footer: "Recibes esto porque tienes el resumen diario activado.",
    unsubscribe: "Gestionar notificaciones",
    timezone: "Horarios en",
  },
};

const BASE_URL = app.baseUrl;

// Emoji icons for email (better compatibility than SVG)
const ICONS = {
  calendar: "📅",
  clock: "🕐",
};

/**
 * Format date according to locale
 */
function formatDateForLocale(date: DateTime, locale: "en" | "es"): string {
  const luxonLocale = locale === "es" ? "es-ES" : "en-US";
  if (locale === "es") {
    // "sábado, 17 de enero"
    return date.setLocale(luxonLocale).toFormat("cccc, d 'de' LLLL");
  }
  // "Saturday, January 17"
  return date.setLocale(luxonLocale).toFormat("cccc, LLLL d");
}

/**
 * Format date for subject line (shorter format)
 */
function formatDateShort(date: DateTime, locale: "en" | "es"): string {
  const luxonLocale = locale === "es" ? "es-ES" : "en-US";
  if (locale === "es") {
    // "17 de enero"
    return date.setLocale(luxonLocale).toFormat("d 'de' LLLL");
  }
  // "January 17"
  return date.setLocale(luxonLocale).toFormat("LLLL d");
}

export function generateDailyDigestSubject(data: DailyDigestEmailData): string {
  const locale = data.locale || "en";
  const t = translations[locale] || translations.en;
  const formattedDate = formatDateShort(data.date, locale);
  return t.subject(data.episodes.length, formattedDate);
}

export function generateDailyDigestHtml(data: DailyDigestEmailData): string {
  const locale = data.locale || "en";
  const t = translations[locale] || translations.en;
  const formattedDate = formatDateForLocale(data.date, locale);

  const episodeCards = data.episodes
    .map((ep) => {
      const crunchyrollButton = ep.crunchyrollUrl
        ? `<td style="padding-left: 8px;">
              <a href="${ep.crunchyrollUrl}" style="display: inline-block; background-color: #F47521; color: #ffffff; padding: 2px 10px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 500;">
                ${t.watchOnCrunchyroll}
              </a>
            </td>`
        : "";

      return `
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
            <tr>
              <td width="80" style="vertical-align: top;">
                <img src="${ep.coverUrl}" alt="${escapeHtml(ep.title)}" width="80" height="110" style="display: block; border-radius: 8px 0 0 8px; object-fit: cover;" />
              </td>
              <td style="padding: 16px; vertical-align: top;">
                <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #ffffff; line-height: 1.3;">
                  ${escapeHtml(ep.title)}
                </p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #a0a0a0;">
                  ${ep.format ? `${ep.format} • ` : ""}${t.episode} ${ep.episode}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #fbbf24; padding: 2px 10px; border-radius: 12px;">
                      <span style="font-size: 13px; font-weight: 600; color: #000000;">
                        ${ICONS.clock} ${ep.airingTime}
                      </span>
                    </td>
                    <td style="padding-left: 12px;">
                      <a href="${BASE_URL}/anime/${ep.slug}" style="color: #fbbf24; font-size: 13px; text-decoration: none; font-weight: 500;">
                        ${t.watchNow} →
                      </a>
                    </td>
                    ${crunchyrollButton}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join("");

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 32px 24px;">
          <!-- Header -->
          <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff;">
            ${t.greeting(data.displayName)}
          </h1>
          <p style="margin: 0 0 24px 0; font-size: 16px; color: #a0a0a0;">
            ${t.intro}
          </p>

          <!-- Date Badge -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="background-color: #262626; padding: 8px 16px; border-radius: 20px;">
                <span style="font-size: 14px; color: #fbbf24; font-weight: 600;">
                  ${ICONS.calendar} ${formattedDate}
                </span>
              </td>
            </tr>
          </table>

          ${
            data.episodes.length > 0
              ? `
          <!-- Episode Cards -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${episodeCards}
          </table>
          `
              : `
          <p style="text-align: center; color: #a0a0a0; padding: 32px 0;">
            ${t.noEpisodes}
          </p>
          `
          }

          <!-- CTA Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
            <tr>
              <td align="center">
                <a href="${BASE_URL}/me/calendar" style="display: inline-block; background-color: #fbbf24; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  ${t.viewCalendar}
                </a>
              </td>
            </tr>
          </table>

          <!-- Timezone info -->
          <p style="margin: 24px 0 0 0; font-size: 12px; color: #666666; text-align: center;">
            ${t.timezone}: ${data.timezone}
          </p>

          <!-- Unsubscribe -->
          <p style="margin: 16px 0 0 0; font-size: 12px; color: #666666; text-align: center;">
            ${t.footer}<br />
            <a href="${BASE_URL}/me/settings" style="color: #fbbf24; text-decoration: none;">
              ${t.unsubscribe}
            </a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseLayout(content, generateDailyDigestSubject(data), locale);
}

export function generateDailyDigestText(data: DailyDigestEmailData): string {
  const locale = data.locale || "en";
  const t = translations[locale] || translations.en;
  const formattedDate = formatDateForLocale(data.date, locale);

  const greeting = t.greeting(data.displayName);
  const intro = t.intro;

  const episodeList =
    data.episodes.length > 0
      ? data.episodes
          .map(
            (ep) =>
              `• ${ep.title}\n  ${t.episode} ${ep.episode} - ${ep.airingTime}\n  ${BASE_URL}/anime/${ep.slug}`
          )
          .join("\n\n")
      : t.noEpisodes;

  return `
${greeting}

${intro}

${formattedDate}
${t.timezone}: ${data.timezone}

${episodeList}

---
${t.viewCalendar}: ${BASE_URL}/me/calendar

${t.footer}
${t.unsubscribe}: ${BASE_URL}/me/settings
`.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
