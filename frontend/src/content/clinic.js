/*
  One place for the clinic's public facts, used by the landing page, the public pages and the footer.
  Facts come from the seed data and the backend rules (fees, hours, slots, discounts, call rules).
  EDIT HERE: the contact email and the address are placeholders until the clinic gives real ones.
*/
import { Pill, Brain, Baby, Wine } from 'lucide-react';

export const CLINIC = {
  name: 'MindCare',
  tagline: 'Mental health clinic',
  email: 'hello@mindcare.example', // placeholder: replace with the clinic's real address
  city: 'Dhaka, Bangladesh',
  emergency: '999',
  updated: '27 November 2026',
};

export const HOURS = [
  ['Saturday to Thursday', '9:00 AM – 9:00 PM', 'Clinic visits'],
  ['Evenings', '6:00 PM – 10:00 PM', 'Video consultations'],
  ['Friday', 'Closed', ''],
];

export const SPECIALISTS = [
  {
    id: 'psychiatrist', icon: Pill, name: 'Psychiatrist', fee: 1200,
    text: 'Diagnosis, medicine and follow-up for depression, anxiety, bipolar disorder and sleep problems.',
    helps: ['Depression and low mood', 'Anxiety and panic', 'Bipolar disorder', 'Sleep problems', 'Medicine reviews'],
  },
  {
    id: 'psychologist', icon: Brain, name: 'Clinical psychologist', fee: 1000,
    text: 'Talking therapy for stress, panic attacks, low mood and relationship problems.',
    helps: ['Work and study stress', 'Panic attacks', 'Trauma', 'Relationship problems', 'Cognitive behavioural therapy'],
  },
  {
    id: 'child', icon: Baby, name: 'Child and adolescent psychiatrist', fee: 1500,
    text: 'Care for children and teenagers with attention, mood or behaviour difficulties.',
    helps: ['ADHD and attention', 'Autism spectrum', 'Learning difficulties', 'Mood and behaviour', 'Support for parents'],
  },
  {
    id: 'addiction', icon: Wine, name: 'Addiction specialist', fee: 1300,
    text: 'Help to cut down or stop alcohol or drugs, at a pace you agree together.',
    helps: ['Alcohol use', 'Drug use', 'Recovery plans', 'Relapse prevention', 'Family support'],
  },
];

export const DOCTORS = [
  { name: 'Dr. Farhana Rahman', role: 'Psychiatrist', bio: 'Consultant psychiatrist focused on depression, anxiety and mood disorders.', days: 'Sun – Thu', hours: '9 AM – 2 PM', video: true },
  { name: 'Dr. Tanvir Ahmed', role: 'Clinical Psychologist', bio: 'Cognitive behavioural therapy for stress, trauma and relationship issues.', days: 'Sat, Sun, Tue, Wed', hours: '2 PM – 8 PM' },
  { name: 'Dr. Sadia Islam', role: 'Child & Adolescent Psychiatrist', bio: 'Supports children and teens with ADHD, autism spectrum and learning difficulties.', days: 'Sat, Mon, Wed, Thu', hours: '10 AM – 4 PM' },
  { name: 'Dr. Mahmud Hasan', role: 'Addiction Specialist', bio: 'Substance use recovery programmes and relapse prevention.', days: 'Sat – Tue, Thu', hours: '4 PM – 9 PM' },
];

export const TESTS = [
  ['PHQ-9 depression assessment', 'Standard depression questionnaire', 300],
  ['GAD-7 anxiety assessment', 'Standard anxiety questionnaire', 300],
  ['Complete blood count (CBC)', 'General health screening', 400],
  ['Thyroid function test (TSH)', 'Rules out thyroid causes of mood change', 800],
  ['Urine drug screen', 'Substance screening panel', 1200],
  ['Vitamin D level', 'Low vitamin D is linked to low mood', 1500],
  ['EEG', 'Records brain activity', 2500],
  ['MRI brain', 'Structural brain imaging', 8000],
];

export const PAYMENT_METHODS = ['bKash', 'Nagad', 'Rocket', 'Card'];

