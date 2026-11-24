// Rich demo history for the seed: 6 months of visits, revenue, expenses, payroll,
// assessments, mood entries, chat and notifications. Deterministic (same data every run).
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Assessment from '../models/Assessment.js';
import MoodEntry from '../models/MoodEntry.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import DoctorLeave from '../models/DoctorLeave.js';
import Expense from '../models/Expense.js';
import PayrollRun from '../models/PayrollRun.js';
import AuditLog from '../models/AuditLog.js';
import { computeEntries } from '../controllers/payroll.controller.js';
import { scoreAssessment } from '../constants/assessments.js';
import { addDays, dayName, fromMinutes, toDateStr } from '../utils/time.js';

// Small seeded random generator so the demo looks the same every time
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

/** Builds a valid answer list that adds up to `score`. */
function answersFor(type, score, selfHarm = 0) {
  const n = type === 'PHQ9' ? 9 : 7;
  const a = Array(n).fill(0);
  if (type === 'PHQ9') a[8] = selfHarm;
  let left = score - selfHarm;
  for (let i = 0; left > 0; i = (i + 1) % n) {
    if (type === 'PHQ9' && i === 8) continue;
    if (a[i] < 3) { a[i] += 1; left -= 1; }
  }
  return a;
}

const DIAGNOSES = [
  'Mild depressive episode', 'Generalised anxiety disorder', 'Adjustment disorder with anxiety', 'Panic disorder',
  'Insomnia related to stress', 'Moderate depressive episode', 'Social anxiety', 'Work-related burnout', 'ADHD, follow-up', 'Grief reaction',
];
const PRESCRIPTIONS = [
  'Sertraline 50mg, 1 tablet after breakfast\nSleep hygiene routine',
  'Escitalopram 10mg, 1 tablet at night\nBreathing exercises twice daily',
  'Weekly CBT sessions for 6 weeks\nDaily mood journal',
  'Mirtazapine 15mg at night\nLimit caffeine after 2 PM',
  'Mindfulness practice 15 min daily\nReview in 4 weeks',
];

