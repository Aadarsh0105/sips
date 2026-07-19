




import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  CalendarClockIcon,
  WalletIcon } from
'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDate, formatTime } from '../../lib/utils';
import type { NotificationType } from '../../lib/types';

const iconFor: Record<NotificationType, React.ReactNode> = {
  payment_success: <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />,
  payment_pending: <ClockIcon className="h-4 w-4 text-amber-500" />,
  due_reminder: <CalendarClockIcon className="h-4 w-4 text-rose-500" />,
  partial_payment: <WalletIcon className="h-4 w-4 text-sky-500" />,
  receipt_generated: <FileTextIcon className="h-4 w-4 text-brand-500" />
};

export function NotificationsMenu() {
  const { notifications, markAllRead } = useData();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
        
        <BellIcon className="h-5 w-5" />
        {unread > 0 &&
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        }
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <p className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Notifications
              </p>
              {unread > 0 &&
            <button
              onMouseDown={markAllRead}
              className="text-xs font-semibold text-brand-600 hover:underline">
              
                  Mark all read
                </button>
            }
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ?
            <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p> :

            notifications.slice(0, 12).map((n) =>
            <div
              key={n.id}
              className={`flex gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-800/60 ${
              !n.read ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`
              }>
              
                    <div className="mt-0.5">{iconFor[n.type]}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatDate(n.date)} · {formatTime(n.date)}
                      </p>
                    </div>
                  </div>
            )
            }
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}