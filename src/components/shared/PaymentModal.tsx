import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchStudents, type StudentRecord } from '../../features/students/studentsSlice';
import { formatCurrency } from '../../lib/utils';
import type { Payment, PaymentMethod } from '../../lib/types';

type LumpSumPreview = {
  eligible: boolean;
  paymentType: string;
  feefeeDiscountType: string;
  monthlyDiscountPercentage: number;
  remainingMonths: number;
  lumpSumMonthlyFee: number;
  remainingMonthlyAmount: number;
  remainingOneTimeFees: number;
  remainingAcademicFee: number;
  additionalDiscount: number;
  lumpSumAmount: number;
};

export function PaymentModal({ student, open, onClose, onDone }: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
  onDone?: (payment: Payment) => void;
}) {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [remarks, setRemarks] = useState('');
  const [preview, setPreview] = useState<LumpSumPreview | null>(null);

  const studentId = student?.studentId ?? '';
  const paid = student?.paidFee ?? 0;
  const remaining = student?.dueFee ?? 0;
  const total = student?.totalFee ?? 0;
  const isLumpSumSeason = new Date().getMonth() + 1 <= 8;
  const lumpSumLocked = Boolean(student?.lumpSumPaid);

  useEffect(() => {
    if (!open || !isLumpSumSeason || !studentId) {
      setPreview(null);
      return;
    }
    let active = true;
    void api
      .get(`${API.FEES}/lump-sum-preview/${studentId}`)
      .then((response) => {
        if (!active) return;
        setPreview(response?.data?.data ?? null);
      })
      .catch(() => {
        if (active) setPreview(null);
      });

    return () => {
      active = false;
    };
  }, [open, studentId, isLumpSumSeason]);

  if (!student) return null;
  const reset = () => {
    setAmount('');
    setMethod('cash');
    setRemarks('');
  };

  const submit = async (full: boolean, lumpSum = false) => {
    const value = lumpSum ? Number(preview?.lumpSumAmount ?? 0) : full ? remaining : Number(amount);
    if (!value || value <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (value > remaining && !lumpSum) {
      toast.error(`Amount exceeds remaining balance of ${formatCurrency(remaining)}.`);
      return;
    }
    try {
      const response = await api.post(API.FEES_COLLECT, {
        studentId: student.studentId,
        amount: value,
        paymentMode: method.toUpperCase(),
        remarks: lumpSum ? remarks.trim() || 'Academic year lump sum payment' : remarks.trim() || 'Fee payment',
        feeHead: lumpSum ? 'MONTHLY' : 'OTHER',
        paymentType: lumpSum ? 'LUMP_SUM' : 'REGULAR',
        feefeeDiscountType: lumpSum ? preview?.feefeeDiscountType ?? 'NONE' : 'NONE',
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
        <>
          {isLumpSumSeason && preview?.eligible && !lumpSumLocked ? (
            <Button variant="outline" onClick={() => submit(false, true)}>
              Pay Lump Sum ({formatCurrency(preview.lumpSumAmount)})
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => submit(true)} disabled={remaining <= 0 || lumpSumLocked}>
            Pay Full ({formatCurrency(remaining)})
          </Button>
          <Button onClick={() => submit(false)} disabled={remaining <= 0 || lumpSumLocked}>
            Make Payment
          </Button>
        </>
      }>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <SummaryTile label="Total Fee" value={formatCurrency(total)} />
        <SummaryTile label="Paid" value={formatCurrency(paid)} tone="text-emerald-600" />
        <SummaryTile label="Remaining" value={formatCurrency(remaining)} tone="text-rose-600" />
      </div>

      {isLumpSumSeason && preview?.eligible && !lumpSumLocked ? (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-brand-500/20 dark:bg-brand-500/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Lump Sum available</p>
              <p className="text-slate-600 dark:text-slate-300">
                Discount {preview.monthlyDiscountPercentage}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Lump Sum Amount</p>
              <p className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">
                {formatCurrency(preview.lumpSumAmount)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {remaining <= 0 || lumpSumLocked ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          This student&apos;s fees are fully paid.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount" required>
              <Input type="text" placeholder={`Up to ${remaining}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
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
          <Field label="Remarks">
            <Textarea placeholder="July Fee" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field>
        </div>
      )}
    </Modal>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-sm font-bold ${tone ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
