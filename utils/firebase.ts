import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1JfKhFGNElcKbGRjHF3sAZdMgqIluSYI",
  authDomain: "reservalasala-c176c.firebaseapp.com",
  projectId: "reservalasala-c176c",
  storageBucket: "reservalasala-c176c.appspot.com",
  messagingSenderId: "56158496123",
  appId: "1:56158496123:web:927b0044e50e13771609de",
  measurementId: "G-9B5G99MLPX"
};

let app: firebase.app.App;

if (!firebase.apps.length) {
  try {
    app = firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Error al inicializar Firebase:", e);
    throw e;
  }
} else {
  app = firebase.app();
}

export const auth = app.auth();
export const db = app.firestore();

// Exporta el tipo de usuario de Firebase para consistencia.
// El tipo correcto con la librería de compatibilidad v9 es `firebase.User`.
// FIX: The type `firebase.auth.User` is incorrect. With the Firebase v9 compat library, the correct user type is `firebase.User`.
export type FirebaseUser = firebase.User;