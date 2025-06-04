import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3DcdnISLjWmZNYmTmi2Suslmm-SPU3Tg",
  authDomain: "smart-pill-8499f.firebaseapp.com",
  projectId: "smart-pill-8499f",
  storageBucket: "smart-pill-8499f.appspot.com",
  messagingSenderId: "404711154678",
  appId: "1:404711154678:web:e525c292f7f56ceef29dd7",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth;
try {
  // Intenta inicializar Auth con persistencia (solo una vez por app)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Si ya está inicializado, solo obtén la instancia existente
  auth = getAuth(app);
}

export { app, auth };
