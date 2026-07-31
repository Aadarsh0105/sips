















import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  QrCodeIcon,
  SearchIcon,
  WalletIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StudentDetailModal } from '../../components/students/StudentDetailModal';
import { PaymentModal } from '../../components/shared/PaymentModal';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { useData, deriveFee } from '../../contexts/DataContext';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  classNamesFor,
  formatCurrency,
  formatTime,
  isToday,
  statusLabel } from
'../../lib/utils';
import type { Payment, Student } from '../../lib/types';

export function ReceptionDashboard() {
  const { students, payments } = useData();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Student | null>(null);
  const [paying, setPaying] = useState<Student | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const myToday = useMemo(
    () =>
    payments.filter(
      (p) => p.status === 'completed' && isToday(p.date) && p.collectedBy === user?.name
    ),
    [payments, user]
  );
  const todayTotal = myToday.reduce((s, p) => s + p.amount, 0);
  const pendingVerification = payments.filter((p) => p.status === 'pending_verification').length;
  const outstanding = students.filter((s) => deriveFee(s, payments).remaining > 0).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students.
    filter(
      (s) =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.mobile.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q)
    ).
    slice(0, 6);
  }, [query, students]);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Search students and collect fees quickly." />
      

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Collected Today (You)" value={formatCurrency(todayTotal)} icon={CalendarDaysIcon} tone="green" />
        <StatCard label="Receipts Today" value={myToday.length} icon={WalletIcon} tone="brand" index={1} />
        <StatCard label="Pending Verification" value={pendingVerification} icon={QrCodeIcon} tone="amber" index={2} />
        <StatCard label="Outstanding Students" value={outstanding} icon={UsersIcon} tone="red" index={3} />
      </div>

      {/* Quick search */}
      <Card className="mb-6">
        <CardHeader
          title="Quick Student Search"
          subtitle="Find a student by ID, name, mobile, or admission number"
          action={
          <Button variant="outline" onClick={() => navigate('/reception/fees')}>
              <QrCodeIcon className="h-4 w-4" /> Verify QR
            </Button>
          } />
        
        <div className="px-5 pb-5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Type to search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus />
            
          </div>

          {query.trim() &&
          <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {results.length === 0 ?
            <p className="px-4 py-6 text-center text-sm text-slate-400">No students found.</p> :

            results.map((s) => {
              const fee = deriveFee(s, payments);
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-600 dark:bg-brand-500/15">
                          {s.name[0]}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                          <p className="text-xs text-slate-400">
                            {s.id} · Class {s.className}-{s.section} · {s.mobile}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-right">
                          <span className="block text-xs text-slate-400">Remaining</span>
                          <span className="font-display font-bold text-slate-800 dark:text-white">
                            {formatCurrency(fee.remaining)}
                          </span>
                        </span>
                        <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classNamesFor(fee.status)}`}>
                      
                          {statusLabel(fee.status)}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => setDetail(s)}>
                          View
                        </Button>
                        {fee.remaining > 0 &&
                    <Button size="sm" onClick={() => setPaying(s)}>
                            Collect
                          </Button>
                    }
                      </div>
                    </div>);

            })
            }
            </div>
          }
        </div>
      </Card>

      {/* My recent receipts */}
      <Card>
        <CardHeader title="Your Recent Collections" subtitle="Payments you've collected" />
        {myToday.length === 0 ?
        <p className="px-5 pb-8 text-sm text-slate-400">No collections yet today.</p> :

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Receipt</th>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Time</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3 text-right font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {myToday.map((p) => {
                const s = students.find((x) => x.id === p.studentId);
                return (
                  <tr key={p.id}>
                      <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">
                        {p.receiptNumber}
                      </td>
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{s?.name}</td>
                      <td className="px-6 py-3 text-slate-500">{formatTime(p.date)}</td>
                      <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setReceipt(p)}>
                          Receipt
                        </Button>
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
      </Card>

      <StudentDetailModal
        student={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onPay={(s) => {
          setDetail(null);
          setPaying(s);
        }}
        onViewReceipt={(p) => setReceipt(p)} />
      
      <PaymentModal
        student={paying}
        open={!!paying}
        onClose={() => setPaying(null)}
        onDone={(p) => setReceipt(p)} />
      
      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </div>);

}
