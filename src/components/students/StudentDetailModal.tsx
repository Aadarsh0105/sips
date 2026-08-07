import React from 'react';
import {
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  WalletIcon,
  UserIcon,
  FileTextIcon,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Payment } from '../../lib/types';
import type { StudentRecord } from '../../features/students/studentsSlice';

export function StudentDetailModal({
  student,
  open,
  onClose,
  onViewReceipt,
  onViewHistory,
  onPay,
  hideHistory = false,
}: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
  onViewReceipt?: (p: Payment) => void;
  onViewHistory?: () => void;
  onPay?: () => void;
  hideHistory?: boolean;
}) {
  if (!student) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Student Profile"
      subtitle={`Admission ${student.admissionNo || '�'} · Student ${student.studentId}`}
      footer={null}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-start dark:bg-slate-800/50">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
            {student.name[0]}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {student.status || 'ACTIVE'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Class {student.className}-{student.section}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Monthly Fee" value={formatCurrency(student.monthlyFee ?? 0)} />
            <MiniStat label="Paid" value={formatCurrency(student.paidFee ?? 0)} tone="text-emerald-600" />
            <MiniStat label="Due" value={formatCurrency(student.dueFee ?? 0)} tone="text-rose-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Info icon={UserIcon} label="Father's Name" value={student.fatherName} />
          <Info icon={UserIcon} label="Mother's Name" value={student.motherName} />
          <Info icon={CalendarIcon} label="Date of Birth" value={formatDate(student.dob)} />
          <Info icon={UserIcon} label="Gender" value={student.gender} className="capitalize" />
          <Info icon={PhoneIcon} label="Student Mobile" value={student.mobile} />
          <Info icon={MailIcon} label="Email" value={student.email || '�'} />
          <Info icon={CalendarIcon} label="Admission Date" value={formatDate(student.admissionDate || '')} />
          <Info icon={CalendarIcon} label="Fee Start Date" value={student.feeStartDate ? formatDate(student.feeStartDate) : '�'} />
          <Info icon={MapPinIcon} label="Address" value={student.address || '�'} />
          <Info icon={CalendarIcon} label="Admission No" value={student.admissionNo || '�'} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4 dark:border-slate-800">
          <MiniStat label="Total Fee" value={formatCurrency(student.totalFee)} />
          <MiniStat label="Monthly Fee" value={formatCurrency(student.monthlyFee ?? 0)} tone="text-slate-700" />
          <MiniStat label="Due Fee" value={formatCurrency(student.dueFee ?? 0)} tone="text-rose-600" />
          <MiniStat label="Paid Fee" value={formatCurrency(student.paidFee ?? 0)} tone="text-emerald-600" />
        </div>

        <div className="flex flex-wrap gap-2">
          {onPay ? (
            <button
              type="button"
              onClick={onPay}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <WalletIcon className="h-4 w-4" /> Pay Fee
            </button>
          ) : null}
          {!hideHistory && onViewHistory ? (
            <button
              type="button"
              onClick={onViewHistory}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              <FileTextIcon className="h-4 w-4" /> View Payment History
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-sm font-medium text-slate-800 dark:text-slate-100 ${className ?? ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-sm font-bold ${tone ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
