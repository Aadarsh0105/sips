

import React from 'react';
import { GraduationCapIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SchoolLogo({
  logo,
  name,
  size = 'md',
  className





}: {logo?: string;name?: string;size?: 'sm' | 'md' | 'lg';className?: string;}) {
  const dims = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const icon = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  if (logo) {
    return (
      <img
        src={logo}
        alt={name ? `${name} logo` : 'School logo'}
        className={cn(dims, 'rounded-xl object-cover', className)} />);


  }
  return (
    <div
      className={cn(
        dims,
        'flex items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm',
        className
      )}>
      
      <GraduationCapIcon className={icon} />
    </div>);

}