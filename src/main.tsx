import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
// We're a Vite SPA, not a Next.js app, so use the `/react` entry —
// the `/next` entry imports from `next/navigation` which doesn't exist
// here and crashes the build.
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);

// Register the service worker. autoUpdate handles version bumps quietly
// — no user prompt; the new SW takes over on next reload.
if (typeof window !== "undefined") {
  registerSW({ immediate: true });
}
