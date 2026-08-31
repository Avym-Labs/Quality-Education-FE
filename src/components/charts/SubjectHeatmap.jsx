import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useMemo } from 'react';

// Custom heatmap using rectangles since Recharts doesn't have a built-in Heatmap
export default function SubjectHeatmap({ 
  students, 
  subjects,
  height = 400,
  cellSize = 35
}) {
  // students: [{ name: 'John', scores: { Math: 85, Science: 72, English: 90 }, initials: 'JD' }, ...]
  // subjects: ['Math', 'Science', 'English', ...]
  
  const data = useMemo(() => {
    if (!students || !subjects || students.length === 0 || subjects.length === 0) return [];
    
    const cells = [];
    students.forEach((student, studentIdx) => {
      subjects.forEach((subject, subjectIdx) => {
        const score = student.scores?.[subject] ?? null;
        cells.push({
          student: student.name || `Student ${studentIdx + 1}`,
          initials: student.initials || student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST',
          subject,
          score,
          studentIdx,
          subjectIdx,
          color: score === null ? '#E2E8F0' : 
                 score >= 80 ? '#10B981' :
                 score >= 60 ? '#F59E0B' :
                 score >= 40 ? '#EF4444' : '#991B1B',
          opacity: score === null ? 0.3 : 
                   score >= 80 ? 1 :
                   score >= 60 ? 0.8 :
                   score >= 40 ? 0.7 : 0.6
        });
      });
    });
    return cells;
  }, [students, subjects]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant font-semibold">
        No heatmap data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      if (item.score === null) return null;
      return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 shadow-lg min-w-[160px]">
          <p className="font-bold text-on-surface">{item.student}</p>
          <p className="text-sm text-on-surface-variant mt-1">{item.subject}</p>
          <p className="text-2xl font-black text-primary mt-1">{item.score}%</p>
        </div>
      );
    }
    return null;
  };

  const width = subjects.length * cellSize + 100;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id="heatmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#991B1B" />
            <stop offset="25%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        
        {/* Subject headers */}
        <g transform="translate(80, 0)">
          {subjects.map((subject, idx) => (
            <text 
              key={idx}
              x={idx * cellSize + cellSize / 2}
              y="-5"
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#64748B"
              className="truncate"
              style={{ maxWidth: cellSize }}
            >
              {subject}
            </text>
          ))}
        </g>
        
        {/* Cells */}
        <g transform="translate(80, 20)">
          {data.map((cell, idx) => (
            <g key={idx} transform={`translate(${cell.subjectIdx * cellSize}, ${cell.studentIdx * cellSize})`}>
              <rect
                width={cellSize - 2}
                height={cellSize - 2}
                rx={4}
                fill={cell.color}
                opacity={cell.opacity}
                onMouseEnter={(e) => {
                  // Tooltip handled by parent
                }}
              />
              {cell.score !== null && (
                <text
                  x={cellSize / 2 - 1}
                  y={cellSize / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={cell.score >= 60 ? 'white' : '#1E293B'}
              >
                {cell.score}
              </text>
              )}
            </g>
          ))}
        </g>
        
        {/* Student labels */}
        <g transform="translate(0, 20)">
          {students.map((student, idx) => (
            <text
              key={idx}
              x="75"
              y={idx * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              fontSize="10"
              fontWeight="600"
              fill="#334155"
              className="truncate"
              style={{ maxWidth: 70 }}
            >
              {student.name || `Student ${idx + 1}`}
            </text>
          ))}
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">Low</span>
          <div className="w-32 h-4 rounded" style={{ background: 'linear-gradient(90deg, #991B1B, #EF4444, #F59E0B, #10B981, #059669)' }} />
          <span className="text-xs text-on-surface-variant">High</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
          <span>No data</span>
        </div>
      </div>
    </div>
  );
}