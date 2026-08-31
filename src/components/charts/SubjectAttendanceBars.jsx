export default function SubjectAttendanceBars({ data, threshold = 75 }) {
  // data: [{ subject: 'Mathematics', percentage: 82, present: 18, total: 22 }, ...]

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-on-surface-variant font-semibold text-sm">
        No subject attendance recorded yet
      </div>
    );
  }

  const getColor = (pct) => (pct >= threshold ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444');

  return (
    <div className="w-full flex flex-col gap-2.5">
      {data.map((d, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-on-surface-variant w-24 shrink-0 truncate" title={d.subject}>
            {d.subject}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, d.percentage)}%`, backgroundColor: getColor(d.percentage) }}
            />
          </div>
          <span className="text-xs font-bold text-on-surface w-10 text-right shrink-0">{d.percentage}%</span>
        </div>
      ))}
    </div>
  );
}
