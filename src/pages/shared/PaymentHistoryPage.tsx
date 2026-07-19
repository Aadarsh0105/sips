
















import React, { useMemo, useState } from 'react';
import { DownloadIcon, ReceiptIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReceiptModal } from '../../components/shared/ReceiptModal';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { exportCSV } from '../../lib/export';
import type { Payment } from '../../lib/types';

const PAGE_SIZE = 12;

export function PaymentHistoryPage() {
  const { payments, students } = useData();
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(1);
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.
    filter((p) => {
      const s = students.find((x) => x.id === p.studentId);
      const matchesQuery =
      !q ||
      p.receiptNumber.toLowerCase().includes(q) ||
      p.invoiceNumber.toLowerCase().includes(q) ||
      (p.transactionId ?? '').toLowerCase().includes(q) ||
      (s?.name ?? '').toLowerCase().includes(q);
      const matchesMethod = method === 'all' || p.method === method;
      return matchesQuery && matchesMethod;
    }).
    sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [payments, students, query, method]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    exportCSV(
      'payment-history',
      filtered.map((p) => {
        const s = students.find((x) => x.id === p.studentId);
        return {
          Receipt: p.receiptNumber,
          Invoice: p.invoiceNumber,
          Student: s?.name ?? '',
          Amount: p.amount,
          Date: formatDate(p.date),
          Time: formatTime(p.date),
          Method: p.method,
          TxnID: p.transactionId ?? '',
          CollectedBy: p.collectedBy,
          RemainingAfter: p.remainingAfter,
          Status: p.status
        };
      })
    );
    toast.success('Payment history exported.');
  };

  return (
    <div>
      <PageHeader
        title="Payment History"
        subtitle={`${payments.length} total transactions`}
        action={
        <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4" /> Export
          </Button>
        } />
      

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search receipt, invoice, txn ID, student…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9" />
            
          </div>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
          </Select>
        </div>
      </Card>

      <Card>
        {current.length === 0 ?
        <EmptyState icon={ReceiptIcon} title="No transactions" description="Try adjusting your filters." /> :

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Receipt / Invoice</th>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Date &amp; Time</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Collected By</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {current.map((p) => {
                const s = students.find((x) => x.id === p.studentId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {p.receiptNumber}
                        </p>
                        <p className="text-xs text-slate-400">{p.invoiceNumber}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                        {s?.name ?? '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {formatDate(p.date)} · {formatTime(p.date)}
                      </td>
                      <td className="px-6 py-3.5 uppercase text-slate-500">{p.method}</td>
                      <td className="px-6 py-3.5 text-slate-500">{p.collectedBy}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-3.5">
                        {p.status === 'completed' ?
                      <Badge tone="green">Completed</Badge> :

                      <Badge tone="amber">Pending</Badge>
                      }
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {p.status === 'completed' &&
                      <Button size="sm" variant="ghost" onClick={() => setReceipt(p)}>
                            Receipt
                          </Button>
                      }
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
        <div className="border-t border-slate-100 dark:border-slate-800">
          <Pagination page={page} pageCount={pageCount} total={filtered.length} onPage={setPage} />
        </div>
      </Card>

      <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
    </div>);

}