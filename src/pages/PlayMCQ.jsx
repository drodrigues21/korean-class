import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useDeck from "../hooks/useDeck";
import { getImageUrl } from "../services/storage";
import { useAuth } from "../hooks/useAuth.jsx";
import { saveQuizProgress } from "../services/progress";
import { fetchDeckProgressMap } from "../services/review";

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

export default function PlayMCQ() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { cards, loading, error } = useDeck(deckId);

  const [searchParams] = useSearchParams();
  const reviewMode = searchParams.get("review") === "1";

  const [progressMap, setProgressMap] = useState(null); // { cardId: { correct, wrong } }

  // Get users and save quiz progress
  const { user } = useAuth();
  const [answers, setAnswers] = useState([]); // { cardId, correct }
  const [saving, setSaving] = useState(false);

  const nParam = Number(searchParams.get("n"));
  const totalQuestions = Number.isFinite(nParam) && nParam > 0 ? nParam : 10;

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [current, setCurrent] = useState(null); // { correctCard, options }
  const [imageUrl, setImageUrl] = useState("");
  const [selected, setSelected] = useState(null); // option cardId
  const [feedback, setFeedback] = useState(""); // "correct" | "wrong" | ""

  // Prepare a question each time index changes
  useEffect(() => {
    async function makeQuestion() {
      if (!cards?.length) return;

      // Choose a card.
      // If review mode: weight by (wrong - correct + 1) so missed cards appear more.
      function pickCorrectCard() {
        if (!reviewMode || !progressMap) {
          return cards[Math.floor(Math.random() * cards.length)];
        }

        // Build weighted pool
        const weighted = [];
        for (const c of cards) {
          const p = progressMap[c.id];
          const correct = p?.correct || 0;
          const wrong = p?.wrong || 0;

          // weight:
          // - unseen cards get weight 1
          // - missed cards get higher weight
          const weight = Math.max(1, wrong - correct + 1);

          for (let i = 0; i < weight; i++) weighted.push(c);
        }

        if (!weighted.length) return cards[Math.floor(Math.random() * cards.length)];
        return weighted[Math.floor(Math.random() * weighted.length)];
      }

      const correctCard = pickCorrectCard();

      const decoys = sample(
        cards.filter((c) => c.id !== correctCard.id),
        3
      );

      const options = shuffle([correctCard, ...decoys]);
      setCurrent({ correctCard, options });

      setSelected(null);
      setFeedback("");

      // load image
      try {
        const url = await getImageUrl(correctCard.imagePath);
        setImageUrl(url);
      } catch {
        setImageUrl("");
      }
    }

    if (!loading && cards.length) makeQuestion();
  }, [index, loading, cards]);

  const finished = useMemo(() => index >= totalQuestions, [index]);

  useEffect(() => {
    async function finish() {
      if (!finished) return;
      if (!user?.uid) {
        navigate("/results", { state: { mode: "mcq", deckId, score, total: totalQuestions } });
        return;
      }
  
      setSaving(true);
      try {
        const saved = await saveQuizProgress({
          uid: user.uid,
          deckId,
          mode: "mcq",
          answers,
        });
  
        navigate("/results", {
          state: {
            mode: "mcq",
            deckId,
            score: saved.correctCount,
            total: saved.total,
            streak: saved.streak,
          },
        });
      } catch (e) {
        // If save fails, still show results
        navigate("/results", { state: { mode: "mcq", deckId, score, total: totalQuestions, saveError: e?.message } });
      } finally {
        setSaving(false);
      }
    }
  
    finish();
  }, [finished, user, deckId, navigate, answers, score]);

  useEffect(() => {
    let cancelled = false;
  
    async function run() {
      if (!reviewMode) {
        setProgressMap(null);
        return;
      }
      if (!user?.uid) return;
      try {
        const map = await fetchDeckProgressMap(user.uid, deckId);
        if (!cancelled) setProgressMap(map);
      } catch {
        if (!cancelled) setProgressMap({});
      }
    }
  
    run();
    return () => {
      cancelled = true;
    };
  }, [reviewMode, user?.uid, deckId]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!cards.length) return <div style={{ padding: 24 }}>No cards in this deck.</div>;
  if (!current) return <div style={{ padding: 24 }}>Preparing question…</div>;
  if (saving) return <div style={{ padding: 24 }}>Saving progress…</div>;

  const { correctCard, options } = current;

  function choose(option) {
    if (selected) return; // prevent double-click
    setSelected(option.id);

    const isCorrect = option.id === correctCard.id;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);

    setAnswers((prev) => [...prev, { cardId: correctCard.id, correct: isCorrect }]);

    // auto-next after a short delay
    setTimeout(() => setIndex((i) => i + 1), 600);
  }

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>MCQ</h1>
      {reviewMode ? <p style={{ marginTop: 0, opacity: 0.7 }}>Review mistakes mode</p> : null}
      <p style={{ opacity: 0.7 }}>
        {index + 1} / {totalQuestions}
      </p>

      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.12)",
          background: "rgba(0,0,0,0.04)",
          display: "grid",
          placeItems: "center",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={correctCard.hangul}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ opacity: 0.6 }}>No image</span>
        )}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {options.map((opt) => {
          const isPicked = selected === opt.id;
          const isCorrect = opt.id === correctCard.id;

          let bg = "white";
          if (selected) {
            if (isPicked && isCorrect) bg = "rgba(0, 180, 0, 0.15)";
            else if (isPicked && !isCorrect) bg = "rgba(220, 0, 0, 0.12)";
          }

          return (
            <button
              key={opt.id}
              onClick={() => choose(opt)}
              disabled={!!selected}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                cursor: selected ? "default" : "pointer",
                border: "1px solid rgba(0,0,0,0.15)",
                background: bg,
                textAlign: "left",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {opt.hangul}
            </button>
          );
        })}
      </div>

      {feedback ? (
        <p style={{ marginTop: 12, fontWeight: 700 }}>
          {feedback === "correct" ? "✅ Correct!" : "❌ Wrong"}
        </p>
      ) : null}
    </div>
  );
}