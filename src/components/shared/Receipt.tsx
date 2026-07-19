


import React from 'react';
import { GraduationCapIcon } from 'lucide-react';
import type { Payment, SchoolSettings, Student } from '../../lib/types';
import { formatCurrency, formatDate, formatTime, netFee } from '../../lib/utils';
import { QRCode } from './QRCode';

const methodLabel: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank: 'Bank Transfer'
};

export function Receipt({
  payment,
  student,
  settings,
  elementId = 'receipt-print'





}: {payment: Payment;student: Student;settings: SchoolSettings;elementId?: string;}) {
  const total = netFee(student);
  return (
    <div
      id={elementId}
      className="print-area mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-slate-900"
      style={{ colorScheme: 'light' }}>
      
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          {settings.logo ?
          <img src={settings.logo} alt="" className="h-14 w-14 rounded-lg object-cover" /> :

          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCapIcon className="h-8 w-8" />
            </div>
          }
          <div>
            <h1 className="font-display text-xl font-extrabold">{settings.name}</h1>
            <p className="text-xs text-slate-500">{settings.address}</p>
            <p className="text-xs text-slate-500">
              {settings.contact} · {settings.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold tracking-wide text-brand-700">FEE RECEIPT</p>
          <p className="mt-1 text-xs text-slate-500">Receipt #: {payment.receiptNumber}</p>
          <p className="text-xs text-slate-500">Invoice #: {payment.invoiceNumber}</p>
        </div>
      </div>

      {/* Student & payment meta */}
      <div className="grid grid-cols-2 gap-6 py-5 text-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Billed To</p>
          <p className="font-semibold">{student.name}</p>
          <p className="text-slate-600">Student ID: {student.id}</p>
          <p className="text-slate-600">Adm. No: {student.admissionNumber}</p>
          <p className="text-slate-600">
            Class {student.className} - {student.section} · Roll {student.rollNumber}
          </p>
          <p className="text-slate-600">Session: {student.session}</p>
        </div>
        <div className="text-right">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Payment Details
          </p>
          <p className="text-slate-600">Date: {formatDate(payment.date)}</p>
          <p className="text-slate-600">Time: {formatTime(payment.date)}</p>
          <p className="text-slate-600">Method: {methodLabel[payment.method]}</p>
          {payment.transactionId &&
          <p className="text-slate-600">Txn ID: {payment.transactionId}</p>
          }
          <p className="text-slate-600">Collected by: {payment.collectedBy}</p>
        </div>
      </div>

      {/* Amounts table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="rounded-l-lg px-4 py-2.5 font-semibold">Description</th>
            <th className="rounded-r-lg px-4 py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="px-4 py-2.5">Total Fee (after discount &amp; fine)</td>
            <td className="px-4 py-2.5 text-right">{formatCurrency(total)}</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="px-4 py-2.5 font-semibold">Amount Paid</td>
            <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">
              {formatCurrency(payment.amount)}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2.5 font-semibold">Remaining Balance</td>
            <td className="px-4 py-2.5 text-right font-semibold text-rose-600">
              {formatCurrency(payment.remainingAfter)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer with QR + signature */}
      <div className="mt-6 flex items-end justify-between gap-6 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3">
          <QRCode value={`upi://pay?pa=${settings.upiId}&am=${payment.amount}`} size={84} />
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Scan to verify</p>
            <p>UPI: {settings.upiId}</p>
            {payment.transactionId && <p>Txn: {payment.transactionId}</p>}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 h-10 w-40 border-b border-slate-400" />
          <p className="text-xs font-semibold text-slate-600">Authorized Signature</p>
        </div>
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
        {settings.invoiceFooter}
      </p>
    </div>);

}