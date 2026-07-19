


import type { Payment, Student, User } from './types';
import { deriveFee } from './utils';
import { isThisMonth, isToday } from './utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface DashboardMetrics {
  totalStudents: number;
  totalReceptionists: number;
  totalRevenue: number;
  todayCollection: number;
  monthlyCollection: number;
  pendingFees: number;
  paidStudents: number;
  pendingStudents: number;
  partialStudents: number;
  monthlySeries: {month: string;amount: number;}[];
  revenueSeries: {month: string;revenue: number;target: number;}[];
  statusSeries: {name: string;value: number;}[];
  classwiseSeries: {className: string;amount: number;}[];
}

export function computeMetrics(
students: Student[],
payments: Payment[],
users: User[])
: DashboardMetrics {
  const completed = payments.filter((p) => p.status === 'completed');
  const totalRevenue = completed.reduce((s, p) => s + p.amount, 0);
  const todayCollection = completed.filter((p) => isToday(p.date)).reduce((s, p) => s + p.amount, 0);
  const monthlyCollection = completed.
  filter((p) => isThisMonth(p.date)).
  reduce((s, p) => s + p.amount, 0);

  let pendingFees = 0;
  let paidStudents = 0;
  let pendingStudents = 0;
  let partialStudents = 0;
  const classMap = new Map<string, number>();

  students.forEach((s) => {
    const fee = deriveFee(s, payments);
    pendingFees += fee.remaining;
    if (fee.status === 'paid') paidStudents++;else
    if (fee.status === 'partial') partialStudents++;else
    pendingStudents++;
    classMap.set(s.className, (classMap.get(s.className) || 0) + fee.paid);
  });

  // Monthly series (last 8 months)
  const now = new Date();
  const monthlySeries: {month: string;amount: number;}[] = [];
  const revenueSeries: {month: string;revenue: number;target: number;}[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = MONTHS[d.getMonth()];
    const amount = completed.
    filter((p) => {
      const pd = new Date(p.date);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
    }).
    reduce((s, p) => s + p.amount, 0);
    monthlySeries.push({ month: label, amount });
    revenueSeries.push({ month: label, revenue: amount, target: Math.round(totalRevenue / 6) || 40000 });
  }

  const classwiseSeries = Array.from(classMap.entries()).
  map(([className, amount]) => ({ className, amount })).
  filter((c) => c.amount > 0).
  sort((a, b) => b.amount - a.amount).
  slice(0, 8);

  return {
    totalStudents: students.length,
    totalReceptionists: users.filter((u) => u.role === 'receptionist').length,
    totalRevenue,
    todayCollection,
    monthlyCollection,
    pendingFees,
    paidStudents,
    pendingStudents,
    partialStudents,
    monthlySeries,
    revenueSeries,
    statusSeries: [
    { name: 'Paid', value: paidStudents },
    { name: 'Partial', value: partialStudents },
    { name: 'Pending', value: pendingStudents }],

    classwiseSeries
  };
}