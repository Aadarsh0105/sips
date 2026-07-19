
import type { User, Student, Payment, SchoolSettings, AppNotification } from './types';
import {
  seedUsers,
  makeSeedStudents,
  makeSeedPayments,
  seedSettings,
  seedNotifications } from
'./seed';

const KEYS = {
  users: 'sfms.users',
  students: 'sfms.students',
  payments: 'sfms.payments',
  settings: 'sfms.settings',
  notifications: 'sfms.notifications',
  seq: 'sfms.sequences',
  auth: 'sfms.auth',
  theme: 'sfms.theme'
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {

    /* ignore quota */}
}

export interface Sequences {
  student: number;
  admission: number;
  receipt: number;
  invoice: number;
}

export function ensureSeed(): void {
  if (!localStorage.getItem(KEYS.students)) {
    const students = makeSeedStudents();
    const payments = makeSeedPayments(students);
    write(KEYS.users, seedUsers);
    write(KEYS.students, students);
    write(KEYS.payments, payments);
    write(KEYS.settings, seedSettings);
    write(KEYS.notifications, seedNotifications);
    write<Sequences>(KEYS.seq, {
      student: students.length + 1,
      admission: 1000 + students.length,
      receipt: payments.length + 1,
      invoice: payments.length + 1
    });
  }
}

export const store = {
  keys: KEYS,
  getUsers: () => read<User[]>(KEYS.users, []),
  setUsers: (u: User[]) => write(KEYS.users, u),
  getStudents: () => read<Student[]>(KEYS.students, []),
  setStudents: (s: Student[]) => write(KEYS.students, s),
  getPayments: () => read<Payment[]>(KEYS.payments, []),
  setPayments: (p: Payment[]) => write(KEYS.payments, p),
  getSettings: () => read<SchoolSettings>(KEYS.settings, seedSettings),
  setSettings: (s: SchoolSettings) => write(KEYS.settings, s),
  getNotifications: () => read<AppNotification[]>(KEYS.notifications, []),
  setNotifications: (n: AppNotification[]) => write(KEYS.notifications, n),
  getSequences: () =>
  read<Sequences>(KEYS.seq, { student: 1, admission: 1000, receipt: 1, invoice: 1 }),
  setSequences: (s: Sequences) => write(KEYS.seq, s),
  nextSequence: (kind: keyof Sequences): number => {
    const seq = read<Sequences>(KEYS.seq, { student: 1, admission: 1000, receipt: 1, invoice: 1 });
    const value = seq[kind];
    seq[kind] = value + 1;
    write(KEYS.seq, seq);
    return value;
  },
  reset: () => {
    Object.values(KEYS).forEach((k) => {
      if (k !== KEYS.theme) localStorage.removeItem(k);
    });
    ensureSeed();
  }
};