



import React from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
  inlineOnMobile = false




}: {title: string;subtitle?: string;action?: React.ReactNode;inlineOnMobile?: boolean;}) {
  return (
    <div className={`mb-6 flex gap-3 ${inlineOnMobile ? 'flex-row items-center justify-between' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>);

}
