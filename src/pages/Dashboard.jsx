import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useDecks from "../hooks/useDecks";
import { useAuth } from "../hooks/useAuth.jsx";
import { subscribeUserStats } from "../services/userStats";

export default function Dashboard() {
  const { decks, loading, error } = useDecks();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserStats(user.uid, setStats);
    return () => unsub();
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

      {/* Decks */}
      {loading ? <p>Loading decks…</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12, maxWidth: 420 }}>
        {decks.map((deck) => (
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
          </Link>
        ))}
      </div>
    </div>
  );
}