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

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui + lucide-react
- **Data Fetching**: @tanstack/react-query
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **Date/Time**: luxon
- **Theming**: next-themes
- **i18n**: next-intl

### Backend
- **Framework**: Next.js API Routes
- **Authentication**: Firebase Authentication (Google)
- **Database**: Firebase Firestore
- **Rate Limiting**: Upstash Redis + @upstash/ratelimit

### External APIs
- **AniList GraphQL API**: Anime data source (server-side only)

---

## Project Structure

```
kiniro-list/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── api/                      # API Route handlers
│   │   │   ├── anime/                # Anime endpoints
│   │   │   │   ├── [id]/route.ts     # Anime detail
│   │   │   │   └── search/route.ts   # Search anime
│   │   │   ├── calendar/             # Calendar endpoints
│   │   │   │   ├── now/route.ts      # Current season
│   │   │   │   ├── upcoming/route.ts # Next season
│   │   │   │   └── season/route.ts   # Any season
│   │   │   ├── me/                   # Protected user endpoints
│   │   │   │   ├── route.ts          # User profile
│   │   │   │   ├── calendar/route.ts # Personal calendar
│   │   │   │   ├── library/route.ts  # User library
│   │   │   │   └── settings/route.ts # User settings
│   │   │   └── schedule/             # Schedule endpoints
│   │   │       └── weekly/route.ts   # Weekly schedule
│   │   ├── anime/[id]/page.tsx       # Anime detail page
│   │   ├── calendar/                 # Calendar pages
│   │   │   ├── now/page.tsx          # Current season
│   │   │   ├── upcoming/page.tsx     # Upcoming season
│   │   │   └── season/[year]/[season]/page.tsx
│   │   ├── me/                       # Protected user pages
│   │   │   ├── layout.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── schedule/weekly/page.tsx  # Weekly schedule page
│   │   ├── search/page.tsx           # Search page
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── components/
│   │   ├── anime/                    # Anime-related components
│   │   │   ├── AnimeCard.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ...
│   │   ├── auth/                     # Auth components
│   │   │   ├── GoogleButton.tsx
│   │   │   └── GoogleOneTap.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ...
│   │   ├── providers/                # Context providers
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── QueryProvider.tsx
│   │   │   └── ...
│   │   └── ui/                       # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── anilist/
│   │   │   └── client.ts             # AniList GraphQL client
│   │   ├── auth/
│   │   │   ├── clientAuth.ts         # Client-side auth
│   │   │   └── serverAuth.ts         # Server-side auth
│   │   ├── firebase/
│   │   │   ├── admin.ts              # Firebase Admin SDK
│   │   │   └── client.ts             # Firebase Client SDK
│   │   ├── firestore/
│   │   │   └── cache.ts              # Firestore cache helpers
│   │   ├── i18n/
│   │   │   └── request.ts            # i18n configuration
│   │   ├── utils/
│   │   │   ├── date.ts               # Date utilities
│   │   │   └── text.ts               # Text utilities
│   │   ├── hooks/
│   │   │   └── useLoadingFetch.ts    # Custom hooks
│   │   ├── api.ts                    # Client API wrapper
│   │   ├── fetchInterceptor.ts       # Fetch interceptor
│   │   ├── ip.ts                     # IP extraction
│   │   ├── ratelimit.ts              # Rate limiting logic
│   │   ├── schemas.ts                # Zod validation schemas
│   │   └── types.ts                  # TypeScript types
│   ├── messages/
│   │   ├── en.json                   # English translations
│   │   └── es.json                   # Spanish translations
│   ├── styles/
│   │   └── globals.css               # Global styles
│   └── middleware.ts                 # next-intl middleware
├── firebase/
│   └── kiniro-list-firebase-adminsdk-*.json
├── public/                           # Static assets
├── scripts/
│   ├── env-from-firebase.js          # Firebase config script
│   └── env-init.js                   # Env initialization
├── firestore.rules                   # Firestore security rules
├── eslint.config.mjs
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── TECHNICAL.md
├── LICENSE
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
│   ├── index.ts
│   ├── Typography.tsx          # Text component with variants
│   ├── Box.tsx                 # Layout primitives (Box, Flex, Stack, Center, Container)
│   ├── Grid.tsx                # Responsive grid layouts
│   ├── TextField.tsx           # Enhanced input with label/error states
│   ├── TextArea.tsx            # Multi-line text input
│   ├── IconWrapper.tsx         # Icon sizing and accessibility
│   ├── Divider.tsx             # Horizontal/vertical dividers
│   └── Spacer.tsx              # Fixed-size spacing element
├── molecules/                  # Composed components
│   ├── index.ts
│   ├── Alert.tsx               # Feedback alerts (info, success, warning, error)
│   ├── Spinner.tsx             # Loading indicators and overlays
│   ├── Progress.tsx            # Progress bar with variants
│   ├── Tooltip.tsx             # Tooltip wrapper
│   ├── EmptyState.tsx          # Empty/no-results states
│   └── FormField.tsx           # Form field wrapper with validation
└── organisms/                  # Complex components
    ├── index.ts
    ├── Section.tsx             # Page section with title/subtitle
    ├── PageHeader.tsx          # Page header with back navigation
    └── PageLayout.tsx          # Full page layout wrapper
```

