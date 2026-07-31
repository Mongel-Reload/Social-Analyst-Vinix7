// Firebase Configuration
// Ganti dengan konfigurasi Firebase project Anda
// Dapatkan dari Firebase Console → Project Settings → General → Your apps
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLAwEwt1LWDRt1MP15xlDdv0IuW-T0O-c",
  authDomain: "kokorolens-c5c38.firebaseapp.com",
  projectId: "kokorolens-c5c38",
  storageBucket: "kokorolens-c5c38.firebasestorage.app",
  messagingSenderId: "88410362460",
  appId: "1:88410362460:web:8cee43cc1a27e8cf384c99",
  measurementId: "G-YTFW04TB7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export auth instance
const auth = firebase.auth();
