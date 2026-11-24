# MindCare Frontend (web app)

React 19 + Vite + Tailwind CSS v4 frontend for MHC-AFMS.

```bash
npm install
npm run dev     # http://localhost:5180 (proxies /api and /socket.io to :5050)
npm run lint
npm run build
```

Start the API (`../backend`) first.

## Folder structure

```
src/
├── main.jsx                  mounts the app: router, auth, realtime, toasts
├── app/
│   └── App.jsx               all routes, lazy-loaded pages, role guards
│
├── api/
│   └── client.js             axios instance (adds the JWT, handles 401)
├── context/
│   ├── AuthContext.jsx       logged-in user, login/register/logout
│   └── RealtimeContext.jsx   Socket.io connection, notifications, unread chat count
├── hooks/
│   └── useFetch.js           GET with loading / error / reload
│
├── components/
│   ├── ui/                   design system: Button, Card, Modal, Badge, StatCard, Tabs…
│   ├── layout/               DashboardLayout, AuthShell, Logo, NotificationBell
│   ├── routing/              ProtectedRoute
│   ├── appointments/         DiagnosisModal, TestResponse, UpcomingList
│   ├── patients/             RiskAlerts
│   └── charts/               ScoreChart (PHQ-9 / GAD-7 trend)
│
├── pages/
│   ├── public/               Home, NotFound
│   ├── auth/                 Login, Register, ForgotPassword, ResetPassword
│   ├── shared/               Profile, Messages, AppointmentDetail, InvoiceView, PatientsList, PatientRecord
│   ├── patient/              dashboard, find doctor, booking, appointments, bills, payment, mood, assessments
│   ├── doctor/               dashboard, appointments, schedule & leave
│   ├── staff/                dashboard, appointments, lab queue, billing, medical tests
│   └── admin/                dashboard, employees, revenue, expenses, payroll, P&L, analytics, audit log
│
├── constants/
│   └── mood.js               mood scale (emoji + label)
├── utils/
│   ├── format.js             money (৳), dates, times
│   └── csv.js                CSV download
└── styles/
    └── index.css             Tailwind theme (brand colours, fonts) + shared classes
```

### Conventions
- Import with the `@/` alias (`@/components/ui`), never long `../../` chains
- Pages live under the role that uses them, and pages used by several roles go in `pages/shared`
- Components are grouped by feature, and generic building blocks go in `components/ui`
