import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { SchoolLogo } from "../shared/SchoolLogo";
import { useData } from "../../contexts/DataContext";
import { cn } from "../../lib/utils";
export interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
}
function NavList({
  items,
  onNavigate



}: {items: NavItem[];onNavigate?: () => void;}) {
  return <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({
      isActive
    }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}>
          <item.icon className="h-5 w-5 shrink-0" />
          {item.label}
        </NavLink>)}
    </nav>;
}
function SidebarInner({
  items,
  subtitle



}: {items: NavItem[];subtitle: string;}) {
  const {
    settings
  } = useData();
  return <>
      <div className="flex items-start gap-2 px-4 py-5 pr-11 lg:items-center lg:gap-3 lg:px-5">
        <SchoolLogo logo={settings.logo} name={settings.name} size="sm" className="shrink-0 lg:h-11 lg:w-11" />
        <div className="min-w-0 flex-1">
          <p className="break-words font-display text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
            {settings.name}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <NavList items={items} />
      </div>
    </>;
}
export function Sidebar({
  items,
  subtitle,
  mobileOpen,
  onClose





}: {items: NavItem[];subtitle: string;mobileOpen: boolean;onClose: () => void;}) {
  return <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <SidebarInner items={items} subtitle={subtitle} />
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} onClick={onClose} />
            <motion.aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" initial={{
          x: -280
        }} animate={{
          x: 0
        }} exit={{
          x: -280
        }} transition={{
          type: 'spring',
          stiffness: 320,
          damping: 34
        }}>
              <button onClick={onClose} aria-label="Close menu" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <XIcon className="h-5 w-5" />
              </button>
              <SidebarInner items={items} subtitle={subtitle} />
            </motion.aside>
          </div>}
      </AnimatePresence>
    </>;
}
