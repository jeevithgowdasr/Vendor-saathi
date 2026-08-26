# VendorSaathi Production Smoke Testing & Sign-Off Checklist

**Document Version**: 2.0.0  
**Release Target**: Production (`https://customervendor.vercel.app`)  
**Prepared By**: Principal QA Lead & Release Management  

---

## 1. Critical Path Smoke Test Matrix

### A. Customer User Journey & Core Transactions
| Test Case ID | Test Scenario | Step-by-Step Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CUST-01** | Landing & Location Detection | 1. Open root URL (`/`).<br>2. Click location pill in Navbar.<br>3. Select "Mijar" village or click "Auto-Detect GPS". | Location badge updates to selected village. Relevant local stores and produce dynamically filter. | `[ ] PASS` |
| **TC-CUST-02** | Produce Catalog & Search | 1. Navigate to `/product-listing`.<br>2. Search "Tomato" in search bar.<br>3. Toggle "In Stock Only". | Instant debounced search results appear without layout shift. Out-of-stock items filter accurately. | `[ ] PASS` |
| **TC-CUST-03** | Cart Drawer & Quantities | 1. Click "Add to Cart" on a produce item.<br>2. Open Cart Drawer.<br>3. Increment/decrement quantity with `+`/`-` buttons. | Cart badge updates instantly. Free delivery progress bar calculates accurately. Subtotal reflects qty changes. | `[ ] PASS` |
| **TC-CUST-04** | Checkout & Delivery Slots | 1. Proceed from Cart to Checkout.<br>2. Choose Delivery Speed ("Instant (20 Mins)", "Evening", or "Tomorrow").<br>3. Verify delivery address and contact details. | Slot selection updates delivery estimate. Form validation accepts valid inputs and blocks empty inputs. | `[ ] PASS` |
| **TC-CUST-05** | Dual Payment Execution (UPI & Card) | 1. Select "UPI Instant Payment" -> Click Place Order -> Verify Dynamic QR Code & Copy VPA.<br>2. Select "Credit/Debit Card" -> Click "Fill Stripe Test Card" -> Click Pay. | Instant payment intent triggers, confetti displays, audio chime plays, and user is redirected to Live Order Tracking. | `[ ] PASS` |
| **TC-CUST-06** | Live GPS Order Tracking | 1. In Order Tracking view, inspect order milestones (Confirmed -> Packed -> Dispatched -> Delivered).<br>2. Verify live rider telemetry and call button. | Step indicator highlights progress. Live map coordinates render without error. | `[ ] PASS` |

---

### B. Vendor User Journey & Inventory Hub
| Test Case ID | Test Scenario | Step-by-Step Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-VEND-01** | Vendor Authentication & Hub Access | 1. Sign in with verified Vendor credentials.<br>2. Navigate to `#vendor-portal`. | Vendor Portal header displays store name, active rider telemetry, and sales metrics. | `[ ] PASS` |
| **TC-VEND-02** | Produce Stock Toggle & Price Update | 1. Switch to "Produce & Inventory" tab.<br>2. Click "In Stock / Out of Stock" toggle button.<br>3. Click "Edit Price" -> Update price from ₹32 to ₹35. | Stock status updates with visual feedback. Price changes reflect immediately in the public catalog. | `[ ] PASS` |
| **TC-VEND-03** | Publish Fresh Harvest Item | 1. Click "Add Fresh Harvest Item".<br>2. Enter produce name, unit, category, price, and image URL.<br>3. Click "Publish to Store". | Form sanitization validates inputs. New item appears in the produce catalog with positive status toast. | `[ ] PASS` |
| **TC-VEND-04** | Rider GPS Dispatch Simulation | 1. Switch to "Live Rider Dispatch" tab.<br>2. Click "Dispatch Order" on pending order. | Simulated GPS telemetry updates rider coordinates along delivery route to customer address. | `[ ] PASS` |

---

### C. Role-Based Access Control (RBAC) & Boundary Enforcement
| Test Case ID | Test Scenario | Step-by-Step Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-RBAC-01** | Unauthenticated Guest Boundary | 1. In private/incognito window, navigate directly to `#checkout` or `#my-orders`. | AuthGuard intercepts navigation and presents "Authentication Required" view with post-login redirect preservation. | `[ ] PASS` |
| **TC-RBAC-02** | Customer Crossing into Vendor Portal | 1. Log in as Customer (`role: 'customer'`).<br>2. Navigate to `#vendor-portal`. | Intercepted with `403 — Unauthorized Role` screen stating Vendor privileges are required. | `[ ] PASS` |
| **TC-RBAC-03** | Secure Session Destruction (Logout) | 1. In Profile View, click "Sign Out Securely (Destroy Session)". | All tokens and session caches in `localStorage` and `sessionStorage` are wiped. User is redirected to Home. | `[ ] PASS` |

