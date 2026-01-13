import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { firebaseClient } from "@/lib/config";

const firebaseConfig = {
  apiKey: firebaseClient.apiKey,
  authDomain: firebaseClient.authDomain,
  projectId: firebaseClient.projectId,
  storageBucket: firebaseClient.storageBucket,
  messagingSenderId: firebaseClient.messagingSenderId,
  appId: firebaseClient.appId,
};

let app: FirebaseApp;
let auth: Auth;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const apps = getApps();
    app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export { getFirebaseApp };
