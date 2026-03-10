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
	const { user } = useAuth();
	const { cards, loading, error } = useDeck(deckId);

	const [searchParams] = useSearchParams();
	const reviewMode = searchParams.get("review") === "1";
	const nParam = Number(searchParams.get("n"));
	const totalQuestions = Number.isFinite(nParam) && nParam > 0 ? nParam : 10;

	const [progressMap, setProgressMap] = useState(null);
	const [reviewCards, setReviewCards] = useState(null);
	const [reviewInfo, setReviewInfo] = useState("");

	const [index, setIndex] = useState(0);
	const [score, setScore] = useState(0);

	const [current, setCurrent] = useState(null);
	const [imageUrl, setImageUrl] = useState("");
	const [selected, setSelected] = useState(null);
	const [feedback, setFeedback] = useState("");

	const [answers, setAnswers] = useState([]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function run() {
			if (!reviewMode) {
				setProgressMap(null);
				setReviewCards(null);
				setReviewInfo("");
				return;
			}

			if (!user?.uid || !cards.length) return;

			try {
				const map = await fetchDeckProgressMap(user.uid, deckId);
				if (cancelled) return;

				setProgressMap(map);

				const mistakesOnly = cards.filter((c) => {
					const p = map[c.id];
					return (p?.wrong || 0) > 0;
				});

				setReviewCards(mistakesOnly);

				if (mistakesOnly.length > 0) {
					setReviewInfo(
						`Review mode: mistakes only (${mistakesOnly.length} card${mistakesOnly.length === 1 ? "" : "s"})`,
					);
				} else {
					setReviewInfo("Review mode: no mistake cards yet, using normal MCQ");
				}
			} catch {
				if (cancelled) return;
				setProgressMap({});
				setReviewCards([]);
				setReviewInfo("Review mode: could not load mistakes, using normal MCQ");
			}
		}

		run();
		return () => {
			cancelled = true;
		};
	}, [reviewMode, user?.uid, deckId, cards]);

	useEffect(() => {
		async function makeQuestion() {
			if (!cards?.length) return;

			function pickCorrectCard() {
				const sourceCards =
					reviewMode && reviewCards && reviewCards.length > 0
						? reviewCards
						: cards;

				return sourceCards[Math.floor(Math.random() * sourceCards.length)];
			}

			const correctCard = pickCorrectCard();

			const decoys = sample(
				cards.filter((c) => c.id !== correctCard.id),
				3,
			);

			const options = shuffle([correctCard, ...decoys]);
			setCurrent({ correctCard, options });

			setSelected(null);
			setFeedback("");

			try {
				const url = await getImageUrl(correctCard.imagePath);
				setImageUrl(url);
			} catch {
				setImageUrl("");
			}
		}

		if (!loading && cards.length) makeQuestion();
	}, [index, loading, cards, reviewMode, reviewCards]);

	const finished = useMemo(
		() => index >= totalQuestions,
		[index, totalQuestions],
	);

	useEffect(() => {
		async function finish() {
			if (!finished) return;
			if (!user?.uid) {
				navigate("/results", {
					state: { mode: "mcq", deckId, score, total: totalQuestions },
				});
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
				navigate("/results", {
					state: {
						mode: "mcq",
						deckId,
						score,
						total: totalQuestions,
						saveError: e?.message,
					},
				});
			} finally {
				setSaving(false);
			}
		}

		finish();
	}, [finished, user, deckId, navigate, answers, score, totalQuestions]);

	if (loading)
		return (
			<div className="quiz-page">
				<p>Loading…</p>
			</div>
		);
	if (error)
		return (
			<div className="quiz-page">
				<p className="text-danger">{error}</p>
			</div>
		);
	if (!cards.length)
		return (
			<div className="quiz-page">
				<p>No cards in this deck.</p>
			</div>
		);
	if (!current)
		return (
			<div className="quiz-page">
				<p>Preparing question…</p>
			</div>
		);
	if (saving)
		return (
			<div className="quiz-page">
				<p>Saving progress…</p>
			</div>
		);

	const { correctCard, options } = current;

	function choose(option) {
		if (selected) return;
		setSelected(option.id);

		const isCorrect = option.id === correctCard.id;
		setFeedback(isCorrect ? "correct" : "wrong");
		if (isCorrect) setScore((s) => s + 1);

		setAnswers((prev) => [
			...prev,
			{ cardId: correctCard.id, correct: isCorrect },
		]);

		setTimeout(() => setIndex((i) => i + 1), 600);
	}

	return (
		<div className="quiz-page quiz-page--narrow">
			<div className="quiz-page__header">
				<h1 className="quiz-page__title">MCQ</h1>
				{reviewMode ? (
					<p className="quiz-page__label">
						{reviewInfo || "Review mode: mistakes only"}
					</p>
				) : null}
				<p className="quiz-page__meta">
					{index + 1} / {totalQuestions}
				</p>
			</div>

			<div className="quiz-page__image-wrap">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={correctCard.hangul}
						className="quiz-page__image"
					/>
				) : (
					<span className="quiz-page__image--empty">No image</span>
				)}
			</div>

			<div className="quiz-page__options">
				{options.map((opt) => {
					const isPicked = selected === opt.id;
					const isCorrect = opt.id === correctCard.id;

					let className = "quiz-page__option korean-text";
					if (selected) {
						if (isPicked && isCorrect)
							className += " quiz-page__option--correct";
						else if (isPicked && !isCorrect)
							className += " quiz-page__option--wrong";
					}

					return (
						<button
							key={opt.id}
							onClick={() => choose(opt)}
							disabled={!!selected}
							className={className}
						>
							{opt.hangul}
						</button>
					);
				})}
			</div>

			{feedback ? (
				<p className="quiz-page__feedback">
					{feedback === "correct" ? "✅ Correct!" : "❌ Wrong"}
				</p>
			) : null}
		</div>
	);
}
