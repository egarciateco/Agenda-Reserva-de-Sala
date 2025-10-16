// Importa los tipos de Firebase para la seguridad de tipos, pero no el código en tiempo de ejecución.
// FIX: Correctly import the type of the default export from firebase/compat/app.
import type firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Define una interfaz para el objeto global `window` para que TypeScript sepa que `firebase` existe.
declare global {
  interface Window {
    // FIX: Use the imported firebase type for the global firebase object.
    firebase: firebase;
  }
}

// Se ha integrado la configuración directamente en el código para asegurar la conexión.
// Esta es la configuración pública para el proyecto de Firebase 'reservalasala-c176c'.
const firebaseConfig = {
  apiKey: "AIzaSyD1JfKhFGNElcKbGRjHF3sAZdMgqIluSYI",
  authDomain: "reservalasala-c176c.firebaseapp.com",
  projectId: "reservalasala-c176c",
  storageBucket: "reservalasala-c176c.appspot.com",
  messagingSenderId: "56158496123",
  appId: "1:56158496123:web:927b0044e50e13771609de",
  measurementId: "G-9B5G99MLPX"
};

// Accede a Firebase a través del objeto global `window`.
const firebase = window.firebase;

// Comprueba si el objeto firebase está disponible. Si no lo está, la carga del script falló.
if (!firebase) {
  throw new Error("El SDK de Firebase no se ha cargado. Por favor, comprueba tu conexión a internet y la configuración del script.");
}

// Inicializa Firebase solo si no ha sido inicializado.
// FIX: Use the 'firebase' type, which correctly includes the 'app' namespace and 'App' type.
let app: firebase.app.App;

if (!firebase.apps.length) {
  try {
    app = firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Error al inicializar Firebase:", e);
    throw e;
  }
} else {
  app = firebase.app(); // Obtiene la instancia de la app por defecto si ya existe.
}

// Exporta los servicios de Firebase para ser usados en toda la aplicación.
export const auth = app.auth();
export const db = app.firestore();

// Exporta el tipo de usuario de Firebase para consistencia.
// El tipo correcto con la librería de compatibilidad es `firebase.User`.
// FIX: The 'User' type is available on the 'firebase' type namespace.
export type FirebaseUser = firebase.User;