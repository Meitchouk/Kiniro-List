/**
 * Quick script to check user notification settings
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

if (getApps().length === 0) {
  initializeApp({
    credential: cert(
      path.join(process.cwd(), "firebase", "kiniro-list-firebase-adminsdk-fbsvc-a334e98fda.json")
    ),
  });
}

const db = getFirestore();

async function check() {
  const users = await db.collection("users").get();
  console.log("Total users:", users.size);

  for (const doc of users.docs) {
    const data = doc.data();
    console.log("---");
    console.log("Email:", data.email);
    console.log("Notifications:", JSON.stringify(data.notifications));
    console.log("Timezone:", data.timezone);
  }
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
