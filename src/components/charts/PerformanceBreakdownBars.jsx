import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PerformanceBreakdownBars({ highest, average, lowest, passRate, height = 150 }) {
  const data = [
    { name: 'Highest', value: highest },
    { name: 'Average', value: average },
    { name: 'Lowest', value: lowest },
    { name: 'Pass %', value: passRate },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 shadow-lg">
          {payload[0].payload.name}: {payload[0].value}%
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.85)', fontWeight: 700 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
          tickLine={false}
          interval={0}
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
        <Bar
          dataKey="value"
          radius={[8, 8, 0, 0]}
          maxBarSize={44}
          label={{ position: 'top', fill: '#fff', fontSize: 12, fontWeight: 800 }}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={i === 0 ? '#FFFFFF' : i === 2 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
