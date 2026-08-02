import { useEffect } from 'react';
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
  PaymentModeChart } from
'../../components/dashboard/Charts';
import { useData } from '../../contexts/DataContext';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  fetchAdminDashboard,
  fetchClassWiseCollection,
  fetchMonthlyCollection,
  fetchPaymentModeSummary,
  fetchRecentTransactions,
  fetchTopDueStudents
} from '../../features/dashboard/dashboardSlice';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

export function AdminDashboard() {
  const dispatch = useAppDispatch();
  const { settings } = useData();
  const { user } = useAppSelector((state) => state.auth);
  const dashboard = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    void dispatch(fetchAdminDashboard());
    void dispatch(fetchRecentTransactions());
    void dispatch(fetchMonthlyCollection());
    void dispatch(fetchTopDueStudents());
    void dispatch(fetchPaymentModeSummary());
    void dispatch(fetchClassWiseCollection());
  }, [dispatch]);

  const stats = dashboard.adminStats;
  const recent = dashboard.recentTransactions;
  const monthlySeries = dashboard.monthlyCollectionSeries;
  const paymentModeData = dashboard.paymentModeSummary.map((mode) => ({
    name: mode._id,
    value: mode.totalAmount,
  }));
  const classWiseData = dashboard.classWiseCollection.map((item) => ({
    className: item._id,
    amount: item.totalCollection,
  }));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`Here's what's happening at ${settings.name} today.`} />
      
      {dashboard.error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/10">
          {dashboard.error}
        </p>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} icon={UsersIcon} tone="brand" index={0} />
        <StatCard
          label="Total Receptionists"
          value={stats?.totalReceptionists ?? 0}
          icon={UserCogIcon}
          tone="violet"
          index={1} />
        
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.totalCollection ?? 0)}
          icon={IndianRupeeIcon}
          tone="green"
          index={2} />
        
        <StatCard
          label="Today's Collection"
          value={formatCurrency(stats?.todayCollection ?? 0)}
          icon={CalendarDaysIcon}
          tone="blue"
          index={3} />
        
        <StatCard
          label="Monthly Collection"
          value={formatCurrency(stats?.monthCollection ?? 0)}
          icon={TrendingUpIcon}
          tone="brand"
          index={4} />
        
        <StatCard
          label="Pending Fees"
          value={formatCurrency(stats?.pendingFee ?? 0)}
          icon={AlertCircleIcon}
          tone="red"
          index={5} />
        
        <StatCard label="Paid Students" value={stats?.paidStudents ?? 0} icon={CheckCircle2Icon} tone="green" index={6} />
        <StatCard
          label="Pending Students"
          value={stats?.dueStudents ?? 0}
          icon={ClockIcon}
          tone="amber"
          index={7} />
        
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly Fee Collection" subtitle="Last 8 months" />
          <div className="px-3 pb-4">
            <MonthlyCollectionChart data={monthlySeries} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Payment Mode" subtitle="Amount by payment method" />
          <div className="px-3 pb-4">
            <PaymentModeChart data={paymentModeData} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Class-wise Collection" subtitle="Top classes by amount collected" />
          <div className="px-3 pb-4">
            <ClasswiseChart data={classWiseData} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top Due Students" subtitle="Students with the highest pending fee" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3 font-semibold">Mobile</th>
                  <th className="px-6 py-3 text-right font-semibold">Paid</th>
                  <th className="px-6 py-3 text-right font-semibold">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dashboard.topDueStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{student.className}</td>
                    <td className="px-6 py-3.5 text-slate-500">{student.mobile}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                      {formatCurrency(student.paidFee)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-rose-600">
                      {formatCurrency(student.dueFee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                return (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                      {p.receiptNo}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                      {p.student?.name ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {formatDate(p.paymentDate)} · {formatTime(p.paymentDate)}
                    </td>
                    <td className="px-6 py-3.5 uppercase text-slate-500">{p.paymentMode}</td>
                    <td className="px-6 py-3.5 text-slate-500">{p.collectedBy?.name}</td>
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
