# RebookRelay 🔄

**RebookRelay** is an autonomous, intelligent revenue recovery platform designed for service-based businesses (clinics, dental offices, salons). It turns empty chairs and missed appointments into recovered revenue by automatically detecting no-shows, calling them via human-like AI voice agents (powered by CALL-E), and cascading open slots down a prioritized waitlist until they are filled.

---

## 📌 The Problem
No-shows and last-minute cancellations are a massive profit killer for clinics, dentists, and salons, costing businesses **15–30% of their monthly potential revenue**.
*   **Active Chasing is Inefficient:** Front desk staff waste hours manually calling or texting waitlists.
*   **Passive Notification Systems Fail:** Text blasts are easily ignored, and there is no real-time conversational negotiation to handle objections.
*   **Siloed Calendars:** Existing software either only reminds the original client or sends bulk waitlist updates—never managing the cascading logic from one to the other automatically.

## 💡 The Solution
RebookRelay acts as a tireless, 24/7 virtual scheduler. 
1.  **Detects:** Cron workers automatically monitor Google Calendar to spot cancellations and no-shows within 15 minutes.
2.  **Calls (Original Client):** CALL-E initiates an empathetic, ultra-realistic voice call to ask if they are okay and reschedule them.
3.  **Cascades (Waitlist):** If the client declines or fails to answer, the system immediately pulls waitlist candidates prioritized by score and calls them sequentially until the slot is booked.
4.  **Syncs:** RebookRelay updates Google Calendar and logs recovered revenue on a premium dashboard.

---

## 🛠️ Stack & Tool Usage Reference

RebookRelay leverages a production-grade stack of modern tools. Here is how each tool is used in the project:

### 1. Next.js 15 (App Router)
*   **Purpose:** The core full-stack application framework.
*   **Usage:**
    *   **Frontend Routing & UI:** Provides a premium, dark-themed dashboard using React, Framer Motion, and Tailwind CSS.
    *   **API Routes:** Implements API routes under `/api/` to handle client settings, dashboard metrics, Google OAuth redirect logic, and incoming webhooks from CALL-E.
    *   **Middleware Guard:** Protects dashboard pages and APIs from unauthorized access and prevents CSRF attacks.

### 2. Inngest
*   **Purpose:** Event-driven serverless background task orchestrator.
*   **Usage:**
    *   **Orchestration & State Machine:** Manages the multi-step cascading call workflow (original client ➡️ waitlist 1 ➡️ waitlist 2) securely.
    *   **Serverless Sleep:** Pauses function execution indefinitely (cost-free) while waiting for external human phone calls to finish.
    *   **Cron Scheduler:** Schedules a recurring job every 15 minutes to trigger the Google Calendar sync.

### 3. CALL-E SDK & API
*   **Purpose:** Ultra-realistic voice conversational AI.
*   **Usage:**
    *   **AI Calling:** Initiated in `calle.ts` using the official `@call-e/calle` client. It instructs CALL-E to call patients with a dynamically built script.
    *   **Webhook Receivers:** Sends transcript turns and booking outcomes (`BOOKED`, `DECLINED`, `NO_ANSWER`) back to Next.js webhook routes to resume Inngest workflows.

### 4. Prisma ORM
*   **Purpose:** Next-generation TypeScript Database Client.
*   **Usage:**
    *   **Database Queries:** Handles all queries to Postgres with strict type safety. Scopes metrics, settings, and OAuth configurations to the logged-in clinic's unique session cookie ID.
    *   **Schema & Migrations:** Maps relational data models and tracks database schema modifications in version-controlled SQL files under `prisma/migrations/`.

### 5. Neon Postgres
*   **Purpose:** Serverless PostgreSQL cloud database.
*   **Usage:**
    *   **Persistent Storage:** Hosts all records for clinics, users, calendar sync logs, waitlist rankings, and individual call logs.

### 6. Google Calendar API (`googleapis`)
*   **Purpose:** Clinic calendar synchronization.
*   **Usage:**
    *   **Authentication:** Uses Google OAuth 2.0 flow to retrieve and store secure clinic refresh tokens.
    *   **Calendar Syncing:** Reads events dynamically using `calendar.events.list` to identify cancelled slot tags (e.g. `#noshow`) and books waitlist clients back into open spots.

---

## 📁 File Structure

```
├── prisma/
│   ├── migrations/             # SQL database migration versions
│   └── schema.prisma           # Prisma database schema definitions (Neon Postgres)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Signup and login endpoints
│   │   │   ├── calendar/sync/  # Sync trigger api
│   │   │   ├── dashboard/      # Dashboard metrics API
│   │   │   ├── inngest/        # Inngest background event routing
│   │   │   └── settings/       # Scoped clinic settings
│   │   ├── auth/               # Auth UI screens (Login / Signup)
│   │   ├── dashboard/          # Sidebar layouts and metrics views
│   │   └── page.tsx            # Homepage & Hero Section
│   ├── components/             # Reusable UI component elements (Framer Motion, Lucide)
│   └── lib/
│       ├── calendar-sync.ts    # Google Calendar API integration
│       ├── calle.ts            # CALL-E SDK setup and call handlers
│       ├── inngest.ts          # Inngest Serverless State Machine Workflow
│       └── prisma.ts           # Prisma database client
├── .env                        # Configuration secrets
├── next.config.ts              # Next.js configurations
└── tailwind.config.ts          # Styles config
```

---

## 🚀 Setup & Installation Instructions

### 1. Prerequisites
Ensure you have the following installed locally:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
*   [Inngest CLI](https://www.inngest.com/docs/local-development) (for local background jobs)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Config
Create a `.env` file in the root folder and add your credentials:
```env
# Neon Postgres Database URL
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# CALL-E Credentials
CALL_E_API_KEY="your_calle_api_key"

# Google Calendar OAuth Config
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google-calendar-callback"

# Inngest Keys (Self-hosted or Cloud)
INNGEST_EVENT_KEY="your_inngest_event_key"
INNGEST_SIGNING_KEY="your_inngest_signing_key"

# App URL Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Schema Sync
Run the database migrations to set up your tables in the Neon PostgreSQL instance:
```bash
npx prisma migrate dev --name init
```

### 5. Running the Application
To run the local Next.js dev server and the Inngest background job orchestrator, run the following:

**Terminal 1 (Next.js Application):**
```bash
npm run dev
```

**Terminal 2 (Inngest Dev Server):**
```bash
npx inngest-cli dev
```

Visit the application at `http://localhost:3000`.

---

## 🛠️ How to Use RebookRelay

1.  **Register your Clinic:** Create an account on the Signup screen.
2.  **Connect Google Calendar:** Go to settings or the integration tab and click **"Connect Google Calendar"**. Complete the OAuth consent loop to allow calendar syncing.
3.  **Configure Waitlist:** Add waitlist entries with customer phone numbers and priority preferences.
4.  **Trigger Recovery Sync:** 
    *   The app runs a cron checker every 15 minutes.
    *   Alternatively, you can click the **"Trigger Test Cascade"** button directly on the dashboard to test and preview the entire call-and-rebook workflow visually!

---

## 📜 License
Licensed under the [MIT License](LICENSE).
