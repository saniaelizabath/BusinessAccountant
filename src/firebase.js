// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // ✅ import getAuth for authentication
import { getFirestore } from "firebase/firestore";
// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDaX4XS3V_uGCEudrQJ9ysYJqKoTlqJf9w",
  authDomain: "accounts-manager-9a897.firebaseapp.com",
  projectId: "accounts-manager-9a897",
  storageBucket: "accounts-manager-9a897.firebasestorage.app",
  messagingSenderId: "232469315721",
  appId: "1:232469315721:web:065db4a9bf574bd1bf8658",
  measurementId: "G-7NLY7SXQLK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
// ✅ Initialize and export auth
export const auth = getAuth(app);
export { app, analytics, db };
