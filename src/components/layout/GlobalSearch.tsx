import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clearStudentSearch, searchStudent } from '../../features/studentSearch/studentSearchSlice';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';

export function GlobalSearch({ basePath }: { basePath: string }) {
  const dispatch = useAppDispatch();
  const { student: results, loading } = useAppSelector((state) => state.studentSearch);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      dispatch(clearStudentSearch());
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch(clearStudentSearch());
      void dispatch(searchStudent(value));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [dispatch, query]);

  const openStudent = (id?: string) => {
    if (!id) return;
    setQuery('');
    setOpen(false);
    dispatch(clearStudentSearch());
    navigate(`${basePath}/student/${id}`);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search students by ID, name, mobile..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-900"
        />
      </div>
      <AnimatePresence>
        {open && query.trim() ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900"
          >
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Searching students...</p>
            ) : !Array.isArray(results) || results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No matches found</p>
            ) : (
              results.slice(0, 6).map((student) => (
                <button
                  key={student.id ?? student._id ?? student.studentId}
                  onMouseDown={() => openStudent(student.id ?? student._id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{student.name}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {student.studentId} · Class {student.className}-{student.section} · {student.mobile}
                    </span>
                  </span>
                </button>
              ))
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
