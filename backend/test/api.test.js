// Integration tests for the MHC-AFMS API.
// Uses a separate database (mhc_afms_test by default) which is wiped before the run.
// Run: npm test
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET ||= 'test-secret';
process.env.AUTH_RATE_LIMIT = '1000';
const MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/mhc_afms_test';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Appointment } = await import('../src/models/Appointment.js');
const { default: MedicalTest } = await import('../src/models/MedicalTest.js');
const { default: Notification } = await import('../src/models/Notification.js');
const { addDays, dayName, toDateStr } = await import('../src/utils/time.js');

const api = request(app);
const tokens = {};
let doctor, tests, futureDate;

const auth = (role) => ({ Authorization: `Bearer ${tokens[role]}` });
const login = async (email, password) => (await api.post('/api/auth/login').send({ email, password })).body.token;

before(async () => {
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.dropDatabase();
  await Appointment.syncIndexes();

  const everyDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  await User.create({ fullName: 'Admin', email: 'admin@t.com', password: 'secret1', role: 'Admin', salary: 50000 });
  await User.create({ fullName: 'Staff', email: 'staff@t.com', password: 'secret1', role: 'Staff', salary: 20000 });
  doctor = await User.create({
    fullName: 'Dr. Test', email: 'doc@t.com', password: 'secret1', role: 'Doctor', specialization: 'Psychiatrist',
    consultationFee: 1000, salary: 10000, commissionRate: 30, schedule: { days: everyDay, startHour: 0, endHour: 24 },
  });
  await User.create({ fullName: 'Pat One', email: 'p1@t.com', password: 'secret1', role: 'Patient' });
  await User.create({ fullName: 'Pat Two', email: 'p2@t.com', password: 'secret1', role: 'Patient' });
  tests = await MedicalTest.insertMany([{ testName: 'CBC', price: 400 }, { testName: 'TSH', price: 800 }]);

  for (const [k, e] of [['admin', 'admin@t.com'], ['staff', 'staff@t.com'], ['doctor', 'doc@t.com'], ['p1', 'p1@t.com'], ['p2', 'p2@t.com']]) {
    tokens[k] = await login(e, 'secret1');
  }
  futureDate = addDays(toDateStr(), 3);
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('auth & access control', () => {
  test('rejects a wrong password', async () => {
    const r = await api.post('/api/auth/login').send({ email: 'admin@t.com', password: 'nope' });
    assert.equal(r.status, 401);
  });
  test('requires a token', async () => {
    assert.equal((await api.get('/api/dashboard')).status, 401);
  });
  test('blocks patients from admin routes', async () => {
    assert.equal((await api.get('/api/finance').set(auth('p1'))).status, 403);
    assert.equal((await api.get('/api/users').set(auth('doctor'))).status, 403);
  });
  test('public sign-up always creates a Patient', async () => {
    const r = await api.post('/api/auth/register').send({ fullName: 'Sneaky', email: 'x@t.com', password: 'secret1', role: 'Admin' });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.role, 'Patient');
    assert.equal(r.body.user.password, undefined);
  });
  test('password reset flow works once', async () => {
    const f = await api.post('/api/auth/forgot-password').send({ email: 'p2@t.com' });
    const token = f.body.devResetUrl.split('/').pop();
    assert.equal((await api.post('/api/auth/reset-password').send({ token, password: 'secret1' })).status, 200);
    assert.equal((await api.post('/api/auth/reset-password').send({ token, password: 'secret1' })).status, 400);
  });
  test('forgot-password does not reveal unknown emails', async () => {
    const r = await api.post('/api/auth/forgot-password').send({ email: 'nobody@t.com' });
    assert.equal(r.status, 200);
    assert.equal(r.body.devResetUrl, undefined);
  });
});

describe('booking', () => {
  let apptId;
  test('patient books a slot', async () => {
    const r = await api.post('/api/appointments').set(auth('p1')).send({ doctorId: doctor._id, date: futureDate, startTime: '10:00' });
    assert.equal(r.status, 201);
    apptId = r.body._id;
  });
  test('the same slot cannot be booked twice', async () => {
    const r = await api.post('/api/appointments').set(auth('p2')).send({ doctorId: doctor._id, date: futureDate, startTime: '10:00' });
    assert.equal(r.status, 409);
  });
  test('slots are 15 minutes and booked ones are unavailable', async () => {
    const r = await api.get(`/api/doctors/${doctor._id}/slots?date=${futureDate}`).set(auth('p2'));
    assert.equal(r.body.slots.length, 96);
    assert.equal(r.body.slots.find((s) => s.time === '10:00').available, false);
  });
  test('staff are notified of the new request', async () => {
    assert.ok(await Notification.exists({ title: 'New appointment request' }));
  });
  test('a future visit cannot be completed early', async () => {
    await api.patch(`/api/appointments/${apptId}/approve`).set(auth('staff')).expect(200);
    const r = await api.patch(`/api/appointments/${apptId}/diagnosis`).set(auth('doctor')).send({ diagnosis: 'x' });
    assert.equal(r.status, 400);
  });
  test('doctor leave cancels bookings and blocks the day', async () => {
    const r = await api.post('/api/leaves').set(auth('doctor')).send({ date: futureDate, reason: 'Conference' });
    assert.equal(r.status, 201);
    assert.equal(r.body.cancelled, 1);
    const slots = await api.get(`/api/doctors/${doctor._id}/slots?date=${futureDate}`).set(auth('p2'));
    assert.equal(slots.body.onLeave, true);
    const book = await api.post('/api/appointments').set(auth('p2')).send({ doctorId: doctor._id, date: futureDate, startTime: '11:00' });
    assert.equal(book.status, 400);
  });
});

describe('visit → bill → payment', () => {
  let apptId, invoiceId;
  before(async () => {
    // A visit today, plus a completed visit 10 days ago, so the follow-up discount applies
    const today = toDateStr();
    const p1 = await User.findOne({ email: 'p1@t.com' });
    await Appointment.create({ doctor: doctor._id, patient: p1._id, date: addDays(today, -10), startTime: '09:00', endTime: '09:15', status: 'Completed', consultationFee: 1000 });
    const a = await Appointment.create({ doctor: doctor._id, patient: p1._id, date: today, startTime: '00:00', endTime: '00:15', status: 'Approved', consultationFee: 1000 });
    apptId = String(a._id);
  });
  test('doctor completes the visit and suggests tests', async () => {
    const r = await api.patch(`/api/appointments/${apptId}/diagnosis`).set(auth('doctor'))
      .send({ diagnosis: 'Anxiety', prescription: 'Rest', testIds: tests.map((t) => t._id) });
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'Completed');
    assert.equal(r.body.tests.length, 2);
  });
  test('patient accepts one test and declines the other', async () => {
    const a = await Appointment.findById(apptId);
    await api.patch(`/api/appointments/${apptId}/tests/${a.tests[0]._id}`).set(auth('p1')).send({ action: 'accept' }).expect(200);
    await api.patch(`/api/appointments/${apptId}/tests/${a.tests[1]._id}`).set(auth('p1')).send({ action: 'reject' }).expect(200);
  });
  test('invoice = 60% consultation (follow-up) + accepted tests only', async () => {
    const r = await api.post('/api/billing/invoices').set(auth('staff')).send({ appointmentId: apptId });
    assert.equal(r.status, 201);
    assert.equal(r.body.discount, 400);
    assert.equal(r.body.amount, 600 + 400);
    invoiceId = r.body._id;
  });
  test('another patient cannot pay this invoice', async () => {
    const r = await api.post('/api/billing/pay').set(auth('p2')).send({ invoiceId, method: 'bKash', walletNumber: '01712345678', pin: '1234' });
    assert.equal(r.status, 403);
  });
  test('payment validates input, succeeds once, and never twice', async () => {
    const bad = await api.post('/api/billing/pay').set(auth('p1')).send({ invoiceId, method: 'Card', cardNumber: '42', cardName: 'A', expiry: '12/40', cvv: '123' });
    assert.equal(bad.status, 400);
    const ok = await api.post('/api/billing/pay').set(auth('p1')).send({ invoiceId, method: 'Card', cardNumber: '4242424242424242', cardName: 'A', expiry: '12/40', cvv: '123' });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.payment.accountRef, '**** **** **** 4242');
    const again = await api.post('/api/billing/pay').set(auth('p1')).send({ invoiceId, method: 'bKash', walletNumber: '01712345678', pin: '1234' });
    assert.equal(again.status, 400);
  });
  test('finance and P&L include the payment', async () => {
    const f = await api.get('/api/finance').set(auth('admin'));
    assert.equal(f.body.summary.revenueToday, 1000);
    const pnl = await api.get('/api/finance/pnl?months=1').set(auth('admin'));
    assert.equal(pnl.body.rows[0].revenue, 1000);
  });
  test('payroll gives the doctor 30% of consultation revenue', async () => {
    const r = await api.post('/api/payroll').set(auth('admin')).send({ month: toDateStr().slice(0, 7) });
    assert.equal(r.status, 201);
    const doc = r.body.entries.find((e) => e.role === 'Doctor');
    assert.equal(doc.commission, 180); // 30% of 600
    assert.equal(doc.total, 10180);
  });
});

