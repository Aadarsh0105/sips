

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Pagination({
  page,
  pageCount,
  total,
  onPage





}: {page: number;pageCount: number;total: number;onPage: (p: number) => void;}) {
  if (pageCount <= 1) {
    return (
      <div className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{total} results</div>);

  }
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1
  );
  const items: (number | '…')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - (pages[i - 1] as number) > 1) items.push('…');
    items.push(p);
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Page {page} of {pageCount} · {total} results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
          aria-label="Previous page">
          
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {items.map((it, i) =>
        it === '…' ?
        <span key={`e${i}`} className="px-2 text-sm text-slate-400">
              …
            </span> :

        <button
          key={it}
          onClick={() => onPage(it)}
          className={cn(
            'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors',
            it === page ?
            'bg-brand-600 text-white' :
            'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          )}>
          
              {it}
            </button>

        )}
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
          aria-label="Next page">
          
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>);

}