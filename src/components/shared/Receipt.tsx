import { GraduationCapIcon } from 'lucide-react';
import type { Payment, SchoolSettings, Student } from '../../lib/types';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

const methodLabel: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank: 'Bank Transfer',
};

export function Receipt({
  payment,
  student,
  settings,
  elementId = 'receipt-print',
}: {
  payment: Payment;
  student: Student;
  settings: SchoolSettings;
  elementId?: string;
}) {
  const paidFeeBreakdown = Object.entries(payment.feeBreakdown ?? {})
    .filter(([, amount]) => Number(amount) > 0);

  return (
    <div
      id={elementId}
      className="print-area mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-slate-900"
      style={{ colorScheme: 'light' }}
    >
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          {settings.logo ? (
            <img src={settings.logo} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCapIcon className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="font-display text-md font-extrabold">{settings.name}</h1>
            {settings.address ? <p className="text-xs text-slate-500">{settings.address}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-md font-bold tracking-wide text-brand-700">FEE RECEIPT</p>
          <p className="mt-1 text-xs text-slate-500">{payment.receiptNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 py-5 text-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Billed To</p>
          <p className="font-semibold">{student.name}</p>
          <p className="text-slate-600">Student ID: {student.id}</p>
          {student.admissionNumber ? <p className="text-slate-600">Adm. No: {student.admissionNumber}</p> : null}
          {student.className ? (
            <p className="text-slate-600">
              Class {student.className}
              {student.section ? ` - ${student.section}` : ''}
            </p>
          ) : null}
          {student.fatherName ? <p className="text-slate-600">Father: {student.fatherName}</p> : null}
        </div>
        <div className="text-right">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Payment Details</p>
          <p className="text-slate-600">Date: {formatDate(payment.date)}</p>
          <p className="text-slate-600">Time: {formatTime(payment.date)}</p>
          <p className="text-slate-600">Method: {methodLabel[payment.method]}</p>
          {payment.transactionId ? <p className="text-slate-600">Txn ID: {payment.transactionId}</p> : null}
          {payment.collectedBy ? <p className="text-slate-600">Collected by: {payment.collectedBy}</p> : null}
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="rounded-l-lg px-4 py-2.5 font-semibold">Description</th>
            <th className="rounded-r-lg px-4 py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {paidFeeBreakdown.map(([feeHead, amount]) => (
            <tr key={feeHead} className="border-b border-slate-100">
              <td className="px-4 py-2.5 font-medium">{feeHead.replace(/_/g, ' ')}</td>
              <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(amount)}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-100">
            <td className="px-4 py-2.5 font-semibold">{paidFeeBreakdown.length ? 'Total Paid' : 'Amount Paid'}</td>
            <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(payment.amount)}</td>
          </tr>
          {/* {payment.remainingAfter !== undefined ? (
            <tr>
              <td className="px-4 py-2.5 font-semibold">Remaining Balance</td>
              <td className="px-4 py-2.5 text-right font-semibold text-rose-600">
                {formatCurrency(payment.remainingAfter)}
              </td>
            </tr>
          ) : null} */}
        </tbody>
      </table>

      {/* <div className="mt-6 flex items-end justify-between gap-6 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3">
          <QRCode value={`upi://pay?pa=${settings.upiId}&am=${payment.amount}`} size={84} />
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Scan to verify</p>
            {settings.upiId ? <p>UPI: {settings.upiId}</p> : null}
            {payment.transactionId ? <p>Txn: {payment.transactionId}</p> : null}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 h-10 w-40 border-b border-slate-400" />
          <p className="text-xs font-semibold text-slate-600">Authorized Signature</p>
        </div>
      </div> */}

      {settings.invoiceFooter ? (
        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">{settings.invoiceFooter}</p>
      ) : null}
    </div>
  );
}
