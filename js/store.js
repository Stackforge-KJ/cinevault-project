import { db } from "./firebase.js";
import { doc, getDoc, setDoc, deleteDoc, getDocs, addDoc, updateDoc, collection, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Entries keep a small snapshot of the movie so list pages need no TMDB calls.
const snap = (m) => ({ id: m.id, title: m.title, year: m.year || "", rating: m.rating || 0, poster: m.poster || "" });

// ----- wishlist -----
const wref = (uid, id) => doc(db, "users", uid, "wishlist", String(id));
export const inWishlist = async (uid, id) => (await getDoc(wref(uid, id))).exists();
export async function toggleWishlist(uid, m) {
  if (await inWishlist(uid, m.id)) { await deleteDoc(wref(uid, m.id)); return false; }
  await setDoc(wref(uid, m.id), { ...snap(m), addedAt: serverTimestamp() });
  return true;
}
export const removeFromWishlist = (uid, id) => deleteDoc(wref(uid, id));
export async function getWishlist(uid) {
  const s = await getDocs(query(collection(db, "users", uid, "wishlist"), orderBy("addedAt", "desc")));
  return s.docs.map((d) => d.data());
}

// ----- playlists -----
const pcol = (uid) => collection(db, "users", uid, "playlists");
const pref = (uid, pid) => doc(db, "users", uid, "playlists", pid);
export async function getPlaylists(uid) {
  const s = await getDocs(query(pcol(uid), orderBy("createdAt", "desc")));
  return s.docs.map((d) => ({ id: d.id, movies: [], ...d.data() }));
}
export const createPlaylist = (uid, name, m) => addDoc(pcol(uid), { name, movies: m ? [snap(m)] : [], createdAt: serverTimestamp() });
export async function addToPlaylist(uid, pid, m) {
  const cur = (await getDoc(pref(uid, pid))).data().movies || [];
  if (cur.some((x) => x.id === m.id)) return;
  await updateDoc(pref(uid, pid), { movies: [...cur, snap(m)] });
}
export async function removeFromPlaylist(uid, pid, mid) {
  const cur = (await getDoc(pref(uid, pid))).data().movies || [];
  await updateDoc(pref(uid, pid), { movies: cur.filter((x) => String(x.id) !== String(mid)) });
}
export const deletePlaylist = (uid, pid) => deleteDoc(pref(uid, pid));
