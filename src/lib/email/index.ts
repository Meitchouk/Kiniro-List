/**
 * Email module exports.
 */

// Low-level SMTP functions
export { sendEmail, verifySmtpConnection } from "./smtp";

// High-level template-based senders
export { sendWelcomeEmail, sendNotificationEmail } from "./sender";

// Templates (for custom usage)
export * from "./templates";
