# Washly — Smart Laundry Booking & Tracking System

A full-stack web application for managing laundry bookings in university residences. Students can register, book washing machines, track laundry progress in real time, and receive notifications when cycles complete.

Built for the **MUT Capstone Project** integrating DS3, IS3, and IP2 modules.

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (styling)
- React Router (navigation)
- Clerk (authentication)
- Supabase Realtime (live updates)

### Backend
- Node.js + Express (REST API)
- Supabase PostgreSQL (database)
- Clerk (JWT validation)
- Groq AI (laundry time suggestions)
- SendGrid (email notifications)
- Vonage SMS (SMS notifications)

### Infrastructure
- Supabase (hosted PostgreSQL + auth)
- Clerk (managed authentication)
- Cisco Packet Tracer (IoT simulation)
- Power BI (analytics dashboards)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (free tier)
- A Clerk application (free tier)
- SendGrid API key (free tier: 100 emails/day)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Fill in your .env values (Clerk publishable key)
npm run dev
```

App runs on `http://localhost:5173`

## Environment Variables

### Backend (.env)
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key (backend only)
- `CLERK_SECRET_KEY` — Clerk secret key
- `GROQ_API_KEY` — Groq AI API key
- `SENDGRID_API_KEY` — SendGrid API key
- `FRONTEND_URL` — Frontend URL for CORS (default: http://localhost:5173)

### Frontend (.env)
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `VITE_API_URL` — Backend API URL (default: http://localhost:5000)

## Project Structure

```
washly/
├── backend/
│   ├── config/          # Supabase, Clerk, Groq, SendGrid clients
│   ├── middleware/      # Clerk auth, validation
│   ├── routes/          # API route handlers
│   ├── controllers/     # Business logic
│   ├── services/        # AI, email, external integrations
│   ├── utils/           # Error handling, helpers
│   ├── app.js          # Express server entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/        # Axios client
    │   ├── components/ # Reusable React components
    │   ├── pages/      # Full page components
    │   ├── context/    # React Context (Auth)
    │   ├── utils/      # Helper functions
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Key Features

- **Digital Booking** — Students book machines online, no physical queue
- **Real-Time Status** — IoT sensors update machine status every 10 seconds
- **AI Suggestions** — Groq AI suggests optimal booking times based on current load
- **Live Tracking** — Students see laundry progress, temperature, water level
- **Notifications** — SendGrid email + Vonage SMS when laundry is done
- **Admin Dashboard** — View all machines, bookings, sensor data, AI suggestions
- **Power BI Analytics** — Executive dashboards for usage patterns and peak hours

## API Endpoints

### Health
- `GET /api/health` — Server status (no auth required)

### Users
- `POST /api/users/sync` — Sync Clerk user to Supabase on first login

### Machines
- `GET /api/machines` — List all machines with current status
- `GET /api/machines/:id` — Get machine details + latest sensor reading
- `PATCH /api/machines/:id/status` — Admin: update machine status

### Bookings
- `GET /api/bookings` — Student: their bookings / Admin: all bookings
- `POST /api/bookings` — Create a new booking
- `PUT /api/bookings/:id` — Modify booking (reschedule)
- `DELETE /api/bookings/:id` — Cancel booking

### Sensors
- `GET /api/sensors` — Latest reading per machine (admin)
- `GET /api/sensors/:machine_id` — Sensor history (Power BI)
- `POST /api/sensors/reading` — IoT ingest endpoint (simulated sensor)
- `POST /api/machines/start` — Start IoT simulation (demo trigger)

### AI
- `POST /api/ai/suggest` — Get laundry time suggestion from Groq

### Notifications
- `POST /api/notify/complete` — Send completion email + SMS

## Development Notes

### Free-Tier APIs Used
- **Supabase** — 500 MB storage, unlimited API calls (free tier)
- **Clerk** — Up to 5,000 monthly active users (free tier)
- **Groq** — Free access to Mixtral-8x7B model
- **SendGrid** — 100 emails/day (free tier)
- **Vonage SMS** — Free trial credit available

### No Paid Options
This project uses only free or open-source tools. No credit card required beyond sign-ups.

### Code Style
- Backend: CommonJS with async/await, consistent error handling
- Frontend: ES modules, React hooks, Tailwind utility classes
- Database: PostgreSQL 3NF with referential integrity

## Team Roles

- **Davis** — Tech Lead / Backend architecture
- **Stamina** — Backend endpoints / IoT simulation
- **Asanda** — Booking logic / Postman testing
- **Anele** — Frontend pages / Slides
- **Amahle** — Documentation / Power BI dashboards
- **Babalo** — Groq prompt design
- **Gwabe** — BPMN diagrams / Final report

## Demo Script (Week 6)

1. Student signs in via Clerk
2. Views machines page with real-time status
3. Gets AI suggestion for best booking time
4. Books a machine
5. Clicks "Start Machine" — IoT simulation begins
6. Tracking page updates live (temp, water level, progress %)
7. Cycle completes — notification fires
8. Admin view: sensor history, all bookings, Power BI dashboard

Full flow must complete in under 15 minutes.

## License

MIT

## Contact

Team Washly — MUT Capstone 2025
# Washly
# Washly # Washly
