import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Card } from "../ui/Card";
import { BoxIcon } from "lucide-react";
type Tone = 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'violet';
const toneMap: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
};
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  index = 0







}: {label: string;value: string | number;icon: BoxIcon;tone?: Tone;hint?: string;index?: number;}) {
  return <motion.div initial={{
    opacity: 0,
    y: 12
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    delay: index * 0.05,
    duration: 0.35
  }}>
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneMap[tone])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </Card>
    </motion.div>;
}