import React from 'react';
import {
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  WalletIcon,
  UserIcon,
  FileTextIcon,
  BusFrontIcon,
  BadgeIndianRupeeIcon,
  PencilIcon,
  GraduationCapIcon,
  Trash2Icon,
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
  page = false,
  onBusAction,
  onWaiveLateFee,
  onEdit,
  onPromote,
  onDelete,
}: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
  onViewReceipt?: (p: Payment) => void;
  onViewHistory?: () => void;
  onPay?: () => void;
  hideHistory?: boolean;
  page?: boolean;
  onBusAction?: () => void;
  onWaiveLateFee?: () => void;
  onEdit?: () => void;
  onPromote?: () => void;
  onDelete?: () => void;
}) {
  if (!student) return null;

  const promotionHistory = Array.isArray((student as any).classPromotionHistory) ? (student as any).classPromotionHistory : [];
  const lateFeeWaivers = Array.isArray((student as any).lateFeeWaivers) ? (student as any).lateFeeWaivers : [];
  const busFacilityHistory = Array.isArray((student as any).busFacilityHistory) ? (student as any).busFacilityHistory : [];
  const busFeeRefunds = Array.isArray((student as any).busFeeRefunds) ? (student as any).busFeeRefunds : [];

  const content = (
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
          <Info icon={CalendarIcon} label="Student ID" value={student.studentId} />
          <Info icon={CalendarIcon} label="Status" value={student.status || 'ACTIVE'} className="capitalize" />
          <Info icon={UserIcon} label="Father's Name" value={student.fatherName} />
          <Info icon={UserIcon} label="Mother's Name" value={student.motherName} />
          <Info icon={CalendarIcon} label="Date of Birth" value={formatDate(student.dob)} />
          <Info icon={UserIcon} label="Gender" value={student.gender} className="capitalize" />
          <Info icon={PhoneIcon} label="Student Mobile" value={student.mobile} />
          <Info icon={MailIcon} label="Email" value={student.email || '�'} />
          <Info icon={CalendarIcon} label="Admission Date" value={formatDate(student.admissionDate || '')} />
          <Info icon={CalendarIcon} label="Fee Start Date" value={student.feeStartDate ? formatDate(student.feeStartDate) : '�'} />
          <Info icon={CalendarIcon} label="Fee Start From" value={(student as any).feeStartFrom || '�'} />
          <Info icon={CalendarIcon} label="Fee Discount Type" value={(student as any).feeDiscountType || 'NONE'} />
          <Info icon={MapPinIcon} label="Address" value={student.address || '�'} />
          <Info icon={CalendarIcon} label="Admission No" value={student.admissionNo || '�'} />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4 dark:border-slate-800">
          <MiniStat label="Admission Fee" value={formatCurrency((student as any).admissionFee ?? 0)} />
          <MiniStat label="Total Fee" value={formatCurrency(student.totalFee)} />
          <MiniStat label="Monthly Fee" value={formatCurrency(student.monthlyFee ?? 0)} tone="text-slate-700" />
          <MiniStat label="Due Fee" value={formatCurrency(student.dueFee ?? 0)} tone="text-rose-600" />
          <MiniStat label="Paid Fee" value={formatCurrency(student.paidFee ?? 0)} tone="text-emerald-600" />
          <MiniStat label="Exam Fee" value={formatCurrency((student as any).examFee ?? 0)} />
          <MiniStat label="Sport Fee" value={formatCurrency((student as any).sportFee ?? 0)} />
          <MiniStat label="Computer Fee" value={formatCurrency((student as any).computerFee ?? 0)} />
          <MiniStat label="Function Fee" value={formatCurrency((student as any).functionFee ?? 0)} />
          <MiniStat label="Smart Class Fee" value={formatCurrency((student as any).smartClassFee ?? 0)} />
          <MiniStat label="Other Charges" value={formatCurrency((student as any).otherCharges ?? 0)} />
          <MiniStat label="Opening Due" value={formatCurrency((student as any).openingDue ?? 0)} />
          <MiniStat label="Lump Sum Paid" value={(student as any).lumpSumPaid ? 'Yes' : 'No'} tone={(student as any).lumpSumPaid ? 'text-emerald-600' : 'text-slate-600'} />
          <MiniStat label="Lump Sum Discount Type" value={(student as any).lumpSumDiscountType || 'NONE'} />
          <MiniStat label="Lump Sum Discount %" value={`${(student as any).lumpSumDiscountPercent ?? 0}%`} />
          <MiniStat label="Lump Sum Discount Amount" value={formatCurrency((student as any).lumpSumDiscountAmount ?? 0)} />
          <MiniStat label="Late Fee Waived" value={(student as any).lateFeeWaived ? 'Yes' : 'No'} tone={(student as any).lateFeeWaived ? 'text-emerald-600' : 'text-slate-600'} />
          <MiniStat label="Late Fee Waiver Amount" value={formatCurrency((student as any).lateFeeWaiverAmount ?? 0)} />
          <MiniStat label="Bus Facility" value={(student as any).hasBusFacility ? 'Active' : 'Not Active'} tone={(student as any).hasBusFacility ? 'text-emerald-600' : 'text-slate-600'} />
          <MiniStat label="Current Bus Fee" value={formatCurrency((student as any).busFee ?? 0)} />
        </div>

        {busFacilityHistory.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Bus Facility History</h4>
              <span className="text-xs text-slate-400">{busFacilityHistory.length} records</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {busFacilityHistory.map((item: any) => (
                <div key={item._id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{item.startType?.replace(/_/g, ' ') || 'Bus Facility'}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <MiniStat label="Bus Fee" value={formatCurrency(item.busFee ?? 0)} />
                    <MiniStat label="First Month Fee" value={item.firstMonthProrated ? formatCurrency(item.firstMonthBusFee ?? 0) : 'Full Fee'} />
                    <MiniStat label="Effective From" value={formatDate(item.effectiveFrom || '')} />
                    <MiniStat label="Effective To" value={item.effectiveTo ? formatDate(item.effectiveTo) : 'Ongoing'} />
                    <MiniStat label="Chargeable Days" value={item.chargeableDays == null ? '—' : `${item.chargeableDays} days`} />
                    <MiniStat label="Covered by Lump Sum" value={item.coveredByExistingLumpSum ? 'Yes' : 'No'} />
                  </div>
                  {item.startReason || item.stopReason ? (
                    <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {item.startReason ? <p><strong>Start:</strong> {item.startReason}</p> : null}
                      {item.stopReason ? <p><strong>Stop:</strong> {item.stopReason}</p> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {busFeeRefunds.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Bus Fee Refunds</h4>
              <span className="text-xs text-slate-400">{busFeeRefunds.length} records</span>
            </div>
            {busFeeRefunds.map((refund: any) => (
              <div key={refund._id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{refund.refundNo}</p>
                    <p className="text-xs text-slate-500">{refund.reason || 'Bus fee refund'}</p>
                  </div>
                  <p className="font-display text-lg font-bold text-emerald-600">{formatCurrency(refund.amount ?? 0)}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label="Mode" value={refund.refundMode || '—'} />
                  <MiniStat label="Status" value={refund.status || '—'} />
                  <MiniStat label="Received By" value={refund.receivedBy || '—'} />
                  <MiniStat label="Refunded At" value={formatDate(refund.refundedAt || '')} />
                </div>
                {refund.refundableMonthDetails?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {refund.refundableMonthDetails.map((month: any) => (
                      <span key={month.month} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                        {month.month}: {formatCurrency(month.amount ?? 0)}
                      </span>
                    ))}
                  </div>
                ) : null}
                {refund.remarks ? <p className="mt-3 text-xs text-slate-500">{refund.remarks}</p> : null}
              </div>
            ))}
          </div>
        ) : null}

        {promotionHistory.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Class Promotion History</h4>
              <span className="text-xs text-slate-400">{promotionHistory.length} records</span>
            </div>
            <div className="space-y-3">
              {promotionHistory.map((item: any) => (
                <div key={item._id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.fromClass} → {item.toClass} ({item.fromSection} → {item.toSection})
                    </p>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {item.status || 'APPLIED'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">{item.remarks || 'No remarks'}</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <MiniStat label="Applied At" value={formatDate(item.appliedAt || item.effectiveFrom || '')} />
                    <MiniStat label="Promoted At" value={formatDate(item.promotedAt || '')} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {lateFeeWaivers.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">Late Fee Waivers</h4>
              <span className="text-xs text-slate-400">{lateFeeWaivers.length} records</span>
            </div>
            <div className="space-y-3">
              {lateFeeWaivers.map((item: any, index: number) => (
                <div key={item._id ?? index} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <MiniStat label="Amount" value={formatCurrency(item.amount ?? 0)} />
                    <MiniStat label="Reason" value={item.reason || '—'} />
                    <MiniStat label="Applied At" value={formatDate(item.appliedAt || item.createdAt || '')} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
          {onWaiveLateFee ? (
            <button
              type="button"
              onClick={onWaiveLateFee}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              <BadgeIndianRupeeIcon className="h-4 w-4" /> Waive Late Fee
            </button>
          ) : null}
          {onBusAction ? (
            <button
              type="button"
              onClick={onBusAction}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${(student as any).hasBusFacility ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
            >
              <BusFrontIcon className="h-4 w-4" /> {(student as any).hasBusFacility ? 'Stop Bus Facility' : 'Start Bus Facility'}
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/10">
              <PencilIcon className="h-4 w-4" /> Edit
            </button>
          ) : null}
          {onPromote ? (
            <button type="button" onClick={onPromote} className="inline-flex items-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:border-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/10">
              <GraduationCapIcon className="h-4 w-4" /> Promote
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/20 dark:hover:bg-rose-500/10">
              <Trash2Icon className="h-4 w-4" /> Delete
            </button>
          ) : null}
        </div>
      </div>
  );

  if (page) return content;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xxl"
      title="Student Profile"
      subtitle={`Admission ${student.admissionNo || '�'} · Student ${student.studentId}`}
      footer={null}
    >
      {content}
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
