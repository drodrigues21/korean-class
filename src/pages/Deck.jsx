import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useDeck from "../hooks/useDeck";
import { getImageUrl } from "../services/storage";

export default function Deck() {
  const { deckId } = useParams();
  const { deck, cards, loading, error } = useDeck(deckId);

  // Map of cardId -> resolved URL
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cards?.length) return;

      // Only fetch URLs we don't already have
      const missing = cards.filter((c) => c.imagePath && !urls[c.id]);
      if (missing.length === 0) return;

      const entries = await Promise.all(
        missing.map(async (c) => {
          try {
            const url = await getImageUrl(c.imagePath);
            return [c.id, url];
          } catch {
            return [c.id, ""];
          }
        })
      );

      if (cancelled) return;

      setUrls((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) next[id] = url;
        return next;
      });
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>{deck?.title || deckId}</h1>
          <p style={{ marginTop: 6, opacity: 0.7 }}>{cards.length} cards</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link to={`/play/${deckId}/mcq`} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
              MCQ
            </button>
          </Link>
          <Link to={`/play/${deckId}/type`} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
              Typing
            </button>
          </Link>
          <Link to={`/play/${deckId}/match`} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
              Match
            </button>
          </Link>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        {cards.map((card) => {
          const src = urls[card.id] || "";
          return (
            <div
              key={card.id}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 14,
                padding: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.04)",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={card.hangul}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  <span style={{ opacity: 0.6, fontSize: 12 }}>No image</span>
                )}
              </div>

              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>{card.hangul}</div>
              {/* <div style={{ marginTop: 4, opacity: 0.65, fontSize: 12 }}>{card.id}</div> */}
            </div>
          );
        })}
      </div>
    </div>
  );
}