// This file tells TypeScript that we expect to have these environment variables defined.
// It helps prevent type errors when accessing process.env.
// FIX: Replaced `declare var process` with a global augmentation of `NodeJS.ProcessEnv`
// to avoid redeclaring the `process` variable, which conflicts with existing
// type definitions from Node.js. Added `export {}` to ensure the file is treated as a module.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      EMAILJS_SERVICE_ID: string;
      EMAILJS_TEMPLATE_ID: string;
      EMAILJS_PUBLIC_KEY: string;
      // Firebase Environment Variables
      FIREBASE_API_KEY: string;
      FIREBASE_AUTH_DOMAIN: string;
      FIREBASE_PROJECT_ID: string;
      FIREBASE_STORAGE_BUCKET: string;
      FIREBASE_MESSAGING_SENDER_ID: string;
      FIREBASE_APP_ID: string;
    }
  }
}

export {};