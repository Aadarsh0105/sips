




import React from 'react';
import {
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  FileTextIcon,
  WalletIcon } from
'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useData, deriveFee } from '../../contexts/DataContext';
import { classNamesFor, formatCurrency, formatDate, formatTime, statusLabel } from '../../lib/utils';
import type { Payment, Student } from '../../lib/types';

export function StudentDetailModal({
  student,
  open,
  onClose,
  onPay,
  onViewReceipt






}: {student: Student | null;open: boolean;onClose: () => void;onPay?: (s: Student) => void;onViewReceipt?: (p: Payment) => void;}) {
  const { paymentsFor } = useData();
  if (!student) return null;
  const fee = deriveFee(student, paymentsFor(student.id));
  const history = paymentsFor(student.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Student Profile"
      subtitle={`${student.id} · Admission ${student.admissionNumber}`}
      footer={
      onPay &&
      <Button onClick={() => onPay(student)} disabled={fee.remaining <= 0}>
            <WalletIcon className="h-4 w-4" /> Accept Payment
          </Button>

      }>
      
      <div className="space-y-6">
        {/* Identity header */}
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-start dark:bg-slate-800/50">
          {student.photo ?
          <img
            src={student.photo}
            alt={student.name}
            className="h-20 w-20 rounded-2xl object-cover" /> :


          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
              {student.name[0]}
            </div>
          }
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classNamesFor(fee.status)}`}>
                {statusLabel(fee.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Class {student.className}-{student.section} · Roll {student.rollNumber} · Session{' '}
              {student.session}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Total" value={formatCurrency(fee.totalFee)} />
            <MiniStat label="Paid" value={formatCurrency(fee.paid)} tone="text-emerald-600" />
            <MiniStat label="Due" value={formatCurrency(fee.remaining)} tone="text-rose-600" />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Info icon={UserIcon} label="Father's Name" value={student.fatherName} />
          <Info icon={UserIcon} label="Mother's Name" value={student.motherName} />
          <Info icon={CalendarIcon} label="Date of Birth" value={formatDate(student.dob)} />
          <Info icon={UserIcon} label="Gender" value={student.gender} className="capitalize" />
          <Info icon={PhoneIcon} label="Student Mobile" value={student.mobile} />
          <Info icon={PhoneIcon} label="Parent Mobile" value={student.parentMobile} />
          <Info icon={MailIcon} label="Email" value={student.email || '—'} />
          <Info icon={CalendarIcon} label="Admission Date" value={formatDate(student.admissionDate)} />
          <Info icon={CalendarIcon} label="Fee Due Date" value={formatDate(student.dueDate)} />
          <Info icon={MapPinIcon} label="Address" value={student.address || '—'} />
        </div>

        {/* Fee breakdown */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4 dark:border-slate-800">
          <MiniStat label="Base Fee" value={formatCurrency(student.totalFee)} />
          <MiniStat label="Discount" value={formatCurrency(student.discount)} tone="text-emerald-600" />
          <MiniStat label="Fine" value={formatCurrency(student.fine)} tone="text-amber-600" />
          <MiniStat label="Net Payable" value={formatCurrency(fee.totalFee)} />
        </div>

        {/* Payment history */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <FileTextIcon className="h-4 w-4 text-brand-500" /> Payment History
          </h4>
          {history.length === 0 ?
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
              No payments recorded yet.
            </p> :

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Receipt</th>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 font-semibold">Method</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    {onViewReceipt && <th className="px-4 py-2.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((p) =>
                <tr key={p.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {formatDate(p.date)} · {formatTime(p.date)}
                      </td>
                      <td className="px-4 py-2.5 uppercase text-slate-500">{p.method}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        {p.status === 'completed' ?
                    <Badge tone="green">Completed</Badge> :

                    <Badge tone="amber">Pending</Badge>
                    }
                      </td>
                      {onViewReceipt &&
                  <td className="px-4 py-2.5 text-right">
                          {p.status === 'completed' &&
                    <Button size="sm" variant="ghost" onClick={() => onViewReceipt(p)}>
                              Receipt
                            </Button>
                    }
                        </td>
                  }
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </Modal>);

}

function Info({
  icon: Icon,
  label,
  value,
  className





}: {icon: any;label: string;value: string;className?: string;}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm font-medium text-slate-800 dark:text-slate-100 ${className ?? ''}`}>
          {value}
        </p>
      </div>
    </div>);

}

function MiniStat({ label, value, tone }: {label: string;value: string;tone?: string;}) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-sm font-bold ${tone ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>);

}