describe('wellbeing & messaging', () => {
  test('PHQ-9 is scored and a self-harm answer alerts the doctor', async () => {
    const r = await api.post('/api/assessments').set(auth('p1')).send({ type: 'PHQ9', answers: [2, 2, 2, 2, 2, 2, 2, 1, 1] });
    assert.equal(r.status, 201);
    assert.equal(r.body.score, 16);
    assert.equal(r.body.severity, 'Moderately severe');
    assert.equal(r.body.riskFlag, true);
    assert.ok(await Notification.exists({ user: doctor._id, type: 'risk' }));
    const alerts = await api.get('/api/assessments/alerts').set(auth('doctor'));
    assert.equal(alerts.body.length, 1);
  });
  test('incomplete questionnaires are rejected', async () => {
    assert.equal((await api.post('/api/assessments').set(auth('p1')).send({ type: 'GAD7', answers: [1, 2] })).status, 400);
  });
  test('mood check-in is one entry per day (upsert)', async () => {
    await api.put('/api/moods').set(auth('p1')).send({ mood: 2 }).expect(200);
    await api.put('/api/moods').set(auth('p1')).send({ mood: 4, emotions: ['Calm', 'NotAnEmotion'] }).expect(200);
    const r = await api.get('/api/moods/mine').set(auth('p1'));
    assert.equal(r.body.entries.length, 1);
    assert.equal(r.body.entries[0].mood, 4);
    assert.deepEqual(r.body.entries[0].emotions, ['Calm']);
  });
  test('doctor can open the record of their own patient only', async () => {
    const p1 = await User.findOne({ email: 'p1@t.com' });
    const p2 = await User.findOne({ email: 'p2@t.com' });
    assert.equal((await api.get(`/api/patients/${p1._id}/record`).set(auth('doctor'))).status, 200);
    assert.equal((await api.get(`/api/patients/${p2._id}/record`).set(auth('doctor'))).status, 403);
  });
  test('chat is limited to doctor–patient pairs with an appointment', async () => {
    const p2 = await User.findOne({ email: 'p2@t.com' });
    const ok = await api.post(`/api/messages/${doctor._id}`).set(auth('p1')).send({ text: 'Hello doctor' });
    assert.equal(ok.status, 201);
    const blocked = await api.post(`/api/messages/${p2._id}`).set(auth('doctor')).send({ text: 'Hi' });
    assert.equal(blocked.status, 403);
    const convo = await api.get(`/api/messages/${(await User.findOne({ email: 'p1@t.com' }))._id}`).set(auth('doctor'));
    assert.equal(convo.body.length, 1);
  });
  test('sensitive actions are written to the audit log', async () => {
    const r = await api.get('/api/audit').set(auth('admin'));
    const actions = r.body.items.map((i) => i.action);
    for (const a of ['payment.receive', 'invoice.generate', 'leave.add', 'patient.record.view']) assert.ok(actions.includes(a), `missing ${a}`);
  });
});

