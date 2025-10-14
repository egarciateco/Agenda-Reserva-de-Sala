// FIX: The firebase compat scripts are UMD modules that attach `firebase` to the global scope.
// Import them for their side-effects only.
import "firebase/compat/app";
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

// FIX: Access the firebase object from the window, where the UMD script places it.
// Need to assert the type to avoid TypeScript errors.
const firebaseApp = (window as any).firebase;

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);

// Initialize and export services
export const auth = firebaseApp.auth();
export const db = firebaseApp.firestore();

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