import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useMemo } from 'react';

const METRIC_COLORS = {
  adoption: '#3525CD',
  attendance: '#10B981',
  performance: '#F59E0B',
  engagement: '#8B5CF6',
  retention: '#EC4899'
};

const METRIC_LABELS = {
  adoption: 'Platform Adoption',
  attendance: 'Attendance Rate',
  performance: 'Academic Performance',
  engagement: 'User Engagement',
  retention: 'Retention Rate'
};

export default function SystemHealthRadar({ 
  metrics, 
  size = 300,
  showLegend = true 
}) {
  // metrics: { adoption: 75, attendance: 82, performance: 68, engagement: 71, retention: 79 }
  
  const data = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics).map(([key, value]) => ({
      metric: METRIC_LABELS[key] || key,
      value: value || 0,
      key,
      color: METRIC_COLORS[key] || '#64748B'
    }));
  }, [metrics]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-semibold">
        No system metrics available
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={size}>
        <RadarChart data={data} cx="50%" cy="50%" innerRadius="10%" outerRadius="58%">
          <PolarGrid gridType="polygon" stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#94A3B8' }}
            axisLine={false}
            tickCount={5}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              color: '#1E293B'
            }}
            formatter={(value) => [value + '%', '']}
            labelFormatter={(label) => <span className="font-bold">{label}</span>}
          />
          {showLegend && <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingRight: 20 }}
          />}
          <Radar
            name="Current"
            dataKey="value"
            stroke="#3525CD"
            fill="#3525CD"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={({ cx, cy, payload, index }) => (
              <circle key={index} cx={cx} cy={cy} r={4} fill={payload.color} stroke="#fff" strokeWidth={1.5} />
            )}
          />
          {/* Target reference at 80% */}
          <Radar
            name="Target (80%)"
            dataKey="value"
            stroke="#10B981"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            fill="none"
            dot={false}
            hide={true}
          />
        </RadarChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {data.map((d, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
              <span className="text-on-surface-variant font-medium">{d.metric}</span>
              <span className="text-primary font-bold">{d.value}%</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <p className="text-xs text-on-surface-variant font-semibold">
          Overall Health: <span className="text-primary font-bold">
            {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}%
          </span>
        </p>
      </div>
    </div>
  );
}