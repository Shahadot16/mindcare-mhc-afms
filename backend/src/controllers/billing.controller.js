import crypto from 'node:crypto';
import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { addDays, addMonths, toDateStr } from '../utils/time.js';
import { notifyRoles, notifyUsers } from '../services/notification.service.js';
import { sendMail } from '../services/mail.service.js';
import { audit } from '../services/audit.service.js';

export const FOLLOW_UP_DISCOUNT = 0.4; // 40% off consultation for a follow-up within 2 months
const BILLABLE_TEST_STATUS = ['Accepted', 'Completed'];

const populateInvoice = (q) =>
  q.populate('patient', 'fullName email contactNumber')
    .populate('doctor', 'fullName specialization')
    .populate('appointment', 'date startTime endTime diagnosis');

/** Works out the bill for an appointment without saving anything. */
async function buildBill(appt) {
  // Follow-up: the same patient had a completed visit with the same doctor in the previous 2 months
  const previous = await Appointment.findOne({
    _id: { $ne: appt._id },
    patient: appt.patient,
    doctor: appt.doctor,
    status: 'Completed',
    date: { $lt: appt.date, $gte: addMonths(appt.date, -2) },
  }).sort({ date: -1 });

  const items = [{ label: 'Consultation fee', type: 'Consultation', amount: appt.consultationFee }];
  let discount = 0;
  if (previous) {
    discount = Math.round(appt.consultationFee * FOLLOW_UP_DISCOUNT * 100) / 100;
    items.push({ label: `Follow-up discount (40%, previous visit ${previous.date})`, type: 'Discount', amount: -discount });
  }
  const billableTests = appt.tests.filter((t) => BILLABLE_TEST_STATUS.includes(t.status));
  for (const t of billableTests) items.push({ label: t.testName, type: 'Test', amount: t.price });

  const consultationAmount = appt.consultationFee - discount;
  const testsAmount = billableTests.reduce((s, t) => s + t.price, 0);
  return {
    items,
    discount,
    consultationAmount,
    testsAmount,
    amount: consultationAmount + testsAmount,
    isFollowUp: Boolean(previous),
    pendingTests: appt.tests.filter((t) => t.status === 'Suggested').length,
    note: previous ? '40% follow-up discount applied' : 'Standard fee',
  };
}

// GET /api/billing/unbilled  (Staff, Admin) — completed visits without an invoice, with a bill preview
export async function unbilledAppointments(_req, res) {
  const list = await Appointment.find({ status: 'Completed', isInvoiceGenerated: false })
    .populate('doctor', 'fullName specialization')
    .populate('patient', 'fullName email')
    .sort({ date: 1 });
  const rows = await Promise.all(list.map(async (a) => ({ appointment: a, preview: await buildBill(a) })));
  res.json(rows);
}