const { callTimes, joinState } = await import('../src/utils/callWindow.js');

describe('video consultation', () => {
  let videoDate;
  let videoAppt;
  const everyDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  before(() => { videoDate = addDays(toDateStr(), 6); });

  test('a video visit takes 30 minutes and blocks the slots it overlaps', async () => {
    const r = await api.post('/api/appointments').set(auth('p1')).send({ doctorId: doctor._id, date: videoDate, startTime: '14:00', mode: 'Video' });
    assert.equal(r.status, 201);
    assert.equal(r.body.mode, 'Video');
    assert.equal(r.body.endTime, '14:30');
    videoAppt = r.body;

    const slots = (await api.get(`/api/doctors/${doctor._id}/slots`).query({ date: videoDate }).set(auth('p2'))).body.slots;
    const at = (t) => slots.find((s) => s.time === t);
    assert.equal(at('14:15').available, false);
    assert.equal(at('14:30').available, true);
    // an in-person visit inside the video call, and a video call overlapping its start, are both refused
    assert.equal((await api.post('/api/appointments').set(auth('p2')).send({ doctorId: doctor._id, date: videoDate, startTime: '14:15' })).status, 409);
    assert.equal((await api.post('/api/appointments').set(auth('p2')).send({ doctorId: doctor._id, date: videoDate, startTime: '13:45', mode: 'Video' })).status, 409);
  });

  test('video slots follow the doctor\'s separate video hours', async () => {
    const set = await api.put(`/api/users/${doctor._id}/schedule`).set(auth('admin'))
      .send({ days: everyDay, startHour: 0, endHour: 24, videoStartHour: 18, videoEndHour: 20 });
    assert.equal(set.status, 200);
    const slots = (await api.get(`/api/doctors/${doctor._id}/slots`).query({ date: videoDate, mode: 'Video' }).set(auth('p2'))).body.slots;
    assert.equal(slots[0].time, '18:00');
    assert.equal(slots.at(-1).time, '19:30'); // last 30-minute call must end by 20:00
    const outside = await api.post('/api/appointments').set(auth('p2')).send({ doctorId: doctor._id, date: videoDate, startTime: '10:00', mode: 'Video' });
    assert.equal(outside.status, 400);
    await api.put(`/api/users/${doctor._id}/schedule`).set(auth('admin')).send({ days: everyDay, startHour: 0, endHour: 24 });
  });

  test('only the appointment\'s doctor and patient can open the call, and only after approval', async () => {
    assert.equal((await api.get(`/api/calls/${videoAppt._id}`).set(auth('p2'))).status, 403);
    assert.equal((await api.get(`/api/calls/${videoAppt._id}`).set(auth('staff'))).status, 403);
    assert.equal((await api.get(`/api/calls/${videoAppt._id}`).set(auth('p1'))).body.state.phase, 'not-approved');
    await api.patch(`/api/appointments/${videoAppt._id}/approve`).set(auth('staff'));
    const r = await api.get(`/api/calls/${videoAppt._id}`).set(auth('doctor'));
    assert.equal(r.status, 200);
    assert.equal(r.body.state.phase, 'early');
    assert.ok(r.body.iceServers[0].urls[0].startsWith('stun:'));
  });

  test('the call opens 10 minutes early and closes 10 minutes after the slot', () => {
    const appt = { mode: 'Video', status: 'Approved', date: '2030-01-01', startTime: '19:00', endTime: '19:30', call: {} };
    const t = callTimes(appt);
    const time = (hhmm) => new Date(`2030-01-01T${hhmm}:00`);
    assert.equal(t.opensAt.getTime(), time('18:50').getTime());
    assert.equal(t.canAdmitAt.getTime(), time('18:55').getTime());
    assert.equal(t.closesAt.getTime(), time('19:40').getTime());
    assert.equal(joinState(appt, time('18:45')).phase, 'early');
    assert.equal(joinState(appt, time('18:50')).ok, true);
    assert.equal(joinState(appt, time('19:39')).ok, true);
    assert.equal(joinState(appt, time('19:41')).phase, 'closed');
    assert.equal(joinState({ ...appt, call: { endedAt: new Date() } }, time('19:10')).phase, 'ended');
  });

  test('a no-show can be marked only 10 minutes after the start', async () => {
    const early = await api.post(`/api/calls/${videoAppt._id}/no-show`).set(auth('doctor'));
    assert.equal(early.status, 400);

    const p2 = await User.findOne({ email: 'p2@t.com' });
    const pad = (n) => String(n).padStart(2, '0');
    const s = new Date(Date.now() - 15 * 60 * 1000);
    const late = await Appointment.create({
      doctor: doctor._id, patient: p2._id, date: toDateStr(s), startTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
      endTime: '23:59', mode: 'Video', status: 'Approved', holdsSlot: false, consultationFee: 1000,
    });
    const r = await api.post(`/api/calls/${late._id}/no-show`).set(auth('doctor'));
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'Cancelled');
    assert.equal(r.body.cancelledBy, 'No-show');
  });
});

void dayName;
