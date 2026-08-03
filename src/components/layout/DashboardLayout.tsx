import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon } from
'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, type NavItem } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../features/auth/authSlice';

export function DashboardLayout({
  items,
  roleLabel,
  basePath,
  allowSearch = true





}: {items: NavItem[];roleLabel: string;basePath: string;allowSearch?: boolean;}) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Auto logout on token expiry surfaces here as a toast + redirect.
  useEffect(() => {
    if (!user) {
      const reason = sessionStorage.getItem('sfms.logoutReason');
      if (reason === 'expired') {
        sessionStorage.removeItem('sfms.logoutReason');
        toast.error('Your session expired. Please sign in again.');
      }
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        items={items}
        subtitle={roleLabel}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)} />
      

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
            
            <MenuIcon className="h-5 w-5" />
          </button>

          {allowSearch ?
          <GlobalSearch basePath={basePath} /> :

          <div className="flex-1" />
          }

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              
              {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
            <NotificationsMenu />

            <div className="relative ml-1">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                onBlur={() => setTimeout(() => setProfileOpen(false), 180)}
                className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {user?.name?.[0] ?? 'U'}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {user?.name}
                  </span>
                  <span className="block text-xs capitalize text-slate-400">{user?.role}</span>
                </span>
                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              </button>
              <AnimatePresence>
                {profileOpen &&
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
                  
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {user?.name}
                      </p>
                      {/* <p className="truncate text-xs text-slate-400">{user?.email}</p> */}
                    </div>
                    <button
                    onMouseDown={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    
                      <LogOutIcon className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                }
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>);

}
