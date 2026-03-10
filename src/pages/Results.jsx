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
		<div className="results-page">
			<h1 className="results-page__title">Results</h1>

			<p className="results-page__mode">
				<strong>{mode.toUpperCase()}</strong> — {deckId}
			</p>

			<div className="surface-card results-page__score-card">
				<div className="results-page__score">
					{score} / {total}
				</div>
				<div className="results-page__accuracy">
					Accuracy: {total ? Math.round((score / total) * 100) : 0}%
				</div>
			</div>

			{streak ? (
				<p>
					🔥 Streak: <strong>{streak}</strong> day(s)
				</p>
			) : null}

			{saveError ? (
				<p className="text-danger">Save error: {saveError}</p>
			) : null}

			<div className="results-page__actions">
				{deckId ? (
					<Link to={`/deck/${deckId}`}>
						<button>Back to Deck</button>
					</Link>
				) : null}

				<Link to="/">
					<button>Dashboard</button>
				</Link>
			</div>

			{!location.state ? (
				<p className="muted">
					Tip: You’ll see results here after finishing a quiz.
				</p>
			) : null}
		</div>
	);
}
