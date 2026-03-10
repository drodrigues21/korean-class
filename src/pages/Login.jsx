import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { useLocation, useNavigate } from "react-router-dom";

function friendlyAuthError(err) {
	const code = err?.code || "";
	switch (code) {
		case "auth/invalid-email":
			return "That email address doesn’t look valid.";
		case "auth/user-not-found":
			return "No account found for that email.";
		case "auth/wrong-password":
			return "Incorrect password. Try again or reset it.";
		case "auth/email-already-in-use":
			return "That email is already in use. Try logging in instead.";
		case "auth/weak-password":
			return "Password is too weak. Use at least 6 characters.";
		case "auth/popup-closed-by-user":
			return "Google sign-in was closed before completing.";
		case "auth/network-request-failed":
			return "Network error. Check your connection and try again.";
		case "auth/too-many-requests":
			return "Too many attempts. Please wait a bit and try again.";
		default:
			return err?.message || "Something went wrong. Please try again.";
	}
}

export default function Login() {
	const {
		user,
		loading,
		loginWithGoogle,
		signupWithEmail,
		loginWithEmail,
		resetPassword,
	} = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const from = useMemo(() => location.state?.from || "/", [location.state]);

	const [mode, setMode] = useState("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [error, setError] = useState("");
	const [info, setInfo] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!loading && user) {
			navigate(from, { replace: true });
		}
	}, [loading, user, navigate, from]);

	async function handleEmailSubmit(e) {
		e.preventDefault();
		setError("");
		setInfo("");
		setBusy(true);

		try {
			if (mode === "signup") {
				await signupWithEmail(email, password);
			} else {
				await loginWithEmail(email, password);
			}
		} catch (err) {
			setError(friendlyAuthError(err));
		} finally {
			setBusy(false);
		}
	}

	async function handleGoogle() {
		setError("");
		setInfo("");
		setBusy(true);

		try {
			await loginWithGoogle();
		} catch (err) {
			setError(friendlyAuthError(err));
		} finally {
			setBusy(false);
		}
	}

	async function handleForgotPassword() {
		setError("");
		setInfo("");

		if (!email.trim()) {
			setError("Type your email above first, then click “Forgot password?”.");
			return;
		}

		setBusy(true);
		try {
			await resetPassword(email.trim());
			setInfo("Password reset email sent. Check your inbox (and spam folder).");
		} catch (err) {
			setError(friendlyAuthError(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="auth-page">
			<div>
				<h1 className="auth-page__title">Login</h1>
				<p className="auth-page__intro">Sign in to track your progress.</p>
			</div>

			<button
				className="auth-page__google-btn"
				onClick={handleGoogle}
				disabled={busy}
			>
				Continue with Google
			</button>

			<div className="auth-page__modes">
				<button
					type="button"
					className={`auth-page__mode-btn ${mode === "login" ? "auth-page__mode-btn--active" : ""}`}
					onClick={() => {
						setMode("login");
						setError("");
						setInfo("");
					}}
					disabled={busy}
				>
					Email Login
				</button>

				<button
					type="button"
					className={`auth-page__mode-btn ${mode === "signup" ? "auth-page__mode-btn--active" : ""}`}
					onClick={() => {
						setMode("signup");
						setError("");
						setInfo("");
					}}
					disabled={busy}
				>
					Sign Up
				</button>
			</div>

			<form onSubmit={handleEmailSubmit} className="auth-page__form">
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="email@example.com"
					required
					disabled={busy}
				/>

				<div className="auth-page__field">
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="password"
						required
						minLength={6}
						disabled={busy}
					/>

					{mode === "signup" ? (
						<small className="auth-page__hint">
							Password must be at least <strong>6 characters</strong>.
						</small>
					) : null}
				</div>

				<button className="auth-page__submit-btn" type="submit" disabled={busy}>
					{mode === "signup" ? "Create account" : "Login"}
				</button>

				{mode === "login" ? (
					<button
						className="auth-page__secondary-btn ghost-btn"
						type="button"
						onClick={handleForgotPassword}
						disabled={busy}
					>
						Forgot password?
					</button>
				) : null}
			</form>

			{error ? <p className="text-danger">{error}</p> : null}
			{info ? <p className="text-success">{info}</p> : null}
		</div>
	);
}
