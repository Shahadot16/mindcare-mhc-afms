import { Link } from 'react-router-dom';
import LegalPage from '@/components/public/LegalPage';
import { CLINIC } from '@/content/clinic';

const sections = [
  {
    id: 'about', title: 'About these terms',
    body: <>
      <p>These terms explain how you may use the MindCare website and patient portal and what you can expect from us. By creating an account or booking a visit you agree to them, together with our <Link to="/privacy">privacy policy</Link>.</p>
      <p>MindCare is an academic project. Payments in this version are simulated and no real money is charged.</p>
    </>,
  },
  {
    id: 'emergency', title: 'Not an emergency service',
    body: <p><strong>MindCare does not provide emergency care.</strong> Messages, mood check-ins and screenings are not watched around the clock. If you or someone else is in danger, call {CLINIC.emergency} or go to the nearest hospital emergency department. See <Link to="/get-help">Get help now</Link>.</p>,
  },
  {
    id: 'account', title: 'Your account',
    body: <ul>
      <li>Give your real name and an email address you can read; we use it for reset links, receipts and reminders.</li>
      <li>Keep your password private. You are responsible for what is done with your account.</li>
      <li>Patient accounts are for one person. Staff and doctor accounts are created by the clinic.</li>
      <li>Tell us if you think someone else has used your account.</li>
    </ul>,
  },
  {
    id: 'booking', title: 'Booking and cancelling',
    body: <ul>
      <li>You book a free slot with a doctor. The booking stays pending until the front desk approves it.</li>
      <li>A clinic visit lasts 15 minutes. A video consultation lasts 30 minutes.</li>
      <li>You can cancel from My Appointments while a booking is pending or approved. The slot then opens for someone else.</li>
      <li>If a doctor goes on leave, bookings on that day are cancelled and you are told at once so you can choose another slot.</li>
      <li>The clinic may cancel a booking when it cannot go ahead; we will tell you in the portal.</li>
    </ul>,
  },
  {
    id: 'video', title: 'Video consultations',
    body: <ul>
      <li>You need a device with a camera, a microphone and a steady connection, and a private place to talk.</li>
      <li>You can join the waiting room 10 minutes before the start time; your doctor lets you in.</li>
      <li>If your doctor has not started 15 minutes after the start time, you may cancel free of charge.</li>
      <li>If you have not joined 10 minutes after the start time, your doctor may mark the visit as missed.</li>
      <li>Consultations are not recorded. Please do not record them yourself without your doctor's consent.</li>
    </ul>,
  },
  {
    id: 'fees', title: 'Fees and payment',
    body: <ul>
      <li>Each doctor's consultation fee is shown before you book. Tests are charged only if you accept them.</li>
      <li>After your visit the front desk issues one invoice for the consultation and any accepted tests.</li>
      <li>A follow-up with the same doctor within two months is 40% off the consultation fee, applied automatically.</li>
      <li>You can pay by bKash, Nagad, Rocket or card. A receipt is kept in your portal.</li>
    </ul>,
  },
  {
    id: 'care', title: 'Medical care and screenings',
    body: <>
      <p>Your doctor decides on diagnosis and treatment during a consultation. PHQ-9 and GAD-7 screenings, mood charts and other tools in the portal help you and your doctor follow your progress; they are not a diagnosis on their own.</p>
      <p>Take medicine only as your doctor prescribes it, and contact the clinic if something does not feel right.</p>
    </>,
  },
  {
    id: 'use', title: 'Using MindCare fairly',
    body: <ul>
      <li>Be respectful in messages and video calls. Abuse towards staff or other patients may end your access.</li>
      <li>Do not try to reach data that is not yours, test the system's security, or disrupt the service.</li>
      <li>Do not book slots you do not intend to use.</li>
    </ul>,
  },
  {
    id: 'ending', title: 'Ending your account',
    body: <p>You can ask the clinic to close your account at any time. We may suspend an account that breaks these terms. Some clinical and financial records may be kept as described in the <Link to="/privacy">privacy policy</Link>.</p>,
  },
  {
    id: 'liability', title: 'Our responsibility',
    body: <p>We work to keep MindCare available and accurate, but the website may sometimes be unavailable for maintenance or because of problems outside our control. Nothing in these terms limits any right you have by law.</p>,
  },
  {
    id: 'changes', title: 'Changes to these terms',
    body: <p>We may update these terms. The date at the top shows the latest version, and important changes will be shown in the portal.</p>,
  },
  {
    id: 'contact', title: 'Contact',
    body: <p>Questions about these terms? Write to <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a> or use the <Link to="/contact">contact page</Link>.</p>,
  },
];

export default function Terms() {
  return <LegalPage title="Terms and conditions" lead="The rules for using MindCare: booking, cancelling, video visits, fees and your account." sections={sections} />;
}
