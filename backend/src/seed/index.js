// Seeds demo data. Usage:
//   npm run seed         -> adds demo data only if the database has no users
//   npm run seed:reset   -> wipes everything and re-seeds
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import MedicalTest from '../models/MedicalTest.js';
import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { addDays, toDateStr } from '../utils/time.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Assessment from '../models/Assessment.js';
import MoodEntry from '../models/MoodEntry.js';
import DoctorLeave from '../models/DoctorLeave.js';
import Expense from '../models/Expense.js';
import PayrollRun from '../models/PayrollRun.js';
import AuditLog from '../models/AuditLog.js';
import { seedDemoHistory } from './demoHistory.js';

const reset = process.argv.includes('--reset');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

async function run() {
  await connectDB();

  if (reset) {
    await Promise.all([User, MedicalTest, Appointment, Invoice, Payment, Notification, Message, Assessment, MoodEntry, DoctorLeave, Expense, PayrollRun, AuditLog].map((m) => m.deleteMany({})));
    console.log('Database cleared');
  } else if (await User.exists({})) {
    console.log('Users already exist, nothing seeded. Use "npm run seed:reset" to start fresh.');
    return;
  }
  await Appointment.syncIndexes();

  // Users are created one by one so the password-hashing hook runs
  const make = (data) => User.create(data);
  await make({ fullName: 'Super Admin', email: 'admin@hospital.com', password: 'admin123', role: 'Admin', contactNumber: '01711000000', salary: 45000 });
  await make({ fullName: 'Nusrat Jahan', email: 'staff@hospital.com', password: 'staff123', role: 'Staff', contactNumber: '01711000001', gender: 'Female', salary: 22000 });

  const doctors = [];
  doctors.push(await make({
    fullName: 'Dr. Farhana Rahman', email: 'doctor@hospital.com', password: 'doctor123', role: 'Doctor', gender: 'Female',
    specialization: 'Psychiatrist', consultationFee: 1200, salary: 12000, commissionRate: 35,
    bio: 'Consultant psychiatrist focused on depression, anxiety and mood disorders.',
    schedule: { days: weekdays, startHour: 9, endHour: 14, videoStartHour: 18, videoEndHour: 22 },
  }));
  doctors.push(await make({
    fullName: 'Dr. Tanvir Ahmed', email: 'tanvir@hospital.com', password: 'doctor123', role: 'Doctor', gender: 'Male',
    specialization: 'Clinical Psychologist', consultationFee: 1000, salary: 12000, commissionRate: 35,
    bio: 'Cognitive behavioural therapy for stress, trauma and relationship issues.',
    schedule: { days: ['Saturday', 'Sunday', 'Tuesday', 'Wednesday'], startHour: 14, endHour: 20 },
  }));
  doctors.push(await make({
    fullName: 'Dr. Sadia Islam', email: 'sadia@hospital.com', password: 'doctor123', role: 'Doctor', gender: 'Female',
    specialization: 'Child & Adolescent Psychiatrist', consultationFee: 1500, salary: 12000, commissionRate: 35,
    bio: 'Supports children and teens with ADHD, autism spectrum and learning difficulties.',
    schedule: { days: ['Saturday', 'Monday', 'Wednesday', 'Thursday'], startHour: 10, endHour: 16 },
  }));
  doctors.push(await make({
    fullName: 'Dr. Mahmud Hasan', email: 'mahmud@hospital.com', password: 'doctor123', role: 'Doctor', gender: 'Male',
    specialization: 'Addiction Specialist', consultationFee: 1300, salary: 12000, commissionRate: 35,
    bio: 'Substance use recovery programmes and relapse prevention.',
    schedule: { days: ['Sunday', 'Monday', 'Tuesday', 'Thursday', 'Saturday'], startHour: 16, endHour: 21 },
  }));

  const patient = await make({
    fullName: 'Rahim Uddin', email: 'patient@hospital.com', password: 'patient123', role: 'Patient',
    age: 29, gender: 'Male', contactNumber: '01811000000', address: 'Mirpur, Dhaka',
  });

  const tests = await MedicalTest.insertMany([
    { testName: 'Complete Blood Count (CBC)', price: 400, description: 'General health screening' },
    { testName: 'Thyroid Function Test (TSH)', price: 800, description: 'Rules out thyroid causes of mood change' },
    { testName: 'Vitamin D Level', price: 1500, description: 'Low vitamin D is linked to low mood' },
    { testName: 'EEG', price: 2500, description: 'Electroencephalogram for brain activity' },
    { testName: 'MRI Brain', price: 8000, description: 'Structural brain imaging' },
    { testName: 'PHQ-9 Depression Assessment', price: 300, description: 'Standardised depression questionnaire' },
    { testName: 'GAD-7 Anxiety Assessment', price: 300, description: 'Standardised anxiety questionnaire' },
    { testName: 'Urine Drug Screen', price: 1200, description: 'Substance screening panel' },
  ]);

  // A past completed visit, billed and paid, so dashboards and reports have data
  const today = toDateStr();
  const past = addDays(today, -20);
  const visit = await Appointment.create({
    doctor: doctors[0]._id, patient: patient._id, date: past, startTime: '10:00', endTime: '10:15',
    status: 'Completed', description: 'Trouble sleeping and low mood for 3 weeks',
    diagnosis: 'Mild depressive episode with insomnia',
    prescription: 'Sertraline 50mg — 1 tablet after breakfast for 4 weeks\nSleep hygiene routine\nReview in 3 weeks',
    followUpDate: addDays(past, 21), consultationFee: 1200, totalAmount: 1500, isInvoiceGenerated: true,
    tests: [
      { test: tests[5]._id, testName: tests[5].testName, price: tests[5].price, status: 'Completed', completedAt: new Date(), result: 'Score 11 (moderate)' },
      { test: tests[2]._id, testName: tests[2].testName, price: tests[2].price, status: 'Rejected' },
    ],
  });
  const inv = await Invoice.create({
    invoiceNo: `INV-${past.replaceAll('-', '')}-SEED01`, appointment: visit._id, patient: patient._id, doctor: doctors[0]._id,
    items: [
      { label: 'Consultation fee', type: 'Consultation', amount: 1200 },
      { label: tests[5].testName, type: 'Test', amount: 300 },
    ],
    consultationAmount: 1200, testsAmount: 300, amount: 1500, note: 'Standard fee', status: 'Paid',
    dueDate: addDays(past, 30), paidAt: new Date(`${addDays(past, 1)}T12:00:00`),
  });
  await Payment.create({
    invoice: inv._id, patient: patient._id, amount: 1500, method: 'bKash', accountRef: '018*****000',
    transactionId: 'TXNSEED0001', createdAt: inv.paidAt,
  });

  // ---- More demo activity so every dashboard has something to show ----
  const ayesha = await make({ fullName: 'Ayesha Khan', email: 'ayesha@example.com', password: 'patient123', role: 'Patient', age: 24, gender: 'Female', contactNumber: '01911223344', address: 'Dhanmondi, Dhaka' });
  const karim = await make({ fullName: 'Karim Hossain', email: 'karim@example.com', password: 'patient123', role: 'Patient', age: 41, gender: 'Male', contactNumber: '01511998877', address: 'Uttara, Dhaka' });

  // Today: two approved visits for the demo doctor (Rahim's is a follow-up, so billing will show the 40% discount)
  await Appointment.create({ doctor: doctors[0]._id, patient: patient._id, date: today, startTime: '12:30', endTime: '12:45', status: 'Approved', description: 'Follow-up: sleep is better, mood still low in the mornings', consultationFee: 1200 });
  await Appointment.create({ doctor: doctors[0]._id, patient: ayesha._id, date: today, startTime: '13:00', endTime: '13:15', status: 'Approved', description: 'Feeling anxious before exams, racing heart', consultationFee: 1200 });
  // Video consultations. The first one starts within minutes, so the call can be tried right after seeding
  // (log in as patient@hospital.com and doctor@hospital.com in two browsers).
  const soon = new Date(Date.now() + 5 * 60 * 1000);
  let soonMin = Math.ceil((soon.getHours() * 60 + soon.getMinutes()) / 15) * 15;
  let soonDate = toDateStr(soon);
  // Keep clear of today's 12:30 and 13:00 in-person visits with the same doctor
  if (soonDate === today) while (soonMin < 13 * 60 + 15 && soonMin + 30 > 12 * 60 + 30) soonMin += 15;
  if (soonMin + 30 > 24 * 60) { soonDate = addDays(soonDate, 1); soonMin = 18 * 60; }
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  await Appointment.create({ doctor: doctors[0]._id, patient: patient._id, date: soonDate, startTime: hhmm(soonMin), endTime: hhmm(soonMin + 30), mode: 'Video', status: 'Approved', description: 'Video follow-up: checking how the new sleep routine is going', consultationFee: 1200 });
  await Appointment.create({ doctor: doctors[0]._id, patient: karim._id, date: addDays(today, 1), startTime: '19:00', endTime: '19:30', mode: 'Video', status: 'Approved', description: 'Low mood after job loss, prefers to talk from home', consultationFee: 1200 });

  // Upcoming requests waiting for staff approval
  await Appointment.create({ doctor: doctors[1]._id, patient: patient._id, date: addDays(today, 2), startTime: '15:00', endTime: '15:15', status: 'Pending', description: 'Work stress and panic attacks', consultationFee: 1000 });
  await Appointment.create({ doctor: doctors[2]._id, patient: karim._id, date: addDays(today, 3), startTime: '10:30', endTime: '10:45', status: 'Pending', description: 'Son (12) has trouble concentrating at school', consultationFee: 1500 });

  // Completed visits with paid / unpaid invoices spread over the last weeks (for the finance report)
  const history = [
    { doc: 1, pat: karim, daysAgo: 12, time: '16:00', method: 'Card', ref: '**** **** **** 4242', test: 0, diagnosis: 'Adjustment disorder with work-related stress' },
    { doc: 3, pat: karim, daysAgo: 9, time: '18:00', method: 'Rocket', ref: '015*****877', test: 7, diagnosis: 'Alcohol use, early stage; motivated for change' },
    { doc: 2, pat: ayesha, daysAgo: 6, time: '11:00', method: 'bKash', ref: '019*****344', test: 6, diagnosis: 'Generalised anxiety, mild' },
    { doc: 0, pat: ayesha, daysAgo: 3, time: '09:30', method: null, test: 1, diagnosis: 'Anxiety with palpitations; rule out thyroid cause' },
  ];
  let n = 2;
  for (const h of history) {
    const d = addDays(today, -h.daysAgo);
    const doc = doctors[h.doc];
    const t = tests[h.test];
    const appt = await Appointment.create({
      doctor: doc._id, patient: h.pat._id, date: d, startTime: h.time, endTime: h.time.replace(/:(\d\d)$/, (_m, mm) => `:${String(+mm + 15).padStart(2, '0')}`),
      status: 'Completed', description: 'Initial consultation', diagnosis: h.diagnosis,
      prescription: 'Supportive psychotherapy sessions\nReview in 2 weeks', consultationFee: doc.consultationFee,
      totalAmount: doc.consultationFee + t.price, isInvoiceGenerated: true,
      tests: [{ test: t._id, testName: t.testName, price: t.price, status: h.method ? 'Completed' : 'Accepted', completedAt: h.method ? new Date() : undefined }],
    });
    const paidAt = h.method ? new Date(`${addDays(d, 1)}T11:00:00`) : undefined;
    const invoice = await Invoice.create({
      invoiceNo: `INV-${d.replaceAll('-', '')}-SEED0${n++}`, appointment: appt._id, patient: h.pat._id, doctor: doc._id,
      items: [{ label: 'Consultation fee', type: 'Consultation', amount: doc.consultationFee }, { label: t.testName, type: 'Test', amount: t.price }],
      consultationAmount: doc.consultationFee, testsAmount: t.price, amount: doc.consultationFee + t.price, note: 'Standard fee',
      status: h.method ? 'Paid' : 'Unpaid', dueDate: addDays(d, 30), paidAt,
    });
    if (h.method) {
      await Payment.create({ invoice: invoice._id, patient: h.pat._id, amount: invoice.amount, method: h.method, accountRef: h.ref, transactionId: `TXNSEED000${n}`, createdAt: paidAt });
    }
  }

  await seedDemoHistory({ doctors, tests, patients: [patient, ayesha, karim] });

  console.log('\nDemo data ready. Log in with:');
  console.table([
    { role: 'Admin', email: 'admin@hospital.com', password: 'admin123' },
    { role: 'Doctor', email: 'doctor@hospital.com', password: 'doctor123' },
    { role: 'Staff', email: 'staff@hospital.com', password: 'staff123' },
    { role: 'Patient', email: 'patient@hospital.com', password: 'patient123' },
  ]);
}

run()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
