// Generates a .env.local template if it does not already exist.
// Does not overwrite an existing file to avoid losing secrets.

import fs from "fs";
import path from "path";

const envPath = path.join(__dirname, "..", ".env.local");

if (fs.existsSync(envPath)) {
    console.log(".env.local already exists. Skipping creation.");
    process.exit(0);
}

const template = `# ===========================================
# KINIRO LIST - Environment Variables
# ===========================================

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin SDK (keep private)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
`;

fs.writeFileSync(envPath, template, { encoding: "utf8", flag: "w" });
console.log("Created .env.local template. Fill in your keys.");
