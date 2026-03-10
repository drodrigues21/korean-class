import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

	const [searchParams] = useSearchParams();
	const nParam = Number(searchParams.get("n"));
	const totalQuestions = Number.isFinite(nParam) && nParam > 0 ? nParam : 10;

	const [queue, setQueue] = useState([]);
	const [index, setIndex] = useState(0);

	const [current, setCurrent] = useState(null);
	const [imageUrl, setImageUrl] = useState("");
	const [input, setInput] = useState("");

	const [answers, setAnswers] = useState([]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!loading && cards.length) {
			const q = shuffle(cards).slice(0, Math.min(totalQuestions, cards.length));
			setQueue(q);
			setIndex(0);
		}
	}, [loading, cards, totalQuestions]);

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

	const finished = useMemo(
		() => index >= queue.length && queue.length > 0,
		[index, queue.length],
	);

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
				<p>Preparing…</p>
			</div>
		);
	if (saving)
		return (
			<div className="quiz-page">
				<p>Saving progress…</p>
			</div>
		);

	function submit() {
		const expected = (current.hangul || "").trim();
		const got = input.trim();

		const correct = got === expected;

		setAnswers((prev) => [...prev, { cardId: current.id, correct }]);
		setIndex((i) => i + 1);
	}

	return (
		<div className="quiz-page quiz-page--narrow">
			<div className="quiz-page__header">
				<h1 className="quiz-page__title">Typing</h1>
				<p className="quiz-page__meta">
					{Math.min(index + 1, queue.length)} / {queue.length}
				</p>
			</div>

			<div className="quiz-page__image-wrap">
				{imageUrl ? (
					<img src={imageUrl} alt="question" className="quiz-page__image" />
				) : (
					<span className="quiz-page__image--empty">No image</span>
				)}
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					submit();
				}}
				className="quiz-page__form"
			>
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="한글로 입력하세요"
					autoFocus
					className="korean-text"
				/>
				<button type="submit" className="quiz-page__submit">
					Submit
				</button>
				<small className="quiz-page__hint">
					Tip: Make sure your keyboard is set to Korean (한/영).
				</small>
			</form>
		</div>
	);
}
