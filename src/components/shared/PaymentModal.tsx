import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRef } from 'react';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { CommonConfirmModal } from '../ui/CommonConfirmModal';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchStudents, type StudentRecord } from '../../features/students/studentsSlice';
import { formatCurrency } from '../../lib/utils';
import type { Payment, PaymentMethod } from '../../lib/types';

type LumpSumPreview = {
  eligible: boolean;
  paymentType: string;
  feeDiscountType?: string;
  discountType?: string;
  monthlyDiscountPercentage: number;
  feeStartDate?: string;
  totalAcademicMonths?: number;
  passedMonths?: number;
  alreadyPaidMonths?: number;
  remainingMonths: number;
  normalMonthlyFee: number;
  monthlyFeeSchedule?: Array<{
    month: string;
    className: string;
    section: string;
    monthlyFee: number;
    effectiveMonthlyFee: number;
  }>;
  remainingMonthlyAmount: number;
  remainingOneTimeFees: number;
  remainingAcademicFee: number;
  additionalDiscount: number;
  discountedMonthlyAmount?: number;
  lumpSumAmount: number;
};

type FeeCalculation = {
  studentId: string;
  feeHead: string | string[];
  feeStartDate?: string;
  accruedMonths: number;
  monthlyDetails: Array<{
    month: string;
    className: string;
    section: string;
    monthlyFee: number;
    effectiveMonthlyFee: number;
  }>;
  busDetails?: Array<{
    month: string;
    busFee: number;
    effectiveBusFee: number;
    firstMonthProrated: boolean;
  }>;
  feeDiscountType: string;
  feeBreakdown: Record<string, number>;
  paidBreakdown: Record<string, number>;
  dueBreakdown: Record<string, number>;
  totalFee: number;
  paidFee: number;
  paidFeeMonths: string[];
  lateFee: number;
  lateFeeWaived: number;
  lateFeePaid: number;
  payableLateFee: number;
  lateFeeDetails: Array<{
    month: string;
    lateFee: number;
    waivedAmount: number;
    payableLateFee: number;
    paid: boolean;
    lateFeePaid: number;
  }>;
  dueFee: number;
  lumpSumDetails?: LumpSumPreview | null;
};

const ALLOWED_FEE_HEADS = [
  'ADMISSION',
  'MONTHLY',
  'BUS',
  'EXAM',
  'SPORT',
  'COMPUTER',
  'FUNCTION',
  'SMART_CLASS',
  'OTHER',
  'LATE_FEE',
  'OPENING_DUE',
  'ALL',
] as const;

