




import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { useData, deriveFee } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';
import type { Payment, PaymentMethod, Student } from '../../lib/types';

export function PaymentModal({
  student,
  open,
  onClose,
  onDone





}: {student: Student | null;open: boolean;onClose: () => void;onDone?: (payment: Payment) => void;}) {
  const { payments, recordPayment } = useData();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [txn, setTxn] = useState('');
  const [note, setNote] = useState('');

  if (!student) return null;
  const fee = deriveFee(student, payments);

  const reset = () => {
    setAmount('');
    setMethod('cash');
    setTxn('');
    setNote('');
  };

  const submit = (full: boolean) => {
    const value = full ? fee.remaining : Number(amount);
    if (!value || value <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (value > fee.remaining) {
      toast.error(`Amount exceeds remaining balance of ${formatCurrency(fee.remaining)}.`);
      return;
    }
    if (method === 'upi' && !txn.trim()) {
      toast.error('Enter the UPI transaction ID.');
      return;
    }
    const payment = recordPayment({
      studentId: student.id,
      amount: value,
      method,
      transactionId: txn.trim() || undefined,
      collectedBy: user?.name ?? 'Front Desk',
      note: note.trim() || undefined
    });
    toast.success(
      value >= fee.remaining ? 'Full payment recorded successfully.' : 'Partial payment recorded.'
    );
    reset();
    onClose();
    onDone?.(payment);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Accept Fee Payment"
      subtitle={`${student.name} · ${student.id}`}
      footer={
      <>
          <Button
          variant="outline"
          onClick={() => submit(true)}
          disabled={fee.remaining <= 0}>
          
            Pay Full ({formatCurrency(fee.remaining)})
          </Button>
          <Button onClick={() => submit(false)} disabled={fee.remaining <= 0}>
            Record Payment
          </Button>
        </>
      }>
      
      <div className="mb-5 grid grid-cols-3 gap-3">
        <SummaryTile label="Total Fee" value={formatCurrency(fee.totalFee)} />
        <SummaryTile label="Paid" value={formatCurrency(fee.paid)} tone="text-emerald-600" />
        <SummaryTile label="Remaining" value={formatCurrency(fee.remaining)} tone="text-rose-600" />
      </div>

      {fee.remaining <= 0 ?
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          This student's fees are fully paid.
        </p> :

      <div className="space-y-4">
          <Field label="Amount" required>
            <Input
            type="number"
            min={1}
            max={fee.remaining}
            placeholder={`Up to ${fee.remaining}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)} />
          
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Payment Method" required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </Select>
            </Field>
            <Field label="Transaction / Reference ID">
              <Input
              placeholder="TXN / UTR number"
              value={txn}
              onChange={(e) => setTxn(e.target.value)} />
            
            </Field>
          </div>
          <Field label="Note (optional)">
            <Textarea
            placeholder="Any remark for this payment"
            value={note}
            onChange={(e) => setNote(e.target.value)} />
          
          </Field>
        </div>
      }
    </Modal>);

}

function SummaryTile({ label, value, tone }: {label: string;value: string;tone?: string;}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-sm font-bold ${tone ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>);

}