import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Redirect desktop users to the main website (production only)
const isDesktop = window.innerWidth >= 1024;
const host = window.location.hostname;
const isDev = host === 'localhost' || host === '127.0.0.1';
const isLovablePreview = host.includes('lovableproject.com') || host.includes('id-preview--');
const isVercelPreview = host.endsWith('.vercel.app') && host !== 'vademecum-legal-guide.vercel.app';
const isProduction = !isDev && !isLovablePreview && !isVercelPreview;

if (isDesktop && isProduction) {
  window.location.replace('https://www.vacatio.com.br');
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}

// Register Service Worker for persistent image caching (production only)
if ('serviceWorker' in navigator) {
  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreview = window.location.hostname.includes('id-preview--') ||
    window.location.hostname.includes('lovableproject.com');

  if (!isInIframe && !isPreview) {
    navigator.serviceWorker.register('/sw-cache.js').catch(() => {});
  } else {
    // Cleanup any stale SW in preview/iframe
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  }
}