---

### D. Offline, Network Dropouts & Error Recovery
| Test Case ID | Test Scenario | Step-by-Step Actions | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-RESIL-01** | Offline PWA Behavior | 1. Enable "Offline" mode in Chrome DevTools Network tab.<br>2. Navigate around the catalog. | PWA ServiceWorker serves cached assets. Offline banner displays without full application crash. | `[ ] PASS` |
| **TC-RESIL-02** | API Failure Fallback | 1. Simulate API failure on produce fetch.<br>2. Click "Retry Fetch". | `ErrorStateFallback` renders with retry action. Application recovers gracefully when connectivity resumes. | `[ ] PASS` |
| **TC-RESIL-03** | Rapid Multi-Clicking Protection | 1. On checkout or cart button, click 4 times in rapid succession (< 50ms interval). | `AsyncButton` disables immediately on initial click, preventing duplicate orders or multiple charges. | `[ ] PASS` |

---

## 2. Automated Health Check & Smoke Script

We provide a dedicated post-deployment automated health check script executable with Node.js:

```bash
# Run against default production URL
npm run test:smoke

# Run against custom target or staging preview deployment
node scripts/smoke-test.js https://customervendor-preview.vercel.app
```

### Automated Assertions Checked:
1. **Public Endpoint Reachability**: Verifies HTTP 200 on `/`, `/manifest.json`, `/robots.txt`, `/sitemap.xml`, and `/favicon.svg`.
2. **SPA Client Routing Fallbacks**: Verifies subpaths (`/categories`, `/vendor/portal`, `/orders/tracking`) return 200 without throwing 404.
3. **HTTP Security Headers**: Validates presence and strictness of:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security` (HSTS)
   - `Permissions-Policy`
   - `Content-Security-Policy` (CSP)
4. **Latency & TTFB Benchmarking**: Asserts that Time to First Byte is **under 800ms**.

---

## 3. Rollback & Incident Response Runbook

### A. Vercel Instant Rollback SOP
If a critical production defect (P1/P2) is identified post-release:

#### Option 1: Instant Vercel CLI Rollback (< 30 Seconds)
```bash
# 1. Rollback to the previous stable deployment instantly
vercel rollback

# 2. Or point directly to a known stable deployment URL:
vercel rollback dpl_xxxxxxxxxxxx
```

#### Option 2: Vercel Web Dashboard Instant Rollback
1. Navigate to **Vercel Dashboard** $\rightarrow$ Select `customervendor` project.
2. Go to the **Deployments** tab.
3. Locate the previous verified stable deployment.
4. Click the three dots (`...`) $\rightarrow$ Select **Instant Rollback (Promote to Production)**.
5. Traffic shifts 100% to the previous deployment in $< 15$ seconds without re-building.

---

### B. 24-Hour Post-Release Monitoring Matrix

| Monitoring Dimension | Tool / Source | Health Threshold | Alert Trigger | Action Plan |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP 5xx & Server Errors** | Vercel Analytics / Server Logs | $< 0.1\%$ | $> 1\%$ in a 5-min window | Trigger immediate rollback to previous build. |
| **Client-Side Runtime Exceptions** | Sentry / Browser Console | 0 unhandled fatal crashes | $> 5$ crashes in 15 mins | Investigate `ErrorBoundary` stack trace in Sentry; deploy hotfix. |
| **Core Web Vitals (LCP)** | Vercel Speed Insights | LCP $< 2.5\text{s}$ | LCP $> 3.5\text{s}$ | Audit image CDN compression and chunk caching. |
| **Cumulative Layout Shift (CLS)** | Vercel Speed Insights | CLS $< 0.1$ | CLS $> 0.25$ | Verify explicit width/height on product imagery. |
| **Payment Gateway Webhooks** | Stripe Dashboard / Logs | $100\%$ delivery | Any failed webhook events | Verify Stripe webhook secret and API endpoint reachability. |

---

## 4. Production Release Sign-Off

| Milestone | Sign-Off Role | Status | Date |
| :--- | :--- | :--- | :--- |
| **Automated E2E Suite (`playwright test`)** | QA Automation Lead | `[✔] APPROVED` | 2026-08-26 |
| **DevOps & Security Headers Audit** | DevOps Specialist | `[✔] APPROVED` | 2026-08-26 |
| **Performance & Bundle Code-Splitting** | Frontend Architect | `[✔] APPROVED` | 2026-08-26 |
| **Final Production Smoke Check (`npm run test:smoke`)** | Release Manager | `[✔] APPROVED` | 2026-08-26 |
