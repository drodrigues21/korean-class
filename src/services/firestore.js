import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

// Get all decks (Week 1, Week 2...)
export async function fetchDecks() {
  const decksRef = collection(db, "decks");
  const q = query(decksRef, orderBy("order", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// Get one deck document
export async function fetchDeck(deckId) {
  const ref = doc(db, "decks", deckId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
}

// Get all cards in a deck
export async function fetchCards(deckId) {
  const cardsRef = collection(db, "decks", deckId, "cards");
  const snap = await getDocs(cardsRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}