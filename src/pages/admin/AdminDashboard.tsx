import { useMemo } from 'react';
import {
  UsersIcon,
  UserCogIcon,
  IndianRupeeIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import {
  ClasswiseChart,
  MonthlyCollectionChart,
  PaymentStatusChart,
  RevenueChart } from
'../../components/dashboard/Charts';
import { useData } from '../../contexts/DataContext';
import { useAppSelector } from '../../hooks/useAppSelector';
import { computeMetrics } from '../../lib/analytics';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

export function AdminDashboard() {
  const { students, payments, users, settings } = useData();
  const { user } = useAppSelector((state) => state.auth);
  const m = useMemo(() => computeMetrics(students, payments, users), [students, payments, users]);

  const recent = useMemo(
    () =>
    [...payments].
    filter((p) => p.status === 'completed').
    sort((a, b) => +new Date(b.date) - +new Date(a.date)).
    slice(0, 6),
    [payments]
  );

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`Here's what's happening at ${settings.name} today.`} />
      

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={m.totalStudents} icon={UsersIcon} tone="brand" index={0} />
        <StatCard
          label="Total Receptionists"
          value={m.totalReceptionists}
          icon={UserCogIcon}
          tone="violet"
          index={1} />
        
        <StatCard
          label="Total Revenue"
          value={formatCurrency(m.totalRevenue)}
          icon={IndianRupeeIcon}
          tone="green"
          index={2} />
        
        <StatCard
          label="Today's Collection"
          value={formatCurrency(m.todayCollection)}
          icon={CalendarDaysIcon}
          tone="blue"
          index={3} />
        
        <StatCard
          label="Monthly Collection"
          value={formatCurrency(m.monthlyCollection)}
          icon={TrendingUpIcon}
          tone="brand"
          index={4} />
        
        <StatCard
          label="Pending Fees"
          value={formatCurrency(m.pendingFees)}
          icon={AlertCircleIcon}
          tone="red"
          index={5} />
        
        <StatCard label="Paid Students" value={m.paidStudents} icon={CheckCircle2Icon} tone="green" index={6} />
        <StatCard
          label="Pending Students"
          value={m.pendingStudents}
          icon={ClockIcon}
          tone="amber"
          index={7} />
        
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly Fee Collection" subtitle="Last 8 months" />
          <div className="px-3 pb-4">
            <MonthlyCollectionChart data={m.monthlySeries} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Payment Status" subtitle="Student distribution" />
          <div className="px-3 pb-4">
            <PaymentStatusChart data={m.statusSeries} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue Analytics" subtitle="Revenue vs. target" />
          <div className="px-3 pb-4">
            <RevenueChart data={m.revenueSeries} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Class-wise Collection" subtitle="Top classes by amount collected" />
          <div className="px-3 pb-4">
            <ClasswiseChart data={m.classwiseSeries} />
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="mt-4">
        <CardHeader title="Recent Transactions" subtitle="Latest completed payments" />
        <div className="overflow-x-auto">
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
              {recent.map((p) => {
                const s = students.find((x) => x.id === p.studentId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                      {p.receiptNumber}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{s?.name ?? '—'}</td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {formatDate(p.date)} · {formatTime(p.date)}
                    </td>
                    <td className="px-6 py-3.5 uppercase text-slate-500">{p.method}</td>
                    <td className="px-6 py-3.5 text-slate-500">{p.collectedBy}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>);

}
