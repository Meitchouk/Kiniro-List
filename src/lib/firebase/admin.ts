import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/config";

let app: App;
let auth: Auth;
let firestore: Firestore;

function getAdminApp(): App {
  if (!app) {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp({
        credential: cert({
          projectId: firebaseAdmin.projectId,
          clientEmail: firebaseAdmin.clientEmail,
          privateKey: firebaseAdmin.privateKey,
        }),
      });
    }
  }
  return app;
}

export function getAdminAuth(): Auth {
  if (!auth) {
    auth = getAuth(getAdminApp());
  }
  return auth;
}

export function getAdminFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getAdminApp());
  }
  return firestore;
}

export { getAdminApp };
