import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { smtp, isSmtpConfigured } from "@/lib/config/env";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured. Set SMTP_* env vars.");
  }

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure, // false for STARTTLS on 587
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  return transporter;
}

/**
 * Sends an email using the configured SMTP transporter.
 * This function is server-side only.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const tx = getTransporter();

  const from = `${smtp.fromName} <${smtp.fromEmail}>`;

  const info = await tx.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    cc: options.cc,
    bcc: options.bcc,
    replyTo: options.replyTo,
  });

  return { messageId: info.messageId };
}

/**
 * Verifies SMTP connection. Useful for health checks.
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const tx = getTransporter();
    await tx.verify();
    return true;
  } catch {
    return false;
  }
}
