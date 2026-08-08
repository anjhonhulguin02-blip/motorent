# Full-Stack Motorcycle Rental Web Application

A modern, responsive full-stack web application designed to streamline the motorcycle rental experience. This system features real-time transaction tracking, automated contract lifecycle computation, secure client data management, and user verification workflows.

## Key Features

- **Dynamic Vehicle Showcase:** Provides a seamless, cross-platform vehicle browsing and real-time client booking experience built with React.js.
- **Real-Time Financial Syncing:** Implements precise, automated mathematical calculations for **Downpayments** and **Remaining Balances**, fully synchronized between the Supabase database and the client payment modal interface.
- **Secure Authentication & Guarded Data:** Powered by Supabase Auth and robust PostgreSQL Row-Level Security (RLS) policies to ensure completely protected and isolated transactional client data.
- **Government ID Verification Gateway:** Features a dynamic verification interface allowing clients to upload their valid Government ID or Driver's License securely before unit dispatch.
- **Bilingual & Localization Ready:** Engineered with an architecture prepared to support instant Tagalog and English language localization switches.

## Tech Stack

- **Front-end:** React.js, JavaScript (ES6+), CSS3 (Modern Glassmorphism UI)
- **Back-end & Database:** Supabase (Backend-as-a-Service), PostgreSQL
- **State Management & Tools:** React Hooks (`useState`, `useEffect`), Git/GitHub

---

##  Project Status & Technical Notes (Incomplete Features)

> ** Note to Reviewers / Recruiters:** > This project is currently in an **Active Development Phase**. While the core booking lifecycle, database communication, and main UI workflows are 100% stable and operational, a few advanced features are scheduled for the upcoming development sprints:

1. **Lease Extension Logic (In Progress):**
   - *Status:* The user interface button for "Extend Lease" is fully visible on the Dashboard for units with a 'Picked Up' status. However, the backend automation script to calculate the additional prorated charges is currently being authored.
2. **Automated Payment Gateway Integration:**
   - *Status:* Currently, the payment workflow relies on manual reference string inputs and client-side state triggers (mock GCash integration). Full production integration with official APIs (e.g., PayMongo or official GCash Webhooks) is on the active project roadmap.
3. **Admin Dashboard Analytics:**
   - *Status:* Client-side lifecycles and backend updates are fully complete. Advanced internal analytics dashboards for administrators (such as monthly revenue reporting and unit utilization statistics) are currently being built in a separate development branch.

---

## Local Development Setup

Follow these steps to clone and run this project locally on your machine:

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name
