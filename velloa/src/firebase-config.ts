// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByE1qCee2wH_VcutDtanom-B-l7Fzvlvs",
  authDomain: "velloa-2024.firebaseapp.com",
  projectId: "velloa-2024",
  storageBucket: "velloa-2024.appspot.com",
  messagingSenderId: "181979940341",
  appId: "1:181979940341:web:08e233d9ff4a1457834cbc",
  measurementId: "G-L90VJ7YTYM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null; // Initialize analytics only on client
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, db, auth, analytics, functions, storage, createUserWithEmailAndPassword, signInWithEmailAndPassword };
