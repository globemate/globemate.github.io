import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjJY9vQzxFQy26jPYtP2P1LFpg7QODafM",
  authDomain: "globemate-85c6b.firebaseapp.com",
  projectId: "globemate-85c6b",
  storageBucket: "globemate-85c6b.firebasestorage.app",
  messagingSenderId: "869913391747",
  appId: "1:869913391747:web:716bfa11289b89712461b6",
  measurementId: "G-6C943CECCQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);