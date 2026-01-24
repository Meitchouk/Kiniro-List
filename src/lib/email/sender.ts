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
  feedbackResponseHtml,
  feedbackResponseText,
  feedbackResponseSubject,
  feedbackStatusChangeHtml,
  feedbackStatusChangeText,
  feedbackStatusChangeSubject,
  type WelcomeEmailData,
  type NotificationEmailData,
  type DailyDigestEmailData,
  type VerifyEmailData,
  type PasswordResetEmailData,
  type FeedbackResponseEmailData,
  type FeedbackStatusChangeEmailData,
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

/**
 * Send feedback response email to a user.
 * Called when an admin responds to user feedback.
 */
export async function sendFeedbackResponseEmail(
  to: string,
  data: FeedbackResponseEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to,
      subject: feedbackResponseSubject(data.locale),
      html: feedbackResponseHtml(data),
      text: feedbackResponseText(data),
    });

    console.log(`[email] Feedback response email sent to ${to}, messageId: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`[email] Failed to send feedback response email to ${to}:`, error);
    return null;
  }
}

/**
 * Send feedback status change email to a user.
 * Called when an admin changes the status of user feedback (without a response).
 */
export async function sendFeedbackStatusChangeEmail(
  to: string,
  data: FeedbackStatusChangeEmailData
): Promise<{ messageId: string } | null> {
  try {
    const result = await sendEmail({
      to,
      subject: feedbackStatusChangeSubject(data.locale, data.newStatus),
      html: feedbackStatusChangeHtml(data),
      text: feedbackStatusChangeText(data),
    });

    console.log(
      `[email] Feedback status change email sent to ${to}, status: ${data.newStatus}, messageId: ${result.messageId}`
    );
    return result;
  } catch (error) {
    console.error(`[email] Failed to send feedback status change email to ${to}:`, error);
    return null;
  }
}
