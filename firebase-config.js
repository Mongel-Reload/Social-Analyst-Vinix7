// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLAwEwt1LWDRt1MP15xlDdv0IuW-T0O-c",
  authDomain: "kokorolens-c5c38.firebaseapp.com",
  projectId: "kokorolens-c5c38",
  storageBucket: "kokorolens-c5c38.firebasestorage.app",
  messagingSenderId: "88410362460",
  appId: "1:88410362460:web:8cee43cc1a27e8cf384c99",
  measurementId: "G-YTFW04TB7X"
};

// Initialize Firebase (using compat version)
firebase.initializeApp(firebaseConfig);

// Export auth instance
const auth = firebase.auth();
