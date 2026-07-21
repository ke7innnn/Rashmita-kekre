import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAYOQJkqOa8pzNRe2Ctnv7trEO8Z0StGSw",
  authDomain: "health360-c1a4a.firebaseapp.com",
  projectId: "health360-c1a4a",
  storageBucket: "health360-c1a4a.firebasestorage.app",
  messagingSenderId: "834198478141",
  appId: "1:834198478141:web:759de0efe0ae1b6af0b954",
  measurementId: "G-07E4VB4KHX"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
