import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Layout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const adminUid = import.meta.env.VITE_ADMIN_UID;
	const isAdmin = user?.uid && adminUid && user.uid === adminUid;

	async function handleLogout() {
		await logout();
		navigate("/login", { replace: true });
	}

	function navClass({ isActive }) {
		return `app-nav__link ${isActive ? "app-nav__link--active" : ""}`;
	}

	return (
		<div>
			<header className="app-header">
				<div className="page-shell app-header__inner">
					<div className="app-header__left">
						<NavLink to="/" className="app-brand">
							<span className="app-brand__title">Hanam Korean Class</span>
							<span className="app-brand__subtitle muted">Study companion</span>
						</NavLink>

						<nav className="app-nav">
							{user ? (
								<NavLink to="/" className={navClass}>
									Dashboard
								</NavLink>
							) : (
								<NavLink to="/login" className={navClass}>
									Login
								</NavLink>
							)}

							{isAdmin ? (
								<NavLink to="/admin" className={navClass}>
									Admin
								</NavLink>
							) : null}
						</nav>
					</div>

					<div className="app-header__right">
						{user ? (
							<>
								<div className="surface-card user-chip">
									<span className="user-chip__dot" />
									<span className="user-chip__text">
										{user.displayName || user.email}
									</span>
								</div>

								<button className="ghost-btn" onClick={handleLogout}>
									Logout
								</button>
							</>
						) : (
							<span className="muted">Not signed in</span>
						)}
					</div>
				</div>
			</header>

			<main className="page-shell page-section">
				<Outlet />
			</main>
		</div>
	);
}
