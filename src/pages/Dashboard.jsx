import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useDecks from "../hooks/useDecks";
import { useAuth } from "../hooks/useAuth.jsx";
import { subscribeUserStats } from "../services/userStats";
import { fetchDeckProgressSummary } from "../services/deckProgress";

export default function Dashboard() {
  const { decks, loading, error } = useDecks();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);

  const [deckProgress, setDeckProgress] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);

  // Add continue options
  function modeToPath(deckId, mode) {
    if (!deckId || !mode) return "";
    if (mode === "mcq") return `/play/${deckId}/mcq`;
    if (mode === "type") return `/play/${deckId}/type`;
    if (mode === "match") return `/play/${deckId}/match`;
    return `/deck/${deckId}`;
  }

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserStats(user.uid, setStats);
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
  
    let cancelled = false;
  
    async function run() {
      setProgressLoading(true);
      try {
        const summary = await fetchDeckProgressSummary(user.uid);
        if (!cancelled) setDeckProgress(summary);
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    }
  
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      {/* Stats */}
      <div
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.12)",
          maxWidth: 520,
        }}
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>Streak</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {stats?.streak ?? 0} 🔥
            </div>
          </div>

          <div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>XP</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {stats?.xpTotal ?? 0}
            </div>
          </div>

          <div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>Last active</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {stats?.lastActiveDate ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Continue options */}
      {stats?.lastDeckId ? (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to={modeToPath(stats.lastDeckId, stats.lastMode)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800 }}>
              Continue
            </button>
          </Link>

          <Link to={`/deck/${stats.lastDeckId}`} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
              Open last deck
            </button>
          </Link>

          <span style={{ opacity: 0.7, alignSelf: "center", fontSize: 14 }}>
            Last: {stats.lastDeckId} ({stats.lastMode || "—"})
          </span>
        </div>
      ) : null}

      {/* Decks */}
      {loading ? <p>Loading decks…</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12, maxWidth: 420 }}>
      {decks.map((deck) => {
  const prog = deckProgress[deck.id];

  return (
    <Link
      key={deck.id}
      to={`/deck/${deck.id}`}
      style={{
        padding: 14,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.12)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontWeight: 800 }}>{deck.title || deck.id}</div>
      <div style={{ opacity: 0.7, fontSize: 14 }}>Deck ID: {deck.id}</div>

      <div style={{ marginTop: 8, fontSize: 14, opacity: 0.85 }}>
        {progressLoading ? (
          "Loading progress…"
        ) : prog ? (
          <>
            Mastery: <strong>{prog.masteryPct}%</strong> · Seen: {prog.seenCards}
          </>
        ) : (
          "Not started"
        )}
      </div>
    </Link>
  );
})}
      </div>
    </div>
  );
}