import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  background: isActive ? "rgba(0,0,0,0.08)" : "transparent",
  color: "inherit",
});

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <header style={{ padding: 16, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavLink to="/" style={linkStyle}>Dashboard</NavLink>

          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <>
                <span style={{ fontSize: 14, opacity: 0.8 }}>
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer" }}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" style={linkStyle}>Login</NavLink>
            )}
          </div>
          <NavLink to="/admin" style={linkStyle}>Admin</NavLink>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}