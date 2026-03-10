import { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../hooks/useAuth.jsx";
import { resetMyProgress } from "../services/admin";

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
	const isAdmin = useMemo(
		() => user?.uid && adminUid && user.uid === adminUid,
		[user, adminUid],
	);

	const [deckId, setDeckId] = useState("week01");
	const [docIdInput, setDocIdInput] = useState("");
	const [hangul, setHangul] = useState("");
	const [imagePath, setImagePath] = useState("");

	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState("");
	const [err, setErr] = useState("");

	const [resetBusy, setResetBusy] = useState(false);
	const [resetMsg, setResetMsg] = useState("");
	const [resetErr, setResetErr] = useState("");

	const slug = useMemo(() => slugify(docIdInput), [docIdInput]);

	function updateDeckId(value) {
		setDeckId(value);
		setImagePath(slug ? `cards/${value}/${slug}.jpg` : "");
	}

	async function handleSave(e) {
		e.preventDefault();
		setMsg("");
		setErr("");

		const cleanDeckId = deckId.trim();
		const cleanId = slugify(docIdInput);

		if (!cleanDeckId) return setErr("Deck ID is required (example: week03).");
		if (!cleanId) return setErr("Doc ID is required (example: ski).");
		if (!hangul.trim()) return setErr("Hangul is required (example: 스키).");
		if (!imagePath.trim()) return setErr("Image path is required.");

		setBusy(true);
		try {
			const ref = doc(db, "decks", cleanDeckId, "cards", cleanId);

			await setDoc(
				ref,
				{
					hangul: hangul.trim(),
					imagePath: imagePath.trim(),
					updatedAt: serverTimestamp(),
				},
				{ merge: true },
			);

			setMsg(`Saved: decks/${cleanDeckId}/cards/${cleanId}`);
			setHangul("");
			setDocIdInput("");
			setImagePath("");
		} catch (e2) {
			setErr(e2?.message || "Failed to save.");
		} finally {
			setBusy(false);
		}
	}

	async function handleCreateDeck() {
		setMsg("");
		setErr("");

		const cleanDeckId = deckId.trim();
		if (!cleanDeckId) {
			setErr("Deck ID is required to create a deck.");
			return;
		}

		setBusy(true);
		try {
			const deckRef = doc(db, "decks", cleanDeckId);
			await setDoc(
				deckRef,
				{
					title: cleanDeckId,
					order: Number(cleanDeckId.replace(/\D/g, "")) || 99,
					isPublic: true,
					updatedAt: serverTimestamp(),
				},
				{ merge: true },
			);

			setMsg(`Deck created/updated: decks/${cleanDeckId}`);
		} catch (e2) {
			setErr(e2?.message || "Failed to create deck.");
		} finally {
			setBusy(false);
		}
	}

	async function handleResetProgress() {
		if (!user?.uid) return;

		const ok = window.confirm(
			"Reset all progress, streak, XP, and saved user stats for your current account?",
		);
		if (!ok) return;

		setResetBusy(true);
		setResetMsg("");
		setResetErr("");

		try {
			await resetMyProgress(user.uid);
			setResetMsg("Your progress was reset successfully.");
		} catch (e) {
			setResetErr(e?.message || "Failed to reset progress.");
		} finally {
			setResetBusy(false);
		}
	}

	return (
		<div className="admin-page">
			<h1 className="admin-page__title">Admin</h1>

			<div className="admin-page__meta">
				<div>Signed in as: {user?.email || user?.displayName}</div>
				<div>
					UID: <code>{user?.uid}</code>
				</div>
			</div>

			{!isAdmin ? (
				<div className="admin-page__denied">
					<strong>Access denied.</strong>
					<p>
						This page is only for the admin UID set in <code>.env.local</code>{" "}
						as <code>VITE_ADMIN_UID</code>.
					</p>
				</div>
			) : (
				<>
					<form onSubmit={handleSave} className="admin-page__form">
						<label className="admin-page__field">
							<span>Deck ID</span>
							<input
								value={deckId}
								onChange={(e) => updateDeckId(e.target.value)}
								placeholder="week03"
								disabled={busy}
							/>
							<small className="muted">
								You can type any deck ID, like <code>week01</code>,{" "}
								<code>week02</code>, <code>week03</code>, etc.
							</small>
						</label>

						<div className="admin-page__buttons">
							<button
								className="admin-page__button"
								type="button"
								onClick={handleCreateDeck}
								disabled={busy}
							>
								Create / Update Deck
							</button>
						</div>

						<label className="admin-page__field">
							<span>Doc ID</span>
							<input
								value={docIdInput}
								onChange={(e) => {
									const v = e.target.value;
									setDocIdInput(v);
									const s = slugify(v);
									setImagePath(s ? `cards/${deckId.trim()}/${s}.jpg` : "");
								}}
								placeholder="ski"
								disabled={busy}
							/>
							<small className="muted">
								Saved Doc ID will be: <code>{slug || "—"}</code>
							</small>
						</label>

						<label className="admin-page__field">
							<span>Hangul</span>
							<input
								value={hangul}
								onChange={(e) => setHangul(e.target.value)}
								placeholder="스키"
								disabled={busy}
							/>
						</label>

						<label className="admin-page__field">
							<span>Image Path</span>
							<input
								value={imagePath}
								onChange={(e) => setImagePath(e.target.value)}
								placeholder="cards/week03/ski.jpg"
								disabled={busy}
							/>
							<small className="muted">
								This should match the file you upload to Storage.
							</small>
						</label>

						<button
							className="admin-page__button"
							type="submit"
							disabled={busy}
						>
							{busy ? "Saving..." : "Save card"}
						</button>

						{err ? <p className="text-danger">{err}</p> : null}
						{msg ? <p className="text-success">{msg}</p> : null}
					</form>

					<div className="admin-page__tools">
						<h2 className="admin-page__tools-title">Testing tools</h2>

						<button
							className="admin-page__button danger-btn"
							type="button"
							onClick={handleResetProgress}
							disabled={resetBusy}
						>
							{resetBusy ? "Resetting..." : "Reset My Progress"}
						</button>

						{resetErr ? <p className="text-danger">{resetErr}</p> : null}
						{resetMsg ? <p className="text-success">{resetMsg}</p> : null}
					</div>
				</>
			)}
		</div>
	);
}
