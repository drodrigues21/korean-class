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

export default function PlayType() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, loading, error } = useDeck(deckId);

  const totalQuestions = 10;

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);

  const [current, setCurrent] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [input, setInput] = useState("");

  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);

  // Build a random question queue once cards load
  useEffect(() => {
    if (!loading && cards.length) {
      const q = shuffle(cards).slice(0, Math.min(totalQuestions, cards.length));
      setQueue(q);
      setIndex(0);
    }
  }, [loading, cards]);

  // Load current question
  useEffect(() => {
    async function run() {
      const card = queue[index];
      if (!card) return;
      setCurrent(card);
      setInput("");
      try {
        const url = await getImageUrl(card.imagePath);
        setImageUrl(url);
      } catch {
        setImageUrl("");
      }
    }
    run();
  }, [queue, index]);

  const finished = useMemo(() => index >= queue.length && queue.length > 0, [index, queue.length]);

  useEffect(() => {
    async function finish() {
      if (!finished) return;

      setSaving(true);
      try {
        const saved = await saveQuizProgress({
          uid: user.uid,
          deckId,
          mode: "type",
          answers,
        });

        navigate("/results", {
          state: {
            mode: "type",
            deckId,
            score: saved.correctCount,
            total: saved.total,
            streak: saved.streak,
          },
        });
      } catch (e) {
        navigate("/results", {
          state: {
            mode: "type",
            deckId,
            score: answers.filter((a) => a.correct).length,
            total: answers.length,
            saveError: e?.message,
          },
        });
      } finally {
        setSaving(false);
      }
    }

    if (user?.uid) finish();
  }, [finished, user?.uid, answers, deckId, navigate]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "crimson" }}>{error}</div>;
  if (!cards.length) return <div style={{ padding: 24 }}>No cards in this deck.</div>;
  if (!current) return <div style={{ padding: 24 }}>Preparing…</div>;
  if (saving) return <div style={{ padding: 24 }}>Saving progress…</div>;

  function submit() {
    const expected = (current.hangul || "").trim();
    const got = input.trim();

    const correct = got === expected;

    setAnswers((prev) => [...prev, { cardId: current.id, correct }]);
    setIndex((i) => i + 1);
  }

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Typing</h1>
      <p style={{ opacity: 0.7 }}>
        {Math.min(index + 1, queue.length)} / {queue.length}
      </p>

      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
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
            alt="question"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ opacity: 0.6 }}>No image</span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ marginTop: 14, display: "grid", gap: 10 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="한글로 입력하세요"
          autoFocus
          style={{ padding: "12px 14px", borderRadius: 12, fontSize: 18 }}
        />
        <button
          type="submit"
          style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}
        >
          Submit
        </button>
        <small style={{ opacity: 0.7 }}>
          Tip: Make sure your keyboard is set to Korean (한/영).
        </small>
      </form>
    </div>
  );
}