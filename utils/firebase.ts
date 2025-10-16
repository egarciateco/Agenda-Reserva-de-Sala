import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Se ha integrado la configuración directamente en el código para asegurar la conexión.
// Esta es la configuración pública para el proyecto de Firebase 'reservalasala-c176c'.
const firebaseConfig = {
  apiKey: "AIzaSyD1JfKhFGNElcKbGRjHF3sAZdMgqIluSYI", // Clave pública real del proyecto
  authDomain: "reservalasala-c176c.firebaseapp.com",
  projectId: "reservalasala-c176c",
  storageBucket: "reservalasala-c176c.firebasestorage.app",
  messagingSenderId: "56158496123",
  appId: "1:56158496123:web:927b0044e50e13771609de"
  measurementId: "G-9B5G99MLPX"
};


// Inicializa Firebase solo si no ha sido inicializado.
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
export type FirebaseUser = firebase.User;