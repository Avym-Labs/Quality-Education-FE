import { useMemo } from 'react';

export default function AttendanceHeatmapCalendar({ 
  weeklyAttendance, 
  weeks = 12,
  cellSize = 28
}) {
  // weeklyAttendance: [{ day: 'Mon', rate: 85 }, { day: 'Tue', rate: 90 }, ...] for current week
  // For a full calendar, we'd need date-based data. This shows a weekly pattern heatmap.
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Generate mock weekly data for demonstration (in real app, this would come from API)
  const calendarData = useMemo(() => {
    if (!weeklyAttendance || weeklyAttendance.length === 0) {
      // Generate empty grid
      const empty = [];
      for (let w = 0; w < weeks; w++) {
        days.forEach((day, d) => {
          empty.push({ week: w, day: d, dayName: day, rate: null });
        });
      }
      return empty;
    }
    
    // Only week 0 has real data from the API; other weeks have no data to show
    const data = [];
    for (let w = 0; w < weeks; w++) {
      days.forEach((day, d) => {
        const actual = w === 0 ? weeklyAttendance.find(a => a.day === day) : null;
        const rate = actual ? actual.rate : null;
        data.push({ week: w, day: d, dayName: day, rate });
      });
    }
    return data;
  }, [weeklyAttendance, weeks]);

  const getColor = (rate) => {
    if (rate === null) return '#E2E8F0';
    if (rate >= 90) return '#059669';
    if (rate >= 75) return '#10B981';
    if (rate >= 60) return '#F59E0B';
    if (rate >= 40) return '#EF4444';
    return '#991B1B';
  };

  const width = weeks * cellSize + 60;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={220} className="block">
        {/* Day labels */}
        <g transform="translate(50, 0)">
          {days.map((day, d) => (
            <text 
              key={d}
              x="-5"
              y={d * cellSize + cellSize / 2 + 5}
              textAnchor="end"
              fontSize="10"
              fontWeight="600"
              fill="#64748B"
            >
              {day}
            </text>
          ))}
        </g>
        
        {/* Week labels and cells */}
        <g transform="translate(50, 0)">
          {Array.from({ length: weeks }).map((_, w) => (
            <g key={w} transform={`translate(${w * cellSize}, 0)`}>
              {/* Week label */}
              <text
                x={cellSize / 2}
                y="-5"
                textAnchor="middle"
                fontSize="9"
                fontWeight="500"
                fill="#94A3B8"
              >
                W{weeks - w}
              </text>
              
              {/* Cells */}
              {days.map((day, d) => {
                const cell = calendarData.find(c => c.week === w && c.day === d);
                const rate = cell?.rate;
                return (
                  <g key={d} transform={`translate(0, ${d * cellSize})`}>
                    <rect
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={4}
                      fill={getColor(rate)}
                      opacity={rate === null ? 0.3 : 1}
                    />
                    {rate !== null && (
                      <text
                        x={cellSize / 2}
                        y={cellSize / 2 + 4}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fill={rate >= 60 ? 'white' : '#1E293B'}
                      >
                        {Math.round(rate)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
        <span className="text-xs text-on-surface-variant">Low</span>
        <div className="flex -space-x-1">
          {['#991B1B', '#EF4444', '#F59E0B', '#10B981', '#059669'].map((color, i) => (
            <div key={i} className="w-8 h-6 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-xs text-on-surface-variant">High</span>
        <div className="flex items-center gap-1.5 ml-4 text-xs text-on-surface-variant">
          <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
          <span>No data</span>
        </div>
      </div>
    </div>
  );
}