
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "agrous-iq0pb",
  "appId": "1:1073025714869:web:d65919dfe0b7c097378cfc",
  "storageBucket": "agrous-iq0pb.appspot.com",
  "apiKey": "AIzaSyBjD03BV3-ERs7OXmt50SpkjlN54OGlJ2I",
  "authDomain": "agrous-iq0pb.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1073025714869"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;


export { app, firestore, storage, auth, messaging };

    