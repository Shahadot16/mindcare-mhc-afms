# MindCare · MHC-AFMS

**Mental Health Care Administrative & Financial Management System**, a full-stack **MERN** application
(MongoDB, Express, React, Node.js) with real-time features. It began as a rebuild of an ASP.NET MVC academic
project and grew into a complete clinic platform: clinical (appointments, prescriptions, mental-health
screenings, risk alerts), communication (live notifications, doctor–patient chat), and financial
(billing, payments, expenses, payroll, profit & loss).

> Payments are **simulated**: no real money is charged, and card numbers or PINs are never stored.

---

## Highlights

| Area | What's inside |
|------|---------------|
| **Scheduling** | 15-minute slot booking with a DB-level double-booking guard · doctor weekly hours · doctor leave (cancels affected bookings and notifies patients) · daily reminder job (cron) for tomorrow's visits |
| **Clinical** | Diagnosis, prescription, follow-up, suggested lab tests · patient accepts/declines tests · lab queue with results · printable prescriptions |
| **Mental health** | Daily **mood tracker** (mood, emotions, sleep, anxiety, journal) · **PHQ-9** and **GAD-7** self-assessments with severity scoring and trend charts · **risk alerts** to the treating doctors when a PHQ-9 answer indicates self-harm · full **patient record** for doctors |
| **Video consultation** | Book **In-person (15 min)** or **Video (30 min)** · separate evening video hours per doctor · waiting room with camera/mic test · doctor admits the patient · **WebRTC** peer-to-peer audio/video with **Socket.io signaling** (free Google STUN, optional TURN) · mute, camera off (audio-only), screen share, in-call chat, rejoin after a drop · 1-hour and 10-minute reminders · no-show marking · call duration saved |
| **Real-time** | **Socket.io** live notifications (bell plus toasts) · **doctor ↔ patient chat** with typing indicator and read receipts |
| **Billing** | Invoices = consultation + accepted tests · automatic **40% follow-up discount** · simulated Card / bKash / Nagad / Rocket payments · atomic "pay once" guard · printable receipts · email receipts |
| **Finance** | Revenue report (by day, doctor, test, method) · **expenses** with categories · **payroll** (base salary + doctor commission on paid consultations, draft → paid) · **profit & loss** by month · CSV export |
| **Analytics** | Busiest-hours **heatmap** · doctor **utilisation** · completion/cancellation rates |
| **Security** | JWT auth · bcrypt · role-based guards on every route · **forgot/reset password** (hashed, expiring token) · Helmet · login rate limiting · **audit log** of sensitive actions |
| **Quality** | 30 API integration tests (`node:test` + Supertest) · GitHub Actions CI · Docker / docker-compose · lazy-loaded React routes |

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS v4, Recharts, Socket.io client, lucide-react |
| Backend | Node.js, Express 5, Mongoose 8, Socket.io, JWT, bcrypt, Helmet, express-rate-limit, Nodemailer, node-cron |
| Database | MongoDB (local or Atlas) |
| Tooling | node:test + Supertest, oxlint, Docker, GitHub Actions |

---

## Quick start (local)

Requirements: **Node.js 20+** and **MongoDB** (local service or an Atlas cluster).

```bash
npm run install:all      # installs root, server and client packages
npm run seed:reset       # wipes the database and loads ~6 months of demo data
npm run dev              # API + realtime on :5050, web app on :5180
```

Open **http://localhost:5180**

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Staff | staff@hospital.com | staff123 |
| Patient | patient@hospital.com | patient123 |

More patients (all with password `patient123`): `ayesha@example.com`, `karim@example.com` (has an open risk alert),
and about 60 generated ones. Other doctors: `tanvir@`, `sadia@`, `mahmud@hospital.com` (password `doctor123`).

### What the demo data includes

