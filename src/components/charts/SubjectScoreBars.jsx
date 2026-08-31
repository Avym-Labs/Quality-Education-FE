import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function SubjectScoreBars({ data, height = 220, passMark = 40 }) {
  // data: [{ name: 'Mathematics', score: 78 }, ...] - real per-subject averages

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant font-semibold text-sm">
        No recorded results yet
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl border border-outline-variant/20 shadow-lg">
          <p className="font-bold text-on-surface">{label}</p>
          <p className="text-sm text-primary font-bold mt-1">Average: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <ReferenceLine
          y={passMark}
          stroke="#EF4444"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: `Pass (${passMark}%)`, position: 'insideTopRight', fill: '#EF4444', fontSize: 10, fontWeight: 600 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.score >= 75 ? '#10B981' : d.score >= passMark ? '#F59E0B' : '#EF4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
