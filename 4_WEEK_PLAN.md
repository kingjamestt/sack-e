# 4-Week Implementation Plan — Fete Online Ticketing Platform

**Client:** Shakir Harewood
**Developer:** Brandon L. S. James (BS Web Solutions)
**Goal:** Reach Public Launch in 4 weeks from kickoff.

This document serves as the single source of truth for the project's roadmap and current progress. All agents should consult and update this document as tasks are completed.

## Current State of the Platform
**Core features already built and functional from prototype:**
- [x] User Authentication (Email, Google, Phone)
- [x] Event Creation & Organizer Dashboard
- [x] Ticket Tier Management (Early Bird, VIP, etc.)
- [x] Team Collaboration & Access Levels
- [x] Digital Ticket Wallet
- [x] Secure Ticket Transfers
- [x] QR Code Scanner Portal
- [x] Platform Master Admin Dashboard
- [x] Mobile-Responsive UI
- [x] WiPay Payment Integration (Test Mode)

---

## Week 1 — Email System, Analytics & Offline Scanner
**Goal:** Build out all features that can be developed independently without requiring client availability.

### Day 1–2: Automated Email System
- [x] Integrate a transactional email provider (Resend is installed, basic route exists).
- [x] Design and build HTML email templates for:
  - Purchase Confirmation — Order summary, event details, and a link to their digital wallet (No PDF to prevent fraud).
  - Ticket Transfer Notification — Alert the recipient that a ticket has been sent to them.
  - Event Reminder — Sent 24 hours before the event.
- [x] Test full email delivery pipeline across Gmail, Yahoo, and Outlook to check spam filtering.

### Day 3: QR Code Day-of-Event Display Logic
- [x] Implement logic so that the QR code on a user's ticket is hidden/blurred until 12:00 AM on the day of the event.
- [x] Display a countdown timer or message: "Your QR code will be available on [Event Date]."
- [x] Ensure server-side validation so the QR payload cannot be extracted early via API inspection.

### Day 4: Basic Analytics Dashboard
- [x] Build an organizer-facing analytics view showing:
  - Total tickets sold (by tier).
  - Total gross revenue.
  - Sales-over-time line chart (daily granularity).
  - Remaining inventory per tier.
- [x] Add a simple CSV export button for sales data (organizers will need this for accounting).
- [x] Build a platform-wide admin analytics summary for Shakir (total platform revenue, total events, total users).

### Day 5: Offline Scanner Persistence
- [x] Enable **Firestore Offline Persistence** in the scanner web app.
- [x] Build a "Sync Before Event" button that pre-downloads the full attendee list to the device's local cache.
- [x] Implement local IndexedDB ledger to track scanned ticket IDs while offline, preventing duplicate scans at the same gate.
- [x] On reconnection, automatically sync all offline scans back to Firestore and reconcile with any scans made at other gates.
- [x] Add a visible online/offline status indicator on the scanner UI so staff know their connection state.

**Week 1 Deliverable:** Email pipeline, analytics dashboard, day-of QR logic, and offline scanner are all complete. Client is notified to prepare WiPay live credentials for Week 2.

---

## Week 2 — WiPay Live Activation & Performance Hardening
**Goal:** Coordinate with the client to go live on payments and stress-test the platform under real-world load.

### Day 6–7: WiPay Live Activation (Requires Client)
- [ ] Coordinate with Shakir to obtain **live WiPay production credentials**.
- [ ] Switch WiPay integration from sandbox/test mode to live production.
- [x] Coordinate with Shakir to obtain **live WiPay production credentials**.
- [x] Switch WiPay integration from sandbox/test mode to live production.
- [x] Conduct 3 real micro-transactions ($1 TTD each) to verify end-to-end payment flow.
- [x] Implement and test WiPay webhook listeners for payment confirmation callbacks.
- [x] Add proper error handling for declined cards, network timeouts, and duplicate charges.
- [x] Build a payment receipt page shown to the user after successful checkout.

