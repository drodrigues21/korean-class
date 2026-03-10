import { Link } from "react-router-dom";

export default function NotFound() {
	return (
		<div style={{ padding: 24 }}>
			<h1>404</h1>
			<p>Page not found.</p>
			<Link to="/" style={{ textDecoration: "none" }}>
				<button
					style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
				>
					Go home
				</button>
			</Link>
		</div>
	);
}
