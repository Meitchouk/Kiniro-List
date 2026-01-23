/**
 * Authentication email templates for verification and password reset.
 */

import { baseLayout, type BaseEmailData, type Locale } from "./base";

export interface VerifyEmailData extends BaseEmailData {
  displayName: string | null;
  email: string;
  verificationLink: string;
}

export interface PasswordResetEmailData extends BaseEmailData {
  displayName: string | null;
  email: string;
  resetLink: string;
}

// ============================================================================
// Email Verification Templates
// ============================================================================

const verifyContent = {
  en: {
    subject: "Verify your email address",
    preview: "Please verify your email to complete your Kiniro List registration.",
    greeting: (name: string | null) => (name ? `Hi ${name},` : "Hi there,"),
    intro:
      "Thanks for signing up for Kiniro List! Please verify your email address to complete your registration and start tracking your anime.",
    instruction: "Click the button below to verify your email:",
    cta: "Verify Email",
    expiry: "This link will expire in 24 hours.",
    ignore: "If you didn't create an account on Kiniro List, you can safely ignore this email.",
    linkNote: "If the button doesn't work, copy and paste this link into your browser:",
    signature: "The Kiniro List Team",
  },
  es: {
    subject: "Verifica tu dirección de correo",
    preview: "Por favor verifica tu correo para completar tu registro en Kiniro List.",
    greeting: (name: string | null) => (name ? `Hola ${name},` : "Hola,"),
    intro:
      "¡Gracias por registrarte en Kiniro List! Por favor verifica tu dirección de correo para completar tu registro y comenzar a seguir tu anime.",
    instruction: "Haz clic en el botón de abajo para verificar tu correo:",
    cta: "Verificar Correo",
    expiry: "Este enlace expirará en 24 horas.",
    ignore: "Si no creaste una cuenta en Kiniro List, puedes ignorar este correo.",
    linkNote: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    signature: "El Equipo de Kiniro List",
  },
};

export function verifyEmailHtml(data: VerifyEmailData): string {
  const locale = data.locale ?? "en";
  const t = verifyContent[locale];

  const body = `
    <h2>${t.greeting(data.displayName)}</h2>
    <p>${t.intro}</p>
    <p>${t.instruction}</p>
    <a href="${data.verificationLink}" class="btn">${t.cta}</a>
    <p style="color: #71717a; font-size: 14px;">${t.expiry}</p>
    <p style="color: #71717a; font-size: 14px;">${t.ignore}</p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    <p style="color: #a1a1aa; font-size: 12px;">
      ${t.linkNote}<br>
      <a href="${data.verificationLink}" style="color: #EAB308; word-break: break-all;">${data.verificationLink}</a>
    </p>
    <p>— ${t.signature}</p>
  `;

  return baseLayout(body, t.preview, locale);
}

export function verifyEmailText(data: VerifyEmailData): string {
  const t = verifyContent[data.locale ?? "en"];

  return `
${t.greeting(data.displayName)}

${t.intro}

${t.instruction}

${t.cta}: ${data.verificationLink}

${t.expiry}

${t.ignore}

— ${t.signature}
  `.trim();
}

export function verifyEmailSubject(locale: Locale = "en"): string {
  return verifyContent[locale].subject;
}

// ============================================================================
// Password Reset Templates
// ============================================================================

const resetContent = {
  en: {
    subject: "Reset your password",
    preview: "You requested a password reset for your Kiniro List account.",
    greeting: (name: string | null) => (name ? `Hi ${name},` : "Hi there,"),
    intro:
      "We received a request to reset the password for your Kiniro List account associated with this email address.",
    instruction: "Click the button below to reset your password:",
    cta: "Reset Password",
    expiry: "This link will expire in 1 hour.",
    ignore:
      "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    security: "For security reasons, never share this link with anyone.",
    linkNote: "If the button doesn't work, copy and paste this link into your browser:",
    signature: "The Kiniro List Team",
  },
  es: {
    subject: "Restablecer tu contraseña",
    preview: "Solicitaste restablecer la contraseña de tu cuenta de Kiniro List.",
    greeting: (name: string | null) => (name ? `Hola ${name},` : "Hola,"),
    intro:
      "Recibimos una solicitud para restablecer la contraseña de tu cuenta de Kiniro List asociada a esta dirección de correo.",
    instruction: "Haz clic en el botón de abajo para restablecer tu contraseña:",
    cta: "Restablecer Contraseña",
    expiry: "Este enlace expirará en 1 hora.",
    ignore:
      "Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.",
    security: "Por razones de seguridad, nunca compartas este enlace con nadie.",
    linkNote: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    signature: "El Equipo de Kiniro List",
  },
};

export function passwordResetEmailHtml(data: PasswordResetEmailData): string {
  const locale = data.locale ?? "en";
  const t = resetContent[locale];

  const body = `
    <h2>${t.greeting(data.displayName)}</h2>
    <p>${t.intro}</p>
    <p>${t.instruction}</p>
    <a href="${data.resetLink}" class="btn">${t.cta}</a>
    <p style="color: #71717a; font-size: 14px;">${t.expiry}</p>
    <p style="color: #71717a; font-size: 14px;">${t.ignore}</p>
    <p style="color: #ef4444; font-size: 14px; font-weight: 500;">${t.security}</p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    <p style="color: #a1a1aa; font-size: 12px;">
      ${t.linkNote}<br>
      <a href="${data.resetLink}" style="color: #EAB308; word-break: break-all;">${data.resetLink}</a>
    </p>
    <p>— ${t.signature}</p>
  `;

  return baseLayout(body, t.preview, locale);
}

export function passwordResetEmailText(data: PasswordResetEmailData): string {
  const t = resetContent[data.locale ?? "en"];

  return `
${t.greeting(data.displayName)}

${t.intro}

${t.instruction}

${t.cta}: ${data.resetLink}

${t.expiry}

${t.ignore}

${t.security}

— ${t.signature}
  `.trim();
}

export function passwordResetEmailSubject(locale: Locale = "en"): string {
  return resetContent[locale].subject;
}
