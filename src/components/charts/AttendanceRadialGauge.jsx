import { RadialBarChart, RadialBar, Cell } from 'recharts';
import { useMemo } from 'react';

export default function AttendanceRadialGauge({ percentage, size = 120, strokeWidth = 12, showLabel = true }) {
  const data = useMemo(() => [
    { name: 'Attendance', value: percentage, fullValue: 100 }
  ], [percentage]);

  const color = percentage >= 75 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col items-center justify-center">
      <RadialBarChart width={size} height={size} data={data} cx="50%" cy="50%" innerRadius={size * 0.55}>
        <RadialBar
          minAngle={-90}
          maxAngle={90}
          background
          dataKey="value"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          backgroundProps={{ stroke: '#E2E8F0', strokeWidth: strokeWidth, strokeLinecap: 'round' }}
        >
          <Cell fill={color} />
        </RadialBar>
      </RadialBarChart>
      {showLabel && (
        <div className="mt-3 text-center">
          <p className="text-2xl font-black text-on-surface">{percentage}%</p>
          <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Attendance</p>
        </div>
      )}
    </div>
  );
}