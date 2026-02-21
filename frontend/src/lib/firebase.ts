import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Added this import
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAXvy6BwNgVDgAgl7-9VUkzCnObZcK-flI",
  authDomain: "clubmonkey-6b485.firebaseapp.com",
  projectId: "clubmonkey-6b485",
  storageBucket: "clubmonkey-6b485.firebasestorage.app",
  messagingSenderId: "293357637102",
  appId: "1:293357637102:web:2d3b41d15d04d978e7d2ff",
  measurementId: "G-QZMXPB5ZJ5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Auth for your SignupPage
export const auth = getAuth(app);

// Initialize Analytics only on the client side
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export default app;
