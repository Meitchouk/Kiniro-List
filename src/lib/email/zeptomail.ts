// @ts-expect-error - zeptomail types have export issues in package.json
import { SendMailClient } from "zeptomail";
import { zeptomail, isZeptomailConfigured } from "@/lib/config/env";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

interface ZeptoMailAddress {
  address: string;
  name?: string;
}

interface ZeptoMailRecipient {
  email_address: ZeptoMailAddress;
}

let client: SendMailClient | null = null;

function getClient(): SendMailClient {
  if (client) return client;

  if (!isZeptomailConfigured()) {
    throw new Error("ZeptoMail is not configured. Set ZEPTOMAIL_* env vars.");
  }

  client = new SendMailClient({
    url: zeptomail.url,
    token: zeptomail.token,
  });

  return client;
}

/**
 * Converts email string or array to ZeptoMail recipient format
 */
function toRecipients(emails: string | string[]): ZeptoMailRecipient[] {
  const list = Array.isArray(emails) ? emails : [emails];
  return list.map((email) => ({
    email_address: { address: email },
  }));
}

/**
 * Sends an email using ZeptoMail API.
 * This function is server-side only.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const mail = getClient();

  const payload: Record<string, unknown> = {
    from: {
      address: zeptomail.fromEmail,
      name: zeptomail.fromName,
    },
    to: toRecipients(options.to),
    subject: options.subject,
  };

  // Add HTML body
  if (options.html) {
    payload.htmlbody = options.html;
  }

  // Add text body
  if (options.text) {
    payload.textbody = options.text;
  }

  // Add CC if provided
  if (options.cc) {
    payload.cc = toRecipients(options.cc);
  }

  // Add BCC if provided
  if (options.bcc) {
    payload.bcc = toRecipients(options.bcc);
  }

  // Add reply-to if provided
  if (options.replyTo) {
    payload.reply_to = { address: options.replyTo };
  }

  const response = await mail.sendMail(payload);

  // ZeptoMail returns request_id as the identifier
  return { messageId: response?.request_id ?? "sent" };
}

/**
 * Verifies ZeptoMail configuration. Basic check since API doesn't have a verify endpoint.
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    return isZeptomailConfigured();
  } catch {
    return false;
  }
}