export async function seedDemoHistory({ doctors, tests, patients }) {
  const today = toDateStr();
  const [rahim, ayesha, karim] = patients;

  // ---- More patients ----
  const more = [];
  for (const [fullName, email, age, gender, area] of [
    ['Nadia Sultana', 'nadia@example.com', 31, 'Female', 'Gulshan, Dhaka'],
    ['Tanvir Hasan', 'tanvirh@example.com', 27, 'Male', 'Mohammadpur, Dhaka'],
    ['Sharmin Akter', 'sharmin@example.com', 38, 'Female', 'Chattogram'],
    ['Imran Kabir', 'imran@example.com', 45, 'Male', 'Banani, Dhaka'],
    ['Farzana Haque', 'farzana@example.com', 22, 'Female', 'Sylhet'],
    ...[['Rafiq Islam', 'M'], ['Mitu Rahman', 'F'], ['Sabbir Ahmed', 'M'], ['Lamia Chowdhury', 'F'], ['Arif Hossain', 'M'], ['Nusrat Jahan Mim', 'F'], ['Zahid Hasan', 'M'], ['Tasnim Ferdous', 'F'], ['Shakil Mahmud', 'M'], ['Rumana Begum', 'F'], ['Fahim Shahriar', 'M'], ['Jannatul Ferdous', 'F'], ['Mehedi Hasan', 'M'], ['Sadia Afrin', 'F'], ['Kamrul Islam', 'M']]
      .map(([n, g], i) => [n, `${n.split(' ')[0].toLowerCase()}${i}@example.com`, 19 + ((i * 7) % 40), g === 'M' ? 'Male' : 'Female', ['Dhaka', 'Khulna', 'Rajshahi', 'Barishal', 'Cumilla'][i % 5]]),
  ]) {
    more.push(await User.create({ fullName, email, password: 'patient123', role: 'Patient', age, gender, address: area, contactNumber: `017${between(10000000, 99999999)}` }));
  }
  // 40 more generated patients so visit counts per person look realistic
  const FIRST = ['Abdul', 'Rina', 'Hasan', 'Shirin', 'Monir', 'Popy', 'Jamal', 'Ruma', 'Sohel', 'Taslima', 'Babul', 'Nasrin', 'Rakib', 'Shathi', 'Masud', 'Lipi', 'Anis', 'Keya', 'Robin', 'Moushumi'];
  const LAST = ['Uddin', 'Akter', 'Miah', 'Begum', 'Sarkar', 'Khatun'];
  for (let i = 0; i < 40; i++) {
    const first = FIRST[i % FIRST.length];
    const fullName = `${first} ${LAST[(i * 5) % LAST.length]}`;
    more.push(await User.create({
      fullName, email: `${first.toLowerCase()}${i + 100}@example.com`, password: 'patient123', role: 'Patient',
      age: 18 + ((i * 11) % 50), gender: ['Rina', 'Shirin', 'Popy', 'Ruma', 'Taslima', 'Nasrin', 'Shathi', 'Lipi', 'Keya', 'Moushumi'].includes(first) ? 'Female' : 'Male',
      contactNumber: `018${between(10000000, 99999999)}`, createdAt: new Date(Date.now() - between(5, 170) * 86400000),
    }));
  }
  const allPatients = [...patients, ...more];

  // ---- 5 past months of completed, paid visits ----
  const used = new Set((await Appointment.find({ holdsSlot: true }).select('doctor date startTime')).map((a) => `${a.doctor}|${a.date}|${a.startTime}`));
  const methods = ['bKash', 'bKash', 'Nagad', 'Card', 'Card', 'Rocket'];
  let inv = 100;
  const startDay = addDays(today, -165);
  for (let d = startDay; d < today; d = addDays(d, 1)) {
    const growth = 0.55 + (0.4 * (Date.parse(d) - Date.parse(startDay))) / (Date.parse(today) - Date.parse(startDay)); // clinic grows over time
    for (const doc of doctors) {
      if (!doc.schedule.days.includes(dayName(d)) || rand() > growth) continue;
      const visits = between(3, 5);
      for (let v = 0; v < visits; v++) {
        const slotMin = doc.schedule.startHour * 60 + 15 * between(0, (doc.schedule.endHour - doc.schedule.startHour) * 4 - 1);
        const startTime = fromMinutes(slotMin);
        const key = `${doc._id}|${d}|${startTime}`;
        if (used.has(key)) continue;
        used.add(key);
        const pat = pick(allPatients);
        const test = rand() < 0.45 ? pick(tests) : null;
        const fee = doc.consultationFee;
        const appt = await Appointment.create({
          doctor: doc._id, patient: pat._id, date: d, startTime, endTime: fromMinutes(slotMin + 15), status: 'Completed',
          description: 'Consultation', diagnosis: pick(DIAGNOSES), prescription: pick(PRESCRIPTIONS), consultationFee: fee,
          totalAmount: fee + (test?.price || 0), isInvoiceGenerated: true,
          tests: test ? [{ test: test._id, testName: test.testName, price: test.price, status: 'Completed', completedAt: new Date(`${d}T15:00:00`), result: 'Within normal range' }] : [],
        });
        const paidAt = new Date(`${addDays(d, between(0, 3))}T${String(between(10, 20)).padStart(2, '0')}:00:00`);
        const invoice = await Invoice.create({
          invoiceNo: `INV-${d.replaceAll('-', '')}-H${inv++}`, appointment: appt._id, patient: pat._id, doctor: doc._id,
          items: [{ label: 'Consultation fee', type: 'Consultation', amount: fee }, ...(test ? [{ label: test.testName, type: 'Test', amount: test.price }] : [])],
          consultationAmount: fee, testsAmount: test?.price || 0, amount: fee + (test?.price || 0), note: 'Standard fee',
          status: 'Paid', dueDate: addDays(d, 30), paidAt,
        });
        await Payment.create({
          invoice: invoice._id, patient: pat._id, amount: invoice.amount, method: pick(methods), accountRef: '***',
          transactionId: `TXNH${inv}${between(1000, 9999)}`, createdAt: paidAt,
        });
      }
    }
    // A few cancellations for realistic analytics
    if (rand() < 0.12) {
      const doc = pick(doctors);
      if (doc.schedule.days.includes(dayName(d))) {
        await Appointment.create({
          doctor: doc._id, patient: pick(allPatients)._id, date: d, startTime: fromMinutes(doc.schedule.startHour * 60 + 15 * between(0, 8)),
          endTime: '00:00', status: 'Cancelled', holdsSlot: false, cancelledBy: pick(['Patient', 'Staff']), consultationFee: doc.consultationFee,
        });
      }
    }
  }

  // ---- Expenses: 6 months ----
  const monthStarts = [];
  for (let i = 5; i >= 0; i--) {
    const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() - i);
    monthStarts.push(toDateStr(x));
  }
  const expenses = [];
  for (const m of monthStarts) {
    const day = (n) => { const s = `${m.slice(0, 8)}${String(n).padStart(2, '0')}`; return s <= today ? s : null; };
    const add = (title, category, amount, dd) => { const date = day(dd); if (date) expenses.push({ title, category, amount, date }); };
    add('Clinic rent', 'Rent', 45000, 1);
    add('Electricity bill', 'Utilities', between(7000, 11000), 5);
    add('Internet & phone', 'Utilities', 3500, 5);
    add('Clinic management software', 'Software', 4500, 3);
    add('Medical supplies restock', 'Medical Supplies', between(6000, 14000), 12);
    add('Cleaning & maintenance', 'Maintenance', between(3000, 6000), 18);
    if (rand() < 0.5) add('Social media campaign', 'Marketing', between(5000, 15000), 20);
    if (rand() < 0.3) add(pick(['New therapy room chairs', 'EEG machine service', 'Waiting room TV']), 'Equipment', between(12000, 40000), 22);
  }
  await Expense.insertMany(expenses);

  // ---- Payroll for the 5 previous months (paid) ----
  for (const m of monthStarts.slice(0, 5)) {
    const month = m.slice(0, 7);
    const entries = await computeEntries(month);
    const [y, mm] = month.split('-').map(Number);
    await PayrollRun.create({ month, entries, total: entries.reduce((s, e) => s + e.total, 0), status: 'Paid', paidAt: new Date(y, mm, 1, 10) });
  }

  // ---- Assessments: improving trend for Rahim, anxiety for Ayesha, a risk flag for Karim ----
  const assess = async (patient, type, score, daysAgo, selfHarm = 0) => {
    const answers = answersFor(type, score, selfHarm);
    const r = scoreAssessment(type, answers);
    const at = new Date(`${addDays(today, -daysAgo)}T19:30:00`);
    return Assessment.create({ patient: patient._id, type, answers, ...r, createdAt: at, updatedAt: at });
  };
  for (const [s, ago] of [[18, 84], [16, 63], [13, 42], [11, 28], [8, 14], [6, 2]]) await assess(rahim, 'PHQ9', s, ago);
  for (const [s, ago] of [[9, 60], [8, 30], [7, 5]]) await assess(rahim, 'GAD7', s, ago);
  for (const [s, ago] of [[15, 40], [13, 21], [11, 7]]) await assess(ayesha, 'GAD7', s, ago);
  await assess(ayesha, 'PHQ9', 7, 7);
  await assess(karim, 'PHQ9', 17, 1, 1); // risk flag, left unreviewed so the alert shows

  // ---- Mood tracker ----
  const moods = [];
  for (let i = 34; i >= 0; i--) {
    if (rand() < 0.15 && i > 0) continue; // a few skipped days
    const trend = Math.min(5, Math.max(1, Math.round(2 + (34 - i) / 13 + (rand() - 0.5) * 1.4)));
    moods.push({
      patient: rahim._id, date: addDays(today, -i), mood: trend,
      emotions: trend >= 4 ? [pick(['Calm', 'Hopeful', 'Grateful']), 'Happy'] : trend === 3 ? ['Tired', pick(['Calm', 'Stressed'])] : [pick(['Sad', 'Anxious', 'Lonely']), 'Tired'],
      sleepHours: Math.round((5 + trend * 0.6 + rand()) * 2) / 2, anxiety: Math.max(0, 8 - trend * 1.4 + Math.round(rand() * 2)),
      note: i === 0 ? 'Went for a walk in the morning. Felt lighter.' : '',
    });
  }
  for (let i = 20; i >= 0; i -= 1) {
    if (rand() < 0.3) continue;
    const m = between(2, 4);
    moods.push({ patient: ayesha._id, date: addDays(today, -i), mood: m, emotions: m < 3 ? ['Anxious', 'Overwhelmed'] : ['Calm'], sleepHours: between(5, 8), anxiety: 9 - m * 2 });
  }
  await MoodEntry.insertMany(moods);

  // ---- Chat ----
  const farhana = doctors[0];
  const t0 = Date.now() - 3 * 86400000;
  const chat = [
    [rahim, farhana, 'Hello Doctor, is it okay to take the medicine at night instead of the morning?'],
    [farhana, rahim, 'Hi Rahim. Sertraline can make some people sleepy, so night is fine if that suits you better. Keep the same time every day.'],
    [rahim, farhana, 'Thank you! My sleep is already better this week.'],
    [farhana, rahim, "That's great progress. Keep logging your mood daily, it helps me see the trend before our follow-up."],
    [ayesha, farhana, 'Doctor, my exams start next week and I feel very anxious. Can I do anything before our appointment?'],
  ];
  await Message.insertMany(chat.map(([from, to, text], i) => ({
    from: from._id, to: to._id, text, read: i < chat.length - 1, createdAt: new Date(t0 + i * 3600000 * 5),
  })));

  // ---- Doctor leave: Dr. Tanvir at a conference next week ----
  let leaveDay = addDays(today, 7);
  while (!doctors[1].schedule.days.includes(dayName(leaveDay))) leaveDay = addDays(leaveDay, 1);
  await DoctorLeave.create({ doctor: doctors[1]._id, date: leaveDay, reason: 'Attending a psychology conference' });

  // ---- A few notifications so the bell isn't empty ----
  const admin = await User.findOne({ role: 'Admin' });
  const staff = await User.findOne({ role: 'Staff' });
  const note = (user, type, title, message, link, hoursAgo, priority = 'normal') =>
    ({ user: user._id, type, title, message, link, priority, createdAt: new Date(Date.now() - hoursAgo * 3600000) });
  await Notification.insertMany([
    note(farhana, 'risk', `Risk alert: ${karim.fullName}`, 'PHQ-9 answer indicates thoughts of self-harm (score 17). Please review promptly.', `/app/patients/${karim._id}`, 20, 'high'),
    note(admin, 'risk', `Risk alert: ${karim.fullName}`, 'PHQ-9 answer indicates thoughts of self-harm (score 17). Please review promptly.', `/app/patients/${karim._id}`, 20, 'high'),
    note(farhana, 'message', `New message from ${ayesha.fullName}`, 'Doctor, my exams start next week and I feel very anxious…', `/app/messages?with=${ayesha._id}`, 2),
    note(rahim, 'appointment', 'Appointment confirmed', `${farhana.fullName}, today at 12:30`, '/app/my-appointments', 26),
    note(rahim, 'test', 'PHQ-9 Depression Assessment result available', 'Score 11 (moderate)', '/app/my-appointments', 300),
    note(staff, 'appointment', 'New appointment request', `${karim.fullName} with ${doctors[2].fullName}`, '/app/appointments', 5),
    note(admin, 'payment', 'Payment received', `${karim.fullName} paid ৳1,000 via Card`, '/app/finance', 30),
  ]);
  await Notification.updateMany({ user: rahim._id, type: 'test' }, { read: true });

  // Karim needs an appointment with Dr. Farhana for her to see his record and the alert
  const kDate = addDays(today, -45);
  let kMin = farhana.schedule.startHour * 60;
  while (used.has(`${farhana._id}|${kDate}|${fromMinutes(kMin)}`)) kMin += 15;
  await Appointment.create({
    doctor: farhana._id, patient: karim._id, date: kDate, startTime: fromMinutes(kMin), endTime: fromMinutes(kMin + 15), status: 'Completed',
    description: 'Low mood after job loss', diagnosis: 'Moderate depressive episode', prescription: 'Sertraline 50mg after breakfast\nWeekly check-in calls',
    consultationFee: 1200, totalAmount: 1200, isInvoiceGenerated: false,
  });

  await AuditLog.insertMany([
    { actorName: 'System', actorRole: 'System', action: 'system.seed', summary: 'Demo data generated', createdAt: new Date() },
  ]);
}
