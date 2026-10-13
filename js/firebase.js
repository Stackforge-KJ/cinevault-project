import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const configured = !firebaseConfig.apiKey.startsWith("PASTE");
const isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
// On the live site, sign-in runs through our own domain (see vercel.json) so Safari does not block it.
export const app = initializeApp({ ...firebaseConfig, authDomain: isLocal ? firebaseConfig.authDomain : location.host });
export const auth = getAuth(app);
export const db = getFirestore(app);
