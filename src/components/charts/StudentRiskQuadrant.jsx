import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { useMemo } from 'react';

export default function StudentRiskQuadrant({ 
  students, 
  height = 300,
  attendanceThreshold = 75,
  performanceThreshold = 60
}) {
  // students: [{ name: 'John', attendance: 85, performance: 78, initials: 'JD' }, ...]
  
  const data = useMemo(() => {
    if (!students || students.length === 0) return [];
    return students.map((s, idx) => ({
      name: s.name || `Student ${idx + 1}`,
      attendance: s.attendance || 0,
      performance: s.performance || 0,
      initials: s.initials || s.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST',
      quadrant: s.attendance >= attendanceThreshold && s.performance >= performanceThreshold ? 'thriving' :
                s.attendance >= attendanceThreshold && s.performance < performanceThreshold ? 'struggling' :
                s.attendance < attendanceThreshold && s.performance >= performanceThreshold ? 'disengaged' : 'at-risk'
    }));
  }, [students, attendanceThreshold, performanceThreshold]);

  const quadrantLabels = useMemo(() => [
    { x: 90, y: 90, label: 'THRIVING', color: '#10B981' },
    { x: 90, y: 30, label: 'STRUGGLING', color: '#F59E0B' },
    { x: 30, y: 90, label: 'DISENGAGED', color: '#8B5CF6' },
    { x: 30, y: 30, label: 'AT RISK', color: '#EF4444' }
  ], []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-semibold">
        No student data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const quadrantNames = {
        'thriving': '🌟 Thriving',
        'struggling': '📚 Struggling',
        'disengaged': '💤 Disengaged',
        'at-risk': '🚨 At Risk'
      };
      return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 shadow-lg min-w-[180px]">
          <p className="font-bold text-on-surface">{item.name}</p>
          <p className="text-sm text-on-surface-variant mt-1">
            <span className="font-medium">Attendance:</span> {item.attendance}%
          </p>
          <p className="text-sm text-on-surface-variant">
            <span className="font-medium">Performance:</span> {item.performance}%
          </p>
          <p className="text-sm font-bold mt-2" style={{ color: 
            item.quadrant === 'thriving' ? '#10B981' :
            item.quadrant === 'struggling' ? '#F59E0B' :
            item.quadrant === 'disengaged' ? '#8B5CF6' : '#EF4444'
          }}>
            {quadrantNames[item.quadrant]}
          </p>
        </div>
      );
    }
    return null;
  };

  const getQuadrantColor = (quadrant) => {
    switch (quadrant) {
      case 'thriving': return '#10B981';
      case 'struggling': return '#F59E0B';
      case 'disengaged': return '#8B5CF6';
      case 'at-risk': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E2E8F0" 
          />
          
          <XAxis
            type="number"
            dataKey="attendance"
            domain={[0, 100]}
            name="Attendance %"
            nameOffset={15}
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            tickCount={5}
            tickFormatter={(value) => `${value}%`}
          />

          <YAxis
            type="number"
            dataKey="performance"
            domain={[0, 100]}
            name="Performance %"
            nameOffset={-10}
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            tickCount={5}
            tickFormatter={(value) => `${value}%`}
            orientation="left"
          />
          
          {/* Quadrant dividing lines */}
          <ReferenceLine x={attendanceThreshold} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1} />
          <ReferenceLine y={performanceThreshold} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1} />
          
          <Tooltip content={<CustomTooltip />} />

          <Scatter
            name="Students"
            data={data}
            shape="circle"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getQuadrantColor(entry.quadrant)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Quadrant Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div className="flex items-center gap-1.5 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-emerald-700">Thriving</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-amber-50/50 rounded-lg border border-amber-100">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="font-medium text-amber-700">Struggling</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-violet-50/50 rounded-lg border border-violet-100">
          <span className="w-2 h-2 rounded-full bg-violet-500"></span>
          <span className="font-medium text-violet-700">Disengaged</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-red-50/50 rounded-lg border border-red-100">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="font-medium text-red-700">At Risk</span>
        </div>
      </div>
    </div>
  );
}