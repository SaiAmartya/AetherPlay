"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register service worker with the root scope
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("AetherPlay SW registered successfully:", registration.scope);
        })
        .catch((err) => {
          console.error("AetherPlay SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
