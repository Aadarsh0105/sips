
import type { User, Student, Payment, SchoolSettings, AppNotification } from './types';

const now = new Date();
const iso = (daysAgo: number, hour = 10) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

export const SESSION = '2025-2026';

export const seedSettings: SchoolSettings = {
  name: 'SHRIJI INTERNATIONAL PUBLIC SCHOOL',
  logo: '',
  address: 'Umarpani, Tendukheda, Narsinghpur, Madhya Pradesh, 487337',
  contact: '+91 88391 94116, +91 77710 38522, ',
  email: 'sipsnarsinghpur@gmail.com',
  upiId: 'greenwood@upi',
  qrImage: '',
  session: SESSION,
  invoiceFooter: 'This is a computer generated receipt and does not require a physical signature unless stamped.'
};

export const seedUsers: User[] = [
{
  id: 'usr-admin',
  name: 'Rahul Verma',
  username: 'admin',
  email: 'admin@greenwood.edu.in',
  mobile: '+91 98100 00001',
  password: 'admin123',
  role: 'ADMIN',
  status: 'active',
  createdAt: iso(400)
},
{
  id: 'usr-recept-1',
  name: 'Priya Sharma',
  username: 'priya',
  email: 'priya@greenwood.edu.in',
  mobile: '+91 98100 00002',
  password: 'recept123',
  role: 'RECEPTIONIST',
  status: 'active',
  createdAt: iso(200)
},
{
  id: 'usr-recept-2',
  name: 'Amit Kumar',
  username: 'amit',
  email: 'amit@greenwood.edu.in',
  mobile: '+91 98100 00003',
  password: 'recept123',
  role: 'RECEPTIONIST',
  status: 'inactive',
  createdAt: iso(120)
}];


const classes = ['Nursery', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const sections = ['A', 'B', 'C'];
const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kabir', 'Myra', 'Sara', 'Reyansh', 'Anaya', 'Kiara', 'Arjun', 'Advik', 'Riya', 'Vihaan', 'Aarohi', 'Krishna', 'Saanvi', 'Ayaan'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Nair', 'Mehta', 'Joshi', 'Malhotra'];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function makeSeedStudents(): Student[] {
  const students: Student[] = [];
  for (let i = 0; i < 24; i++) {
    const first = pick(firstNames, i);
    const last = pick(lastNames, i * 3 + 1);
    const cls = pick(classes, i);
    const total = 25000 + i % 6 * 5000;
    students.push({
      id: `STU-2026-${String(i + 1).padStart(4, '0')}`,
      admissionNumber: `ADM${2026}${String(1000 + i)}`,
      name: `${first} ${last}`,
      fatherName: `${pick(firstNames, i + 5)} ${last}`,
      motherName: `${pick(firstNames, i + 9)} ${last}`,
      className: cls,
      section: pick(sections, i),
      rollNumber: String(i % 30 + 1),
      gender: i % 2 === 0 ? 'male' : 'female',
      dob: iso(3650 - i * 40).slice(0, 10),
      mobile: `+91 9${String(800000000 + i * 111111).slice(0, 9)}`,
      parentMobile: `+91 9${String(700000000 + i * 121212).slice(0, 9)}`,
      address: `${100 + i} Rose Lane, New Delhi`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      admissionDate: iso(300 - i * 5).slice(0, 10),
      session: SESSION,
      totalFee: total,
      discount: i % 5 === 0 ? 2000 : 0,
      fine: i % 7 === 0 ? 500 : 0,
      dueDate: iso(-20 + i % 40).slice(0, 10),
      createdAt: iso(300 - i * 5)
    });
  }
  return students;
}

export function makeSeedPayments(students: Student[]): Payment[] {
  const payments: Payment[] = [];
  let receiptSeq = 1;
  let invoiceSeq = 1;
  students.forEach((s, i) => {
    const net = s.totalFee - s.discount + s.fine;
    // Full payer
    if (i % 3 === 0) {
      payments.push({
        id: `pay-${i}-a`,
        receiptNumber: `RCP-${String(receiptSeq++).padStart(5, '0')}`,
        invoiceNumber: `INV-${String(invoiceSeq++).padStart(5, '0')}`,
        studentId: s.id,
        amount: net,
        method: i % 2 === 0 ? 'upi' : 'cash',
        transactionId: i % 2 === 0 ? `TXN${100000 + i}` : undefined,
        status: 'completed',
        collectedBy: i % 2 === 0 ? 'Priya Sharma' : 'Rahul Verma',
        date: iso(i % 28),
        remainingAfter: 0
      });
    } else if (i % 3 === 1) {
      // Partial
      const first = Math.round(net * 0.5);
      payments.push({
        id: `pay-${i}-a`,
        receiptNumber: `RCP-${String(receiptSeq++).padStart(5, '0')}`,
        invoiceNumber: `INV-${String(invoiceSeq++).padStart(5, '0')}`,
        studentId: s.id,
        amount: first,
        method: 'upi',
        transactionId: `TXN${200000 + i}`,
        status: 'completed',
        collectedBy: 'Priya Sharma',
        date: iso(i % 20 + 5),
        remainingAfter: net - first
      });
    }
    // else pending, no payment
  });
  return payments;
}

export const seedNotifications: AppNotification[] = [
{
  id: 'ntf-1',
  type: 'payment_pending',
  title: 'Payment pending verification',
  message: 'A UPI payment of ₹12,500 is awaiting verification.',
  date: iso(0, 9),
  read: false
},
{
  id: 'ntf-2',
  type: 'due_reminder',
  title: 'Fee due reminders',
  message: '6 students have fees due within the next 7 days.',
  date: iso(1, 14),
  read: false
},
{
  id: 'ntf-3',
  type: 'payment_success',
  title: 'Payment received',
  message: 'Aarav Sharma paid ₹25,000 in full.',
  date: iso(2, 11),
  read: true
}];