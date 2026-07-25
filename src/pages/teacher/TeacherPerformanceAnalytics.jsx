import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TeacherPerformanceAnalytics() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '10-A')
  
  const subjects = user?.subjects || ['Mathematics', 'Science']
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Mathematics')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // null means "no results recorded yet for this class/subject" - rendered as an honest empty state
  // rather than silently showing made-up numbers.
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function loadPerformanceStats() {
      if (!selectedClass) return
      setLoading(true)
      setError('')
      try {
        const [grade, section] = selectedClass.split('-')
        const res = await api.get('/results', {
          params: { grade, section: section || '', subject: selectedSubject }
        })
        const results = res.data || []

        if (results.length === 0) {
          setStats(null)
        } else {
          const marksPctList = results.map(r => r.percentage)
          const highest = Math.max(...marksPctList)
          const lowest = Math.min(...marksPctList)
          const classAverage = roundTo1(marksPctList.reduce((a, b) => a + b, 0) / results.length)
          const passCount = results.filter(r => r.percentage >= 40).length
          const passRate = Math.round((passCount / results.length) * 100)

          const distribution = { bin1: 0, bin2: 0, bin3: 0, bin4: 0 }
          results.forEach(r => {
            if (r.percentage <= 40) distribution.bin1++
            else if (r.percentage <= 60) distribution.bin2++
            else if (r.percentage <= 80) distribution.bin3++
            else distribution.bin4++
          })

          // Calculate average trend by grouping by test_title, ordered chronologically
          const testGroups = {}
          const testOrder = []
          results
            .slice()
            .sort((a, b) => new Date(a.test_date || a.created_at) - new Date(b.test_date || b.created_at))
            .forEach(r => {
              if (!testGroups[r.test_title]) {
                testGroups[r.test_title] = []
                testOrder.push(r.test_title)
              }
              testGroups[r.test_title].push(r.percentage)
            })

          const trends = testOrder.map(title => {
            const list = testGroups[title]
            return roundTo1(list.reduce((a, b) => a + b, 0) / list.length)
          }).slice(-5)

          // Build each student's real chronological score history for this class/subject,
          // then compare their most recent test against the one before it.
          const byStudent = {}
          results.forEach(r => {
            const key = r.student_id || r.student_name || 'unknown'
            if (!byStudent[key]) byStudent[key] = []
            byStudent[key].push(r)
          })

          const insights = Object.values(byStudent).map(studentResults => {
            const sorted = studentResults
              .slice()
              .sort((a, b) => new Date(a.test_date || a.created_at) - new Date(b.test_date || b.created_at))
            const latest = sorted[sorted.length - 1]
            const prior = sorted.length > 1 ? sorted[sorted.length - 2] : null
            const name = latest.student_name || latest.student?.full_name || 'Student'
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const current = Math.round(latest.percentage)
            const previous = prior ? Math.round(prior.percentage) : null
            const diff = previous !== null ? current - previous : null
            return {
              name,
              initial: initials || 'ST',
              current,
              previous,
              change: diff !== null ? Math.abs(diff) : null,
              up: diff !== null ? diff >= 0 : null
            }
          }).sort((a, b) => b.current - a.current).slice(0, 5)

          setStats({
            classAverage,
            passRate,
            highest,
            lowest,
            distribution,
            insights,
            trends: trends.length > 0 ? trends : [classAverage]
          })
        }
      } catch (err) {
        console.error('Failed to load performance analytics:', err)
        setError('Failed to load performance analytics.')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    loadPerformanceStats()
  }, [selectedClass, selectedSubject])

  // Real target line (not a fabricated "target achieved" claim) - a class is considered
  // healthy once at least 3 in 4 students are passing.
  const PASS_RATE_TARGET = 75

  function roundTo1(num) {
    return Math.round(num * 10) / 10
  }

  const trendDelta = stats && stats.trends.length > 1 ? roundTo1(stats.trends[stats.trends.length - 1] - stats.trends[0]) : null
  const targetMet = stats ? stats.passRate >= PASS_RATE_TARGET : false

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24">
        
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Performance Analytics
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {assignedClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
            <span className="text-xs text-on-surface-variant font-bold">Recalculating analytics...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            {error}
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2 bg-surface-container-lowest rounded-[24px] border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">query_stats</span>
            <p className="text-sm font-bold text-on-surface">No test results recorded yet</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              Record marks for Class {selectedClass} in {selectedSubject} to see performance analytics here.
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Average */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">Class Average</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-primary font-bold">{stats.classAverage}</span>
                  <span className="text-xs font-semibold text-primary">%</span>
                </div>
                {trendDelta !== null ? (
                  <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${trendDelta >= 0 ? 'text-emerald-600' : 'text-error'}`}>
                    <span className="material-symbols-outlined text-xs">{trendDelta >= 0 ? 'trending_up' : 'trending_down'}</span>
                    <span>{trendDelta >= 0 ? '+' : ''}{trendDelta}% since first recorded test</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant font-bold mt-2">Only one test recorded so far</p>
                )}
              </div>

              {/* Pass percentage */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">Pass Rate</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-secondary font-bold">{stats.passRate}</span>
                  <span className="text-xs font-semibold text-secondary">%</span>
                </div>
                <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${targetMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <span className="material-symbols-outlined text-xs">{targetMet ? 'check_circle' : 'warning'}</span>
                  <span>{targetMet ? `Above ${PASS_RATE_TARGET}% target` : `Below ${PASS_RATE_TARGET}% target`}</span>
                </div>
              </div>

              {/* Highest score */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">Highest Score</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-on-surface font-bold">{stats.highest}</span>
                  <span className="text-xs font-semibold text-on-surface-variant">%</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold mt-2">Excellent top rank</p>
              </div>

              {/* Lowest score */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">Lowest Score</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-error font-bold">{stats.lowest}</span>
                  <span className="text-xs font-semibold text-on-surface-variant">%</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-error text-[10px] font-bold">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  <span>Needs attention</span>
                </div>
              </div>
            </section>

            {/* Charts Visual Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
              
              {/* Trend Chart (Col Span 8) */}
              <div className="lg:col-span-8 bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col justify-between h-64">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Last 5 Tests Trend</h4>
                  {trendDelta !== null && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      trendDelta >= 0 ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'
                    }`}>
                      <span className="material-symbols-outlined text-xs">{trendDelta >= 0 ? 'auto_graph' : 'trending_down'}</span>
                      <span>{trendDelta >= 0 ? 'Trending up' : 'Trending down'}</span>
                    </span>
                  )}
                </div>
                
                {/* Horizontal bar heights */}
                <div className="flex-1 flex items-end gap-5 pb-2 pt-6 px-4">
                  {stats.trends.map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      <div 
                        className={`w-full max-w-[32px] rounded-t transition-all duration-300 hover:opacity-90 ${
                          idx === stats.trends.length - 1 ? 'bg-primary' : 'bg-primary-fixed-dim'
                        }`}
                        style={{ height: `${val}%` }}
                      ></div>
                      <span className="absolute -top-6 text-[9px] font-bold bg-on-surface text-surface py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}%
                      </span>
                      <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                        {idx === stats.trends.length - 1 ? 'Now' : `T${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marks Distribution Card (Col Span 4) */}
              <div className="lg:col-span-4 bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col justify-between">
                <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider mb-3">Marks Distribution</h4>
                <div className="space-y-2.5">
                  {[
                    { label: '81 - 100%', count: stats.distribution.bin4, color: 'bg-primary' },
                    { label: '61 - 80%', count: stats.distribution.bin3, color: 'bg-secondary' },
                    { label: '41 - 60%', count: stats.distribution.bin2, color: 'bg-amber-500' },
                    { label: '0 - 40%', count: stats.distribution.bin1, color: 'bg-error' },
                  ].map((b, idx) => {
                    const total = Object.values(stats.distribution).reduce((a, b) => a + b, 0) || 1
                    const pct = (b.count / total) * 100
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                          <span>{b.label}</span>
                          <span>{b.count} Stud. ({Math.round(pct)}%)</span>
                        </div>
                        <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                          <div className={`${b.color} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Student Insights Table */}
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Student Academic Insights</h4>
              </div>
              <div className="bg-surface-container-lowest rounded-[28px] shadow-sm border border-outline-variant/35 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/40 text-on-surface-variant font-label-md text-xs border-b border-outline-variant/20">
                        <th className="px-5 py-3 w-1/3">Student</th>
                        <th className="px-5 py-3 text-center">Current Score</th>
                        <th className="px-5 py-3 text-center">Previous Score</th>
                        <th className="px-5 py-3 text-center">Delta Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {stats.insights.map((ins, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-container/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {ins.initial}
                              </div>
                              <span className="font-label-md text-xs font-bold text-on-surface">{ins.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center font-numeric-bold text-xs text-on-surface font-bold">
                            {ins.current}%
                          </td>
                          <td className="px-5 py-3.5 text-center text-xs font-semibold text-on-surface-variant">
                            {ins.previous !== null ? `${ins.previous}%` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {ins.change !== null ? (
                              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                                ins.up ? 'text-emerald-600' : 'text-error'
                              }`}>
                                <span className="material-symbols-outlined text-[14px]">
                                  {ins.up ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                                <span>{ins.change}%</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase bg-surface-container-low px-2 py-0.5 rounded-full">New</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

      </div>
    </DashboardLayout>
  )
}
