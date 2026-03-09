import { Link, useLocation } from "react-router-dom";

export default function Results() {
  const location = useLocation();
  const state = location.state || {};

  const mode = state.mode || "quiz";
  const deckId = state.deckId || "";
  const score = state.score ?? 0;
  const total = state.total ?? 0;

  const streak = state.streak ?? null;
  const saveError = state.saveError || "";

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Results</h1>

      <p style={{ fontSize: 18 }}>
        <strong>{mode.toUpperCase()}</strong> — {deckId}
      </p>

      <div
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>
          {score} / {total}
        </div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>
          Accuracy: {total ? Math.round((score / total) * 100) : 0}%
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {streak ? <p style={{ marginTop: 12 }}>🔥 Streak: <strong>{streak}</strong> day(s)</p> : null}
        {saveError ? <p style={{ marginTop: 12, color: "crimson" }}>Save error: {saveError}</p> : null}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {deckId ? (
          <Link to={`/deck/${deckId}`} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
              Back to Deck
            </button>
          </Link>
        ) : null}

        <Link to="/" style={{ textDecoration: "none" }}>
          <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
            Dashboard
          </button>
        </Link>
      </div>

      {!location.state ? (
        <p style={{ marginTop: 16, opacity: 0.7 }}>
          Tip: You’ll see results here after finishing a quiz.
        </p>
      ) : null}
    </div>
  );
}