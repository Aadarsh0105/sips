








import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, SmartphoneIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Input';
import { QRCode } from '../shared/QRCode';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../lib/utils';
import type { Student } from '../../lib/types';

export function PayFeeModal({
  student,
  remaining,
  open,
  onClose





}: {student: Student;remaining: number;open: boolean;onClose: () => void;}) {
  const { settings, recordPayment } = useData();
  const [amount, setAmount] = useState(String(remaining));
  const [txn, setTxn] = useState('');
  const [done, setDone] = useState(false);

  const reset = () => {
    setAmount(String(remaining));
    setTxn('');
    setDone(false);
  };

  const submit = () => {
    const value = Number(amount);
    if (!value || value <= 0) return toast.error('Enter a valid amount.');
    if (value > remaining)
    return toast.error(`Amount exceeds remaining balance of ${formatCurrency(remaining)}.`);
    if (!txn.trim()) return toast.error('Enter the UPI Transaction ID after paying.');

    recordPayment({
      studentId: student.id,
      amount: value,
      method: 'upi',
      transactionId: txn.trim(),
      collectedBy: 'Online (Student)',
      pendingVerification: true
    });
    setDone(true);
    toast.success('Payment submitted for verification.');
  };

  const upiLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.name)}&am=${amount}&cu=INR`;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={done ? 'Payment Submitted' : 'Pay Fee via UPI'}
      subtitle={done ? undefined : `${student.name} · Balance ${formatCurrency(remaining)}`}
      size="md"
      footer={
      done ?
      <Button
        onClick={() => {
          reset();
          onClose();
        }}>
        
            Done
          </Button> :

      <>
            <Button
          variant="outline"
          onClick={() => {
            reset();
            onClose();
          }}>
          
              Cancel
            </Button>
            <Button onClick={submit}>Submit Transaction ID</Button>
          </>

      }>
      
      {done ?
      <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
            <CheckCircle2Icon className="h-9 w-9" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Pending Verification
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Your payment of {formatCurrency(Number(amount))} was submitted. Once the school verifies
            your transaction, it will be marked as paid and your receipt will be generated
            automatically.
          </p>
        </div> :

      <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/50">
            {settings.qrImage ?
          <img src={settings.qrImage} alt="School UPI QR" className="h-48 w-48 rounded-lg object-contain" /> :

          <QRCode value={upiLink} size={190} />
          }
            <div className="text-center">
              <p className="text-xs text-slate-400">Amount Due</p>
              <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(remaining)}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-600">UPI: {settings.upiId}</p>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <SmartphoneIcon className="h-4 w-4" /> Scan with any UPI app to pay
            </p>
          </div>

          <Field label="Amount to Pay (₹)" required>
            <Input
            type="number"
            min={1}
            max={remaining}
            value={amount}
            onChange={(e) => setAmount(e.target.value)} />
          
          </Field>
          <Field label="UPI Transaction ID" required>
            <Input
            placeholder="Enter the 12-digit UTR / Txn ID"
            value={txn}
            onChange={(e) => setTxn(e.target.value)} />
          
          </Field>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            After paying, enter your transaction ID above. The payment will show as{' '}
            <strong>Pending Verification</strong> until the school confirms it.
          </p>
        </div>
      }
    </Modal>);

}