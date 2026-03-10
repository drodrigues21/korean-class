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

	const [roundCards, setRoundCards] = useState([]);
	const [imageUrls, setImageUrls] = useState({});

	const [selectedWordId, setSelectedWordId] = useState(null);
	const [matches, setMatches] = useState({});
	const [locked, setLocked] = useState({});

	const [saving, setSaving] = useState(false);

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
				}),
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

	if (loading)
		return (
			<div className="match-page">
				<p>Loading…</p>
			</div>
		);
	if (error)
		return (
			<div className="match-page">
				<p className="text-danger">{error}</p>
			</div>
		);
	if (!cards.length)
		return (
			<div className="match-page">
				<p>No cards in this deck.</p>
			</div>
		);
	if (!roundCards.length)
		return (
			<div className="match-page">
				<p>Preparing…</p>
			</div>
		);
	if (saving)
		return (
			<div className="match-page">
				<p>Saving progress…</p>
			</div>
		);

	function pickWord(cardId) {
		if (locked[cardId]) return;
		setSelectedWordId(cardId);
	}

	function pickImage(imageCardId) {
		if (!selectedWordId) return;
		if (locked[selectedWordId]) return;

		const isCorrect = selectedWordId === imageCardId;

		setMatches((prev) => ({ ...prev, [selectedWordId]: imageCardId }));

		if (isCorrect) {
			setLocked((prev) => ({ ...prev, [selectedWordId]: true }));
			setSelectedWordId(null);
		} else {
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
		<div className="match-page">
			<div className="quiz-page__header">
				<h1 className="quiz-page__title">Match</h1>
				<p className="quiz-page__meta">Match the 4 words to the 4 images.</p>
			</div>

			<div className="match-page__grid">
				<div className="match-page__panel">
					<h2 className="match-page__panel-title">Words</h2>
					<div className="match-page__words">
						{words.map((c) => {
							const isSelected = selectedWordId === c.id;
							const isLocked = !!locked[c.id];

							let className = "match-page__word korean-text";
							if (isLocked) className += " match-page__word--locked";
							else if (isSelected) className += " match-page__word--selected";

							return (
								<button
									key={c.id}
									onClick={() => pickWord(c.id)}
									className={className}
								>
									{c.hangul}
								</button>
							);
						})}
					</div>
				</div>

				<div className="match-page__panel">
					<h2 className="match-page__panel-title">Images</h2>
					<div className="match-page__images">
						{images.map((c) => {
							const src = imageUrls[c.id] || "";
							return (
								<button
									key={c.id}
									onClick={() => pickImage(c.id)}
									className="match-page__image-btn"
								>
									{src ? (
										<img src={src} alt="" className="match-page__image" />
									) : (
										<span className="quiz-page__image--empty">No image</span>
									)}
								</button>
							);
						})}
					</div>

					<p className="match-page__note">
						{selectedWordId
							? "Now click the matching image."
							: "Click a word first."}
					</p>
				</div>
			</div>
		</div>
	);
}
