







import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, LockIcon, ShieldCheckIcon } from 'lucide-react';
import { SchoolLogo } from '../components/shared/SchoolLogo';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export function Login() {
  const { login } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = login(username, password);
    setSubmitting(false);
    if (res.ok) {
      toast.success('Signed in successfully.');
      navigate(res.role === 'admin' ? '/admin' : '/reception', { replace: true });
    } else {
      setError(res.error ?? 'Login failed.');
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-900/50 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <SchoolLogo logo={settings.logo} name={settings.name} className="ring-2 ring-white/30" />
          <span className="font-display text-lg font-extrabold text-white">{settings.name}</span>
        </div>
        <div className="relative">
          <ShieldCheckIcon className="mb-5 h-12 w-12 text-brand-200" />
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white">
            Staff &amp; Administration Portal
          </h2>
          <p className="mt-3 max-w-md text-brand-100">
            Manage students, collect fees, generate receipts, and track collections — all in one
            secure dashboard.
          </p>
        </div>
        <p className="relative text-sm text-brand-200">
          © {new Date().getFullYear()} {settings.name}
        </p>
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">
          
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600">
            
            <ArrowLeftIcon className="h-4 w-4" /> Back to Student Portal
          </Link>

          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <SchoolLogo logo={settings.logo} name={settings.name} />
            <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              {settings.name}
            </span>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your Admin or Receptionist account.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Username" required>
              <Input
                autoFocus
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)} />
              
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10" />
                
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600">
                  
                  {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error &&
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-500/10">
                {error}
              </p>
            }

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              <LockIcon className="h-4 w-4" /> Sign In
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Demo credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickFill('admin', 'admin123')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-500/10">
                
                <span className="block font-semibold text-slate-700 dark:text-slate-200">Admin</span>
                <span className="text-slate-400">admin / admin123</span>
              </button>
              <button
                onClick={() => quickFill('priya', 'recept123')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-500/10">
                
                <span className="block font-semibold text-slate-700 dark:text-slate-200">
                  Receptionist
                </span>
                <span className="text-slate-400">priya / recept123</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>);

}