import { useMemo, useState } from 'react';
import {
  DownloadIcon,
  FileTextIcon,
  PrinterIcon } from
'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData, deriveFee } from '../../contexts/DataContext';
import { formatCurrency, formatDate, formatTime, isThisMonth, isToday } from '../../lib/utils';
import { exportCSV, printElement } from '../../lib/export';
import type { Payment } from '../../lib/types';

type ReportType =
'daily' |
'weekly' |
'monthly' |
'yearly' |
'pending' |
'paid' |
'partial' |
'student';

const OPTIONS: {value: ReportType;label: string;}[] = [
{ value: 'daily', label: 'Daily Collection' },
{ value: 'weekly', label: 'Weekly Collection' },
{ value: 'monthly', label: 'Monthly Collection' },
{ value: 'yearly', label: 'Yearly Collection' },
{ value: 'pending', label: 'Pending Fees' },
{ value: 'paid', label: 'Fully Paid Students' },
{ value: 'partial', label: 'Partial Payments' },
{ value: 'student', label: 'Student-wise Report' }];


function withinDays(iso: string, days: number): boolean {
  const diff = Date.now() - new Date(iso).getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function ReportsPage() {
  const { students, payments, settings } = useData();
  const [type, setType] = useState<ReportType>('monthly');

  const isCollection = ['daily', 'weekly', 'monthly', 'yearly'].includes(type);

  const collectionRows = useMemo(() => {
    let filtered: Payment[] = payments.filter((p) => p.status === 'completed');
    if (type === 'daily') filtered = filtered.filter((p) => isToday(p.date));else
    if (type === 'weekly') filtered = filtered.filter((p) => withinDays(p.date, 7));else
    if (type === 'monthly') filtered = filtered.filter((p) => isThisMonth(p.date));else
    if (type === 'yearly')
    filtered = filtered.filter((p) => new Date(p.date).getFullYear() === new Date().getFullYear());
    return filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [payments, type]);

  const studentRows = useMemo(() => {
    return students.
    map((s) => ({ s, fee: deriveFee(s, payments) })).
    filter(({ fee }) => {
      if (type === 'pending') return fee.status === 'pending' || fee.status === 'partial';
      if (type === 'paid') return fee.status === 'paid';
      if (type === 'partial') return fee.status === 'partial';
      return true; // student-wise
    });
  }, [students, payments, type]);

  const total = isCollection ?
  collectionRows.reduce((sum, p) => sum + p.amount, 0) :
  studentRows.reduce((sum, r) => sum + (type === 'pending' ? r.fee.remaining : r.fee.paid), 0);

  const handleExport = () => {
    if (isCollection) {
      exportCSV(
        `report-${type}`,
        collectionRows.map((p) => {
          const s = students.find((x) => x.id === p.studentId);
          return {
            Receipt: p.receiptNumber,
            Student: s?.name ?? '',
            Date: formatDate(p.date),
            Method: p.method,
            CollectedBy: p.collectedBy,
            Amount: p.amount
          };
        })
      );
    } else {
      exportCSV(
        `report-${type}`,
        studentRows.map(({ s, fee }) => ({
          StudentID: s.id,
          Name: s.name,
          Class: `${s.className}-${s.section}`,
          Total: fee.totalFee,
          Paid: fee.paid,
          Remaining: fee.remaining,
          Status: fee.status
        }))
      );
    }
    toast.success('Report exported to Excel (CSV).');
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and export collection and fee reports."
        action={
        <>
            <Button variant="outline" onClick={() => printElement('report-print', 'Report')}>
              <PrinterIcon className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleExport}>
              <DownloadIcon className="h-4 w-4" /> Excel
            </Button>
          </>
        } />
      

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-72">
            <Select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
              {OPTIONS.map((o) =>
              <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              )}
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm dark:bg-brand-500/10">
            <span className="text-slate-500 dark:text-slate-400">
              {isCollection ? 'Total Collected' : type === 'pending' ? 'Total Pending' : 'Total Paid'}:
            </span>
            <span className="font-display font-bold text-brand-700 dark:text-brand-300">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </Card>

      <div id="report-print">
        <div className="mb-4 hidden items-center justify-between print:flex">
          <div>
            <h2 className="font-display text-xl font-bold">{settings.name}</h2>
            <p className="text-sm text-slate-500">
              {OPTIONS.find((o) => o.value === type)?.label} · Generated {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <Card>
          <CardHeader
            title={OPTIONS.find((o) => o.value === type)?.label}
            subtitle={`${isCollection ? collectionRows.length : studentRows.length} records`} />
          
          {(isCollection ? collectionRows.length : studentRows.length) === 0 ?
          <EmptyState icon={FileTextIcon} title="No records" description="No data for this report." /> :

          <div className="overflow-x-auto">
              {isCollection ?
            <table className="w-full text-left text-sm">
                  <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Receipt</th>
                      <th className="px-6 py-3 font-semibold">Student</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Method</th>
                      <th className="px-6 py-3 font-semibold">Collected By</th>
                      <th className="px-6 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {collectionRows.map((p) => {
                  const s = students.find((x) => x.id === p.studentId);
                  return (
                    <tr key={p.id}>
                          <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">
                            {p.receiptNumber}
                          </td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{s?.name}</td>
                          <td className="px-6 py-3 text-slate-500">
                            {formatDate(p.date)} · {formatTime(p.date)}
                          </td>
                          <td className="px-6 py-3 uppercase text-slate-500">{p.method}</td>
                          <td className="px-6 py-3 text-slate-500">{p.collectedBy}</td>
                          <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>);

                })}
                  </tbody>
                </table> :

            <table className="w-full text-left text-sm">
                  <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Student</th>
                      <th className="px-6 py-3 font-semibold">Class</th>
                      <th className="px-6 py-3 text-right font-semibold">Total</th>
                      <th className="px-6 py-3 text-right font-semibold">Paid</th>
                      <th className="px-6 py-3 text-right font-semibold">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentRows.map(({ s, fee }) =>
                <tr key={s.id}>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.id}</p>
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {s.className}-{s.section}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-300">
                          {formatCurrency(fee.totalFee)}
                        </td>
                        <td className="px-6 py-3 text-right text-emerald-600">
                          {formatCurrency(fee.paid)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-rose-600">
                          {formatCurrency(fee.remaining)}
                        </td>
                      </tr>
                )}
                  </tbody>
                </table>
            }
            </div>
          }
        </Card>
      </div>
    </div>);

}