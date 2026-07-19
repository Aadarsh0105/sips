












import React, { useMemo, useState } from 'react';
import {
  CheckIcon,
  ClockIcon,
  QrCodeIcon,
  WalletIcon,
  ReceiptIcon } from
'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { PaymentModal } from '../../components/shared/PaymentModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { useData, deriveFee } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  classNamesFor,
  formatCurrency,
  formatDate,
  formatTime,
  statusLabel } from
'../../lib/utils';
import type { Payment, Student } from '../../lib/types';

export function FeeManagementPage() {
  const { students, payments, verifyPayment } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [paying, setPaying] = useState<Student | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const pending = useMemo(
    () => payments.filter((p) => p.status === 'pending_verification'),
    [payments]
  );

  const outstanding = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.
    map((s) => ({ s, fee: deriveFee(s, payments) })).
    filter(({ s, fee }) => {
      if (fee.remaining <= 0) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.mobile.toLowerCase().includes(q));

    }).
    sort((a, b) => b.fee.remaining - a.fee.remaining);
  }, [students, payments, query]);

  const totalDue = outstanding.reduce((sum, o) => sum + o.fee.remaining, 0);
  const partialCount = students.filter((s) => deriveFee(s, payments).status === 'partial').length;

  return (
    <div>
      <PageHeader title="Fee Management" subtitle="Collect payments, verify UPI, and manage balances." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Outstanding" value={formatCurrency(totalDue)} icon={WalletIcon} tone="red" />
        <StatCard label="Partial Payments" value={partialCount} icon={ClockIcon} tone="amber" index={1} />
        <StatCard
          label="Pending Verification"
          value={pending.length}
          icon={QrCodeIcon}
          tone="blue"
          index={2} />
        
      </div>

      {/* Pending verification queue */}
      <Card className="mb-6">
        <CardHeader
          title="QR Payments — Pending Verification"
          subtitle="Review UPI payments submitted by students" />
        
        {pending.length === 0 ?
        <EmptyState
          icon={QrCodeIcon}
          title="Nothing to verify"
          description="Submitted UPI payments will appear here for review." /> :


        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Txn ID</th>
                  <th className="px-6 py-3 font-semibold">Submitted</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pending.map((p) => {
                const s = students.find((x) => x.id === p.studentId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {s?.name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">{p.studentId}</p>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                        {p.transactionId}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {formatDate(p.date)} · {formatTime(p.date)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                          size="sm"
                          onClick={() => {
                            verifyPayment(p.id, user?.name ?? 'Staff');
                            setReceipt({ ...p, status: 'completed' });
                          }}>
                          
                            <CheckIcon className="h-4 w-4" /> Verify
                          </Button>
                        </div>
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
      </Card>

      {/* Outstanding balances */}
      <Card>
        <CardHeader
          title="Outstanding Balances"
          subtitle="Students with pending fees"
          action={
          <div className="w-56">
              <Input
              placeholder="Search students…"
              value={query}
              onChange={(e) => setQuery(e.target.value)} />
            
            </div>
          } />
        
        {outstanding.length === 0 ?
        <EmptyState icon={ReceiptIcon} title="All fees collected" description="No outstanding balances." /> :

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                  <th className="px-6 py-3 text-right font-semibold">Paid</th>
                  <th className="px-6 py-3 text-right font-semibold">Remaining</th>
                  <th className="px-6 py-3 font-semibold">Due Date</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outstanding.map(({ s, fee }) =>
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.id}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {s.className}-{s.section}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(fee.totalFee)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-emerald-600">
                      {formatCurrency(fee.paid)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-rose-600">
                      {formatCurrency(fee.remaining)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(s.dueDate)}</td>
                    <td className="px-6 py-3.5">
                      <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classNamesFor(fee.status)}`}>
                    
                        {statusLabel(fee.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button size="sm" variant="outline" onClick={() => setPaying(s)}>
                        <WalletIcon className="h-4 w-4" /> Collect
                      </Button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </Card>

      <PaymentModal
        student={paying}
        open={!!paying}
        onClose={() => setPaying(null)}
        onDone={(p) => setReceipt(p)} />
      
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </div>);

}