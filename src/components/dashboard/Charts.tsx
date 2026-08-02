




import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../lib/utils';

const inr = (v: number) => `₹${(v / 1000).toFixed(0)}k`;

function useChartColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    grid: dark ? '#1e293b' : '#e2e8f0',
    axis: dark ? '#94a3b8' : '#64748b',
    tooltipBg: dark ? '#0f172a' : '#ffffff',
    tooltipBorder: dark ? '#1e293b' : '#e2e8f0',
    tooltipText: dark ? '#e2e8f0' : '#0f172a'
  };
}

function ChartTooltip({ active, payload, label, colors }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-soft"
      style={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder, color: colors.tooltipText }}>
      
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p: any) =>
      <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      )}
    </div>);

}

export function MonthlyCollectionChart({ data }: {data: {month: string;amount: number;}[];}) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3366ff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3366ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="month" stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={inr} />
        <Tooltip content={<ChartTooltip colors={c} />} />
        <Area
          type="monotone"
          dataKey="amount"
          name="Collection"
          stroke="#3366ff"
          strokeWidth={2.5}
          fill="url(#areaFill)" />
        
      </AreaChart>
    </ResponsiveContainer>);

}

export function RevenueChart({ data }: {data: {month: string;revenue: number;target: number;}[];}) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="month" stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={inr} />
        <Tooltip content={<ChartTooltip colors={c} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3366ff" strokeWidth={2.5} dot={false} />
        <Line
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false} />
        
      </LineChart>
    </ResponsiveContainer>);

}

const STATUS_COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

export function PaymentStatusChart({
  data


}: {data: {name: string;value: number;}[];}) {
  const c = useChartColors();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={95}
          paddingAngle={3}
          stroke="none">
          
          {data.map((_, i) =>
          <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
          )}
        </Pie>
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            color: c.tooltipText,
            fontSize: 12
          }}
          formatter={(value: number, name: string) => [`${value} students`, name]} />
        
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-slate-900 dark:fill-white"
          style={{ fontSize: 22, fontWeight: 800 }}>
          
          {total}
        </text>
        <text x="50%" y="57%" textAnchor="middle" style={{ fontSize: 11, fill: c.axis }}>
          Students
        </text>
      </PieChart>
    </ResponsiveContainer>);

}

export function PaymentModeChart({ data }: { data: { name: string; value: number }[] }) {
  const c = useChartColors();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={95}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            color: c.tooltipText,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <text x="50%" y="47%" textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ fontSize: 22, fontWeight: 800 }}>
          {formatCurrency(total)}
        </text>
        <text x="50%" y="57%" textAnchor="middle" style={{ fontSize: 11, fill: c.axis }}>
          Collected
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ClasswiseChart({ data }: {data: {className: string;amount: number;}[];}) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="className" stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={c.axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={inr} />
        <Tooltip content={<ChartTooltip colors={c} />} cursor={{ fill: 'rgba(51,102,255,0.06)' }} />
        <Bar dataKey="amount" name="Collection" fill="#3366ff" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>);

}
