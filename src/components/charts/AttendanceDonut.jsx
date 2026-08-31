import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

export default function AttendanceDonut({ percentage, size = 160, showLabel = true, label = 'Attendance', segmentLabel = 'Present' }) {
  const pct = Math.max(0, Math.min(100, percentage || 0));
  const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

  const data = useMemo(() => [
    { name: segmentLabel, value: pct },
    { name: 'Remaining', value: 100 - pct }
  ], [pct, segmentLabel]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="#E2E8F0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl font-black text-on-surface leading-none">{pct}%</p>
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider mt-1.5">{label}</p>
        </div>
      )}
    </div>
  );
}
