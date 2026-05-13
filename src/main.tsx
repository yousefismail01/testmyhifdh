import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);

// Register the service worker. autoUpdate handles version bumps quietly
// — no user prompt; the new SW takes over on next reload.
if (typeof window !== "undefined") {
  registerSW({ immediate: true });
}
