# Full-Stack Motorcycle Rental Web Application

A modern, responsive full-stack web application designed to streamline the motorcycle rental experience. This system features real-time transaction tracking, automated contract lifecycle computation, secure client data management, and user verification workflows.

**Live demo:** https://motorent-xi.vercel.app/

## Key Features

- **Dynamic Vehicle Showcase:** Provides a seamless, cross-platform vehicle browsing and real-time client booking experience built with React.js.
- **Real-Time Financial Syncing:** Implements precise, automated mathematical calculations for **Downpayments** and **Remaining Balances**, fully synchronized between the Supabase database and the client payment modal interface.
- **Secure Authentication & Guarded Data:** Powered by Supabase Auth and robust PostgreSQL Row-Level Security (RLS) policies to ensure completely protected and isolated transactional client data.
- **Government ID Verification Gateway:** Features a dynamic verification interface allowing clients to upload their valid Government ID or Driver's License securely before unit dispatch.
- **Lease Extension:** Clients can extend an active rental directly from the dashboard; the extension fee is recalculated from live fleet rates and tracked through to payment confirmation.
- **Admin Dashboard:** Approve, reject, and complete bookings, confirm manual cash/GCash payments, auto-calculate late-return penalties, and manage the fleet (add/edit/price/availability) from a dedicated fleet manager.
- **Bilingual & Localization Ready:** Engineered with an architecture prepared to support instant Tagalog and English language localization switches.

## Tech Stack

- **Front-end:** React.js, JavaScript (ES6+), CSS3 (Modern Glassmorphism UI)
- **Back-end & Database:** Supabase (Backend-as-a-Service), PostgreSQL
- **State Management & Tools:** React Hooks (`useState`, `useEffect`), Git/GitHub

---

## Project Status & Roadmap

> **Note to Reviewers / Recruiters:** Core booking lifecycle, admin management, database security (RLS), and the lease-extension flow are complete and operational. The following are known, intentional gaps:

1. **Payment Gateway:** Payment currently relies on manual GCash/Maya screenshot upload, reviewed and confirmed by an admin. Integration with a real payment processor (e.g. PayMongo) is planned but not yet implemented.
2. **Admin Analytics:** There is no revenue/utilization reporting dashboard yet — the admin view currently covers bookings and fleet management only.
3. **Localization:** The UI has scattered `en`/`tl` conditionals in place but no full i18n framework wired up yet.

---

## Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/anjhonhulguin02-blip/motorent.git
cd motorent
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root with your own Supabase project credentials:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
(The anon key is safe to expose client-side — access control is enforced by PostgreSQL Row-Level Security policies, not by hiding this key.)

### 4. Run the dev server
```bash
npm run dev
```

Open the URL Vite prints in the terminal (usually `http://localhost:5173`).
