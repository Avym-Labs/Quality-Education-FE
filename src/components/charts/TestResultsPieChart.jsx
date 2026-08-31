import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useMemo, Fragment } from 'react';

const SUBJECT_COLORS = {
  'Mathematics': '#3525CD',
  'Physics': '#10B981',
  'Chemistry': '#F59E0B',
  'Biology': '#EF4444',
  'English': '#8B5CF6',
  'Hindi': '#EC4899',
  'History': '#06B6D4',
  'Geography': '#84CC16',
  'Computer Science': '#6366F1',
  'Economics': '#14B8A6',
  'Accountancy': '#F97316',
  'Business Studies': '#84CC16',
  'Physical Education': '#A855F7',
  'Art': '#EAB308',
  'Music': '#EC4899',
  'Default': '#64748B'
};

export default function TestResultsPieChart({ 
  results, 
  size = 280,
  innerRadius = 60,
  showLegend = true,
  title = 'Test Distribution by Subject'
}) {
  // results: [{ subject: 'Math', count: 5, avgScore: 78 }, ...]
  
  const data = useMemo(() => {
    if (!results || results.length === 0) return [];
    return results.map((r, idx) => ({
      name: r.subject,
      value: r.count || 0,
      avgScore: r.avgScore || 0,
      color: SUBJECT_COLORS[r.subject] || SUBJECT_COLORS['Default']
    })).filter(d => d.value > 0);
  }, [results]);

  const totalTests = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-on-surface-variant font-semibold">No test results yet</p>
        <p className="text-xs text-on-surface-variant/70 mt-1">Take tests to see distribution</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 shadow-lg min-w-[180px]">
          <p className="font-bold text-on-surface">{item.name}</p>
          <p className="text-sm text-on-surface-variant mt-1">
            {item.value} test{item.value !== 1 ? 's' : ''} • {((item.value / totalTests) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-primary font-bold mt-1">Avg Score: {item.avgScore}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h3 className="font-title-lg text-sm text-on-surface font-bold text-center mb-4">{title}</h3>
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="shrink-0 w-full" style={{ maxWidth: size, height: size }}>
          <ResponsiveContainer width="100%" height={size}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={size * 0.4}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {showLegend && (
          <div className="flex-1 w-full md:pr-4">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 items-center">
              <span className="pb-2 border-b border-outline-variant/20"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide text-right pb-2 border-b border-outline-variant/20">Total Tests</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide text-right pb-2 border-b border-outline-variant/20">Avg. Marks</span>

              {data.map((d, idx) => (
                <Fragment key={idx}>
                  <div className="flex items-center gap-2 min-w-0 py-2 border-b border-outline-variant/10">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                    <span className="text-sm text-on-surface font-semibold truncate">{d.name}</span>
                  </div>
                  <span className="text-sm text-primary font-bold text-right py-2 border-b border-outline-variant/10">{d.value}</span>
                  <span className="text-sm text-on-surface font-bold text-right py-2 border-b border-outline-variant/10">{d.avgScore}%</span>
                </Fragment>
              ))}
            </div>

            <div className="mt-3 pt-3">
              <p className="text-xs text-on-surface-variant font-semibold">
                Total: <span className="text-primary font-bold">{totalTests}</span> tests across <span className="text-primary font-bold">{data.length}</span> subjects
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}