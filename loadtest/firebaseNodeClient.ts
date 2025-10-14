import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Check for required environment variables
const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
for (const key of requiredKeys) {
    if (!firebaseConfig[key]) {
        throw new Error(`Missing required environment variable for Firebase config: ${key.replace('VITE_', '')}`);
    }
}

// Initialize Firebase for Node.js environment
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export default app;
