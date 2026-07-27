import { useEffect, useState } from 'react'
import Icon from './Icon'

export default function PointsCard({ attendancePoints, testPoints, totalPoints }) {
  const [view, setView] = useState('attendance')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setView(prev => (prev === 'attendance' ? 'test' : 'attendance'))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const ap = attendancePoints || {}
  const tp = testPoints || {}
  const isAttendance = view === 'attendance'

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant flex flex-col justify-between relative overflow-hidden group h-32 text-left animate-fade-in cursor-pointer hover:shadow-md transition-all"
      >
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
        <div className="flex items-center gap-2.5 z-10 w-full">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-tertiary shrink-0">
            <Icon name={isAttendance ? 'calendar_today' : 'quiz'} className="text-base" filled />
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">
            {isAttendance ? 'Attendance Points' : 'Test Points'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-auto z-10 w-full">
          <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">
            {isAttendance ? ap.total_attendance_points ?? 0 : tp.total_test_points ?? 0}
            <span className="text-xs font-bold text-on-surface-variant ml-0.5">pts</span>
          </h3>
          <span className="text-[9px] font-bold text-tertiary bg-tertiary-fixed-dim px-2 py-0.5 rounded shrink-0">
            {isAttendance ? `Streak: ${ap.current_streak ?? 0}/15d` : `${tp.test_count ?? 0} tests`}
          </span>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[24px] shadow-xl max-w-md w-full p-6 relative text-left max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <Icon name="close" className="text-base text-on-surface-variant" />
            </button>

            <h3 className="text-lg font-black text-on-surface mb-1">Points Breakdown</h3>
            <p className="text-3xl font-black text-primary mb-4">
              {totalPoints ?? 0} <span className="text-sm font-bold text-on-surface-variant">total pts</span>
            </p>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="calendar_today" className="text-primary text-base" />
                  <h4 className="font-bold text-sm text-on-surface">Attendance Points</h4>
                  <span className="ml-auto font-black text-on-surface">{ap.total_attendance_points ?? 0} pts</span>
                </div>
                <ul className="text-xs text-on-surface-variant space-y-1">
                  <li>Days attended: <span className="font-bold text-on-surface">{ap.attended_days ?? 0}</span></li>
                  <li>Daily points (5/day attended): <span className="font-bold text-on-surface">{ap.daily_points ?? 0} pts</span></li>
                  <li>15-day streak bonuses earned: <span className="font-bold text-on-surface">{ap.completed_cycles ?? 0}</span></li>
                  <li>Bonus points (25 per streak): <span className="font-bold text-on-surface">{ap.bonus_points ?? 0} pts</span></li>
                  <li>Current streak: <span className="font-bold text-on-surface">{ap.current_streak ?? 0} / 15 days</span></li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-outline-variant/30">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="quiz" className="text-tertiary text-base" />
                  <h4 className="font-bold text-sm text-on-surface">Test Points</h4>
                  <span className="ml-auto font-black text-on-surface">{tp.total_test_points ?? 0} pts</span>
                </div>
                {tp.breakdown && tp.breakdown.length > 0 ? (
                  <ul className="text-xs text-on-surface-variant space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {tp.breakdown.map((b, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span className="truncate">{b.test_title} ({b.subject})</span>
                        <span className="font-bold text-on-surface shrink-0">{b.percentage}% → {b.points} pts</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-on-surface-variant">No tests recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
