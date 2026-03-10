import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./hooks/useAuth.jsx";

// Styles
import "./styles/base/variables.css";
import "./styles/base/globals.css";
import "./styles/base/utilities.css";
import "./styles/components/layout.css";
import "./styles/pages/dashboard.css";
import "./styles/pages/deck.css";
import "./styles/pages/results.css";
import "./styles/components/auth.css";
import "./styles/pages/admin.css";
import "./styles/pages/quiz.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<RouterProvider router={router} />
		</AuthProvider>
	</React.StrictMode>,
);
