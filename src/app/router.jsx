import { createBrowserRouter } from "react-router-dom";

import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Deck from "../pages/Deck";
import PlayMCQ from "../pages/PlayMCQ";
import PlayType from "../pages/PlayType";
import PlayMatch from "../pages/PlayMatch";
import Results from "../pages/Results";
import NotFound from "../pages/NotFound";
import Admin from "../pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      { path: "login", element: <Login /> },
      {
        path: "deck/:deckId",
        element: (
          <ProtectedRoute>
            <Deck />
          </ProtectedRoute>
        ),
      },
      {
        path: "play/:deckId/mcq",
        element: (
          <ProtectedRoute>
            <PlayMCQ />
          </ProtectedRoute>
        ),
      },
      {
        path: "play/:deckId/type",
        element: (
          <ProtectedRoute>
            <PlayType />
          </ProtectedRoute>
        ),
      },
      {
        path: "play/:deckId/match",
        element: (
          <ProtectedRoute>
            <PlayMatch />
          </ProtectedRoute>
        ),
      },
      {
        path: "results",
        element: (
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);