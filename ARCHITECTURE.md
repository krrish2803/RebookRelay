# System Architecture 🏗️

This document details the end-to-end system architecture of **RebookRelay**, showing how the calendar synchronization, background orchestration, and voice API layers interact.

---

## 🗺️ Architectural Workflow

The diagram below maps the complete cycle of a no-show incident being caught, processed, and recovered through the cascading waitlist.

```mermaid
graph TD
    %% Define system actors and steps
    A[Google Calendar] -- 1. Cron Sync: 15 mins --> B(calendar-sync.ts)
    B -- 2. Detect No-Show / Cancellation --> C{Save to database}
    C -- Store Incident --> D[(Neon PostgreSQL)]
    C -- 3. Dispatch Event --> E[Inngest Event Bus]
    
    %% Inngest workflow runs
    E -- 4. Triggers State Machine --> F[inngest.ts: recoveryWorkflow]
    F -- 5. Generate Script & Call --> G[calle.ts: CALL-E SDK]
    G -- 6. Call original client --> H([Client Phone])
    
    %% Webhook loop
    H -- 7. Hangup & Process --> I[CALL-E Production Servers]
    I -- 8. Webhook Callback --> J[Next.js API: /api/calls/webhook/calle]
    J -- 9. Log transcript & outcome --> D
    J -- 10. Wake up Workflow --> F
    
    %% Decisions
    F -- 11. Check Outcome --> K{Client Rebooked?}
    K -- Yes --> L[Update Google Calendar & Complete]
    K -- No / Declined --> M[Query prioritized waitlist in DB]
    
    %% Cascade Sequence
    M -- 12. Retrieve Next Person --> N[Waitlist Person #1]
    N -- 13. Initiate Call Sequence 2 --> G
    
    %% Re-evaluate Waitlist 1
    G -- Call waitlist client --> O([Waitlist Phone 1])
    O -- Webhook return --> J
    F -- 14. Check Outcome 2 --> P{Waitlist Booked?}
    P -- Yes --> Q[Write new booking to Google Calendar]
    P -- No / Declined --> R[Query next candidate]
    
    %% Depth 3 Sequence
    R -- 15. Retrieve Next Person --> S[Waitlist Person #2]
    S -- 16. Initiate Call Sequence 3 --> G
```

---

## ⚙️ Core Technical Stack

### 1. Database Layer (Neon Postgres + Prisma)
We utilize a relational Postgres database hosted on Neon. The schema structures multi-tenancy:
*   **Clinics & Staff:** Authenticated accounts linked via unique workspace IDs.
*   **CalendarEvents:** Local cached events for state tracking and delta comparison.
*   **WaitlistPerson:** Clients grouped by service types, ordered dynamically by their **Priority Score**:
    $$\text{Priority Score} = \left(\frac{\text{Days Waiting}}{30}\right) \times 0.6 + (\text{Recency} \times 0.4)$$
*   **RecoveryCases & CallAttempts:** Audit logs showing cascade path metrics.

### 2. Orchestration State Machine (Inngest)
Because voice phone calls are synchronous and can take minutes, standard API endpoints would time out. RebookRelay leverages **Inngest** to build a durable serverless workflow. Inngest handles:
*   **Serverless Sleeps:** Pauses execution state machine until CALL-E completes the call.
*   **Decisions:** Determines if it should stop the run (on successful booking) or cascade to the next waitlist index.
*   **Resiliency:** Automatically handles retries and step caching to prevent duplicating phone calls.

### 3. Voice AI Endpoint (CALL-E SDK)
The unmocked integration calls the live CALL-E API using the `@call-e/calle` SDK:
*   **Structured Output:** Webhooks deliver JSON payloads detailing client intent, call sentiment analysis, and complete transcript turns.
*   **Compliance:** The system respects telecom regulations by verifying clinic telephone headers and ignoring invalid call routing parameters.
