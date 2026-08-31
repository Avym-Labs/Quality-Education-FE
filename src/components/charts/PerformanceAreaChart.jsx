import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useMemo } from 'react';

export default function PerformanceAreaChart({
  trendData,
  height = 200,
  showClassAvg = true,
  showTopper = true,
  showTarget = true,
  targetValue = 75,
  personalLabel = 'Your Score',
  classAvgLabel = 'Class Average',
  topperLabel = 'Class Topper'
}) {
  // trendData: [{ test_title: 'Test 1', personal: 85, class_average: 72, topper: 95 }, ...]
  
  const data = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    return trendData.map((d, idx) => ({
      name: d.test_title || `Test ${idx + 1}`,
      personal: d.personal || 0,
      class_average: d.class_average || 0,
      topper: d.topper || 0,
      index: idx
    }));
  }, [trendData]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-semibold">
        No performance data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 shadow-lg min-w-[160px]">
          <p className="font-bold text-on-surface mb-2">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-sm flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-bold text-on-surface">{entry.value}%</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 24, right: 30, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3525CD" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3525CD" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorClassAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748B" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#64748B" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTopper" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E2E8F0" 
            vertical={false}
            horizontal={true}
          />
          
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
            tickCount={5}
            tickFormatter={(value) => `${value}%`}
          />
          
          {showTarget && (
            <ReferenceLine 
              y={targetValue} 
              stroke="#10B981" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{
                value: `Target (${targetValue}%)`,
                position: 'insideTopRight',
                fill: '#10B981',
                fontSize: 10,
                fontWeight: 600,
                offset: 8
              }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            layout="horizontal" 
            align="center" 
            verticalAlign="top"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: 10 }}
          />
          
          {showTopper && (
            <Area
              type="monotone"
              dataKey="topper"
              name={topperLabel}
              stroke="#F59E0B"
              fill="url(#colorTopper)"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
            />
          )}
          
          {showClassAvg && (
            <Area
              type="monotone"
              dataKey="class_average"
              name={classAvgLabel}
              stroke="#64748B"
              fill="url(#colorClassAvg)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fillOpacity={1}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="personal"
            name={personalLabel}
            stroke="#3525CD"
            fill="url(#colorPersonal)"
            strokeWidth={3}
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}