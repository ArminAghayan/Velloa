// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFunctions } from 'firebase/functions'; // Import getFunctions
import { getStorage } from 'firebase/storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyByE1qCee2wH_VcutDtanom-B-l7Fzvlvs",
  authDomain: "velloa-2024.firebaseapp.com",
  projectId: "velloa-2024",
  storageBucket: "velloa-2024.appspot.com",
  messagingSenderId: "181979940341",
  appId: "1:181979940341:web:08e233d9ff4a1457834cbc",
  measurementId: "G-L90VJ7YTYM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize auth
const functions = getFunctions(app); // Initialize Cloud Functions
const storage = getStorage(app);

firebase.initializeApp(firebaseConfig);

export { db, auth, analytics, app, functions,storage, createUserWithEmailAndPassword, addDoc, collection };
export default firebase;
