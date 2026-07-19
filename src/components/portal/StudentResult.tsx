







import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DownloadIcon,
  WalletIcon,
  FileTextIcon,
  CalendarClockIcon } from
'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ReceiptModal } from '../shared/ReceiptModal';
import { PayFeeModal } from './PayFeeModal';
import { useData, deriveFee } from '../../contexts/DataContext';
import {
  classNamesFor,
  formatCurrency,
  formatDate,
  formatTime,
  statusLabel } from
'../../lib/utils';
import type { Payment, Student } from '../../lib/types';

export function StudentResult({ student }: {student: Student;}) {
  const { paymentsFor } = useData();
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const history = paymentsFor(student.id);
  const fee = deriveFee(student, history);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6">
      
      {/* Profile summary */}
      <Card>
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          {student.photo ?
          <img src={student.photo} alt={student.name} className="h-20 w-20 rounded-2xl object-cover" /> :

          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
              {student.name[0]}
            </div>
          }
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                {student.name}
              </h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classNamesFor(fee.status)}`}>
                {statusLabel(fee.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {student.id} · Class {student.className}-{student.section} · Roll {student.rollNumber}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <CalendarClockIcon className="h-4 w-4" /> Fee due by {formatDate(student.dueDate)}
            </p>
          </div>
          {fee.remaining > 0 &&
          <Button size="lg" onClick={() => setPayOpen(true)}>
              <WalletIcon className="h-5 w-5" /> Pay Fee
            </Button>
          }
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800">
          <FeeTile label="Total Fee" value={formatCurrency(fee.totalFee)} />
          <FeeTile label="Paid Amount" value={formatCurrency(fee.paid)} tone="text-emerald-600" />
          <FeeTile label="Remaining Fee" value={formatCurrency(fee.remaining)} tone="text-rose-600" />
          <FeeTile label="Class & Section" value={`${student.className}-${student.section}`} />
        </div>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader title="Payment History" subtitle="All transactions on your account" />
        {history.length === 0 ?
        <p className="px-6 pb-8 text-sm text-slate-400">No payments recorded yet.</p> :

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Receipt</th>
                  <th className="px-6 py-3 font-semibold">Date &amp; Time</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((p) =>
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                      {p.receiptNumber}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {formatDate(p.date)} · {formatTime(p.date)}
                    </td>
                    <td className="px-6 py-3.5 uppercase text-slate-500">{p.method}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      {p.status === 'completed' ?
                  <Badge tone="green">Paid</Badge> :

                  <Badge tone="amber">Pending Verification</Badge>
                  }
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {p.status === 'completed' ?
                  <Button size="sm" variant="outline" onClick={() => setReceipt(p)}>
                          <DownloadIcon className="h-4 w-4" /> Receipt
                        </Button> :

                  <span className="text-xs text-slate-400">Awaiting review</span>
                  }
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </Card>

      <PayFeeModal
        student={student}
        remaining={fee.remaining}
        open={payOpen}
        onClose={() => setPayOpen(false)} />
      
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </motion.div>);

}

function FeeTile({ label, value, tone }: {label: string;value: string;tone?: string;}) {
  return (
    <div className="bg-white p-5 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold ${tone ?? 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
    </div>);

}