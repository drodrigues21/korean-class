import { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../hooks/useAuth.jsx";

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Admin() {
  const { user } = useAuth();

  const adminUid = import.meta.env.VITE_ADMIN_UID;
  const isAdmin = useMemo(() => user?.uid && adminUid && user.uid === adminUid, [user, adminUid]);

  const [deckId, setDeckId] = useState("week01");
  const [docIdInput, setDocIdInput] = useState("");
  const [hangul, setHangul] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const slug = useMemo(() => slugify(docIdInput), [docIdInput]);

  // Auto-build imagePath when deckId/docId changes (but only if user hasn't manually edited)
  function updateDocId(value) {
    const clean = slugify(value);
    setDocId(clean);
    setImagePath(`cards/${deckId}/${clean}.jpg`);
  }

  function updateDeckId(value) {
    setDeckId(value);
    setImagePath(slug ? `cards/${value}/${slug}.jpg` : "");
  }

  async function handleSave(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    const cleanId = slugify(docIdInput);
    if (!cleanId) return setErr("Doc ID is required (example: ski).");
    if (!hangul.trim()) return setErr("Hangul is required (example: 스키).");
    if (!imagePath.trim()) return setErr("imagePath is required.");

    setBusy(true);
    try {
      const ref = doc(db, "decks", deckId, "cards", cleanId);
      await setDoc(
        ref,
        {
          hangul: hangul.trim(),
          imagePath: imagePath.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg(`Saved: decks/${deckId}/cards/${cleanId}`);
      setHangul("");
      setDocId("");
      setImagePath("");
    } catch (e2) {
      setErr(e2?.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Admin</h1>

      <div style={{ opacity: 0.75, marginBottom: 12 }}>
        <div>Signed in as: {user?.email || user?.displayName}</div>
        <div>UID: <code>{user?.uid}</code></div>
      </div>

      {!isAdmin ? (
        <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" }}>
          <strong>Access denied.</strong>
          <p style={{ marginTop: 8 }}>
            This page is only for the admin UID set in <code>.env.local</code> as <code>VITE_ADMIN_UID</code>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Deck</span>
            <select
              value={deckId}
              onChange={(e) => updateDeckId(e.target.value)}
              disabled={busy}
              style={{ padding: "10px 12px", borderRadius: 10 }}
            >
              <option value="week01">week01</option>
              <option value="week02">week02</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Doc ID (you can type freely)</span>
            <input
              value={docIdInput}
              onChange={(e) => {
                const v = e.target.value;
                setDocIdInput(v);
                const s = slugify(v);
                setImagePath(s ? `cards/${deckId}/${s}.jpg` : "");
              }}
              placeholder="gain weight (it will become gain-weight)"
              disabled={busy}
              style={{ padding: "10px 12px", borderRadius: 10 }}
            />
            <small style={{ opacity: 0.75 }}>
              Saved Doc ID will be: <code>{slug || "—"}</code>
            </small>
        </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Hangul</span>
            <input
              value={hangul}
              onChange={(e) => setHangul(e.target.value)}
              placeholder="스키"
              disabled={busy}
              style={{ padding: "10px 12px", borderRadius: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Image Path</span>
            <input
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              placeholder="cards/week02/ski.jpg"
              disabled={busy}
              style={{ padding: "10px 12px", borderRadius: 10 }}
            />
            <small style={{ opacity: 0.75 }}>
              This should match the file you upload to Storage.
            </small>
          </label>

          <button
            type="submit"
            disabled={busy}
            style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
          >
            {busy ? "Saving..." : "Save card"}
          </button>

          {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
          {msg ? <p style={{ color: "green" }}>{msg}</p> : null}
        </form>
      )}
    </div>
  );
}