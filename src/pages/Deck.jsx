import { useEffect, useState } from "react";
import { Link, useParams, createSearchParams } from "react-router-dom";
import useDeck from "../hooks/useDeck";
import { getImageUrl } from "../services/storage";

export default function Deck() {
	const { deckId } = useParams();
	const { deck, cards, loading, error } = useDeck(deckId);

	const [urls, setUrls] = useState({});
	const [reviewDefault, setReviewDefault] = useState(false);

	useEffect(() => {
		const saved = localStorage.getItem("mcqReviewDefault");
		setReviewDefault(saved === "true");
	}, []);

	function handleToggleReviewDefault(e) {
		const checked = e.target.checked;
		setReviewDefault(checked);
		localStorage.setItem("mcqReviewDefault", String(checked));
	}

	function playLink(deckId, mode, n, extraParams = {}) {
		const baseParams = { n: String(n), ...extraParams };

		if (mode === "mcq" && reviewDefault && !("review" in baseParams)) {
			baseParams.review = "1";
		}

		const params = new URLSearchParams(baseParams);
		return `/play/${deckId}/${mode}?${params.toString()}`;
	}

	useEffect(() => {
		let cancelled = false;

		async function run() {
			if (!cards?.length) return;

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
				}),
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
	}, [cards, urls]);

	return (
		<div className="deck-page">
			<div className="deck-page__header">
				<div>
					<h1 className="deck-page__title">{deck?.title || deckId}</h1>
					<p className="deck-page__meta">{cards.length} cards</p>
				</div>

				<div className="deck-page__actions">
					<Link to={playLink(deckId, "mcq", 5)}>
						<button>MCQ 5</button>
					</Link>
					<Link to={playLink(deckId, "mcq", 10)}>
						<button>MCQ 10</button>
					</Link>
					<Link to={playLink(deckId, "mcq", 20)}>
						<button>MCQ 20</button>
					</Link>

					<Link to={playLink(deckId, "type", 5)}>
						<button>Type 5</button>
					</Link>
					<Link to={playLink(deckId, "type", 10)}>
						<button>Type 10</button>
					</Link>
					<Link to={playLink(deckId, "type", 20)}>
						<button>Type 20</button>
					</Link>

					<Link to={`/play/${deckId}/match`}>
						<button>Match</button>
					</Link>

					<Link
						to={{
							pathname: `/play/${deckId}/mcq`,
							search: `?${createSearchParams({ review: "1", n: "10" })}`,
						}}
					>
						<button>Review mistakes</button>
					</Link>
				</div>
			</div>

			{/* <div className="deck-page__review-toggle">
				<label>
					<input
						type="checkbox"
						checked={reviewDefault}
						onChange={handleToggleReviewDefault}
					/>
					Start MCQ in review mode by default
				</label>
			</div> */}

			{loading ? <p className="muted">Loading…</p> : null}
			{error ? <p className="text-danger">{error}</p> : null}

			<div className="deck-page__grid">
				{cards.map((card) => {
					const src = urls[card.id] || "";
					return (
						<div key={card.id} className="deck-card">
							<div className="deck-card__image-wrap">
								{src ? (
									<img
										src={src}
										alt={card.hangul}
										className="deck-card__image"
										loading="lazy"
									/>
								) : (
									<span className="deck-card__image--empty">No image</span>
								)}
							</div>

							<div className="deck-card__hangul korean-text">{card.hangul}</div>
							{/* <div className="deck-card__id">{card.id}</div> */}
						</div>
					);
				})}
			</div>
		</div>
	);
}
