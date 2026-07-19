
import React from 'react';
import { cn } from '../../lib/utils';

const base =
'w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) =>
  <input ref={ref} className={cn(base, 'h-10', className)} {...props} />

);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) =>
  <textarea ref={ref} className={cn(base, 'py-2.5 min-h-[80px]', className)} {...props} />
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) =>
  <select ref={ref} className={cn(base, 'h-10 pr-8', className)} {...props}>
    {children}
  </select>
);
Select.displayName = 'Select';

export function Field({
  label,
  htmlFor,
  required,
  children,
  className






}: {label: string;htmlFor?: string;required?: boolean;children: React.ReactNode;className?: string;}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>);

}