// This file safely initializes Firebase using the global object provided by the CDN scripts.
// This avoids ES module import issues that can occur in certain environments.
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
// FIX: Import the firebase namespace type to correctly type the global firebase object.
import type firebaseNamespace from 'firebase/compat/app';

// Assert that the global firebase object is available.
const firebase = (window as any).firebase as typeof firebaseNamespace;
if (!firebase) {
  throw new Error("Firebase is not loaded. Check the script tags in index.html.");
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1JfKhFGNElcKbGRjHF3sAZdMgqIluSYI",
  authDomain: "reservalasala-c176c.firebaseapp.com",
  projectId: "reservalasala-c176c",
  storageBucket: "reservalasala-c176c.appspot.com",
  messagingSenderId: "56158496123",
  appId: "1:56158496123:web:927b0044e50e13771609de",
};

// Initialize Firebase only if it hasn't been initialized yet.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize and export services
export const auth = firebase.auth();
export const db = firebase.firestore();

// Type export for use in other files
export type FirebaseUser = firebase.User;

// Enable offline persistence for a robust PWA experience.
db.enablePersistence()
  .catch((err: any) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser.');
    } else {
      console.error('An unknown error occurred during Firestore persistence setup:', String(err));
    }
  });