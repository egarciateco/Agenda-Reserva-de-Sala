import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Se crea una variable para la instancia de la app de Firebase.
let app: firebase.app.App;

// Se verifica que la configuración sea válida antes de inicializar.
// Si no es válida, se lanza un error para detener la ejecución inmediatamente.
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    // Este error detendrá la ejecución del script y será visible en la consola.
    throw new Error("La configuración de Firebase está incompleta. Asegúrate de que todas las variables de entorno FIREBASE_* estén definidas.");
}

// Inicializa Firebase solo si no ha sido inicializado.
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app(); // Obtiene la instancia de la app por defecto si ya existe.
}

// Exporta los servicios de Firebase para ser usados en toda la aplicación.
// Ahora estamos seguros de que 'app' está inicializada.
export const auth = app.auth();
export const db = app.firestore();

// Exporta el tipo de usuario de Firebase para consistencia.
// El tipo correcto con la librería de compatibilidad es `firebase.User`.
export type FirebaseUser = firebase.User;