### Importing Components

```tsx
// Import specific components
import { Typography, Button, TextField, Card, Box, IconWrapper } from '@/components/ds';

// Import tokens for programmatic access
import { colors, spacing, typography } from '@/components/ds/foundations';
```

### Using Typography

```tsx
// Semantic headings (h1-h6)
<Typography variant="h1">Main Title</Typography>
<Typography variant="h2">Section Title</Typography>

// Body text variants
<Typography variant="body1">Regular paragraph text</Typography>
<Typography variant="body2">Smaller text</Typography>
<Typography variant="caption">Caption or helper text</Typography>

// With modifiers
<Typography variant="h3" weight="medium" align="center">
  Centered Medium Title
</Typography>

// Color variants
<Typography variant="body1" colorScheme="primary">Primary colored</Typography>
<Typography variant="body1" colorScheme="destructive">Error text</Typography>

// Truncation
<Typography variant="body1" truncate>Very long text that will be truncated...</Typography>
<Typography variant="body1" lineClamp={2}>Multi-line clamping...</Typography>
```

### Using Button

Uses shadcn/ui Button with CVA variants:

```tsx
import { Button } from '@/components/ds';

<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link Style</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Using TextField

```tsx
import { TextField } from '@/components/ds';

<TextField
  label="Email"
  placeholder="Enter your email"
  helperText="We'll never share your email"
/>

<TextField
  label="Password"
  type="password"
  errorText="Password is required"
  error
/>

// With adornments
<TextField
  label="Search"
  startAdornment={<SearchIcon className="h-4 w-4" />}
/>
```

### Using Layout Components

```tsx
import { Box, Flex, Stack, Container, Grid } from '@/components/ds';

// Basic box
<Box p={4} rounded="md" bg="card">Content</Box>

// Flexbox layouts
<Flex justify="between" align="center" gap={4}>
  <div>Left</div>
  <div>Right</div>
</Flex>

// Stack (vertical flex)
<Stack gap={4}>
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// Container with max-width
<Container maxWidth="xl" px={4}>
  Page content
</Container>

// Responsive grid
<Grid cols={1} mdCols={2} lgCols={3} gap={6}>
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</Grid>
```

### Using IconWrapper

```tsx
import { IconWrapper, Icon } from '@/components/ds';
import { Star, Heart } from 'lucide-react';

// Accessible icon with label
<IconWrapper icon={Star} size="lg" label="Favorite" />

// Decorative icon (hidden from screen readers)
<IconWrapper icon={Heart} size="md" decorative />

