

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { initializeSettings, store } from '../lib/storage';
import type {
  AppNotification,
  NotificationType,
  Payment,
  PaymentMethod,
  SchoolSettings,
  Student,
  User } from
'../lib/types';
import { deriveFee, netFee, pad, uid } from '../lib/utils';

interface RecordPaymentInput {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  collectedBy: string;
  pendingVerification?: boolean;
  note?: string;
}

interface DataCtx {
  students: Student[];
  payments: Payment[];
  users: User[];
  settings: SchoolSettings;
  notifications: AppNotification[];
  // students
  addStudent: (data: Omit<Student, 'id' | 'admissionNumber' | 'createdAt'> & {admissionNumber?: string;}) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudent: (id: string) => Student | undefined;
  // users / receptionists
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // payments
  recordPayment: (input: RecordPaymentInput) => Payment;
  verifyPayment: (paymentId: string, verifier: string) => void;
  paymentsFor: (studentId: string) => Payment[];
  // settings
  updateSettings: (data: Partial<SchoolSettings>) => void;
  // notifications
  pushNotification: (type: NotificationType, title: string, message: string) => void;
  markAllRead: () => void;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: {children: React.ReactNode;}) {
  initializeSettings();
  const [students, setStudents] = useState<Student[]>(() => store.getStudents());
  const [payments, setPayments] = useState<Payment[]>(() => store.getPayments());
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [settings, setSettings] = useState<SchoolSettings>(() => store.getSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => store.getNotifications());

  useEffect(() => store.setStudents(students), [students]);
  useEffect(() => store.setPayments(payments), [payments]);
  useEffect(() => store.setUsers(users), [users]);
  useEffect(() => store.setSettings(settings), [settings]);
  useEffect(() => store.setNotifications(notifications), [notifications]);

  const pushNotification = useCallback(
    (type: NotificationType, title: string, message: string) => {
      const n: AppNotification = {
        id: uid('ntf'),
        type,
        title,
        message,
        date: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [n, ...prev].slice(0, 50));
    },
    []
  );

  const addStudent: DataCtx['addStudent'] = (data) => {
    const seq = store.nextSequence('student');
    const admSeq = store.nextSequence('admission');
    const student: Student = {
      ...data,
      id: `STU-2026-${pad(seq)}`,
      admissionNumber: data.admissionNumber || `ADM2026${admSeq}`,
      createdAt: new Date().toISOString()
    };
    setStudents((prev) => [student, ...prev]);
    return student;
  };

  const updateStudent: DataCtx['updateStudent'] = (id, data) => {
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
  };

  const deleteStudent: DataCtx['deleteStudent'] = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setPayments((prev) => prev.filter((p) => p.studentId !== id));
  };

  const getStudent = useCallback((id: string) => students.find((s) => s.id === id), [students]);

  const addUser: DataCtx['addUser'] = (data) => {
    const u: User = { ...data, id: uid('usr'), createdAt: new Date().toISOString() };
    setUsers((prev) => [u, ...prev]);
  };
  const updateUser: DataCtx['updateUser'] = (id, data) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...data } : u));
  };
  const deleteUser: DataCtx['deleteUser'] = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const recordPayment: DataCtx['recordPayment'] = (input) => {
    const student = students.find((s) => s.id === input.studentId);
    const total = student ? netFee(student) : 0;
    const priorPaid = payments.
    filter((p) => p.studentId === input.studentId && p.status === 'completed').
    reduce((sum, p) => sum + p.amount, 0);
    const status = input.pendingVerification ? 'pending_verification' : 'completed';
    const remainingAfter = Math.max(0, total - (priorPaid + (status === 'completed' ? input.amount : 0)));

    const receiptSeq = store.nextSequence('receipt');
    const invoiceSeq = store.nextSequence('invoice');
    const payment: Payment = {
      id: uid('pay'),
      receiptNumber: `RCP-${pad(receiptSeq, 5)}`,
      invoiceNumber: `INV-${pad(invoiceSeq, 5)}`,
      studentId: input.studentId,
      amount: input.amount,
      method: input.method,
      transactionId: input.transactionId,
      status,
      collectedBy: input.collectedBy,
      date: new Date().toISOString(),
      remainingAfter,
      note: input.note
    };
    setPayments((prev) => [payment, ...prev]);

    if (status === 'pending_verification') {
      pushNotification(
        'payment_pending',
        'Payment pending verification',
        `${student?.name ?? 'A student'} submitted a UPI payment awaiting verification.`
      );
    } else {
      const full = remainingAfter <= 0;
      pushNotification(
        full ? 'payment_success' : 'partial_payment',
        full ? 'Payment successful' : 'Partial payment received',
        `${student?.name ?? 'Student'} paid via ${input.method.toUpperCase()}. Receipt ${payment.receiptNumber}.`
      );
      pushNotification('receipt_generated', 'Receipt generated', `Receipt ${payment.receiptNumber} is ready.`);
    }
    return payment;
  };

  const verifyPayment: DataCtx['verifyPayment'] = (paymentId, verifier) => {
    setPayments((prev) => {
      const target = prev.find((p) => p.id === paymentId);
      if (!target) return prev;
      const student = students.find((s) => s.id === target.studentId);
      const total = student ? netFee(student) : 0;
      const priorPaid = prev.
      filter((p) => p.studentId === target.studentId && p.status === 'completed').
      reduce((sum, p) => sum + p.amount, 0);
      const remainingAfter = Math.max(0, total - (priorPaid + target.amount));
      return prev.map((p) =>
      p.id === paymentId ?
      { ...p, status: 'completed', collectedBy: verifier, remainingAfter } :
      p
      );
    });
    const target = payments.find((p) => p.id === paymentId);
    const student = students.find((s) => s.id === target?.studentId);
    pushNotification('payment_success', 'Payment verified', `${student?.name ?? 'Payment'} verified successfully.`);
    toast.success('Payment verified and marked as paid.');
  };

  const paymentsFor = useCallback(
    (studentId: string) =>
    payments.
    filter((p) => p.studentId === studentId).
    sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [payments]
  );

  const updateSettings: DataCtx['updateSettings'] = (data) => {
    setSettings((prev) => ({ ...prev, ...data }));
  };

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo<DataCtx>(
    () => ({
      students,
      payments,
      users,
      settings,
      notifications,
      addStudent,
      updateStudent,
      deleteStudent,
      getStudent,
      addUser,
      updateUser,
      deleteUser,
      recordPayment,
      verifyPayment,
      paymentsFor,
      updateSettings,
      pushNotification,
      markAllRead
    }),
    [students, payments, users, settings, notifications, getStudent, paymentsFor, pushNotification, markAllRead]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export { deriveFee };
