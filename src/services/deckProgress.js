import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Loads all progress docs for a user and summarizes mastery per deck.
 * Returns an object: { [deckId]: { seenCards, masteryPct } }
 */
export async function fetchDeckProgressSummary(uid) {
  const progressRef = collection(db, "users", uid, "progress");
  const snap = await getDocs(progressRef);

  const byDeck = new Map();

  snap.forEach((docSnap) => {
    const p = docSnap.data();
    const deckId = p.deckId;
    if (!deckId) return;

    const correct = Number(p.correct || 0);
    const wrong = Number(p.wrong || 0);
    const total = correct + wrong;
    if (total <= 0) return;

    const mastery = correct / total; // 0..1

    if (!byDeck.has(deckId)) {
      byDeck.set(deckId, { sum: 0, count: 0 });
    }
    const agg = byDeck.get(deckId);
    agg.sum += mastery;
    agg.count += 1;
  });

  const result = {};
  for (const [deckId, agg] of byDeck.entries()) {
    const masteryPct = Math.round((agg.sum / agg.count) * 100);
    result[deckId] = { seenCards: agg.count, masteryPct };
  }

  return result;
}