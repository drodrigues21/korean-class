import { useEffect, useState } from "react";
import { fetchDeck, fetchCards } from "../services/firestore";

export default function useDeck(deckId) {
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!deckId) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const [d, c] = await Promise.all([fetchDeck(deckId), fetchCards(deckId)]);
        if (cancelled) return;
        setDeck(d);
        setCards(c);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load deck");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  return { deck, cards, loading, error };
}