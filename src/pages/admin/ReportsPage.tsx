import { useEffect, useMemo, useState } from 'react';
import { DownloadIcon, FileTextIcon, PrinterIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { exportCSV, printElement } from '../../lib/export';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

type FeeHistoryItem = {
  _id: string;
  receiptNo: string;
  student:
    | {
        _id: string;
        studentId: string;
        admissionNo: string;
        name: string;
        fatherName: string;
        className: string;
        section: string;
      }
    | string;
  studentId: string;
  amount: number;
  paymentMode: string;
  paymentStatus: string;
  collectedBy: { _id: string; name: string; role: string } | null;
  paymentDate: string;
};

type DashboardData = {
  adminStats?: {
    totalCollection: number;
    todayCollection: number;
    monthCollection: number;
    pendingFee: number;
    paidStudents: number;
    dueStudents: number;
  };
  paymentModeSummary?: { _id: string; totalAmount: number; totalTransactions: number }[];
  monthlyCollectionSeries?: { month: string; total: number }[];
  classWiseCollection?: { _id: string; totalCollection: number; totalTransactions: number }[];
  recentTransactions?: { _id: string; receiptNo: string; studentId: string; amount: number; paymentMode: string; paymentDate: string }[];
  topDueStudents?: { _id: string; studentId: string; name: string; className: string; dueFee: number; paidFee: number }[];
};

function withinDays(iso: string, days: number): boolean {
  const diff = Date.now() - new Date(iso).getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function ReportsPage() {
  const { settings } = useData();
  const [type, setType] = useState<ReportType>('daily');
  const [history, setHistory] = useState<FeeHistoryItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([api.get(API.FEES + '/history'), api.get(API.DASHBOARD_ADMIN)])
      .then(([historyResponse, dashboardResponse]) => {
        if (!active) return;
        setHistory(historyResponse?.data?.data ?? []);
        setDashboard(dashboardResponse?.data?.data ?? {});
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error?.response?.data?.message ?? 'Unable to load reports data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((item) => {
      const student = typeof item.student === 'object' ? item.student : null;
      const matchesQuery =
        !q ||
        item.receiptNo.toLowerCase().includes(q) ||
        item.studentId.toLowerCase().includes(q) ||
        (student?.name ?? '').toLowerCase().includes(q) ||
        (item.collectedBy?.name ?? '').toLowerCase().includes(q);
      const matchesMethod = method === 'all' || item.paymentMode.toLowerCase() === method;
      return matchesQuery && matchesMethod;
    });
  }, [history, query, method]);

  const collectionRows = useMemo(() => {
    let rows = filteredHistory.filter((item) => item.paymentStatus === 'SUCCESS');
    if (type === 'daily') rows = rows.filter((item) => withinDays(item.paymentDate, 1));
    if (type === 'weekly') rows = rows.filter((item) => withinDays(item.paymentDate, 7));
    if (type === 'monthly') rows = rows.filter((item) => withinDays(item.paymentDate, 31));
    if (type === 'yearly') rows = rows.filter((item) => new Date(item.paymentDate).getFullYear() === new Date().getFullYear());
    return rows.sort((a, b) => +new Date(b.paymentDate) - +new Date(a.paymentDate));
  }, [filteredHistory, type]);

  const todayCollection = collectionRows.filter((item) => withinDays(item.paymentDate, 1)).reduce((sum, item) => sum + item.amount, 0);
  const weeklyCollection = collectionRows.filter((item) => withinDays(item.paymentDate, 7)).reduce((sum, item) => sum + item.amount, 0);
  const monthlyCollection = collectionRows.filter((item) => withinDays(item.paymentDate, 31)).reduce((sum, item) => sum + item.amount, 0);
  const yearlyCollection = collectionRows.filter((item) => new Date(item.paymentDate).getFullYear() === new Date().getFullYear()).reduce((sum, item) => sum + item.amount, 0);

  const reportLabel = `${type.charAt(0).toUpperCase()}${type.slice(1)} Collection`;

  const handleExport = () => {
    exportCSV(
      `payment-history-${type}`,
      collectionRows.map((item) => {
        const student = typeof item.student === 'object' ? item.student : null;
        return {
          Receipt: item.receiptNo,
          Student: student?.name ?? item.studentId,
          Date: formatDate(item.paymentDate),
          Time: formatTime(item.paymentDate),
          Method: item.paymentMode,
          CollectedBy: item.collectedBy?.name ?? '',
          Amount: item.amount,
        };
      })
    );
    toast.success('Report exported to CSV.');
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Live payment reports from history and dashboard data."
        action={
          <>
            <Button variant="outline" onClick={() => printElement('report-print', 'Report')}>
              <PrinterIcon className="h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleExport}>
              <DownloadIcon className="h-4 w-4" /> Excel
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Today Collection" value={formatCurrency(dashboard.adminStats?.todayCollection ?? todayCollection)} />
        <SummaryCard label="Weekly Collection" value={formatCurrency(weeklyCollection)} />
        <SummaryCard label="Monthly Collection" value={formatCurrency(dashboard.adminStats?.monthCollection ?? monthlyCollection)} />
        <SummaryCard label="Yearly Collection" value={formatCurrency(yearlyCollection)} />
      </div>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search receipt, student, collector..." className="pl-9" />
          </div>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
          </Select>
          <Select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
            <option value="daily">Today</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <CardHeader title="Payment History" subtitle={`${collectionRows.length} records`} />
        <div id="report-print">
          <div className="mb-4 hidden print:block">
            <h2 className="font-display text-xl font-bold">{settings.name}</h2>
            <p className="text-sm text-slate-500">{reportLabel} · Generated {formatDate(new Date().toISOString())}</p>
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Loading reports...</p>
          ) : collectionRows.length === 0 ? (
            <EmptyState icon={FileTextIcon} title="No records" description="Try changing the filters." />
          ) : (
            <div className="w-full overflow-x-auto pb-2">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold sm:px-6">Receipt</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold sm:px-6">Student</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold sm:px-6">Date &amp; Time</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold sm:px-6">Method</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold sm:px-6">Collected By</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold sm:px-6">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {collectionRows.map((item) => {
                    const student = typeof item.student === 'object' ? item.student : null;
                    return (
                      <tr key={item._id}>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 sm:px-6 dark:text-slate-200">{item.receiptNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 sm:px-6 dark:text-slate-300">{student?.name ?? item.studentId}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 sm:px-6">{formatDate(item.paymentDate)} · {formatTime(item.paymentDate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 uppercase text-slate-500 sm:px-6">{item.paymentMode}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 sm:px-6">{item.collectedBy?.name ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-600 sm:px-6">{formatCurrency(item.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </Card>
  );
}
