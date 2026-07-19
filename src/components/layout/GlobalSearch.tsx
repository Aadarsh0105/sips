



import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../lib/utils';

export function GlobalSearch({ basePath }: {basePath: string;}) {
  const { students } = useData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students.
    filter(
      (s) =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.mobile.toLowerCase().includes(q) ||
      s.parentMobile.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q)
    ).
    slice(0, 6);
  }, [query, students]);

  const go = (id: string) => {
    setQuery('');
    setOpen(false);
    navigate(`${basePath}/students?focus=${id}`);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search students by ID, name, mobile…"
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-900" />
        
      </div>
      <AnimatePresence>
        {open && query.trim() &&
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          
            {results.length === 0 ?
          <p className="px-4 py-6 text-center text-sm text-slate-400">No matches found</p> :

          results.map((s) =>
          <button
            key={s.id}
            onMouseDown={() => go(s.id)}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800'
            )}>
            
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {s.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {s.id} · Class {s.className}-{s.section} · {s.mobile}
                    </span>
                  </span>
                </button>
          )
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}