import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useDeck from "../hooks/useDeck";
import { getImageUrl } from "../services/storage";
import { useAuth } from "../hooks/useAuth.jsx";
import { saveQuizProgress } from "../services/progress";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export default function PlayMatch() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, loading, error } = useDeck(deckId);

  const [roundCards, setRoundCards] = useState([]); // 4 cards
  const [imageUrls, setImageUrls] = useState({}); // cardId -> url

  const [selectedWordId, setSelectedWordId] = useState(null);
  const [matches, setMatches] = useState({}); // wordCardId -> imageCardId
  const [locked, setLocked] = useState({}); // wordCardId -> true (correct locked)

  const [saving, setSaving] = useState(false);

  // Start new round
  useEffect(() => {
    if (!loading && cards.length) {
      const picked = sample(cards, Math.min(4, cards.length));
      setRoundCards(picked);
      setSelectedWordId(null);
      setMatches({});
      setLocked({});
      setImageUrls({});
    }
  }, [loading, cards]);

  // Load image URLs for the 4 cards
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!roundCards.length) return;

      const entries = await Promise.all(
        roundCards.map(async (c) => {
          try {
            const url = await getImageUrl(c.imagePath);
            return [c.id, url];
          } catch {
            return [c.id, ""];
          }
        })
      );

      if (cancelled) return;

      const map = {};
      for (const [id, url] of entries) map[id] = url;
      setImageUrls(map);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [roundCards]);

  const words = useMemo(() => shuffle(roundCards), [roundCards]);
  const images = useMemo(() => shuffle(roundCards), [roundCards]);

  const allMatched = useMemo(() => {
    if (roundCards.length === 0) return false;
    const lockedCount = Object.keys(locked).length;
    return lockedCount === roundCards.length;
  }, [locked, roundCards.length]);

  useEffect(() => {
    async function finish() {
      if (!allMatched) return;

      // Convert locked matches into answers. Each correct match = correct.
      const answers = roundCards.map((c) => ({
        cardId: c.id,
        correct: true,
      }));

      setSaving(true);
      try {
        const saved = await saveQuizProgress({
          uid: user.uid,
          deckId,
          mode: "match",
          answers,
        });

        navigate("/results", {
          state: {
            mode: "match",
            deckId,
            score: saved.correctCount,
            total: saved.total,
            streak: saved.streak,
          },
        });
      } catch (e) {
        navigate("/results", {
          state: {
            mode: "match",
            deckId,
            score: answers.length,
            total: answers.length,
            saveError: e?.message,
          },
        });
      } finally {
        setSaving(false);
      }
    }

    if (user?.uid) finish();
  }, [allMatched, user?.uid, roundCards, deckId, navigate]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!cards.length) return <div style={{ padding: 24 }}>No cards in this deck.</div>;
  if (!roundCards.length) return <div style={{ padding: 24 }}>Preparing…</div>;
  if (saving) return <div style={{ padding: 24 }}>Saving progress…</div>;

  function pickWord(cardId) {
    if (locked[cardId]) return;
    setSelectedWordId(cardId);
  }

  function pickImage(imageCardId) {
    if (!selectedWordId) return;
    if (locked[selectedWordId]) return;

    // Check correctness: word card id must equal image card id
    const isCorrect = selectedWordId === imageCardId;

    setMatches((prev) => ({ ...prev, [selectedWordId]: imageCardId }));

    if (isCorrect) {
      setLocked((prev) => ({ ...prev, [selectedWordId]: true }));
      setSelectedWordId(null);
    } else {
      // wrong: clear selection after short delay
      setTimeout(() => {
        setMatches((prev) => {
          const next = { ...prev };
          delete next[selectedWordId];
          return next;
        });
        setSelectedWordId(null);
      }, 400);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Match</h1>
      <p style={{ opacity: 0.7 }}>Match the 4 words to the 4 images.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        {/* Words */}
        <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, opacity: 0.8 }}>Words</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {words.map((c) => {
              const isSelected = selectedWordId === c.id;
              const isLocked = !!locked[c.id];

              return (
                <button
                  key={c.id}
                  onClick={() => pickWord(c.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: isLocked ? "default" : "pointer",
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: isLocked
                      ? "rgba(0,180,0,0.15)"
                      : isSelected
                      ? "rgba(0,0,0,0.08)"
                      : "white",
                    textAlign: "left",
                    fontSize: 18,
                    fontWeight: 800,
                    opacity: isLocked ? 0.85 : 1,
                  }}
                >
                  {c.hangul}
                </button>
              );
            })}
          </div>
        </div>

        {/* Images */}
        <div style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14 }}>
          <h2 style={{ marginTop: 0, fontSize: 16, opacity: 0.8 }}>Images</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {images.map((c) => {
              const src = imageUrls[c.id] || "";
              return (
                <button
                  key={c.id}
                  onClick={() => pickImage(c.id)}
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    padding: 0,
                    cursor: selectedWordId ? "pointer" : "default",
                    background: "rgba(0,0,0,0.04)",
                    aspectRatio: "1 / 1",
                  }}
                >
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                  ) : (
                    <span style={{ opacity: 0.6 }}>No image</span>
                  )}
                </button>
              );
            })}
          </div>

          <p style={{ marginTop: 12, opacity: 0.7 }}>
            {selectedWordId ? "Now click the matching image." : "Click a word first."}
          </p>
        </div>
      </div>
    </div>
  );
}