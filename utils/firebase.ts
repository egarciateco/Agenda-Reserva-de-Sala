// Import types for TypeScript, but don't import runtime code.
import type firebaseNs from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Cast the global window object to access firebase.
// This is necessary because we are loading Firebase via a script tag, not as a module.
const firebase = (window as any).firebase as typeof firebaseNs;

if (!firebase) {
    throw new Error("Firebase SDK not loaded. Make sure the script tags are in your index.html.");
}

// La configuración de Firebase ahora se construye a partir de variables de entorno.
// Estas variables deben estar configuradas en el entorno de despliegue para que la app se conecte a Firebase.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Se verifica que la configuración sea válida antes de inicializar para evitar errores.
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error("La configuración de Firebase está incompleta. Asegúrate de que todas las variables de entorno FIREBASE_* estén definidas.");
    // Esto evita que la app intente inicializarse con una configuración vacía.
} else {
    // Inicializa Firebase solo si no ha sido inicializado
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
}


// Exporta los servicios de Firebase para ser usados en toda la aplicación
export const auth = firebase.auth();
export const db = firebase.firestore();

// Exporta el tipo de usuario de Firebase para consistencia
// El tipo correcto con la librería de compatibilidad es `firebase.User`.
export type FirebaseUser = firebaseNs.User;