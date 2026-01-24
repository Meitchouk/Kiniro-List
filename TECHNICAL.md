# Kiniro List - Technical Documentation

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Design System](#design-system)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [API Endpoints](#api-endpoints)
7. [Caching Strategy](#caching-strategy)
8. [Architecture](#architecture)
9. [Logging and Observability](#logging-and-observability)
10. [Email and Cron Jobs](#email-and-cron-jobs)
11. [Deployment to Vercel](#deployment-to-vercel)
12. [Development Commands](#development-commands)
13. [Troubleshooting](#troubleshooting)
14. [Performance Optimization](#performance-optimization)
15. [Security](#security)
16. [Contributing](#contributing)
17. [License](#license)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: TailwindCSS v4 + shadcn/ui + Radix UI + lucide-react
- **Data Fetching**: @tanstack/react-query
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **Date/Time**: luxon
- **Theming**: next-themes
- **i18n**: next-intl
- **UI Feedback**: sonner
- **Analytics**: Vercel Analytics + Speed Insights

### Backend
- **Framework**: Next.js Route Handlers (App Router API)
- **Authentication**: Firebase Authentication (Google, email/password)
- **Database**: Firebase Firestore
- **Rate Limiting & Metrics**: Upstash Redis + @upstash/ratelimit
- **Email**: ZeptoMail API (transactional and digest emails)
- **Logging**: Pino-based logging to Firestore (server) + client error reporting

### External APIs
- **AniList GraphQL API**: Anime data source (server-side only)
- **Google Identity Services**: One Tap sign-in (client-side)

---

## Project Structure

```
kiniro-list/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── api/                      # API route handlers
│   │   │   ├── admin/                # Admin-only endpoints
│   │   │   │   ├── feedback/route.ts
│   │   │   │   └── users/route.ts
│   │   │   ├── alive/route.ts        # Liveness probe
│   │   │   ├── anime/                # Anime endpoints
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── browse/route.ts
│   │   │   │   ├── popular/route.ts
│   │   │   │   ├── search/route.ts
│   │   │   │   └── trending/route.ts
│   │   │   ├── auth/                 # Auth email endpoints
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   └── send-verification/route.ts
│   │   │   ├── calendar/             # Season endpoints
│   │   │   │   ├── now/route.ts
│   │   │   │   ├── upcoming/route.ts
│   │   │   │   └── season/route.ts
│   │   │   ├── cron/                 # Scheduled jobs
│   │   │   │   ├── daily-digest/route.ts
│   │   │   │   └── refresh-trending/route.ts
│   │   │   ├── email/                # Email utilities
│   │   │   │   ├── send/route.ts
│   │   │   │   └── preview-digest/route.ts
│   │   │   ├── feedback/route.ts     # User feedback
│   │   │   ├── health/route.ts       # Health checks
│   │   │   ├── me/                   # Authenticated user endpoints
│   │   │   │   ├── calendar/route.ts
│   │   │   │   ├── library/route.ts
│   │   │   │   ├── notifications/route.ts
│   │   │   │   ├── settings/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── schedule/weekly/route.ts
│   │   │   ├── search/top/route.ts   # Top search queries
│   │   │   └── system-logs/          # Logging endpoints
│   │   │       ├── route.ts
│   │   │       ├── client-errors/route.ts
│   │   │       ├── report/route.ts
│   │   │       └── stats/route.ts
│   │   ├── admin-panel/              # Admin UI
│   │   ├── anime/[slug]/             # Anime detail page
│   │   ├── auth/                     # Auth completion routes
│   │   ├── calendar/                 # Calendar pages
│   │   ├── feedback/                 # Feedback UI
│   │   ├── me/                       # Authenticated user pages
│   │   ├── privacy/                  # Privacy policy
│   │   ├── schedule/                 # Schedule pages
│   │   ├── search/                   # Search UI
│   │   ├── terms/                    # Terms of service
│   │   ├── styles/globals.css        # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── components/
│   │   ├── anime/                    # Anime UI components
│   │   ├── auth/                     # Auth UI components
│   │   ├── common/                   # Shared UI utilities
│   │   ├── ds/                       # Design system
│   │   ├── layout/                   # Layout components
│   │   ├── providers/                # Context providers
│   │   ├── seo/                      # SEO components
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── anilist/                  # AniList client
│   │   ├── api/                      # Client API helpers
│   │   ├── auth/                     # Auth helpers
│   │   ├── config/                   # Environment config
│   │   ├── email/                    # Email templates/services
│   │   ├── firebase/                 # Firebase admin/client
│   │   ├── firestore/                # Firestore caching
│   │   ├── i18n/                     # Internationalization utils
│   │   ├── logging/                  # Logging utilities
│   │   ├── redis/                    # Redis cache/ratelimit/metrics
│   │   ├── seo/                      # SEO helpers
│   │   ├── types/                    # Shared types
│   │   ├── utils/                    # Utilities
│   │   └── validation/               # Zod schemas
│   ├── messages/                     # Translations
│   └── middleware.ts                 # Locale middleware
├── scripts/                          # Env helpers
├── public/                           # Static assets
├── firestore.rules                   # Firestore security rules
├── next.config.ts                    # Next.js config
├── tailwind.config.ts
├── package.json
├── TECHNICAL.md
└── .env.example
```

---

## Design System

The project includes a centralized Design System located at `src/components/ds/`. It provides reusable, accessible components and design tokens to ensure visual consistency across the application.

### Structure

```
src/components/ds/
├── index.ts                    # Main barrel export
├── foundations/
│   ├── index.ts
│   └── tokens.ts               # Design tokens (colors, spacing, typography)
├── atoms/                      # Basic building blocks
│   ├── Box.tsx                 # Layout primitives (Box, Flex, Stack, Center, Container)
│   ├── Divider.tsx             # Horizontal/vertical dividers
│   ├── Grid.tsx                # Responsive grid layouts
│   ├── IconWrapper.tsx         # Icon sizing and accessibility
│   ├── Spacer.tsx              # Fixed-size spacing element
│   ├── TextArea.tsx            # Multi-line text input
│   ├── TextField.tsx           # Enhanced input with label/error states
│   ├── Typography.tsx          # Text component with variants
│   └── index.ts
├── molecules/                  # Composed components
│   ├── Alert.tsx               # Feedback alerts
│   ├── EmptyState.tsx          # Empty/no-results states
│   ├── FormField.tsx           # Form field wrapper
│   ├── InfoLabel.tsx           # Inline metadata labels
│   ├── PosterCard.tsx          # Poster card presentation
│   ├── Progress.tsx            # Progress bar
│   ├── Spinner.tsx             # Loading indicators
│   ├── Tooltip.tsx             # Tooltip wrapper
│   └── index.ts
└── organisms/                  # Complex components
    ├── Carousel.tsx            # Horizontal scroll carousel
    ├── PageHeader.tsx          # Page header with back navigation
    ├── PageLayout.tsx          # Layout wrapper
    ├── Section.tsx             # Page section with title/subtitle
    └── index.ts
```

### Importing Components

```tsx
// Import specific components
import { Typography, Button, TextField, Card, Box, IconWrapper } from "@/components/ds";

// Import tokens for programmatic access
import { colors, spacing, typography } from "@/components/ds/foundations";
```

### Theme Integration

The DS uses CSS variables defined in `globals.css`. Theme switching (light/dark) is handled via `next-themes` with the `.dark` class.

### Adding New Components

1. Determine the component level (atom, molecule, organism)
2. Create the component file in the appropriate folder
3. Use CVA for variants when needed
4. Export from the folder's `index.ts`
5. Re-export from `src/components/ds/index.ts` if needed

**Conventions:**
- Use `colorScheme` instead of `color` for color variants
- Always support `className` props for custom styles
- Use `forwardRef` for all components
- Add JSDoc comments for props
- Use CSS variables via Tailwind classes (for example: `text-primary`, `bg-card`)

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Upstash account
- ZeptoMail account (for transactional email)

### 1. Clone and Install

```bash
git clone <repository-url>
cd kiniro-list
npm install
```

### 2. Firebase Setup

1. Go to Firebase Console
2. Create a new project (or use existing)
3. Enable Authentication (Google and Email/Password as needed)
4. Create Firestore Database
5. Obtain Web App config (client SDK keys)
6. Generate Admin service account JSON
7. Deploy Firestore rules

### 3. Upstash Redis Setup

1. Create a Redis database in Upstash
2. Copy REST URL and Token

### 4. ZeptoMail Setup

1. Create a ZeptoMail account and senders
2. Obtain API token
3. Define the from email and name

### 5. Environment Variables

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables)).

### 6. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Firebase app ID |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Public | Google OAuth client ID for One Tap |
| `NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY` | Public | Client-side storage encryption key |
| `NEXT_PUBLIC_BASE_URL` | Public | Base URL used for email templates and links |
| `NEXT_PUBLIC_APP_URL` | Public | App URL used in auth email action links |
| `GOOGLE_SITE_VERIFICATION` | Private | Google site verification token |
| `FIREBASE_ADMIN_PROJECT_ID` | Private | Firebase admin project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Private | Firebase admin client email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private | Firebase admin private key |
| `UPSTASH_REDIS_REST_URL` | Private | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Private | Upstash Redis token |
| `ANILIST_API` | Private | AniList GraphQL API endpoint |
| `ZEPTOMAIL_URL` | Private | ZeptoMail API URL |
| `ZEPTOMAIL_TOKEN` | Private | ZeptoMail API token |
| `ZEPTOMAIL_FROM_EMAIL` | Private | ZeptoMail sender email |
| `ZEPTOMAIL_FROM_NAME` | Private | ZeptoMail sender name |
| `CRON_SECRET` | Private | Shared secret for cron endpoints |

**Notes:**
- `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` have safe defaults but should be set per environment.
- `NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY` must be a strong, environment-specific key for production.

---

## API Endpoints

### Status and Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alive` | Lightweight liveness probe |
| GET | `/api/health` | Detailed health report |

### Public Anime Data

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/anime/search?q=&page=` | Search (20/min) | Search anime |
| GET | `/api/anime/[id]` | Anime detail (60/min) | Anime detail (includes airing info) |
| GET | `/api/anime/browse` | Search (20/min) | Browse with filters/sorting |
| GET | `/api/anime/popular` | Search (20/min) | Popular anime lists |
| GET | `/api/anime/trending` | Search (20/min) | Trending anime lists |
| GET | `/api/search/top` | Search (20/min) | Top search queries |

### Calendar and Schedule

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/calendar/now?page=` | Calendar (30/min) | Current season anime |
| GET | `/api/calendar/upcoming?page=` | Calendar (30/min) | Upcoming season anime |
| GET | `/api/calendar/season?year=&season=&page=` | Calendar (30/min) | Season by year and season |
| GET | `/api/schedule/weekly` | Calendar (30/min) | Weekly airing schedule |

### Authentication and User Data (Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get/create user profile |
| PATCH | `/api/me/settings` | Update user settings |
| GET | `/api/me/library` | Get user library |
| POST | `/api/me/library` | Add/update library entry |
| DELETE | `/api/me/library/[animeId]` | Remove library entry |
| GET | `/api/me/calendar` | Get personalized calendar |
| GET | `/api/me/notifications` | List notifications or unread count |
| PATCH | `/api/me/notifications` | Mark notifications as read |
| DELETE | `/api/me/notifications` | Cleanup old notifications |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback` | List user feedback |
| PATCH | `/api/feedback` | Reply or mark feedback as read |
| POST | `/api/auth/send-verification` | Send email verification (auth required) |
| POST | `/api/auth/reset-password` | Request password reset (no auth required) |

### Email Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send` | Send transactional emails (server-to-server) |
| POST | `/api/email/preview-digest` | Preview or send digest in development |

### Admin and System Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Admin: list users |
| PATCH | `/api/admin/users` | Admin: update user flags |
| GET | `/api/admin/feedback` | Admin: list feedback |
| PATCH | `/api/admin/feedback` | Admin: update feedback |
| GET | `/api/system-logs` | Query system logs |
| DELETE | `/api/system-logs?confirm=true` | Clear logs |
| GET | `/api/system-logs/stats` | Log statistics |
| POST | `/api/system-logs/report` | Client log report |
| POST | `/api/system-logs/client-errors` | Client error report |

### Cron (Protected by shared secret)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cron/refresh-trending` | Refresh trending cache |
| POST | `/api/cron/daily-digest` | Send daily digest emails |

---

## Caching Strategy

### Firestore Caching (Persistent)

| Data Type | TTL | Purpose |
|-----------|-----|---------|
| Anime metadata | 7 days | Canonical anime info and slug cache |
| Airing schedule | 60 minutes | Next airing episode data |
| Season cache | 30 minutes | Season anime ID lists |
| Daily airing cache | 30 minutes | Digest schedule lookups |
| Trending cache | 25 hours | Daily trending anime IDs |

### Redis Caching (Ephemeral)

- Short-lived response caching for AniList-heavy endpoints
- Redis sorted sets for trending metrics and search popularity
- Rate limiting by IP or UID

### How Caching Works

1. API routes check Redis for short-lived responses
2. If missing, AniList requests are made server-side
3. Responses are cached in Redis (short TTL) and Firestore (longer TTL where applicable)
4. Season and trending lists are cached for pagination and dashboards

---

## Architecture

### Data Flow

```
Client (Next.js App Router)
    ↓
API Routes (Next.js)
    ├─→ Redis (rate limit, cache, metrics)
    ├─→ Firestore (user data + persistent cache)
    └─→ AniList GraphQL API (external data)
```

### Authentication Flow

1. User signs in with Google or email/password via Firebase
2. Client stores the Firebase ID token securely
3. API routes verify token with Firebase Admin SDK
4. User data and library entries are stored in Firestore
5. Admin privileges are derived from user documents

### Internationalization

- Locale detection handled in middleware with cookie and Accept-Language fallback
- Messages stored in `src/messages` and loaded via `next-intl`
- Date formatting utilities in `src/lib/i18n`

---

## Logging and Observability

- Server logs are stored in Firestore using a Pino-compatible logger
- Client errors and logs are reported via `/api/system-logs/*`
- Health endpoints provide liveness and diagnostic checks
- Rate limit events are logged for monitoring

---

## Email and Cron Jobs

- Transactional emails (verification, password reset, feedback responses) are sent via ZeptoMail
- Daily digest email is generated from Firestore + AniList schedule data
- Cron endpoints are protected by a shared secret (`CRON_SECRET`)

---

## Deployment to Vercel

### 1. Push to Git

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Import the Git repository in Vercel
2. Add environment variables to the project settings
3. Deploy

### 3. Vercel Settings

- **Node.js Version**: 18.x or later
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 4. Important Notes

- Upstash Redis is required for rate limiting and metrics
- Firebase Admin SDK is required for authenticated routes
- Cron jobs should call the `/api/cron/*` endpoints with the shared secret
- Configure image domains in `next.config.ts` for AniList and Google images

---

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run lint + type check + build
npm run check

# Run formatter
npm run format

# Check formatting
npm run format:check

# Initialize env
npm run env:init

# Pull env from Firebase
npm run env:from-firebase
```

---

## Troubleshooting

### Firebase Auth Issues
- Ensure Firebase project and credentials are correct
- Verify authorized domains and OAuth settings
- Check service account keys for Admin SDK

### Email Issues
- Verify ZeptoMail token and sender configuration
- Confirm `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_URL` are correct

### Rate Limiting Issues
- Confirm Upstash Redis credentials
- Verify `x-forwarded-for` headers are present in production

### Localization Issues
- Confirm locale cookie (`NEXT_LOCALE`) is set
- Verify translation JSON files in `src/messages`

---

## Performance Optimization

1. **Image Optimization**: Uses `next/image` for anime covers
2. **Client-side Caching**: React Query caches API responses
3. **Server-side Caching**: Redis + Firestore caching layers
4. **Code Splitting**: Automatic with Next.js App Router
5. **Lazy Loading**: Non-critical components load on demand

---

## Security

- **Firebase Security Rules**: Restrict Firestore access to authenticated users
- **API Route Protection**: Validates Firebase tokens on protected endpoints
- **Rate Limiting**: Upstash Redis sliding window limits
- **Secure Storage**: Encrypted localStorage for sensitive client data
- **Cron Protection**: Shared secret on scheduled routes

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - See LICENSE file for details

---

For more information or questions, please open an issue on GitHub.
