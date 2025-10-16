// FIX: The original import `import type * as firebaseNs from 'firebase/compat/app'` was incorrect
// for obtaining the types of the Firebase compat library, as it doesn't correctly resolve the default export.
// The correct approach is to import the `firebase` object itself, which provides both the runtime logic (if bundled)
// and, crucially, all the necessary type definitions. This allows us to correctly cast the global `firebase`
// object loaded from the script tag.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Hacemos referencia al objeto global de Firebase cargado a través de las etiquetas <script> en index.html.
// Esto evita los conflictos de importación de módulos.
const firebaseApp = (window as any).firebase as typeof firebase;

if (!firebaseApp) {
  throw new Error("El SDK de Firebase no se ha cargado. Por favor, revisa las etiquetas <script> en tu index.html.");
}

const firebaseConfig = {
  apiKey: "AIzaSyD1JfKhFGNElcKbGRjHF3sAZdMgqIluSYI",
  authDomain: "reservalasala-c176c.firebaseapp.com",
  projectId: "reservalasala-c176c",
  storageBucket: "reservalasala-c176c.appspot.com",
  messagingSenderId: "56158496123",
  appId: "1:56158496123:web:927b0044e50e13771609de",
  measurementId: "G-9B5G99MLPX"
};
  
// FIX: The `firebase.app.App` type is correctly resolved from the `firebase` import.
let app: firebase.app.App;

// FIX: Use the correctly typed `firebaseApp` global variable.
if (!firebaseApp.apps.length) {
  try {
    app = firebaseApp.initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Error al inicializar Firebase:", e);
    throw e;
  }
} else {
  app = firebaseApp.app();
}

export const auth = app.auth();
export const db = app.firestore();

// Exporta el tipo de usuario de Firebase para consistencia.
// El tipo correcto con la librería de compatibilidad es `firebase.User`.
// FIX: The `firebase.User` type is now correctly resolved from the import,
// which is augmented by `firebase/compat/auth`.
export type FirebaseUser = firebase.User;
