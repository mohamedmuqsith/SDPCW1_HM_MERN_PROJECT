import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project config
// You get this from Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
    apiKey: "AIzaSyBrThZ6bJrqwBS12zuRkVqpqFGXCzJYu4o",
    authDomain: "hmsdp-68573.firebaseapp.com",
    projectId: "hmsdp-68573",
    storageBucket: "hmsdp-68573.firebasestorage.app",
    messagingSenderId: "834753632748",
    appId: "1:834753632748:web:f57143a11d2ef6a91788c9",
    measurementId: "G-NPVT6QRG49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services you want to use
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;