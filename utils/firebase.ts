// Corrected import from `* as firebase` to default import `firebase` for compat library.
// FIX: Corrected Firebase compat import from a namespace import (`* as firebase`) to a default import (`firebase`) to resolve errors with initialization and service access.
// FIX: The firebase/compat/app module is designed to be imported as a default export. Using `import * as firebase` treats it as a module namespace, which doesn't contain the expected properties like `initializeApp` and service accessors like `auth`. The correct import is `import firebase from 'firebase/compat/app'`.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

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

// Enable offline persistence for a robust PWA experience.
db.enablePersistence()
  .catch((err: any) => {
    if (err.code === 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // The browser does not support all of the features required.
      console.warn('Firestore persistence not available in this browser.');
    } else {
      console.error('An unknown error occurred during Firestore persistence setup:', String(err));
    }
  });