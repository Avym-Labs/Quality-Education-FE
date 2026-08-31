import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ReferenceLine,
  Cell
} from 'recharts';
import { useMemo } from 'react';

export default function ScoreDistributionHistogram({ 
  scores, 
  height = 250,
  binCount = 10,
  showNormalCurve = false,
  targetLine = 40
}) {
  // scores: [85, 72, 90, 45, 67, ...] - array of percentage scores
  
  const data = useMemo(() => {
    if (!scores || scores.length === 0) return [];
    
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 1;
    const binWidth = range / binCount;
    
    const bins = Array(binCount).fill(0).map((_, i) => ({
      range: `${Math.round(min + i * binWidth)}-${Math.round(min + (i + 1) * binWidth)}`,
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth,
      count: 0,
      center: min + (i + 0.5) * binWidth
    }));
    
    scores.forEach(score => {
      const binIndex = Math.min(Math.floor((score - min) / binWidth), binCount - 1);
      if (binIndex >= 0) bins[binIndex].count++;
    });
    
    // Add normal distribution curve if requested
    if (showNormalCurve) {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const std = Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length);
      const total = scores.length;
      
      bins.forEach(bin => {
        // Normal PDF scaled to histogram
        const x = bin.center;
        const pdf = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        bin.normalValue = pdf * total * binWidth;
      });
    }
    
    return bins;
  }, [scores, binCount, showNormalCurve]);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-semibold">
        No score data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 shadow-lg">
          <p className="font-bold text-on-surface">{item.range}%</p>
          <p className="text-sm text-on-surface-variant mt-1">{item.count} students</p>
          <p className="text-xs text-on-surface-variant/70">{(item.count / scores.length * 100).toFixed(1)}% of class</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          
          <XAxis 
            dataKey="range" 
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            interval={0}
          />
          
          <YAxis 
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          
          {targetLine && (
            <ReferenceLine 
              x={targetLine} 
              stroke="#EF4444" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{ 
                value: `Pass (${targetLine}%)`, 
                position: 'top', 
                fill: '#EF4444', 
                fontSize: 10,
                fontWeight: 600
              }}
            />
          )}
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar
            dataKey="count"
            name="Students"
            radius={[4, 4, 0, 0]}
            barGap={0}
            barCategoryGap="10%"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.center >= targetLine ? '#10B981' : '#EF4444'} />
            ))}
          </Bar>
          
          {showNormalCurve && (
            <Line
              type="monotone"
              dataKey="normalValue"
              name="Normal Distribution"
              stroke="#3525CD"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      
      {/* Stats summary */}
      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-on-surface-variant">Pass (≥{targetLine}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-on-surface-variant">Fail (&lt;{targetLine}%)</span>
        </div>
        {showNormalCurve && (
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-primary" style={{ borderRadius: '2px', borderTopRightRadius: '2px', borderBottomRightRadius: '2px' }}></span>
            <span className="text-on-surface-variant">Normal Curve</span>
          </div>
        )}
      </div>
    </div>
  );
}