// ─────────────────────────────────────────────────────────────────────────────
// auth-context.js — Tiny module that owns the auth context.
//
// Extracted out of App.jsx so that components like AdminPanel can
// useAuth() without importing App.jsx and creating a circular import.
// AuthProvider stays in App.jsx (it lives next to the data it holds).
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
