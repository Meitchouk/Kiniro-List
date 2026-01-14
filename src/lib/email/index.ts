/**
 * Email module exports.
 */

// Low-level ZeptoMail API functions
export { sendEmail, verifyEmailConnection } from "./zeptomail";

// High-level template-based senders
export { sendWelcomeEmail, sendNotificationEmail } from "./sender";

// Templates (for custom usage)
export * from "./templates";
