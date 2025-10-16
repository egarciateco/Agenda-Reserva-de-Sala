import type firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Assert the global firebase object from the script tag has the correct type.
const firebaseApp = (window as any).firebase as typeof firebase;

if (!firebaseApp) {
  throw new Error("Firebase SDK not loaded. Please check the script tags in index.html.");
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
if (!firebaseApp.apps.length) {
  firebaseApp.initializeApp(firebaseConfig);
}

// Initialize and export services
export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();

// Type export for use in other files.
// The User type is available on the root firebase namespace in the compat library.
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