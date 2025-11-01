// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ✅ Your Firebase Config (never expose private keys here, this is safe for client SDK)
const firebaseConfig = {
  apiKey: "AIzaSyD1OuTwPyfK3_leEeVmNb39lRZ9FStEU",
  authDomain: "post-automation-228fd.firebaseapp.com",
  projectId: "post-automation-228fd",
  storageBucket: "post-automation-228fd.appspot.com",
  messagingSenderId: "1076363975972",
  appId: "1:1076363975972:web:bdf87cbb26024e05bb27b1",
  measurementId: "G-ZD6V0JMB62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Use client SDK, not admin
const db = getFirestore(app);
const auth = getAuth(app);
auth.languageCode = "en";
const provider = new GoogleAuthProvider();

export { app, db, auth, provider };
