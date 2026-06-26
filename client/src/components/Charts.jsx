import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

export const PALETTE = ['#10b981', '#06b6d4', '#34d399', '#22d3ee', '#f59e0b', '#f43f5e'];

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-line)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--color-ink)',
  boxShadow: 'var(--shadow-card)',
};

export function BarCard({ title, subtitle, data, dataKey = 'value', nameKey = 'name', color = '#10b981' }) {
  return (
    <div className="card p-5 text-ink-soft">
      <ChartHead title={title} subtitle={subtitle} />
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,135,0.16)" vertical={false} />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill={color} animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AreaCard({ title, subtitle, data, dataKey = 'value', nameKey = 'name', color = '#06b6d4' }) {
  return (
    <div className="card p-5 text-ink-soft">
      <ChartHead title={title} subtitle={subtitle} />
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,135,0.16)" vertical={false} />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill="url(#areaFill)" animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DonutCard({ title, subtitle, data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card p-5 text-ink-soft">
      <ChartHead title={title} subtitle={subtitle} />
      <div className="flex items-center gap-4">
        <div style={{ width: 150, height: 180 }} className="relative">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70}
                paddingAngle={3} stroke="none" animationDuration={900}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-ink">{total}</span>
            <span className="text-[11px] text-faint">total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2 text-sm">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-ink-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                {d.name}
              </span>
              <span className="font-semibold text-ink">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChartHead({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {subtitle && <p className="text-xs text-faint">{subtitle}</p>}
    </div>
  );
}
