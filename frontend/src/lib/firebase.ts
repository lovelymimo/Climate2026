import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-JFAM0n3vnVS1qcnKqigJI0xcFwcjo8s",
  authDomain: "climate-safety-hub.firebaseapp.com",
  projectId: "climate-safety-hub",
  storageBucket: "climate-safety-hub.firebasestorage.app",
  messagingSenderId: "190048140476",
  appId: "1:190048140476:web:4d06cba8784281425f24b9",
  measurementId: "G-7EMYR6TTZZ"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 및 Firestore 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
