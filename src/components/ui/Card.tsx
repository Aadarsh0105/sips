
import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children }: {className?: string;children: React.ReactNode;}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900',
        className
      )}>
      
      {children}
    </div>);

}

export function CardHeader({
  title,
  subtitle,
  action,
  className





}: {title: React.ReactNode;subtitle?: React.ReactNode;action?: React.ReactNode;className?: string;}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5', className)}>
      <div>
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>);

}