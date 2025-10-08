// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Agrega aquí la configuración de tu proyecto de Firebase.
// Ve a tu proyecto en la consola de Firebase -> Configuración del Proyecto (el ícono del engranaje)
// En la pestaña "General", desplázate hacia abajo hasta "Tus apps".
// Selecciona la app web y encontrarás tu objeto de configuración de Firebase.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
