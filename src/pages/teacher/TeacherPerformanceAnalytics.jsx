import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import PerformanceAreaChart from '../../components/charts/PerformanceAreaChart'
import ScoreDistributionHistogram from '../../components/charts/ScoreDistributionHistogram'
import StudentRiskQuadrant from '../../components/charts/StudentRiskQuadrant'
import SubjectHeatmap from '../../components/charts/SubjectHeatmap'

export default function TeacherPerformanceAnalytics() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const assignedClasses = user?.assigned_classes || []
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '')

  const subjects = user?.subjects || []
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '')

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
        const [res, attendanceRes] = await Promise.all([
          api.get('/results', { params: { grade, section: section || '', subject: selectedSubject } }),
          api.get('/attendance/class-summary', { params: { grade, section: section || '' } }).catch(() => ({ data: [] })),
        ])
        const results = res.data || []
        const attendanceMap = {}
        ;(attendanceRes.data || []).forEach(a => {
          attendanceMap[a.student_id] = a.attendance_percentage
        })

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
          const highestTrends = testOrder.map(title => Math.max(...testGroups[title])).slice(-5)

          // Build each student's real chronological score history for this class/subject,
          // then compare their most recent test against the one before it.
          const byStudent = {}
          results.forEach(r => {
            const key = r.student_id || r.student_name || 'unknown'
            if (!byStudent[key]) byStudent[key] = []
            byStudent[key].push(r)
          })

          const perStudent = Object.entries(byStudent).map(([studentId, studentResults]) => {
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
              studentId,
              name,
              initial: initials || 'ST',
              current,
              previous,
              change: diff !== null ? Math.abs(diff) : null,
              up: diff !== null ? diff >= 0 : null,
              attendance: attendanceMap[studentId]
            }
          }).sort((a, b) => b.current - a.current)

          const insights = perStudent.slice(0, 5)

          setStats({
            classAverage,
            passRate,
            highest,
            lowest,
            distribution,
            insights,
            allStudents: perStudent,
            allScores: marksPctList,
            trends: trends.length > 0 ? trends : [classAverage],
            highestTrends: highestTrends.length > 0 ? highestTrends : [highest]
          })
        }
      } catch (err) {
        console.error('Failed to load performance analytics:', err)
        setError(t('teacherPerfAnalytics.fetchFailed'))
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
              className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                {t('studentDashboard.performanceAnalytics')}
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {assignedClasses.length === 0 && <option value="">{t('teacherPerfAnalytics.noClassesAssigned')}</option>}
              {assignedClasses.map(cls => (
                <option key={cls} value={cls}>{t('teacherPerfAnalytics.classOption', { cls })}</option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {subjects.length === 0 && <option value="">{t('teacherPerfAnalytics.noSubjectsAssigned')}</option>}
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
            <span className="text-xs text-on-surface-variant font-bold">{t('teacherPerfAnalytics.recalculating')}</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            {error}
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2 bg-surface-container-lowest rounded-[24px] border border-outline-variant/30">
            <Icon name="query_stats" className="text-4xl text-on-surface-variant" />
            <p className="text-sm font-bold text-on-surface">{t('teacherPerfAnalytics.noTestResults')}</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              {t('teacherPerfAnalytics.recordMarksPrompt', { cls: selectedClass, subject: selectedSubject })}
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Average */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">{t('teacherPerfAnalytics.classAverage')}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-primary font-bold">{stats.classAverage}</span>
                  <span className="text-xs font-semibold text-primary">%</span>
                </div>
                {trendDelta !== null ? (
                  <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${trendDelta >= 0 ? 'text-emerald-600' : 'text-error'}`}>
                    <Icon name={trendDelta >= 0 ? 'trending_up' : 'trending_down'} className="text-xs" />
                    <span>{trendDelta >= 0 ? '+' : ''}{trendDelta}{t('teacherPerfAnalytics.sinceFirstRecordedTest')}</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-on-surface-variant font-bold mt-2">{t('teacherPerfAnalytics.onlyOneTest')}</p>
                )}
              </div>

              {/* Pass percentage */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">{t('common.passRate')}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-secondary font-bold">{stats.passRate}</span>
                  <span className="text-xs font-semibold text-secondary">%</span>
                </div>
                <div className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${targetMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <Icon name={targetMet ? 'check_circle' : 'warning'} className="text-xs" />
                  <span>{targetMet ? t('teacherPerfAnalytics.aboveTarget', { target: PASS_RATE_TARGET }) : t('teacherPerfAnalytics.belowTarget', { target: PASS_RATE_TARGET })}</span>
                </div>
              </div>

              {/* Highest score */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">{t('teacherPerfAnalytics.highestScore')}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-on-surface font-bold">{stats.highest}</span>
                  <span className="text-xs font-semibold text-on-surface-variant">%</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-bold mt-2">{t('teacherPerfAnalytics.excellentTopRank')}</p>
              </div>

              {/* Lowest score */}
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase tracking-wider">{t('teacherPerfAnalytics.lowestScore')}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-3xl text-error font-bold">{stats.lowest}</span>
                  <span className="text-xs font-semibold text-on-surface-variant">%</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-error text-[10px] font-bold">
                  <Icon name="warning" className="text-xs" />
                  <span>{t('teacherPerfAnalytics.needsAttention')}</span>
                </div>
              </div>
            </section>

            {/* Charts Visual Bento - New Improved Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
              
              {/* Performance Trend - Area Chart (Col Span 8) */}
              <div className="lg:col-span-8 bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">{t('teacherPerfAnalytics.performanceTrend')}</h4>
                  {trendDelta !== null && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      trendDelta >= 0 ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'
                    }`}>
                      <Icon name={trendDelta >= 0 ? 'auto_graph' : 'trending_down'} className="text-xs" />
                      <span>{trendDelta >= 0 ? t('teacherPerfAnalytics.trendingUp') : t('teacherPerfAnalytics.trendingDown')}</span>
                    </span>
                  )}
                </div>

                <div className="h-[220px]">
                  <PerformanceAreaChart
                    trendData={stats.trends.map((val, idx) => ({
                      test_title: idx === stats.trends.length - 1 ? t('common.now') : t('common.testN', { n: idx + 1 }),
                      personal: val,
                      topper: stats.highestTrends[idx]
                    }))}
                    height={220}
                    showClassAvg={false}
                    showTopper={true}
                    showTarget={true}
                    targetValue={75}
                    personalLabel={t('teacherPerfAnalytics.classAverage')}
                    topperLabel={t('teacherPerfAnalytics.highestScore')}
                  />
                </div>
              </div>

              {/* Score Distribution Histogram (Col Span 4) */}
              <div className="lg:col-span-4 bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col overflow-hidden">
                <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider mb-3">{t('adminDashboard.scoreDistribution')}</h4>
                <div className="h-[220px]">
                  <ScoreDistributionHistogram
                    scores={stats.allScores}
                    height={220}
                    binCount={10}
                    showNormalCurve={true}
                    targetLine={40}
                  />
                </div>
              </div>

            </div>

            {/* Additional Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Student Risk Quadrant - real score vs. real attendance */}
              <div className="bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col overflow-hidden">
                <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider mb-3">{t('teacherPerfAnalytics.studentRiskQuadrant')}</h4>
                <div className="h-[280px]">
                  <StudentRiskQuadrant
                    students={stats.allStudents
                      .filter(s => s.attendance !== undefined)
                      .map(s => ({
                        name: s.name,
                        attendance: s.attendance,
                        performance: s.current,
                        initials: s.initial
                      }))}
                    height={280}
                    attendanceThreshold={75}
                    performanceThreshold={60}
                  />
                </div>
              </div>

              {/* Subject Heatmap */}
              <div className="bg-surface-container-lowest p-5 rounded-[28px] shadow-sm border border-outline-variant/35 flex flex-col overflow-hidden">
                <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider mb-3">{t('adminDashboard.subjectPerformanceHeatmap')}</h4>
                <div className="h-[280px]">
                  <SubjectHeatmap
                    students={stats.insights.map(ins => ({
                      name: ins.name,
                      scores: { [selectedSubject]: ins.current },
                      initials: ins.initial
                    }))}
                    subjects={[selectedSubject]}
                    height={280}
                    cellSize={50}
                  />
                </div>
              </div>

            </div>

            {/* Student Insights Table */}
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">{t('teacherPerfAnalytics.studentAcademicInsights')}</h4>
              </div>
              <div className="bg-surface-container-lowest rounded-[28px] shadow-sm border border-outline-variant/35 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/40 text-on-surface-variant font-label-md text-xs border-b border-outline-variant/20">
                        <th className="px-5 py-3 w-1/3">{t('teacherPerfAnalytics.studentCol')}</th>
                        <th className="px-5 py-3 text-center">{t('teacherPerfAnalytics.currentScoreCol')}</th>
                        <th className="px-5 py-3 text-center">{t('teacherPerfAnalytics.previousScoreCol')}</th>
                        <th className="px-5 py-3 text-center">{t('teacherPerfAnalytics.deltaProgressCol')}</th>
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
                                <Icon name={ins.up ? 'arrow_upward' : 'arrow_downward'} className="text-[14px]" />
                                <span>{ins.change}%</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase bg-surface-container-low px-2 py-0.5 rounded-full">{t('teacherPerfAnalytics.newBadge')}</span>
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
