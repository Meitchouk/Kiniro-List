/**
 * High-level email sending functions using templates.
 * These wrap the low-level ZeptoMail sender with pre-built templates.
 */

import { sendEmail } from "./zeptomail";
import {
  welcomeEmailHtml,
  welcomeEmailText,
  welcomeEmailSubject,
  notificationEmailHtml,
  notificationEmailText,
  generateDailyDigestHtml,
  generateDailyDigestText,
  generateDailyDigestSubject,
  verifyEmailHtml,
  verifyEmailText,
  verifyEmailSubject,
  passwordResetEmailHtml,
  passwordResetEmailText,
  passwordResetEmailSubject,
  type WelcomeEmailData,
  type NotificationEmailData,
  type DailyDigestEmailData,
  type VerifyEmailData,
  type PasswordResetEmailData,
} from "./templates";

/**
 * Send a welcome email to a new user.
 * Called automatically when a user account is created.
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to: data.email,
      subject: welcomeEmailSubject(data.locale),
      html: welcomeEmailHtml(data),
      text: welcomeEmailText(data),
    });

    console.log(`[email] Welcome email sent to ${data.email}, messageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[email] Failed to send welcome email to ${data.email}:`, error);
    return null;
  }
}

/**
 * Send a generic notification email.
 */
export async function sendNotificationEmail(
  to: string,
  data: NotificationEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to,
      subject: data.title,
      html: notificationEmailHtml(data),
      text: notificationEmailText(data),
    });

    console.log(`[email] Notification email sent to ${to}, messageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[email] Failed to send notification email to ${to}:`, error);
    return null;
  }
}

/**
 * Send daily digest email with today's airing episodes.
 */
export async function sendDailyDigestEmail(
  to: string,
  data: DailyDigestEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to,
      subject: generateDailyDigestSubject(data),
      html: generateDailyDigestHtml(data),
      text: generateDailyDigestText(data),
    });

    console.log(
      `[email] Daily digest sent to ${to} with ${data.episodes.length} episodes, messageId: ${result.messageId}`
    );
    return result;
  } catch (error) {
    console.error(`[email] Failed to send daily digest to ${to}:`, error);
    return null;
  }
}

/**
 * Send email verification email to a user.
 * Called after user registration with email/password.
 */
export async function sendVerificationEmail(
  data: VerifyEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to: data.email,
      subject: verifyEmailSubject(data.locale),
      html: verifyEmailHtml(data),
      text: verifyEmailText(data),
    });

    console.log(`[email] Verification email sent to ${data.email}, messageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[email] Failed to send verification email to ${data.email}:`, error);
    return null;
  }
}

/**
 * Send password reset email to a user.
 * Called when user requests a password reset.
 */
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to: data.email,
      subject: passwordResetEmailSubject(data.locale),
      html: passwordResetEmailHtml(data),
      text: passwordResetEmailText(data),
    });

    console.log(
      `[email] Password reset email sent to ${data.email}, messageId: ${result.messageId}`
    );
    return result;
  } catch (error) {
    console.error(`[email] Failed to send password reset email to ${data.email}:`, error);
    return null;
  }
}
