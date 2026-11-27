import { Link } from 'react-router-dom';
import LegalPage from '@/components/public/LegalPage';
import { CLINIC } from '@/content/clinic';

const sections = [
  {
    id: 'who', title: 'Who we are',
    body: <>
      <p>MindCare is a mental health clinic that runs online booking, video consultations and a patient portal. This policy explains what information the MindCare system keeps about you, why, who can see it and the choices you have.</p>
      <p>MindCare is an academic project. Payments in this version are simulated and no real money is charged.</p>
    </>,
  },
  {
    id: 'collect', title: 'What we collect',
    body: <>
      <p><strong>When you create an account:</strong> your full name, email address, password (stored only as a secure hash), and if you choose to give them, your age, gender, phone number and address.</p>
      <p><strong>When you use the clinic:</strong></p>
      <ul>
        <li>appointments: the doctor, date, time, visit type and the reason you give for the visit;</li>
        <li>notes your doctor writes: diagnosis, prescription, follow-up date and recommended tests, and test results;</li>
        <li>wellbeing data you enter: daily mood, emotions, hours of sleep, anxiety level, journal entries and PHQ-9 and GAD-7 answers and scores;</li>
        <li>messages between you and your doctors;</li>
        <li>invoices and payment records, including the payment method and a masked account or card number.</li>
      </ul>
      <p><strong>Technical data:</strong> the time of sensitive actions and the IP address they came from, kept in the audit log.</p>
    </>,
  },
  {
    id: 'use', title: 'Why we use it',
    body: <>
      <ul>
        <li>to book, approve and run your appointments, including video consultations;</li>
        <li>to let your doctors see your history, scores and mood trend so they can care for you;</li>
        <li>to alert your doctors at once if a screening shows thoughts of self-harm;</li>
        <li>to create invoices, take payments and send receipts and reminders;</li>
        <li>to keep the system secure and to show who did what, through the audit log.</li>
      </ul>
      <p>We do not sell your information, show you advertising or use your health data for marketing.</p>
    </>,
  },
  {
    id: 'access', title: 'Who can see it',
    body: <>
      <ul>
        <li><strong>You</strong> can see your appointments, prescriptions, test results, invoices, wellbeing data and messages in the portal.</li>
        <li><strong>Your doctors</strong> can see your record, scores, mood trend and journal, and the messages you send them.</li>
        <li><strong>Front desk staff</strong> see what they need to approve visits, run tests and bill you, such as your name, contact details, appointments and invoices.</li>
        <li><strong>Clinic administrators</strong> manage accounts, finances and the audit log.</li>
      </ul>
      <p>Every role sees only the pages its job needs. Opening a patient record, approving a visit, changing notes and taking a payment are all written to the audit log.</p>
    </>,
  },
  {
    id: 'video', title: 'Video consultations',
    body: <p>Video and sound go directly between your device and your doctor's device. MindCare does not record consultations. Your browser asks for permission before it uses your camera or microphone.</p>,
  },
  {
    id: 'security', title: 'How we protect it',
    body: <ul>
      <li>Passwords are stored only as salted hashes, never as plain text.</li>
      <li>You stay logged in with a signed token that expires after seven days.</li>
      <li>Password reset links work once and expire after 30 minutes.</li>
      <li>Repeated login attempts are rate limited to slow down guessing.</li>
      <li>Every request is checked against your role before any data is returned.</li>
    </ul>,
  },
  {
    id: 'storage', title: 'Cookies and local storage',
    body: <>
      <p>MindCare does not use advertising or tracking cookies. Your browser keeps your login token in local storage so you stay signed in; logging out removes it.</p>
      <p>The website loads its fonts from Google Fonts, so your browser connects to Google's servers when a page opens.</p>
    </>,
  },
  {
    id: 'keep', title: 'How long we keep it',
    body: <p>We keep your account and clinical records while your account is active, because your doctors need your history to care for you safely. Clinical and financial records may need to be kept for a period required by law even after you stop using MindCare.</p>,
  },
  {
    id: 'rights', title: 'Your choices',
    body: <ul>
      <li>See and update your personal details at any time under Profile in the portal.</li>
      <li>Ask the clinic for a copy of your records or to correct something that is wrong.</li>
      <li>Decline any test your doctor recommends, and choose what you write in your journal.</li>
      <li>Ask us to close your account. We will explain what we must keep by law.</li>
    </ul>,
  },
  {
    id: 'children', title: 'Children and teenagers',
    body: <p>Our child and adolescent psychiatrist works with young people. A parent or guardian should contact the clinic before the first visit so we can agree how the young person's information is handled.</p>,
  },
  {
    id: 'changes', title: 'Changes to this policy',
    body: <p>If we change how we handle your information, we will update this page and the date at the top. For important changes we will tell you in the portal.</p>,
  },
  {
    id: 'contact', title: 'Contact',
    body: <p>Write to <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a> or use the <Link to="/contact">contact page</Link>. See also our <Link to="/terms">terms and conditions</Link>.</p>,
  },
];

export default function Privacy() {
  return <LegalPage title="Privacy policy" lead="What MindCare keeps about you, why, who can see it and the choices you have." sections={sections} />;
}
