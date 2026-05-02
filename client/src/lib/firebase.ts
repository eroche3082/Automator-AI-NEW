
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAI, getGenerativeModel } from 'firebase/ai';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration - Credenciales reales para automator-ai
const firebaseConfig = {
  apiKey: "AIzaSyDjLW2v8BRyHnnMZC1rdG6Tp5T-Hbp80r4",
  authDomain: "automator-ai.firebaseapp.com",
  projectId: "automator-ai",
  storageBucket: "automator-ai.firebasestorage.app",
  messagingSenderId: "1095307761542",
  appId: "1:1095307761542:web:dfe732267c090630c03e07",
  measurementId: "G-04MT27TPBE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const analytics = getAnalytics(app);
const ai = getAI(app);

// Función para obtener modelo generativo
export const getModel = (modelName: string = "gemini-1.5-pro") => {
  return getGenerativeModel(ai, { model: modelName });
};

export { app, auth, analytics, ai };