export function PaymentModal({ student, open, onClose, onDone }: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
  onDone?: (payment: Payment) => void;
}) {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [feeHeads, setFeeHeads] = useState<Array<(typeof ALLOWED_FEE_HEADS)[number]>>(['ALL']);
  const [selectedFeeMonths, setSelectedFeeMonths] = useState<Record<'MONTHLY' | 'BUS', string[]>>({ MONTHLY: [], BUS: [] });
  const [feeHeadOpen, setFeeHeadOpen] = useState(false);
  const feeHeadRef = useRef<HTMLDivElement>(null);
  const [remarks, setRemarks] = useState('');
  const [calculation, setCalculation] = useState<FeeCalculation | null>(null);
  const [lumpSumDetails, setLumpSumDetails] = useState<LumpSumPreview | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{ full: boolean; lumpSum: boolean } | null>(null);

  const studentId = student?.studentId ?? '';
  const remaining = student?.dueFee ?? 0;
  const isLumpSumSeason = new Date().getMonth() + 1 <= 8;
  const lumpSumLocked = Boolean(student?.lumpSumPaid);

  useEffect(() => {
    if (!open || !studentId) {
      setCalculation(null);
      setLumpSumDetails(null);
      return;
    }
    let active = true;
    void api
      .post(`${API.FEES}/calculate`, {
        studentId,
        feeHead: feeHeads.includes('ALL') ? 'ALL' : feeHeads,
      })
      .then((response) => {
        if (!active) return;
        const data = response?.data?.data ?? null;
        setCalculation(data);
        if (data?.lumpSumDetails) setLumpSumDetails(data.lumpSumDetails);
      })
      .catch(() => {
        if (active) setCalculation(null);
      });

    return () => {
      active = false;
    };
  }, [open, studentId, feeHeads]);

  useEffect(() => {
    const closeDropdown = (event: MouseEvent) => {
      if (!feeHeadRef.current?.contains(event.target as Node)) setFeeHeadOpen(false);
    };
    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);

  if (!student) return null;
  const preview = lumpSumDetails;
  const monthlyDueOptions = buildDueMonthOptions(calculation?.monthlyDetails ?? [], Number(calculation?.dueBreakdown?.MONTHLY ?? 0), 'effectiveMonthlyFee');
  const busDueOptions = buildDueMonthOptions(calculation?.busDetails ?? [], Number(calculation?.dueBreakdown?.BUS ?? 0), 'effectiveBusFee');
  const monthOptions = { MONTHLY: monthlyDueOptions, BUS: busDueOptions };
  const selectedMonthTotal = (head: 'MONTHLY' | 'BUS') => monthOptions[head]
    .filter((item) => selectedFeeMonths[head].includes(item.month))
    .reduce((sum, item) => sum + item.due, 0);
  const selectedFeeDue = feeHeads.includes('ALL')
    ? Number(calculation?.dueFee ?? remaining)
    : feeHeads.reduce((sum, head) => sum + (
      head === 'MONTHLY' || head === 'BUS'
        ? selectedMonthTotal(head)
        : Number(calculation?.dueBreakdown?.[head] ?? 0)
    ), 0);
  const hasPayableLumpSum = Boolean(
    isLumpSumSeason &&
    preview?.eligible &&
    Number(preview?.lumpSumAmount ?? 0) > 0 &&
    !lumpSumLocked
  );
  const canPaySelectedFee = selectedFeeDue > 0 && !lumpSumLocked;
  const reset = () => {
    setAmount('');
    setMethod('cash');
    setFeeHeads(['ALL']);
    setSelectedFeeMonths({ MONTHLY: [], BUS: [] });
    setFeeHeadOpen(false);
    setRemarks('');
    setPendingPayment(null);
  };

  const getPaymentValue = (full: boolean, lumpSum: boolean) => (
    lumpSum ? Number(preview?.lumpSumAmount ?? 0) : full ? selectedFeeDue : Number(amount)
  );

  const requestPayment = (full: boolean, lumpSum = false) => {
    const value = getPaymentValue(full, lumpSum);
    if (!feeHeads.length && !lumpSum) {
      toast.error('Select at least one fee head.');
      return;
    }
    if (!value || value <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (value > selectedFeeDue && !lumpSum) {
      toast.error(`Amount cannot exceed the selected fees total of ${formatCurrency(selectedFeeDue)}.`);
      return;
    }
    setPendingPayment({ full, lumpSum });
  };

  const buildFeeBreakdown = (value: number) => {
    const selectedHeads = feeHeads.includes('ALL')
      ? ALLOWED_FEE_HEADS.filter((head) => head !== 'ALL')
      : feeHeads;
    let balance = value;
    return selectedHeads.reduce<Record<string, number>>((breakdown, head) => {
      const due = head === 'MONTHLY' || head === 'BUS'
        ? selectedMonthTotal(head)
        : Number(calculation?.dueBreakdown?.[head] ?? 0);
      const allocated = Math.min(due, balance);
      if (allocated > 0) {
        breakdown[head] = allocated;
        balance -= allocated;
      }
      return breakdown;
    }, {});
  };

  const submit = async (full: boolean, lumpSum = false) => {
    const value = getPaymentValue(full, lumpSum);
    try {
      const response = await api.post(API.FEES_COLLECT, {
        studentId: student.studentId,
        feeHead: 'ALL',
        amount: value,
        ...(!lumpSum ? {
          feeBreakdown: buildFeeBreakdown(value),
          // feeMonths: selectedFeeMonths,
        } : {}),
        paymentMode: method.toUpperCase(),
        remarks: lumpSum ? remarks.trim() || 'Academic year lump sum payment' : remarks.trim() || 'Fee payment',
        paymentType: lumpSum ? 'LUMP_SUM' : 'REGULAR',
        feeDiscountType: lumpSum ? preview?.feeDiscountType ?? preview?.discountType ?? 'NONE' : 'NONE',
        lumpSumDiscountPercent: lumpSum ? preview?.monthlyDiscountPercentage ?? 0 : 0,
        lumpSumDiscountAmount: lumpSum ? preview?.additionalDiscount ?? 0 : 0,
      });
      const paymentData = response?.data?.data;
      const payment: Payment = {
        id: paymentData?._id ?? paymentData?.receiptNo,
        receiptNumber: paymentData?.receiptNo ?? '',
        invoiceNumber: '',
        studentId: student.studentId,
        amount: paymentData?.amount ?? value,
        method,
        transactionId: paymentData?.transactionId || undefined,
        status: 'completed',
        collectedBy: paymentData?.collectedBy ?? '',
        date: paymentData?.paymentDate ?? new Date().toISOString(),
        remainingAfter: Math.max(0, remaining - value),
        note: (paymentData?.remarks ?? remarks.trim()) || undefined,
      };
      toast.success('Fee collected successfully.');
      await dispatch(fetchStudents());
      reset();
      onClose();
      onDone?.(payment);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Unable to collect fee.');
    }
  };

  return (
    <Modal open={open} size="lg" onClose={() => { reset(); onClose(); }} title="Accept Fee Payment" subtitle={`${student.name} · ${student.studentId}`}
      footer={
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
          {hasPayableLumpSum ? (
            <Button variant="outline" className="w-full whitespace-nowrap sm:w-auto" onClick={() => requestPayment(false, true)}>
              Pay Lump Sum ({formatCurrency(preview?.lumpSumAmount ?? 0)})
            </Button>
          ) : null}
          <Button variant="outline" className="w-full whitespace-nowrap sm:w-auto" onClick={() => requestPayment(true)} disabled={!canPaySelectedFee}>
            Pay Selected ({formatCurrency(selectedFeeDue)})
          </Button>
          <Button className="w-full whitespace-nowrap sm:w-auto" onClick={() => requestPayment(false)} disabled={!canPaySelectedFee}>
            Make Payment
          </Button>
        </div>
      }>
      {calculation ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Payable Fee</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a fee head below to see its payable balance.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Current payable</p>
              <p className="font-display text-xl font-bold text-rose-600">{formatCurrency(selectedFeeDue)}</p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60">
            <div className="grid grid-cols-4 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <span>Fee</span>
              <span className="text-right">Total</span>
              <span className="text-right">Paid</span>
              <span className="text-right">Due</span>
            </div>
            {Object.keys(calculation.feeBreakdown || {}).map((key) => (
              <button
                key={key}
                type="button"
                className={`grid w-full grid-cols-4 border-t border-slate-100 px-3 py-2.5 text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${feeHeads.includes(key as (typeof ALLOWED_FEE_HEADS)[number]) ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}
                onClick={() => {
                  if (ALLOWED_FEE_HEADS.includes(key as (typeof ALLOWED_FEE_HEADS)[number])) {
                    const selectedHead = key as (typeof ALLOWED_FEE_HEADS)[number];
                    setFeeHeads((current) => current.includes(selectedHead)
                      ? current.filter((item) => item !== selectedHead)
                      : [...current.filter((item) => item !== 'ALL'), selectedHead]);
                    if (selectedHead === 'MONTHLY' || selectedHead === 'BUS') {
                      setSelectedFeeMonths((current) => ({
                        ...current,
                        [selectedHead]: current[selectedHead].length ? [] : monthOptions[selectedHead].map((item) => item.month),
                      }));
                    }
                    setAmount('');
                  }
                }}
              >
                <span className="text-left font-medium text-slate-700 dark:text-slate-200">{key.replace(/_/g, ' ')}</span>
                <span className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(Number(calculation.feeBreakdown?.[key] ?? 0))}</span>
                <span className="text-right font-medium text-emerald-600">{formatCurrency(Number(calculation.paidBreakdown?.[key] ?? 0))}</span>
                <span className="text-right font-semibold text-rose-600">{formatCurrency(Number(calculation.dueBreakdown?.[key] ?? 0))}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {hasPayableLumpSum ? (
        <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Full-year lump sum</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Pay all remaining academic fees together and save {formatCurrency(preview?.additionalDiscount ?? 0)}.
              </p>
            </div>
            <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-300">
              {formatCurrency(preview?.lumpSumAmount ?? 0)}
            </p>
          </div>
        </div>
      ) : null}

      {(remaining <= 0 || lumpSumLocked) && !hasPayableLumpSum ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          This student&apos;s fees are fully paid.
        </p>
      ) : (
        <div className="space-y-4">
          {remaining <= 0 && hasPayableLumpSum ? (
            <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              Current accrued fees are paid. The lump sum amount includes remaining future academic or bus fees.
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Fee Head" required>
              <div ref={feeHeadRef} className="relative">
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  onClick={() => setFeeHeadOpen((current) => !current)}
                >
                  <span className="truncate">{feeHeads.length ? feeHeads.map((item) => item.replace(/_/g, ' ')).join(', ') : 'Select fee heads'}</span>
                  <span className="ml-2 text-slate-400">⌄</span>
                </button>
                {feeHeadOpen ? (
                  <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    {ALLOWED_FEE_HEADS.map((item) => {
                      const disabled = item !== 'ALL' && feeHeads.includes('ALL');
                      return (
                        <label key={item} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-800 dark:text-slate-100 ${disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          <input
                            type="checkbox"
                            checked={feeHeads.includes(item)}
                            disabled={disabled}
                            onChange={() => {
                              setAmount('');
                              if (item === 'ALL') {
                                setFeeHeads((current) => current.includes('ALL') ? [] : ['ALL']);
                                setSelectedFeeMonths({ MONTHLY: [], BUS: [] });
                                return;
                              }
                              setFeeHeads((current) => current.includes(item)
                                ? current.filter((selected) => selected !== item)
                                : [...current.filter((selected) => selected !== 'ALL'), item]);
                              if (item === 'MONTHLY' || item === 'BUS') {
                                setSelectedFeeMonths((current) => ({
                                  ...current,
                                  [item]: current[item].length ? [] : monthOptions[item].map((option) => option.month),
                                }));
                              }
                            }}
                          />
                          <span>{item.replace(/_/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Amount" required>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={`Up to ${selectedFeeDue}`}
                value={amount}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (/^\d*(\.\d{0,2})?$/.test(nextValue)) setAmount(nextValue);
                }}
              />
              <p className="mt-1 text-xs text-slate-500">Maximum: {formatCurrency(selectedFeeDue)}</p>
            </Field>
            <Field label="Payment Mode" required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </Select>
            </Field>
          </div>
          {(feeHeads.includes('MONTHLY') || feeHeads.includes('BUS')) ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(['MONTHLY', 'BUS'] as const).map((head) => feeHeads.includes(head) ? (
                <MonthMultiSelect
                  key={head}
                  label={`${head === 'MONTHLY' ? 'Monthly Fee' : 'Bus Fee'} Months`}
                  options={monthOptions[head]}
                  selected={selectedFeeMonths[head]}
                  onChange={(months) => {
                    setSelectedFeeMonths((current) => ({ ...current, [head]: months }));
                    const monthTotal = monthOptions[head]
                      .filter((item) => months.includes(item.month))
                      .reduce((sum, item) => sum + item.due, 0);
                    const otherTotal = feeHeads
                      .filter((item) => item !== head)
                      .reduce((sum, item) => sum + (
                        item === 'MONTHLY' || item === 'BUS'
                          ? selectedMonthTotal(item)
                          : Number(calculation?.dueBreakdown?.[item] ?? 0)
                      ), 0);
                    setAmount(String(monthTotal + otherTotal));
                  }}
                />
              ) : null)}
            </div>
          ) : null}
          <Field label="Remarks">
            <Textarea placeholder="July Fee" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field>
        </div>
      )}
      <CommonConfirmModal
        open={Boolean(pendingPayment)}
        onClose={() => setPendingPayment(null)}
        onConfirm={() => {
          if (pendingPayment) void submit(pendingPayment.full, pendingPayment.lumpSum);
        }}
        title={pendingPayment?.lumpSum ? 'Confirm Lump Sum Payment' : 'Confirm Fee Payment'}
        message={`Collect ${formatCurrency(pendingPayment ? getPaymentValue(pendingPayment.full, pendingPayment.lumpSum) : 0)} from ${student.name} using ${method.toUpperCase()}?`}
        confirmLabel="Confirm Payment"
        tone="success"
      />
    </Modal>
  );
}

function buildDueMonthOptions<T extends { month: string }>(items: T[], totalDue: number, amountKey: keyof T) {
  const scheduledTotal = items.reduce((sum, item) => sum + Number(item[amountKey] ?? 0), 0);
  let paidBalance = Math.max(0, scheduledTotal - totalDue);
  return items.map((item) => {
    const amount = Number(item[amountKey] ?? 0);
    const paid = Math.min(amount, paidBalance);
    paidBalance -= paid;
    return { month: item.month, due: Math.max(0, amount - paid) };
  }).filter((item) => item.due > 0);
}

function MonthMultiSelect({ label, options, selected, onChange }: {
  label: string;
  options: Array<{ month: string; due: number }>;
  selected: string[];
  onChange: (months: string[]) => void;
}) {
  const allSelected = options.length > 0 && selected.length === options.length;
  return (
    <Field label={label} required>
      <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
        <label className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span className="flex items-center gap-2">
            <input type="checkbox" checked={allSelected} onChange={() => onChange(allSelected ? [] : options.map((item) => item.month))} />
            All due months
          </span>
          <span>{formatCurrency(options.reduce((sum, item) => sum + item.due, 0))}</span>
        </label>
        <div className="mt-1 max-h-36 space-y-1 overflow-y-auto">
          {options.map((item) => (
            <label key={item.month} className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(item.month)}
                  onChange={() => onChange(selected.includes(item.month) ? selected.filter((month) => month !== item.month) : [...selected, item.month])}
                />
                {item.month}
              </span>
              <span className="font-semibold">{formatCurrency(item.due)}</span>
            </label>
          ))}
          {!options.length ? <p className="px-3 py-2 text-xs text-slate-500">No due months.</p> : null}
        </div>
      </div>
    </Field>
  );
}
