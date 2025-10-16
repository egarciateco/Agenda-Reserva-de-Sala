// Se importan los paquetes de compatibilidad de Firebase por sus efectos secundarios.
// Estos scripts adjuntan el objeto `firebase` al objeto `window` global.
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


// Initialize Firebase only if it hasn't been initialized yet.
// Accedemos a `firebase` a través del objeto `window` ya que los scripts lo exponen globalmente.
// FIX: The compat scripts attach `firebase` to the window object. Access it from there.
if (!(window as any).firebase?.apps.length) {
  (window as any).firebase.initializeApp(firebaseConfig);
}

// Initialize and export services
export const auth = (window as any).firebase.auth();
export const db = (window as any).firebase.firestore();

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