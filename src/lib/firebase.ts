import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBst5SczNGD6UQ5PEy_qczOLfTjQJNhVBM",
  authDomain: "mygeniusprofile.firebaseapp.com",
  projectId: "mygeniusprofile",
  storageBucket: "mygeniusprofile.firebasestorage.app",
  messagingSenderId: "1082167301175",
  appId: "1:1082167301175:web:30084a18c2a8db836cdbb2",
  measurementId: "G-2TWMH4VD0T"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth }; 