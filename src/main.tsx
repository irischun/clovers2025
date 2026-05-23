import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const authSignals = `${window.location.search}${window.location.hash}`;
const isAuthCallback = /(type=recovery|access_token=|refresh_token=|error=|error_code=|code=)/.test(authSignals);
const isOnAuthRoute = window.location.pathname === `${basePath}/auth`;

if (isAuthCallback && !isOnAuthRoute) {
  window.history.replaceState({}, "", `${basePath}/auth${window.location.search}${window.location.hash}`);
}

createRoot(document.getElementById("root")!).render(<App />);
