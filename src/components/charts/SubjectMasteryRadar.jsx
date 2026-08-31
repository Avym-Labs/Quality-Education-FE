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

const COLORS = ['#3525CD', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function SubjectMasteryRadar({ 
  subjects, 
  size = 280,
  showLegend = true 
}) {
  // subjects: [{ subject: 'Math', score: 85 }, { subject: 'Science', score: 72 }, ...]
  
  const data = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];
    return subjects.map((s, idx) => ({
      subject: s.subject,
      score: s.score || 0,
      fullMark: 100,
      color: COLORS[idx % COLORS.length]
    }));
  }, [subjects]);

  const maxScore = useMemo(() => Math.max(...data.map(d => d.score), 100), [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-semibold">
        No subject data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={size}>
        <RadarChart data={data} cx="50%" cy="50%" innerRadius="10%" outerRadius="58%">
          <PolarGrid gridType="polygon" stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#94A3B8' }}
            axisLine={false}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              color: '#1E293B'
            }}
            formatter={(value, name) => [value + '%', name]}
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
            name="Your Score"
            dataKey="score"
            stroke="#3525CD"
            fill="#3525CD"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={({ cx, cy, payload, index }) => (
              <circle key={index} cx={cx} cy={cy} r={4} fill={payload.color} stroke="#fff" strokeWidth={1.5} />
            )}
          />
          {/* Target reference line at 75% */}
          <Radar
            name="Target (75%)"
            dataKey="fullMark"
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
              <span className="text-on-surface-variant font-medium">{d.subject}</span>
              <span className="text-primary font-bold">{d.score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}