import { auth, db } from "./firebase.js";
import { cloudinary } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider,
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const MESSAGES = {
  "auth/email-already-in-use": "That email already has an account. Log in instead.",
  "auth/invalid-credential": "The email or password is wrong.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Use at least 6 characters for the password.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
  "auth/unauthorized-domain": "This address is not allowed in Firebase yet. Add it under Authentication > Settings > Authorized domains.",
  "app/no-uploads": "Photo uploads are not set up yet. Add your Cloudinary details in js/firebase-config.js.",
  "permission-denied": "Firestore refused this. Check that your security rules are published.",
  "auth/network-request-failed": "No internet connection. Check it and try again.",
};
export const friendly = (e) => MESSAGES[e.code] || "Something went wrong. Try again.";

async function uploadAvatar(file) {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", cloudinary.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("upload failed");
  return (await res.json()).secure_url;
}

// Creates the profile record once per user. Role and subscription start fixed; only the server changes them later.
async function ensureUserDoc(user, username, photoURL = "") {
  const ref = doc(db, "users", user.uid);
  if ((await getDoc(ref)).exists()) return;
  await setDoc(ref, { username, email: user.email, photoURL, role: "user", subscriptionStatus: "none", createdAt: serverTimestamp() });
}

export async function signUp({ username, email, password, photo }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  let photoURL = "";
  if (photo && photo.size && cloudinary.cloudName) {
    try { photoURL = await uploadAvatar(photo); } catch (e) { console.warn("Photo upload skipped", e); }
  }
  await updateProfile(user, { displayName: username, photoURL: photoURL || null });
  await ensureUserDoc(user, username, photoURL);
}

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

// Phones and Safari block pop-ups, so Google sign-in uses a full-page redirect there.
const ua = navigator.userAgent;
const useRedirect = /iPhone|iPad|iPod|Android|Mobile/i.test(ua) || (/safari/i.test(ua) && !/chrome|crios|fxios|android/i.test(ua));

export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  if (useRedirect) {
    await signInWithRedirect(auth, provider);
    return new Promise(() => {}); // the page is leaving, so never continue
  }
  const { user } = await signInWithPopup(auth, provider);
  await ensureUserDoc(user, user.displayName || user.email.split("@")[0], user.photoURL || "");
}

// Run on the login and signup pages: finishes a Google sign-in that came back from a redirect.
export async function finishRedirect() {
  const result = await getRedirectResult(auth);
  if (!result) return false;
  const { user } = result;
  await ensureUserDoc(user, user.displayName || user.email.split("@")[0], user.photoURL || "");
  return true;
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export const logout = () => signOut(auth);

// Calls back with null (logged out) or { uid, email, username, photoURL, role, isSubscribed }
export function watchUser(cb) {
  return onAuthStateChanged(auth, async (u) => {
    if (!u) return cb(null);
    let d = {};
    try {
      const ref = doc(db, "users", u.uid);
      let s = await getDoc(ref);
      // Older accounts that never got a profile record get one now (skipped for brand-new signups, which create their own).
      const isNew = Date.now() - Date.parse(u.metadata.creationTime) < 15000;
      if (!s.exists() && !isNew) {
        await ensureUserDoc(u, u.displayName || u.email.split("@")[0], u.photoURL || "");
        s = await getDoc(ref);
      }
      if (s.exists()) d = s.data();
    } catch (e) { console.warn(e); }
    cb({
      uid: u.uid,
      email: u.email,
      username: d.username || u.displayName || u.email.split("@")[0],
      photoURL: d.photoURL || u.photoURL || "",
      role: d.role || "user",
      isSubscribed: d.subscriptionStatus === "active" && !!d.expiresAt && d.expiresAt.toMillis() > Date.now(),
      expiresAt: d.expiresAt ? d.expiresAt.toMillis() : 0,
      plan: d.plan || "",
    });
  });
}

// Protected pages: send logged-out visitors to login, then back here.
export function requireAuth() {
  return new Promise((resolve) => {
    const stop = watchUser((user) => {
      if (!user) { location.href = `login.html?next=${encodeURIComponent(location.pathname.split("/").pop() + location.search)}`; return; }
      resolve(user);
    });
  });
}

// Profile edits: only username and photoURL, which is all the security rules allow a user to change.
export async function updateAccount(user, { username, photo }) {
  let photoURL = user.photoURL;
  if (photo && photo.size) {
    if (!cloudinary.cloudName) throw Object.assign(new Error("uploads off"), { code: "app/no-uploads" });
    photoURL = await uploadAvatar(photo);
  }
  // The profile record normally exists already; create it if an older account is missing one.
  const ref = doc(db, "users", user.uid);
  if ((await getDoc(ref)).exists()) await updateDoc(ref, { username, photoURL });
  else await setDoc(ref, { username, email: user.email, photoURL, role: "user", subscriptionStatus: "none", createdAt: serverTimestamp() });
  await updateProfile(auth.currentUser, { displayName: username, photoURL: photoURL || null });
  return { ...user, username, photoURL };
}
