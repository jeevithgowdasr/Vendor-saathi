# 🛒 VendorSaathi

A hyper-local direct farm-to-kitchen and kirana commerce platform connecting customers with local village vendors and farmers across Moodbidri & surrounding regions.

---

## 📁 Clean Unified Architecture

```
customervendor-main/
├── index.html                       # Frontend HTML entry point
├── package.json                     # Unified root package.json with fullstack scripts
├── vite.config.js                   # Vite configuration
├── vercel.json                      # Vercel deployment configuration
├── .env / .env.example              # Environment variables (Firebase, Stripe, etc.)
├── public/                          # Static assets, sounds, icons
├── src/                             # Complete Unified React 19 Frontend
│   ├── assets/                      # Produce imagery & branding
│   ├── components/                  # Modals, Drawers, ResponsiveTable, Navbars
│   ├── context/                     # AppContext, VendorSyncContext
│   ├── data/                        # Static seeds & store data
│   ├── hooks/                       # useAsyncMutation, usePagination
│   ├── services/                    # Stripe Payments, Firebase Firestore/Auth
│   ├── utils/                       # Audio, Geolocation, Cache, Validators
│   └── views/                       # RBAC Views (Customer, Vendor, Admin)
└── backend/                         # Node.js / Express / Socket.io API Server
    ├── package.json
    ├── .env / .env.example
    └── src/                         # Server controllers, models, routes, sockets
```

---

## 🚀 Quick Start Commands

### 1. Install All Dependencies
```bash
npm run install:all
```

### 2. Run the Frontend Web Application
```bash
npm run dev
```
Accessible at: `http://localhost:5173`

### 3. Run the Backend API Server
```bash
npm run dev:backend
```
Accessible at: `http://localhost:5000`

### 4. Build for Production
```bash
npm run build
```
Preview production build:
```bash
npm run preview
```

---

## 🌟 Key Features
- **Responsive Table & Card Layouts**: Adapts tabular inventory data automatically to mobile-friendly card grids.
- **$\ge 44\times 44\text{px}$ Touch Targets & Accessibility**: Built strictly for WCAG AA compliance and touch screens.
- **Secure Role-Based Routing**: Strict client & server-side RBAC distinguishing customer and vendor personas.
- **Dual Payment Integrations**: Stripe 3DS Card Payments + Dynamic UPI QR Codes (GPay / PhonePe / Paytm).
- **Voice AI Search & Voice Assistant**: Multilingual speech recognition in English, Kannada, and Hindi.
- **Live GPS & Telemetry Tracking**: Real-time simulated rider dispatch and order milestone tracking.
>>>>>>> e16cb94 (feat: complete VendorSaathi PWA with live ordering, RBAC routing, vendor portal, and service worker fixes)
