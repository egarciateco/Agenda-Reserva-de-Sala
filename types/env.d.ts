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
    }
  }
}

export {};