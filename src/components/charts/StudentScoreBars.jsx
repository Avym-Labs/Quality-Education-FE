export default function StudentScoreBars({ data, passMark = 40 }) {
  // data: [{ name: 'Priya Verma', initials: 'PV', score: 90.3 }, ...] - already sorted desc

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-on-surface-variant font-semibold text-sm">
        No recorded results yet
      </div>
    );
  }

  const getColor = (score) => (score >= 75 ? '#10B981' : score >= passMark ? '#F59E0B' : '#EF4444');

  return (
    <div className="w-full flex flex-col gap-2.5">
      {data.map((d, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-on-surface-variant shrink-0">
            {d.initials}
          </div>
          <span className="text-xs font-semibold text-on-surface w-28 shrink-0 truncate" title={d.name}>
            {d.name}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, d.score)}%`, backgroundColor: getColor(d.score) }}
            />
          </div>
          <span className="text-xs font-bold text-on-surface w-12 text-right shrink-0">{d.score}%</span>
        </div>
      ))}
    </div>
  );
}
