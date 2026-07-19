import { twMerge } from 'tailwind-merge';
import type { Student, Payment, DerivedFee, FeeStatus } from './types';

export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(' '));
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n || 0);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function netFee(s: Student): number {
  return Math.max(0, (s.totalFee || 0) - (s.discount || 0) + (s.fine || 0));
}

export function deriveFee(student: Student, payments: Payment[]): DerivedFee {
  const total = netFee(student);
  const paid = payments.
  filter((p) => p.studentId === student.id && p.status === 'completed').
  reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - paid);
  let status: FeeStatus = 'pending';
  if (paid <= 0) status = 'pending';else
  if (remaining <= 0) status = 'paid';else
  status = 'partial';
  return { totalFee: total, paid, remaining, status };
}

export function classNamesFor(status: FeeStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
    case 'partial':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400';
    default:
      return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400';
  }
}

export function statusLabel(status: FeeStatus): string {
  return status === 'paid' ? 'Paid' : status === 'partial' ? 'Partially Paid' : 'Pending';
}

let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function pad(n: number, len = 4): string {
  return String(n).padStart(len, '0');
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate());

}

export function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}