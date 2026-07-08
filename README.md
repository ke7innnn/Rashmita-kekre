# Health 360 Physiotherapy Clinic — Patient CRM & Reception Dashboard

This is Dr. Rashmita Karvir Kekre's modern clinic CRM web application. It integrates the OPD appointments scheduling, patient clinical timelines, AI Voice call history (transcripts and follow-ups), and website sync widgets into a premium unified cream-and-sage dashboard.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Cream-based theme)
- **Database:** PostgreSQL via Prisma ORM 7 (with native driver adapter `pg` + `@prisma/adapter-pg`)
- **Authentication:** NextAuth.js
- **State Management:** TanStack Query & Zustand

---

## Getting Started

### 1. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database connection URL for PostgreSQL (used by both migrations and client)
DATABASE_URL="postgresql://username:password@localhost:5432/health360?schema=public"

# NextAuth secret key (for session cookie signing)
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Voice Agent Integration Webhook security (Optional)
AI_AGENT_WEBHOOK_SECRET="secure-webhook-api-token"
```

### 2. Database Migration & Initialization
Apply the database migrations and seed the database with realistic sample records (Admin User, modalities, patients, call logs, and daily appointments):
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations (ensure local or managed Postgres is running and DATABASE_URL is set)
npx prisma db push

# Seed the database
npx prisma db seed
```
*Note: Seeding creates two user roles:*
- **Admin role:** Username: `rashmita` | Password: `rashmita123`
- **Receptionist role:** Username: `receptionist` | Password: `receptionist123`

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## Integration API Contracts

### A. Website Booking Sync (`POST /api/public/book`)
The public-facing booking widget on the clinic's public website sends bookings here. Input payloads are validated with Zod and checked against clinic working hours/holidays/availability before insertion.

#### Webhook Request Format
```json
{
  "fullName": "Karan Malhotra",
  "phone": "+919876543210",
  "gender": "Male",
  "dateOfBirth": "1994-05-15",
  "date": "2026-07-06",
  "startTime": "10:30",
  "treatmentType": "Manual Therapy & Joint Mobilization",
  "notes": "Patient reports severe lower back pain."
}
```

#### Success Response
```json
{
  "success": true,
  "message": "Appointment booked successfully.",
  "booking": {
    "id": "cly12345abcde",
    "patientName": "Karan Malhotra",
    "date": "2026-07-06",
    "time": "10:30",
    "treatmentType": "Manual Therapy & Joint Mobilization"
  }
}
```

---

### B. AI Voice Agent Sync (`POST /api/call-logs`)
Integrate inbound/outbound voice systems (e.g. Bland AI, Retell, Vapi) to log phone interactions, transcripts, summaries, outcomes, and trigger database booking writes automatically.

#### Webhook Request Format (with active booking/cancellation actions)
Provide `x-api-key` in headers matching `AI_AGENT_WEBHOOK_SECRET` for security.
```json
{
  "direction": "INBOUND",
  "phoneNumber": "+919876543210",
  "duration": 142,
  "transcript": "Agent: Welcome to Health 360. How can I help? ...",
  "summary": "Patient Rohan called to schedule a dry needling session.",
  "outcome": "BOOKED",
  "actionDetails": {
    "fullName": "Rohan Joshi",
    "date": "2026-07-06",
    "startTime": "11:30",
    "treatmentType": "Dry Needling"
  }
}
```
*Possible `outcome` options:* `BOOKED` | `RESCHEDULED` | `CANCELLED` | `INQUIRY_ONLY` | `FOLLOW_UP_NEEDED` | `MISSED`
- Outoming outcomes of `FOLLOW_UP_NEEDED` are automatically pushed to the **Follow-up Queue** panel in the CRM for receptionist callbacks.
