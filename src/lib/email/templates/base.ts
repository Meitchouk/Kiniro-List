/**
 * Email template types and base layout.
 * All email templates extend BaseEmailData and use the base HTML wrapper.
 */

export type Locale = "en" | "es";

export interface BaseEmailData {
  locale?: Locale;
}

export interface WelcomeEmailData extends BaseEmailData {
  displayName: string | null;
  email: string;
}

export interface NotificationEmailData extends BaseEmailData {
  displayName: string | null;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

const footerContent = {
  en: {
    help: "Need help or have feedback? We're here for you.",
    contact: "Contact us at",
    rights: "All rights reserved.",
  },
  es: {
    help: "¿Necesitas ayuda o tienes comentarios? Estamos aquí para ti.",
    contact: "Contáctanos en",
    rights: "Todos los derechos reservados.",
  },
};

/**
 * Base HTML wrapper for all email templates.
 * Provides consistent styling and branding.
 */
export function baseLayout(
  content: string,
  previewText: string = "",
  locale: Locale = "en"
): string {
  const footer = footerContent[locale] || footerContent.en;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Kiniro List</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    /* Base */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background: linear-gradient(135deg, #EAB308 0%, #CA8A04 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 40px;
    }
    .email-body h2 {
      margin: 0 0 16px;
      color: #18181b;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body p {
      margin: 0 0 16px;
      color: #3f3f46;
      font-size: 16px;
      line-height: 1.6;
    }
    .email-body p:last-child {
      margin-bottom: 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #EAB308 0%, #CA8A04 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      margin: 24px 0;
    }
    .email-footer {
      padding: 24px 40px;
      background-color: #fafafa;
      text-align: center;
      border-top: 1px solid #e4e4e7;
    }
    .email-footer p {
      margin: 0;
      color: #71717a;
      font-size: 14px;
    }
    .email-footer a {
      color: #EAB308;
      text-decoration: none;
    }
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-wrapper {
        background-color: #18181b !important;
      }
      .email-container {
        background-color: #27272a !important;
      }
      .email-body h2 {
        color: #fafafa !important;
      }
      .email-body p {
        color: #a1a1aa !important;
      }
      .email-footer {
        background-color: #1f1f23 !important;
        border-top-color: #3f3f46 !important;
      }
      .email-footer p {
        color: #71717a !important;
      }
    }
    /* Mobile */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .email-header, .email-body, .email-footer {
        padding: 24px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preview text -->
  <div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Kiniro List</h1>
      </div>
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p>
          <a href="https://kinirolist.app">kinirolist.app</a>
        </p>
        <p style="margin-top: 16px; font-size: 13px; color: #52525b;">
          ${footer.help}<br>
          ${footer.contact} <a href="mailto:admin@kinirolist.app">admin@kinirolist.app</a>
        </p>
        <p style="margin-top: 16px; font-size: 12px;">
          © ${new Date().getFullYear()} Kiniro List. ${footer.rights}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}
