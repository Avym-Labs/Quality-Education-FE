import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

const COLORS = {
  Present: { bar: '#10B981', bg: '#D1FAE5', text: '#065F46' },
  Absent:  { bar: '#F43F5E', bg: '#FFE4E6', text: '#9F1239' },
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    const c = COLORS[name] || COLORS.Present;
    return (
      <div
        style={{
          background: '#fff',
          border: `1.5px solid ${c.bar}33`,
          borderRadius: 12,
          padding: '6px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        }}
      >
        <span style={{ color: c.bar, fontWeight: 800, fontSize: 12 }}>
          {name}: {value}
        </span>
      </div>
    );
  }
  return null;
}

function CustomLabel({ x, y, width, value, index }) {
  const colors = [COLORS.Present, COLORS.Absent];
  const c = colors[index] || colors[0];
  return (
    <g>
      <rect
        x={x + width / 2 - 16}
        y={y - 26}
        width={32}
        height={20}
        rx={10}
        fill={c.bg}
      />
      <text
        x={x + width / 2}
        y={y - 11}
        textAnchor="middle"
        fill={c.text}
        fontSize={11}
        fontWeight={800}
      >
        {value}
      </text>
    </g>
  );
}

export default function AttendanceCountBars({ present, total, height = 160 }) {
  const absent = Math.max(0, total - present);
  const data = [
    { name: 'Present', value: present },
    { name: 'Absent',  value: absent  },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 32, right: 16, left: 16, bottom: 4 }} barCategoryGap="40%">
        <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="4 4" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, Math.max(total, 1)]} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }} />
        <Bar
          dataKey="value"
          radius={[10, 10, 4, 4]}
          maxBarSize={60}
          label={<CustomLabel />}
          isAnimationActive={false}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={i === 0 ? COLORS.Present.bar : COLORS.Absent.bar}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
