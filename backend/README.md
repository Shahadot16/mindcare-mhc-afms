# MindCare Backend (API)

Express 5 + MongoDB (Mongoose) + Socket.io backend for MHC-AFMS.

```bash
npm install
npm run seed:reset   # wipe the database and load demo data
npm run dev          # http://localhost:5050 (restarts on file changes)
npm test             # 25 integration tests on a separate test database
```

Settings live in `.env` (see `.env.example`).

## Folder structure

```
src/
├── server.js                 entry point: HTTP + Socket.io server, background jobs
├── app.js                    Express app: security middleware, /api routes, error handling
│
├── config/
│   └── db.js                 MongoDB connection
├── constants/
│   └── assessments.js        PHQ-9 / GAD-7 questions, scoring bands
│
├── models/                   Mongoose schemas (one per collection, PascalCase)
│   ├── User.js  Appointment.js  MedicalTest.js  DoctorLeave.js
│   ├── Invoice.js  Payment.js  Expense.js  PayrollRun.js
│   ├── Assessment.js  MoodEntry.js
│   └── Message.js  Notification.js  AuditLog.js
│
├── routes/                   URL → middleware → controller (one file per feature)
│   ├── index.js              mounts every router under /api
│   └── *.routes.js
├── controllers/              request handling + business rules (one file per feature)
│   └── *.controller.js
├── middleware/
│   ├── auth.middleware.js    JWT protect + role authorize
│   ├── rateLimit.middleware.js
│   └── error.middleware.js   404 + central error handler
├── services/                 shared side effects used by controllers
│   ├── notification.service.js   save + push live notifications
│   ├── socket.service.js         Socket.io auth and per-user rooms
│   ├── mail.service.js           Nodemailer (console fallback in dev)
│   └── audit.service.js          audit log writer
├── jobs/
│   └── reminder.job.js       daily "appointment tomorrow" reminders (cron)
├── utils/
│   ├── time.js               date helpers, 15-minute slot generator
│   └── httpError.js          typed HTTP errors
└── seed/
    ├── index.js              demo users, doctors, tests, today's visits
    └── demoHistory.js        6 months of visits, finance, assessments, chat
test/
└── api.test.js               node:test + Supertest
```

### Naming conventions
- `feature.routes.js` → `feature.controller.js`: same feature name in both folders
- Models are PascalCase singular (`User.js`), everything else is camelCase
- Controllers throw `HttpError`s, and the error middleware turns them into JSON responses
