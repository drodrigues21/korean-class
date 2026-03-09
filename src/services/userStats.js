import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Subscribe to users/{uid} for streak/xp.
 * Returns unsubscribe function.
 */
export function subscribeUserStats(uid, cb) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...snap.data() });
  });
}