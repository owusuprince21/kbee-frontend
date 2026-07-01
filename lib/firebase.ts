// src/lib/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function configurePrivateAuthPersistence() {
  await setPersistence(auth, inMemoryPersistence);
}

export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;

  const clearKeys = (storage: Storage, includeFirebaseAuthKeys = false) => {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (!key) continue;
      if (
        key === "auth-storage" ||
        key === "authToken" ||
        (includeFirebaseAuthKeys && (
          key.startsWith("firebase:authUser:") ||
          key.startsWith("firebase:redirectUser:")
        ))
      ) {
        storage.removeItem(key);
      }
    }
  };

  try { clearKeys(window.localStorage, true); } catch {}
  try { clearKeys(window.sessionStorage, true); } catch {}
}

export function toSafeUser(firebaseUser: FirebaseUser) {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
  };
}

export { auth, provider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile };
