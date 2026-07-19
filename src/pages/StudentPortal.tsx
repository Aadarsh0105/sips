






import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SearchIcon,
  ShieldCheckIcon,
  MoonIcon,
  SunIcon,
  ClockIcon,
  BadgeCheckIcon,
  WalletIcon } from
'lucide-react';
import { toast } from 'sonner';
import { SchoolLogo } from '../components/shared/SchoolLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Student } from '../lib/types';
import { StudentResult } from '../components/portal/StudentResult';

const CAMPUS = "/0cff149f-67fb-4097-8cd3-d6d7bfb6e95a.jpg";

export function StudentPortal() {
  const { students, settings } = useData();
  const { theme, toggle } = useTheme();
  const [studentId, setStudentId] = useState('');
  const [mobile, setMobile] = useState('');
  const [result, setResult] = useState<Student | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !mobile.trim()) {
      toast.error('Please enter both Student ID and registered mobile number.');
      return;
    }
    const digits = (s: string) => s.replace(/\D/g, '');
    const found = students.find(
      (s) =>
      s.id.toLowerCase() === studentId.trim().toLowerCase() && (
      digits(s.mobile).includes(digits(mobile)) ||
      digits(s.parentMobile).includes(digits(mobile))) &&
      digits(mobile).length >= 4
    );
    setSearched(true);
    if (found) {
      setResult(found);
      toast.success(`Welcome, ${found.name.split(' ')[0]}!`);
    } else {
      setResult(null);
      toast.error('No student found. Check the ID and mobile number.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SchoolLogo logo={settings.logo} name={settings.name} className="ring-2 ring-white/30" />
            <span className="font-display text-lg font-extrabold text-white drop-shadow">
              {settings.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25">
              
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link to="/login">
              <Button className="shadow-lg">
                <ShieldCheckIcon className="h-4 w-4" /> Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={CAMPUS} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-900/80 to-brand-950/90" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>
              
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <BadgeCheckIcon className="h-4 w-4" /> Student Fee Portal
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                Check your fees &amp; pay securely — no login required.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-brand-100">
                Enter your Student ID and registered mobile number to view your fee status, download
                receipts, and pay instantly via UPI.
              </p>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-brand-100">
                <Feature icon={ClockIcon} text="Instant fee lookup" />
                <Feature icon={WalletIcon} text="UPI QR payments" />
                <Feature icon={BadgeCheckIcon} text="Downloadable receipts" />
              </div>
            </motion.div>

            {/* Search card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto w-full max-w-md rounded-3xl border border-white/20 bg-white p-7 shadow-2xl dark:bg-slate-900">
              
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Find your fee details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Secure lookup for students &amp; parents
                  </p>
                </div>
              </div>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Student ID
                  </label>
                  <Input
                    placeholder="e.g. STU-2026-0001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)} />
                  
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Registered Mobile Number
                  </label>
                  <Input
                    placeholder="Last digits are enough"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)} />
                  
                </div>
                <Button type="submit" size="lg" className="w-full">
                  <SearchIcon className="h-5 w-5" /> Search
                </Button>
              </form>
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-400 dark:bg-slate-800/60">
                Try <span className="font-semibold text-slate-500 dark:text-slate-300">STU-2026-0001</span> with any part of its mobile number.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {result ?
        <StudentResult student={result} /> :
        searched ?
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
            <SearchIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              No matching student found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Please verify your Student ID and the registered mobile number, then try again.
            </p>
          </div> :
        null}
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center sm:px-6 lg:px-8">
          <SchoolLogo logo={settings.logo} name={settings.name} size="sm" />
          <p className="font-display font-bold text-slate-800 dark:text-white">{settings.name}</p>
          <p className="text-sm text-slate-500">{settings.address}</p>
          <p className="text-sm text-slate-500">
            {settings.contact} · {settings.email}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>);

}

function Feature({ icon: Icon, text }: {icon: any;text: string;}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-5 w-5" /> {text}
    </span>);

}