// Simple icon (no wrapper span)
<Icon icon={Star} size="sm" colorScheme="primary" />
```

### Using Feedback Components

```tsx
import { Alert, Spinner, Progress, EmptyState } from '@/components/ds';

// Alerts
<Alert variant="info" title="Information">
  This is an informational message.
</Alert>
<Alert variant="destructive" title="Error" dismissible>
  Something went wrong.
</Alert>

// Spinners
<Spinner size="lg" />
<LoadingOverlay visible text="Loading..." />

// Progress
<Progress value={75} showLabel />
<Progress indeterminate variant="primary" />

// Empty states
<EmptyState
  icon={InboxIcon}
  title="No results"
  description="Try adjusting your search"
  action={<Button>Clear filters</Button>}
/>
```

### Design Tokens

All design values are centralized in `src/components/ds/foundations/tokens.ts`:

```tsx
import {
  colors,         // Semantic colors (primary, background, card, etc.)
  spacing,        // Spacing scale (0, 1, 2, 4, 8, 12, 16, etc.)
  typography,     // Font families, sizes, weights, line heights
  borderRadius,   // Radius tokens (none, sm, md, lg, full)
  shadows,        // Shadow tokens (sm, md, lg, xl)
  transitions,    // Animation durations and easings
  zIndex,         // Z-index scale
  breakpoints,    // Responsive breakpoints
  iconSizes,      // Icon size tokens
} from '@/components/ds/foundations';
```

### Theme Integration

The DS uses CSS variables defined in `globals.css`. Theme switching (light/dark) is handled via `next-themes` with the `.dark` class:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 224 71.4% 4.1%;
  --primary: 220.9 39.3% 11%;
  /* ... */
}

.dark {
  --background: 224 71.4% 4.1%;
  --foreground: 210 20% 98%;
  --primary: 210 20% 98%;
  /* ... */
}
```

### Adding New Components

1. Determine the component level (atom, molecule, organism)
2. Create the component file in the appropriate folder
3. Use CVA for variants when needed
4. Export from the folder's `index.ts`
5. Re-export from the main `src/components/ds/index.ts` if needed

**Conventions:**
- Use `colorScheme` instead of `color` for color variants (to avoid conflicts with HTML attributes)
- Always support `className` prop for custom styles
- Use `forwardRef` for all components
- Add JSDoc comments for props
- Use CSS variables via Tailwind classes (e.g., `text-primary`, `bg-card`)

**Example new atom:**

```tsx
// src/components/ds/atoms/MyComponent.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const myComponentVariants = cva("base-classes", {
  variants: {
    size: {
      sm: "h-8",
      md: "h-10",
      lg: "h-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(myComponentVariants({ size }), className)}
        {...props}
      />
    );
  }
);
MyComponent.displayName = "MyComponent";

export { MyComponent, myComponentVariants };
```

Then add to exports:

```tsx
// src/components/ds/atoms/index.ts
export { MyComponent, myComponentVariants } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Upstash account

### 1. Clone and Install

```bash
git clone <repository-url>
cd kiniro-list
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. **Enable Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains
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
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules
   ```

### 3. Upstash Redis Setup

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose a region close to your deployment region
4. Copy the REST URL and Token

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

# AniList API
ANILIST_API=https://graphql.anilist.co
```

**Note**: For `FIREBASE_ADMIN_PRIVATE_KEY`, copy the entire value from the service account JSON, including the `\n` characters. Wrap in quotes.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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
| `FIREBASE_ADMIN_PROJECT_ID` | Private | Firebase admin project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Private | Firebase admin client email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private | Firebase admin private key |
| `UPSTASH_REDIS_REST_URL` | Private | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Private | Upstash Redis token |
| `ANILIST_API` | Private | AniList GraphQL API endpoint |

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| GET | `/api/anime/search?q=&page=` | 20/min | Search anime |
| GET | `/api/anime/[id]` | 60/min | Get anime detail |
| GET | `/api/calendar/now?page=` | 30/min | Current season anime |
| GET | `/api/calendar/upcoming?page=` | 30/min | Upcoming season anime |
| GET | `/api/calendar/season?year=&season=&page=` | 30/min | Season by year and season |
| GET | `/api/schedule/weekly` | 30/min | Weekly schedule |

