# Kiniro List

An anime calendar + personal tracker app built with Next.js, TailwindCSS, and Firebase.

## Features

- 📺 **Public Browsing**: Browse current season, upcoming season, any season by year, and weekly schedule
- 🔍 **Search**: Search anime from AniList database
- 📝 **Anime Details**: View detailed information about any anime
- 🔐 **Google Login**: Secure authentication with Firebase Auth
- 📚 **Personal Library**: Track anime with status (watching/planned/completed/paused/dropped)
- 📅 **Personal Calendar**: See when your anime episodes air
- ⚙️ **User Preferences**: Customize timezone, language (EN/ES), theme (light/dark/system)
- 🌍 **i18n**: Full internationalization support (English and Spanish)
- 🎨 **Theming**: Light/Dark/System theme support
- ⚡ **Performance**: Smart caching with Firestore + rate limiting with Upstash Redis

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui + lucide-react
- **Data Fetching**: @tanstack/react-query
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **Date/Time**: luxon
- **Auth**: Firebase Authentication (Google)
- **Database**: Firebase Firestore
- **Data Source**: AniList GraphQL API (server-only)
- **Rate Limiting**: Upstash Redis + @upstash/ratelimit
- **Theming**: next-themes
- **i18n**: next-intl

## Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account
- Upstash account

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd kiniro-list
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Google provider
4. **Create Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Choose a location close to your users
5. **Get Web App Config**:
   - Go to Project Settings > General > Your apps
   - Click "Add app" > Web
   - Register app and copy the config values
6. **Generate Admin Service Account**:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely
7. **Deploy Firestore Rules**:
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Init: `firebase init firestore`
   - Deploy: `firebase deploy --only firestore:rules`

### 3. Upstash Redis Setup

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose a region close to your Vercel deployment region
4. Copy the REST URL and Token from the dashboard

### 4. Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (server-only)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

> **Note**: For `FIREBASE_ADMIN_PRIVATE_KEY`, copy the entire private_key value from the service account JSON, including the `\n` characters. Wrap in quotes.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to Git

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your Git repository
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Deploy

### 3. Important Vercel Settings

- **Node.js Version**: 18.x or later
- **Framework Preset**: Next.js (auto-detected)

### 4. Vercel Runtime Notes

- Rate limiting uses Upstash Redis which works in Vercel's serverless environment
- Firebase Admin SDK is only used in API routes (server-side)
- IP extraction uses `x-forwarded-for` header which Vercel provides

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API Route handlers
│   │   ├── anime/            # Anime endpoints
│   │   ├── calendar/         # Calendar endpoints  
│   │   ├── me/               # Protected user endpoints
│   │   └── schedule/         # Schedule endpoints
│   ├── anime/[id]/           # Anime detail page
│   ├── calendar/             # Calendar pages
│   ├── me/                   # Protected user pages
│   ├── schedule/             # Schedule pages
│   ├── search/               # Search page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── anime/                # Anime-related components
│   ├── layout/               # Layout components (Header, Footer)
│   ├── providers/            # Context providers
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── anilist/              # AniList GraphQL client
│   ├── auth/                 # Auth utilities
│   ├── firebase/             # Firebase client/admin
│   ├── firestore/            # Firestore cache helpers
│   ├── i18n/                 # i18n configuration
│   ├── utils/                # Utility functions
│   ├── api.ts                # Client API wrapper
│   ├── ip.ts                 # IP extraction
│   ├── ratelimit.ts          # Rate limiting
│   ├── schemas.ts            # Zod schemas
│   └── types.ts              # TypeScript types
├── messages/
│   ├── en.json               # English translations
│   └── es.json               # Spanish translations
├── middleware.ts             # next-intl middleware
└── firestore.rules           # Firestore security rules
```

## API Endpoints

### Public

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/anime/search?q=&page=` | 20/min | Search anime |
| GET | `/api/anime/[id]` | 60/min | Get anime detail |
| GET | `/api/calendar/now?page=` | 30/min | Current season |
| GET | `/api/calendar/upcoming?page=` | 30/min | Upcoming season |
| GET | `/api/calendar/season?year=&season=&page=` | 30/min | Season by year |
| GET | `/api/schedule/weekly` | 30/min | Weekly schedule |

### Protected (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get/create user profile |
| PATCH | `/api/me/settings` | Update user settings |
| GET | `/api/me/library` | Get user library |
| POST | `/api/me/library` | Add/update library entry |
| DELETE | `/api/me/library/[animeId]` | Remove library entry |
| GET | `/api/me/calendar` | Get personalized calendar |

## Caching Policy

- **Anime metadata**: Cached in Firestore for 7 days
- **Airing information**: Cached in Firestore for 60 minutes
- **AniList calls**: Minimized through shared Firestore cache and batch queries

## License

MIT

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
