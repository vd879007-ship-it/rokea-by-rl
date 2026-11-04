import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBQcdDPRCNgF7yfAJpqdH2EFriGKTdvMKA",
  authDomain: "rokeya-3ccaa.firebaseapp.com",
  projectId: "rokeya-3ccaa",
  storageBucket: "rokeya-3ccaa.firebasestorage.app",
  messagingSenderId: "474801043436",
  appId: "1:474801043436:web:e12c0bf29704e4319072c9",
  measurementId: "G-H1GBK81D1Z"
};

let db = null;
let auth = null;
let googleProvider = null;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  auth = firebase.auth();
  googleProvider = new firebase.auth.GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  if (typeof window !== 'undefined' && typeof firebase.analytics === 'function') {
    try {
      firebase.analytics();
    } catch (e) {
      // Ignore analytics in non-supported environments
    }
  }
  console.log("Firebase Connected to rokeya-3ccaa!");
} catch (err) {
  console.error("Firebase init error:", err);
}

export { firebase, db, auth, googleProvider };
export default firebase;

