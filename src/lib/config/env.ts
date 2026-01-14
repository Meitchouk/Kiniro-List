/**
 * Centralized environment configuration.
 * All environment variables should be accessed through this module.
 *
 * Server-side variables (no NEXT_PUBLIC_ prefix) are only available in:
 * - API routes
 * - getServerSideProps
 * - Server Components
 *
 * Client-side variables (NEXT_PUBLIC_ prefix) are available everywhere.
 */

// =============================================================================
// Server-side only environment variables
// =============================================================================

/**
 * Upstash Redis configuration for caching, rate limiting, and metrics.
 * Required for server-side operations.
 */
export const upstash = {
  get url() {
    return process.env.UPSTASH_REDIS_REST_URL ?? "";
  },
  get token() {
    return process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  },
} as const;

/**
 * Firebase Admin SDK configuration for server-side authentication.
 * Used for verifying tokens and managing users.
 */
export const firebaseAdmin = {
  get projectId() {
    return process.env.FIREBASE_ADMIN_PROJECT_ID ?? "";
  },
  get clientEmail() {
    return process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "";
  },
  get privateKey() {
    return process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
  },
} as const;

/**
 * AniList GraphQL API endpoint.
 */
export const anilist = {
  get apiUrl() {
    return process.env.ANILIST_API ?? "https://graphql.anilist.co";
  },
} as const;

/**
 * SMTP configuration for transactional emails.
 * Server-side only.
 */
export const smtp = {
  get host() {
    return process.env.SMTP_HOST ?? "";
  },
  get port() {
    const raw = process.env.SMTP_PORT ?? "";
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : 0;
  },
  get user() {
    return process.env.SMTP_USER ?? "";
  },
  get pass() {
    return process.env.SMTP_PASS ?? "";
  },
  get fromEmail() {
    return process.env.SMTP_FROM_EMAIL ?? "";
  },
  get fromName() {
    return process.env.SMTP_FROM_NAME ?? "Kiniro List";
  },
  get secure() {
    // If SMTP_SECURE is explicitly set to "true", use TLS; otherwise false
    return (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
  },
} as const;

// =============================================================================
// Client-side environment variables (NEXT_PUBLIC_)
// =============================================================================

/**
 * Firebase client configuration for authentication.
 * These values are safe to expose to the browser.
 */
export const firebaseClient = {
  get apiKey() {
    return process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
  },
  get authDomain() {
    return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  },
  get projectId() {
    return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  },
  get storageBucket() {
    return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  },
  get messagingSenderId() {
    return process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "";
  },
  get appId() {
    return process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "";
  },
} as const;

/**
 * Google OAuth configuration for One Tap sign-in.
 */
export const googleOAuth = {
  get clientId() {
    return process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? "";
  },
} as const;

// =============================================================================
// Validation helpers
// =============================================================================

/**
 * Check if Upstash Redis is configured.
 */
export function isUpstashConfigured(): boolean {
  return Boolean(upstash.url && upstash.token);
}

/**
 * Check if Firebase Admin is configured.
 */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(firebaseAdmin.projectId && firebaseAdmin.clientEmail && firebaseAdmin.privateKey);
}

/**
 * Check if Firebase Client is configured.
 */
export function isFirebaseClientConfigured(): boolean {
  return Boolean(firebaseClient.apiKey && firebaseClient.projectId);
}

/**
 * Check if Google OAuth is configured.
 */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(googleOAuth.clientId);
}

/**
 * Check if SMTP is configured.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(smtp.host && smtp.port && smtp.user && smtp.pass && smtp.fromEmail);
}
