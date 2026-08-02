export type Role = 'ADMIN' | 'RECEPTIONIST';

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export type FeeStatus = 'pending' | 'partial' | 'paid';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Student {
  id: string; // Auto generated Student ID e.g. STU-2026-0001
  admissionNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  className: string;
  section: string;
  rollNumber: string;
  gender: Gender;
  dob: string;
  mobile: string;
  parentMobile: string;
  address: string;
  email: string;
  admissionDate: string;
  monthlyFee?: number;
  openingDue?: number;
  session: string;
  totalFee: number;
  discount: number;
  fine: number;
  dueDate: string;
  photo?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank';
export type PaymentStatus = 'completed' | 'pending_verification';

export interface Payment {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  status: PaymentStatus;
  collectedBy: string; // user name
  date: string; // ISO
  remainingAfter: number;
  note?: string;
}

export interface SchoolSettings {
  name: string;
  logo: string;
  address: string;
  contact: string;
  email: string;
  upiId: string;
  qrImage: string;
  session: string;
  invoiceFooter: string;
}

export type NotificationType =
'payment_success' |
'payment_pending' |
'due_reminder' |
'partial_payment' |
'receipt_generated';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface DerivedFee {
  totalFee: number;
  paid: number;
  remaining: number;
  status: FeeStatus;
}
