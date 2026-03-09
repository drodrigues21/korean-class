import { useEffect, useState } from "react";
import { Link, useParams, createSearchParams } from "react-router-dom";
import useDeck from "../hooks/useDeck";
import { getImageUrl } from "../services/storage";

export default function Deck() {
  const { deckId } = useParams();
  const { deck, cards, loading, error } = useDeck(deckId);

  function playLink(deckId, mode, n, extraParams = {}) {
  const params = new URLSearchParams({ n: String(n), ...extraParams });
  return `/play/${deckId}/${mode}?${params.toString()}`;
}

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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* MCQ lengths */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to={playLink(deckId, "mcq", 5)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>MCQ 5</button>
          </Link>
          <Link to={playLink(deckId, "mcq", 10)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>MCQ 10</button>
          </Link>
          <Link to={playLink(deckId, "mcq", 20)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>MCQ 20</button>
          </Link>
        </div>

        {/* Typing lengths */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to={playLink(deckId, "type", 5)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>Type 5</button>
          </Link>
          <Link to={playLink(deckId, "type", 10)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>Type 10</button>
          </Link>
          <Link to={playLink(deckId, "type", 20)} style={{ textDecoration: "none" }}>
            <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>Type 20</button>
          </Link>
        </div>

        {/* Match stays simple */}
        <Link to={`/play/${deckId}/match`} style={{ textDecoration: "none" }}>
          <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>Match</button>
        </Link>

        {/* Review mistakes uses MCQ + n=10 by default */}
        <Link to={playLink(deckId, "mcq", 10, { review: "1" })} style={{ textDecoration: "none" }}>
          <button style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>Review mistakes</button>
        </Link>
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