// POST /api/billing/invoices  { appointmentId }  (Staff, Admin)
export async function generateInvoice(req, res) {
  const appt = await Appointment.findById(req.body.appointmentId);
  if (!appt) throw notFound('Appointment not found');
  if (appt.status !== 'Completed') throw badRequest('Only completed appointments can be billed');
  if (appt.isInvoiceGenerated) throw badRequest('An invoice already exists for this appointment');

  const bill = await buildBill(appt);
  const invoice = await Invoice.create({
    invoiceNo: `INV-${toDateStr().replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    appointment: appt._id,
    patient: appt.patient,
    doctor: appt.doctor,
    items: bill.items,
    consultationAmount: bill.consultationAmount,
    testsAmount: bill.testsAmount,
    discount: bill.discount,
    amount: bill.amount,
    note: bill.note,
    dueDate: addDays(toDateStr(), 30),
    generatedBy: req.user._id,
  });

  appt.isInvoiceGenerated = true;
  appt.totalAmount = bill.amount;
  await appt.save();
  const full = await populateInvoice(Invoice.findById(invoice._id));
  await notifyUsers([full.patient._id], {
    type: 'billing', title: 'New bill',
    message: `${full.invoiceNo}: ৳${full.amount.toLocaleString('en-US')}${bill.isFollowUp ? ' (40% follow-up discount applied)' : ''}`,
    link: `/app/invoices/${full._id}`,
  });
  await sendMail({
    to: full.patient.email, subject: `Your bill ${full.invoiceNo}`, title: 'Your bill is ready',
    html: `<p>Hi ${full.patient.fullName},</p><p>Your bill for the visit with <b>${full.doctor.fullName}</b> is <b>৳${full.amount.toLocaleString('en-US')}</b>, due by ${full.dueDate}.</p><p>You can pay online from <i>My Bills</i> in your MindCare account.</p>`,
  });
  await audit(req, 'invoice.generate', { entity: 'Invoice', entityId: full._id, summary: `${full.invoiceNo} ${full.patient.fullName} ৳${full.amount}` });
  res.status(201).json(full);
}

// GET /api/billing/invoices?status=  (Staff, Admin)
export async function allInvoices(req, res) {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await populateInvoice(Invoice.find(filter).sort({ createdAt: -1 }).limit(500)));
}

// GET /api/billing/invoices/mine  (Patient)
export async function myInvoices(req, res) {
  res.json(await populateInvoice(Invoice.find({ patient: req.user._id }).sort({ createdAt: -1 })));
}

// GET /api/billing/invoices/:id
export async function getInvoice(req, res) {
  const invoice = await populateInvoice(Invoice.findById(req.params.id));
  if (!invoice) throw notFound('Invoice not found');
  if (req.user.role === 'Patient' && String(invoice.patient._id) !== String(req.user._id)) throw forbidden();
  if (req.user.role === 'Doctor') throw forbidden();
  const payment = await Payment.findOne({ invoice: invoice._id, status: 'Success' });
  res.json({ invoice, payment });
}

// POST /api/billing/pay  (Patient) — SIMULATED gateway, no real money moves
export async function payInvoice(req, res) {
  const { invoiceId, method, cardNumber, cardName, expiry, cvv, walletNumber, pin } = req.body;
  if (!['Card', 'bKash', 'Nagad', 'Rocket'].includes(method)) throw badRequest('Choose a payment method');

  let accountRef;
  if (method === 'Card') {
    const digits = String(cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(digits)) throw badRequest('Card number must be 16 digits');
    if (!cardName?.trim()) throw badRequest('Name on card is required');
    const m = /^(\d{2})\/(\d{2})$/.exec(expiry || '');
    if (!m || +m[1] < 1 || +m[1] > 12) throw badRequest('Expiry must be in MM/YY format');
    const expEnd = new Date(2000 + +m[2], +m[1], 1); // first day after expiry month
    if (expEnd <= new Date()) throw badRequest('This card has expired');
    if (!/^\d{3,4}$/.test(cvv || '')) throw badRequest('CVV must be 3 or 4 digits');
    accountRef = `**** **** **** ${digits.slice(-4)}`;
  } else {
    if (!/^01[3-9]\d{8}$/.test(walletNumber || '')) throw badRequest(`Enter a valid 11-digit ${method} number`);
    if (!/^\d{4,5}$/.test(pin || '')) throw badRequest('PIN must be 4 or 5 digits');
    accountRef = `${walletNumber.slice(0, 3)}*****${walletNumber.slice(-3)}`;
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw notFound('Invoice not found');
  if (String(invoice.patient) !== String(req.user._id)) throw forbidden();

  // Atomic flip Unpaid -> Paid so a double-click can never charge twice
  const updated = await Invoice.findOneAndUpdate(
    { _id: invoice._id, status: 'Unpaid' },
    { status: 'Paid', paidAt: new Date() },
    { returnDocument: 'after' }
  );
  if (!updated) throw badRequest('This invoice is already paid');

  const payment = await Payment.create({
    invoice: invoice._id,
    patient: req.user._id,
    amount: invoice.amount,
    method,
    accountRef,
    transactionId: `TXN${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
  });
  await notifyRoles(['Admin', 'Staff'], {
    type: 'payment', title: 'Payment received',
    message: `${req.user.fullName} paid ৳${invoice.amount.toLocaleString('en-US')} via ${method} (${invoice.invoiceNo})`, link: `/app/invoices/${invoice._id}`,
  });
  await sendMail({
    to: req.user.email, subject: `Payment receipt ${invoice.invoiceNo}`, title: 'Thank you for your payment',
    html: `<p>We received <b>৳${invoice.amount.toLocaleString('en-US')}</b> via ${method} (${accountRef}).</p><p>Transaction ID: <b>${payment.transactionId}</b></p>`,
  });
  await audit(req, 'payment.receive', { entity: 'Payment', entityId: payment._id, summary: `${invoice.invoiceNo} ৳${invoice.amount} via ${method}` });
  res.status(201).json({ payment, invoice: updated });
}

// GET /api/billing/payments/mine  (Patient)
export async function myPayments(req, res) {
  res.json(await Payment.find({ patient: req.user._id }).populate('invoice', 'invoiceNo amount').sort({ createdAt: -1 }));
}
