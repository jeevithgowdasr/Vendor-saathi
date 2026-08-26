import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './config/env.js'
import './index.css'
import './App.css'
import App from './App.jsx'

// Register PWA Service Worker for Offline & Installability only in production
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ VendorSaathi PWA Service Worker Registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('PWA Service Worker registration note:', error);
        });
    });
  } else {
    // In local development, unregister service workers to avoid stale cache locks on Vite
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

