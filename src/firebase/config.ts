
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj6eEzMTAm-XBjTDMh9V1lRDM8XgUJkQU",
  authDomain: "localx-6b52f.firebaseapp.com",
  projectId: "localx-6b52f",
  storageBucket: "localx-6b52f.firebasestorage.app",
  messagingSenderId: "935862310610",
  appId: "1:935862310610:web:f8987e6781a28fcffd3f0b",
  measurementId: "G-Q0YBDX7PYY"
};

// Initialize Firebase
console.log('Initializing Firebase with config:', 
  {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    // Don't log the API key for security reasons
  }
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