- About 1,200 completed and paid visits over the last ~5 months, spread across 4 doctors and 63 patients
- Today: 2 approved visits for Dr. Farhana (Rahim's is a follow-up, so billing shows the 40% discount)
- Expenses and paid payroll runs for previous months, so Profit & Loss has real numbers
- PHQ-9 / GAD-7 history (Rahim improving over 3 months), 35 days of mood check-ins, chat messages
- An unreviewed **risk alert** for Karim Hossain, plus upcoming doctor leave for Dr. Tanvir

### Using MongoDB Atlas

Edit `backend/.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/mhc_afms
```

then run `npm run seed:reset`.

### Email

Without SMTP settings, emails (password reset, bills, receipts, reminders) are **printed to the server console**,
and the forgot-password page shows the reset link directly (development only). Add `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` to `backend/.env` to send real email.

---

## Tests

```bash
cd server
npm test        # uses a separate database: mhc_afms_test (override with MONGO_URI_TEST)
```

The 30 integration tests cover: access control, sign-up role safety, password reset, double booking,
doctor leave, the follow-up discount, payment validation and the pay-once guard, payroll commission,
P&L, PHQ-9 scoring and risk alerts, mood upsert, record privacy, chat permissions, the audit log, and video calls (30-minute slots, video hours, call access, the call window, no-show).

## Docker

```bash
docker compose up --build
docker compose exec backend node src/seed/index.js --reset
# open http://localhost:8080
```

nginx serves the React build and proxies `/api` and `/socket.io` to the API container.

## CI

`.github/workflows/ci.yml` runs the API tests against a MongoDB service, then lints and builds the web app,
on every push to `main` and on every pull request.

---

## Business rules

- Slots are 15 minutes inside the doctor's hours. A unique partial index on (doctor, date, time) makes double-booking impossible.
- Status flow: **Pending → Approved → Completed**, or **Cancelled** (frees the slot).
- A visit can be completed only on or after its date. Notes are locked once billed.
- Doctor leave blocks the day and auto-cancels its bookings, with patient notifications.
- **Bill** = consultation + accepted/completed tests. A completed visit with the same doctor in the previous
  2 months gives **40% off** the consultation.
- **Revenue** = money actually received (paid invoices, by payment date).
- **Payroll** = base salary + (doctor's commission % × paid consultation revenue that month). Paid runs are locked.
- **Profit** = revenue − expenses − payroll.
- PHQ-9 item 9 > 0 raises a **high-priority risk alert** to every doctor treating the patient and to admins,
  until a doctor marks it reviewed.
- Chat is allowed only between a doctor and a patient who share a non-cancelled appointment.
- Users and tests with history are deactivated rather than deleted.
- **Video calls:** a video visit is 30 minutes (two slots). The waiting room opens 10 minutes early; the doctor can admit
  the patient 5 minutes early; the doctor sees a warning 5 minutes before the end; the call closes 10 minutes after the
  slot (grace time). The doctor can mark a no-show 10 minutes after the start; if the doctor is 15+ minutes late the
  patient can cancel at no cost. Only the appointment's doctor and patient can join, and times use the server clock.
  Audio and video go directly between the two browsers and are never stored on the server.

## Project structure

```
Mental Health Care AFMS/
├── backend/                    Express API + Socket.io       → see backend/README.md
│   ├── src/
│   │   ├── server.js           entry point
│   │   ├── app.js              Express app
│   │   ├── config/             database connection
│   │   ├── constants/          PHQ-9 / GAD-7 definitions
│   │   ├── models/             13 Mongoose models
│   │   ├── routes/             *.routes.js, one per feature
│   │   ├── controllers/        *.controller.js, one per feature
│   │   ├── middleware/         auth, rate limit, errors
│   │   ├── services/           notifications, socket, mail, audit
│   │   ├── jobs/               reminder cron job
│   │   ├── utils/              time/slots, HTTP errors
│   │   └── seed/               demo data
│   └── test/                   API integration tests
│
├── frontend/                   React web app                  → see frontend/README.md
│   └── src/
│       ├── app/                routes
│       ├── api/                axios client
│       ├── context/            auth + realtime
│       ├── hooks/
│       ├── components/         ui/ layout/ routing/ appointments/ patients/ charts/
│       ├── pages/              public/ auth/ shared/ patient/ doctor/ staff/ admin/
│       ├── constants/  utils/  styles/
│
├── .github/workflows/ci.yml    tests + lint + build on every push
├── docker-compose.yml          mongo + api + web (nginx)
└── package.json                root scripts (npm run dev runs both)
```

## API overview

| Method | Endpoint | Who |
|--------|----------|-----|
| POST | `/api/auth/register` `login` `forgot-password` `reset-password` | public (rate-limited) |
| GET/PUT | `/api/auth/me`, `/api/auth/profile` | any user |
| GET | `/api/dashboard` | any user (role-aware) |
| CRUD | `/api/users`, `PUT /api/users/:id/schedule` | Admin |
| GET | `/api/doctors`, `/api/doctors/:id/slots?date=` | any user |
| POST/PATCH | `/api/appointments`, `…/:id/approve` `cancel` `diagnosis` `tests/:t` `tests/:t/complete` | by role |
| CRUD | `/api/tests` | Admin, Staff |
| GET/POST | `/api/billing/unbilled` `invoices` `pay` | Staff / Patient |
| GET | `/api/finance`, `/api/finance/pnl`, `/api/finance/operations` | Admin |
| CRUD | `/api/expenses`, `/api/payroll` (+ `preview`, `:id/pay`) | Admin |
| GET/POST/PUT | `/api/assessments` (+ `definitions` `mine` `alerts` `:id/review`), `/api/moods` | Patient / Doctor |
| GET | `/api/patients`, `/api/patients/:id/record` | Doctor (own patients), Admin |
| GET/POST/DELETE | `/api/leaves` | Doctor, Admin |
| GET/POST | `/api/messages/contacts` `unread-count` `:userId` | Doctor, Patient |
| GET/POST | `/api/calls/:id`, `/api/calls/:id/no-show` | Doctor, Patient (own appointment) |
| GET/PATCH | `/api/notifications` (+ `read-all`, `:id/read`) | any user |
| GET | `/api/audit` | Admin |

Socket events: `notification`, `chat:message`, `chat:typing`, `chat:read`, and for video calls `call:join`, `call:admit`, `call:ready`, `call:signal` (offer / answer / ICE), `call:state`, `call:end`, `call:leave`.

Optional TURN server for strict networks (`backend/.env`): `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`.

## Original authors (ASP.NET version)

Md Jawadur Rafid, Nabid Ahamed Noushad, Taif Tanjil Srabon, Maisha Tabassum.