export const taka = (n) => `৳${n.toLocaleString('en-US')}`;

/* Questions, grouped. The landing page shows the first five marked `home`. */
export const FAQ_GROUPS = [
  {
    id: 'urgent', title: 'Urgent help',
    items: [
      { home: true, q: 'What if I need help right now?', a: 'MindCare is not an emergency service. If you might hurt yourself or someone else, call 999 or go to the nearest hospital emergency department now.' },
      { q: 'What happens if a screening shows I am at risk?', a: 'If your PHQ-9 answers show thoughts of self-harm, your doctors get an alert at once so they can contact you. Please still call 999 if you are in danger.' },
    ],
  },
  {
    id: 'booking', title: 'Booking',
    items: [
      { home: true, q: 'How long is a consultation?', a: 'A clinic visit is 15 minutes. A video consultation takes 30 minutes, so there is time to connect.' },
      { q: 'How do I book?', a: 'Create a free patient account, choose a doctor, pick a free slot and confirm. The front desk approves the booking and you get a notification.' },
      { q: 'Do I need a referral?', a: 'No. You can book any of our specialists directly from the patient portal.' },
      { home: true, q: 'Can I cancel a booking?', a: 'Yes. You can cancel from My Appointments while the booking is pending or approved, and the slot opens again for someone else.' },
      { q: 'What if my doctor is on leave?', a: 'Doctors mark their leave in advance. Any booking on that day is cancelled and you are told at once, so you can pick another slot.' },
      { q: 'Can my child be seen?', a: 'Yes. Our child and adolescent psychiatrist works with children and teenagers. Please contact the clinic before the first booking so we can plan the visit with you.' },
    ],
  },
  {
    id: 'video', title: 'Video consultations',
    items: [
      { q: 'What do I need for a video consultation?', a: 'A phone or computer with a camera, a microphone and a steady internet connection, and a quiet private place to talk.' },
      { q: 'When can I join the call?', a: 'You can enter the waiting room 10 minutes before the start time. Your doctor lets you in when they are ready.' },
      { q: 'What if my doctor is late?', a: 'If your doctor has not started the call 15 minutes after the start time, you can cancel free of charge from the waiting room.' },
      { q: 'Is the video call recorded?', a: 'No. The video goes directly between your device and your doctor\'s and is not recorded.' },
    ],
  },
  {
    id: 'fees', title: 'Fees and payment',
    items: [
      { home: true, q: 'How do I pay?', a: 'After the visit the invoice appears in your portal. Pay by bKash, Nagad, Rocket or card. A follow-up with the same doctor within two months is 40% off the consultation fee.' },
      { q: 'How much does a visit cost?', a: 'Consultation fees range from ৳1,000 to ৳1,500 depending on the specialist. Tests your doctor recommends are charged separately and only if you accept them.' },
      { q: 'Do I have to accept a recommended test?', a: 'No. Your doctor may suggest tests; you accept or decline each one in the portal. You only pay for the tests you accept.' },
    ],
  },
  {
    id: 'privacy', title: 'Privacy and records',
    items: [
      { home: true, q: 'Who can see my records?', a: 'Your doctors and the clinic team who run your appointments and bills. Every approval, record change and payment is written to an audit log.' },
      { q: 'Can I see my own prescriptions?', a: 'Yes. Every prescription, diagnosis note and invoice is kept in your portal, and you can print a prescription at any time.' },
      { q: 'Is my mood journal private?', a: 'Your journal entries are visible only to you and your doctors, who use them to understand how you have been between visits.' },
    ],
  },
  {
    id: 'account', title: 'Your account',
    items: [
      { q: 'I forgot my password. What do I do?', a: 'Use "Forgot password" on the login page. We send a reset link that works once and expires after 30 minutes.' },
      { q: 'How do I change my details?', a: 'Open Profile in the portal to update your name, phone, age, gender, address and password.' },
    ],
  },
];

export const HOME_FAQS = FAQ_GROUPS.flatMap((g) => g.items).filter((i) => i.home);