### Day 8–9: Load Testing & Performance Hardening
- [x] Refactor ticket reservation logic (`reserveTickets` in `src/lib/events.ts`) to use Firestore Transactions, preventing "stampedes" and race conditions.
- [x] Implement Edge Rate-Limiting middleware (`src/middleware.ts`) using Vercel KV / `@upstash/ratelimit` to protect against bot abuse.
- [x] Perform strict audit of `firestore.rules` to lock down `reservations` and `tickets` access.
- [x] Optimize Next.js bundle size and implement remote image caching for `firebasestorage.googleapis.com` in `next.config.ts`.
- [x] Add graceful error boundary UI (`error.tsx`) to the checkout flow.

### Day 10: End-to-End Integration Testing
- [x] Extract WiPay `account_number` and `environment` into `.env.local` for seamless transition to live mode.
- [x] Build highly secure server-to-server webhook endpoint (`/api/wipay/webhook`) to validate MD5 hashes.
- [x] Run the complete user journey with live payments: Sign up -> Buy ticket -> Receive email -> View ticket in digital wallet -> Wait for QR on event day -> Scan at door.
- [x] Verify analytics dashboard reflects real transaction data.
- [x] Test offline scanner with live ticket data.

**Week 2 Deliverable:** WiPay is live and processing real payments. The full purchase-to-email pipeline works end-to-end with real money. The platform has been stress-tested and hardened for real traffic.

---

## Week 3 — Branding, Polish & Staging Event
**Goal:** Make it look like Shakir's brand (not a prototype) and run the first real-world test.

### Day 11–12: Client Branding & Domain
- [x] Replace all placeholder text with Shakir's official brand name.
- [x] Integrate Shakir's logo, brand colours, and typography across the platform.
- [ ] Configure Shakir's custom domain (DNS setup, SSL certificate). (ON HOLD)
- [ ] Set up Firebase Hosting / Vercel production environment on the custom domain. (ON HOLD)
- [x] Configure robots.txt, sitemap, Open Graph meta tags, and social sharing preview cards.

### Day 13: User Profiles & Final UI Polish
- [x] Implement user profile page (profile picture upload, name editing, contact info).
- [x] Final UI/UX sweep across devices (iPhone Safari, Android Chrome, Desktop).
- [x] Add a "Contact Us" / "Support" link in the footer and nav.

### Day 14–15: Staging Live Event Test (Internal)
- [ ] Shakir creates a real test event on the platform.
- [ ] Recruit 10–15 real people to purchase tickets, transfer tickets, and have QR codes scanned.
- [ ] Document all issues discovered during the live test in a shared bug tracker.
- [ ] Deliberately test offline scanning: turn off Wi-Fi/data on a scanner phone, scan 5 tickets, then reconnect and verify sync.

**Week 3 Deliverable:** The platform is fully branded, polished, and has survived its first real-world event with real money and real people walking through a door.

---

## Week 4 — Bug Fixes, Security Audit & Public Launch
**Goal:** Fix everything from the staging test, lock down security, and go live.

### Day 16–17: Bug Fix Sprint
- [ ] Triage and fix every bug discovered during the Week 3 live event test.
- [ ] Priority order: payment issues → scanner issues → email issues → UI issues.
- [ ] Re-test every fixed bug to confirm resolution.

### Day 18: Security & Data Audit
- [ ] Full Firestore Security Rules audit (no unauthenticated reads/writes, isolation between organizers).
- [ ] Verify WiPay webhook signature validation is active.
- [ ] Ensure all API routes have proper authentication middleware.
- [ ] Review and sanitize all user-generated content inputs against XSS.
- [ ] Confirm HTTPS is enforced on all routes.

### Day 19: Organizer Payout Reporting
- [ ] Build a payout summary page for organizers.
- [ ] Add CSV export for payout reports.

### Day 20: Final Pre-Launch Checklist & Go-Live
- [ ] Run through the complete user journey one final time.
- [ ] Verify custom domain is live and SSL is green.
- [ ] Confirm Google Analytics / basic tracking is active.
- [ ] Set up Firestore automated daily backups.
- [ ] Set up uptime monitoring with SMS alerts.
- [ ] Deploy production build to custom domain.
- [ ] Notify Shakir: Platform is officially LIVE.

**Week 4 Deliverable:** Platform is publicly live on Shakir's custom domain, fully secured, monitored, and ready for real organizers to list real events.
