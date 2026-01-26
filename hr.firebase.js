// /assets/js/hr.firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAltOFeJKk1BhjpqZYd9cb7u_GmZ0EVXVE",
  authDomain: "lucidata-hr.firebaseapp.com",
  projectId: "lucidata-hr",
  storageBucket: "lucidata-hr.firebasestorage.app",
  messagingSenderId: "13908534678",
  appId: "1:13908534678:web:c92caad4b9eb7d442be9b7",
  measurementId: "G-Q0RKKGKS8Q"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);

// export helpers
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
};
