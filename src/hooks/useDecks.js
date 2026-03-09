import { useEffect, useState } from "react";
import { fetchDecks } from "../services/firestore";

export default function useDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchDecks();
        if (!cancelled) setDecks(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load decks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { decks, loading, error };
}