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

	function modeToPath(deckId, mode) {
		if (!deckId || !mode) return "";
		if (mode === "mcq") return `/play/${deckId}/mcq`;
		if (mode === "type") return `/play/${deckId}/type`;
		if (mode === "match") return `/play/${deckId}/match`;
		return `/deck/${deckId}`;
	}

	return (
		<div className="dashboard">
			<div>
				<h1 className="section-title">Dashboard</h1>
				<p className="section-subtitle">
					Pick up where you left off and keep your Korean practice consistent.
				</p>
			</div>

			<section className="surface-card dashboard__stats">
				<div className="dashboard__stats-grid">
					<div className="soft-card dashboard__stat-card">
						<div className="muted dashboard__stat-label">Streak</div>
						<div className="dashboard__stat-value">{stats?.streak ?? 0} 🔥</div>
					</div>

					<div className="soft-card dashboard__stat-card">
						<div className="muted dashboard__stat-label">XP</div>
						<div className="dashboard__stat-value">{stats?.xpTotal ?? 0}</div>
					</div>

					<div className="soft-card dashboard__stat-card">
						<div className="muted dashboard__stat-label">Last active</div>
						<div className="dashboard__stat-value">
							{stats?.lastActiveDate ?? "—"}
						</div>
					</div>
				</div>

				{stats?.lastDeckId ? (
					<div className="row-wrap dashboard__continue">
						<Link to={modeToPath(stats.lastDeckId, stats.lastMode)}>
							<button className="primary-btn">Continue</button>
						</Link>

						<Link to={`/deck/${stats.lastDeckId}`}>
							<button>Open last deck</button>
						</Link>

						<span className="badge">
							Last: {stats.lastDeckId} ({stats.lastMode || "—"})
						</span>
					</div>
				) : null}
			</section>

			<section className="dashboard__decks">
				<div>
					<h2 className="ui-heading">Your decks</h2>
					<p className="muted">
						Practice by week and track your mastery over time.
					</p>
				</div>

				{loading ? <p className="muted">Loading decks…</p> : null}
				{error ? <p className="text-danger">{error}</p> : null}

				<div className="grid-auto">
					{decks.map((deck) => {
						const prog = deckProgress[deck.id];

						return (
							<Link
								key={deck.id}
								to={`/deck/${deck.id}`}
								className="surface-card dashboard__deck-card"
							>
								<div className="dashboard__deck-title">
									{deck.title || deck.id}
								</div>
								<div className="muted dashboard__deck-meta">
									Deck ID: {deck.id}
								</div>

								<div className="dashboard__deck-progress">
									{progressLoading ? (
										<span className="muted">Loading progress…</span>
									) : prog ? (
										<span>
											Mastery: <strong>{prog.masteryPct}%</strong> · Seen:{" "}
											{prog.seenCards}
										</span>
									) : (
										<span className="muted">Not started</span>
									)}
								</div>
							</Link>
						);
					})}
				</div>
			</section>
		</div>
	);
}
