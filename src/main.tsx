import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress known third-party errors that are not critical for the app
window.addEventListener('unhandledrejection', (event) => {
  // MetaMask extension errors often happen when the extension is not ready or has connection issues
  // These usually don't affect the main app functionality unless Web3 is required immediately
  if (event.reason?.message?.includes('MetaMask') ||
      event.reason?.stack?.includes('MetaMask') ||
      event.reason?.message?.includes('ethereum')) {
    // Prevent these errors from cluttering the console
    event.preventDefault();
    console.debug('Suppressed MetaMask error:', event.reason);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