### Protected Endpoints (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get/create user profile |
| PATCH | `/api/me/settings` | Update user settings |
| GET | `/api/me/library` | Get user library |
| POST | `/api/me/library` | Add/update library entry |
| DELETE | `/api/me/library/[animeId]` | Remove library entry |
| GET | `/api/me/calendar` | Get personalized calendar |

---

## Caching Strategy

### Firestore Caching

| Data Type | TTL | Purpose |
|-----------|-----|---------|
| Anime metadata | 7 days | Complete anime information |
| Airing schedule | 60 minutes | Episode airing information |
| Season cache | 30 minutes | Season anime IDs for pagination |

### How Caching Works

1. **First Request**: Fetches from AniList → Stores in Firestore → Returns to client
2. **Subsequent Requests**: Checks Firestore cache first → If valid, returns cached data
3. **Expired Cache**: Automatically refetches from AniList

### Pagination Strategy

For season/calendar endpoints:
1. Fetch ALL anime for the season from AniList (50 items per request)
2. Cache anime IDs in Firestore (30 min TTL)
3. Paginate locally (20 items per page)
4. Returns reliable `lastPage` and `total` counts

This ensures accurate pagination without relying on AniList's sometimes-unreliable `lastPage` value.

---

## Architecture

### Data Flow

```
Client (Next.js App Router)
    ↓
API Routes (Next.js)
    ↓
    ├─→ Firestore Cache (Check)
    │       ↓ (if valid)
    │   Return cached data
    │
    └─→ (if cache miss)
        AniList GraphQL API
            ↓
        Firestore Cache (Store)
            ↓
        Return data to client
```

### Authentication Flow

1. User clicks "Sign in with Google"
2. Firebase handles OAuth flow
3. User authenticated in Firebase Auth
4. Client stores ID token in localStorage
5. Token included in API requests (Authorization header)
6. API routes verify token with Firebase Admin SDK
7. User data stored in Firestore

### Rate Limiting

- Uses Upstash Redis to track requests per IP
- Configured per endpoint (20-60 requests per minute)
- Returns 429 status if limit exceeded
- IP extracted from `x-forwarded-for` header (Vercel friendly)

---

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
3. Add environment variables to project settings
4. Deploy

### 3. Vercel Settings

- **Node.js Version**: 18.x or later
- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 4. Important Notes

- Rate limiting uses Upstash Redis which works in serverless
- Firebase Admin SDK only used in API routes
- IP extraction uses `x-forwarded-for` header provided by Vercel
- All env vars must be added to Vercel project settings

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

# Run ESLint
npm run lint

# Type check
npm run type-check
```

---

## Troubleshooting

### Firebase Auth Issues
- Check authorized domains in Firebase Console
- Verify OAuth credentials are correct
- Clear browser cache and localStorage

### Rate Limiting Issues
- Check Upstash Redis connection
- Verify REST URL and token
- Check IP extraction is working (x-forwarded-for)

### Pagination Issues
- Verify season cache is working in Firestore
- Check AniList API response data
- Ensure paginate locally function calculates correctly

---

## Performance Optimization

1. **Next.js Image Optimization**: Uses `next/image` for anime covers
2. **Client-side Caching**: React Query caches API responses
3. **Server-side Caching**: Firestore caches anime metadata
4. **Code Splitting**: Automatic with Next.js App Router
5. **Lazy Loading**: Components loaded on demand

---

## Security

- **Firebase Security Rules**: Restricts Firestore access to authenticated users
- **API Route Protection**: Validates Firebase tokens on protected endpoints
- **Environment Variables**: Sensitive data never exposed to client
- **Rate Limiting**: Prevents abuse and DDoS
- **CORS**: Configured for API routes

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
