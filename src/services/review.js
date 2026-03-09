import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fetch progress docs for a deck for the current user.
 * Returns map: { [cardId]: { correct, wrong } }
 */
export async function fetchDeckProgressMap(uid, deckId) {
  const ref = collection(db, "users", uid, "progress");
  const q = query(ref, where("deckId", "==", deckId));
  const snap = await getDocs(q);

  const map = {};
  snap.forEach((d) => {
    const p = d.data();
    map[p.cardId] = { correct: Number(p.correct || 0), wrong: Number(p.wrong || 0) };
  });

  return map;
}