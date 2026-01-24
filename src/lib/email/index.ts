/**
 * Email module exports.
 */

// Low-level ZeptoMail API functions
export { sendEmail, verifyEmailConnection } from "./zeptomail";

// High-level template-based senders
export {
  sendWelcomeEmail,
  sendNotificationEmail,
  sendFeedbackResponseEmail,
  sendFeedbackStatusChangeEmail,
} from "./sender";

// Templates (for custom usage)
export * from "./templates";
