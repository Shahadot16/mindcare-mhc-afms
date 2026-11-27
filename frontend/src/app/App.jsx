import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

// Every page is its own chunk, so the first load stays small
const Home = lazy(() => import('@/pages/public/Home'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const Profile = lazy(() => import('@/pages/shared/Profile'));
const NotFound = lazy(() => import('@/pages/public/NotFound'));
const About = lazy(() => import('@/pages/public/About'));
const Services = lazy(() => import('@/pages/public/Services'));
const Faq = lazy(() => import('@/pages/public/Faq'));
const Contact = lazy(() => import('@/pages/public/Contact'));
const Privacy = lazy(() => import('@/pages/public/Privacy'));
const Terms = lazy(() => import('@/pages/public/Terms'));
const GetHelp = lazy(() => import('@/pages/public/GetHelp'));
const AppointmentDetail = lazy(() => import('@/pages/shared/AppointmentDetail'));
const InvoiceView = lazy(() => import('@/pages/shared/InvoiceView'));
const Messages = lazy(() => import('@/pages/shared/Messages'));
const VideoCall = lazy(() => import('@/pages/shared/VideoCall'));
const PatientsList = lazy(() => import('@/pages/shared/PatientsList'));
const PatientRecord = lazy(() => import('@/pages/shared/PatientRecord'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const Employees = lazy(() => import('@/pages/admin/Employees'));
const Finance = lazy(() => import('@/pages/admin/Finance'));
const Expenses = lazy(() => import('@/pages/admin/Expenses'));
const Payroll = lazy(() => import('@/pages/admin/Payroll'));
const ProfitLoss = lazy(() => import('@/pages/admin/ProfitLoss'));
const Analytics = lazy(() => import('@/pages/admin/Analytics'));
const AuditLog = lazy(() => import('@/pages/admin/AuditLog'));

const StaffDashboard = lazy(() => import('@/pages/staff/StaffDashboard'));
const ManageAppointments = lazy(() => import('@/pages/staff/ManageAppointments'));
const LabQueue = lazy(() => import('@/pages/staff/LabQueue'));
const Billing = lazy(() => import('@/pages/staff/Billing'));
const MedicalTests = lazy(() => import('@/pages/staff/MedicalTests'));

const DoctorDashboard = lazy(() => import('@/pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('@/pages/doctor/DoctorAppointments'));
const MySchedule = lazy(() => import('@/pages/doctor/MySchedule'));

const PatientDashboard = lazy(() => import('@/pages/patient/PatientDashboard'));
const FindDoctors = lazy(() => import('@/pages/patient/FindDoctors'));
const BookAppointment = lazy(() => import('@/pages/patient/BookAppointment'));
const MyAppointments = lazy(() => import('@/pages/patient/MyAppointments'));
const MyBills = lazy(() => import('@/pages/patient/MyBills'));
const PayBill = lazy(() => import('@/pages/patient/PayBill'));
const Wellbeing = lazy(() => import('@/pages/patient/Wellbeing'));
const Assessments = lazy(() => import('@/pages/patient/Assessments'));

function RoleDashboard() {
  const { user } = useAuth();
  const Page = { Admin: AdminDashboard, Staff: StaffDashboard, Doctor: DoctorDashboard, Patient: PatientDashboard }[user.role];
  return <Page />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner className="size-8" /></div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/get-help" element={<GetHelp />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/app" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<RoleDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />

            <Route element={<ProtectedRoute roles={['Admin']} />}>
              <Route path="employees" element={<Employees />} />
              <Route path="finance" element={<Finance />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="profit-loss" element={<ProfitLoss />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="audit" element={<AuditLog />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Admin', 'Staff']} />}>
              <Route path="appointments" element={<ManageAppointments />} />
              <Route path="lab-tests" element={<LabQueue />} />
              <Route path="billing" element={<Billing />} />
              <Route path="tests" element={<MedicalTests />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Admin', 'Doctor']} />}>
              <Route path="patients" element={<PatientsList />} />
              <Route path="patients/:id" element={<PatientRecord />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Admin', 'Staff', 'Patient']} />}>
              <Route path="invoices/:id" element={<InvoiceView />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Doctor', 'Patient']} />}>
              <Route path="messages" element={<Messages />} />
              <Route path="call/:id" element={<VideoCall />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Doctor']} />}>
              <Route path="doctor/appointments" element={<DoctorAppointments />} />
              <Route path="schedule" element={<MySchedule />} />
            </Route>

            <Route element={<ProtectedRoute roles={['Patient']} />}>
              <Route path="doctors" element={<FindDoctors />} />
              <Route path="doctors/:id/book" element={<BookAppointment />} />
              <Route path="my-appointments" element={<MyAppointments />} />
              <Route path="bills" element={<MyBills />} />
              <Route path="bills/:id/pay" element={<PayBill />} />
              <Route path="wellbeing" element={<Wellbeing />} />
              <Route path="assessments" element={<Assessments />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
