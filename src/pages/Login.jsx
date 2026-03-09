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
  const { user, loading, loginWithGoogle, signupWithEmail, loginWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from || "/", [location.state]);

  const [mode, setMode] = useState("login"); // "login" | "signup"
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
      // redirect handled by useEffect once auth state updates
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
      // redirect handled by useEffect
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
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>
      <p>Sign in to track your progress.</p>

      <button
        onClick={handleGoogle}
        disabled={busy}
        style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", width: "100%" }}
      >
        Continue with Google
      </button>

      <div style={{ height: 16 }} />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setInfo("");
          }}
          disabled={busy}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            width: "50%",
            background: mode === "login" ? "rgba(0,0,0,0.08)" : "transparent",
            cursor: "pointer",
          }}
        >
          Email Login
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
            setInfo("");
          }}
          disabled={busy}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            width: "50%",
            background: mode === "signup" ? "rgba(0,0,0,0.08)" : "transparent",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleEmailSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          disabled={busy}
          style={{ padding: "10px 12px", borderRadius: 10 }}
        />

        <div style={{ display: "grid", gap: 6 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            minLength={6}
            disabled={busy}
            style={{ padding: "10px 12px", borderRadius: 10 }}
          />

          {mode === "signup" ? (
            <small style={{ opacity: 0.75 }}>
              Password must be at least <strong>6 characters</strong>.
            </small>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
        >
          {mode === "signup" ? "Create account" : "Login"}
        </button>

        {mode === "login" ? (
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={busy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              cursor: "pointer",
              background: "transparent",
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          >
            Forgot password?
          </button>
        ) : null}
      </form>

      {error ? <p style={{ marginTop: 12, color: "crimson" }}>{error}</p> : null}
      {info ? <p style={{ marginTop: 12, color: "green" }}>{info}</p> : null}
    </div>
  );
}