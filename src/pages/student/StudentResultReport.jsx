import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import PerformanceAreaChart from '../../components/charts/PerformanceAreaChart'
import SubjectMasteryRadar from '../../components/charts/SubjectMasteryRadar'
import TestResultsPieChart from '../../components/charts/TestResultsPieChart'
import ScoreDistributionHistogram from '../../components/charts/ScoreDistributionHistogram'

export default function StudentResultReport() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [results, setResults] = useState([])
  const [studentStats, setStudentStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [testLimit, setTestLimit] = useState(5)

  useEffect(() => {
    async function fetchResults() {
      if (!user?.id) return
      try {
        const requests = [api.get('/results', { params: { student_id: user.id } })]
        if (user.student_id) {
          requests.push(api.get(`/students/${user.student_id}/stats`).catch(() => ({ data: null })))
        }
        const [resultsRes, statsRes] = await Promise.all(requests)
        if (resultsRes.data) setResults(resultsRes.data)
        if (statsRes?.data) setStudentStats(statsRes.data)
      } catch (err) {
        console.error('Failed to load student results:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [user])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Calculate statistics
  const totalTests = results.length
  const avgMarks = totalTests > 0 ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalTests) : 0
  const highestScore = totalTests > 0 ? Math.max(...results.map(r => r.percentage)) : 0
  const classRank = studentStats?.class_rank
  const classSize = studentStats?.class_size
  const currentRank = classRank ? `#${classRank}` : '—'
  const rankPercentile = classRank && classSize
    ? t('studentResultReport.topPercentOfClass', { pct: Math.max(1, Math.round((classRank / classSize) * 100)) })
    : t('studentDashboard.notRankedYet')
  const performanceTrend = studentStats?.performance_trend || []

  // Real per-subject breakdown from already-fetched results — no fabricated chapters.
  const subjectBreakdown = (() => {
    const bySubject = {}
    results.forEach(r => {
      if (!r.subject) return
      bySubject[r.subject] = bySubject[r.subject] || []
      bySubject[r.subject].push(r.percentage)
    })
    return Object.entries(bySubject).map(([subject, pcts]) => ({
      subject,
      avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    }))
  })()

  // Most recent result that actually has a teacher-written remark — no fabricated quotes.
  const latestRemark = results.find(r => r.remarks && r.remarks.trim().length > 0)

  const filteredResults = results.filter((r) =>
    (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.test_title || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, testLimit)

  const pieData = useMemo(() => {
  const bySubject = {};
  results.forEach(r => {
  if (!r.subject) return;
  bySubject[r.subject] = bySubject[r.subject] || { count: 0, scores: [] };
  bySubject[r.subject].count++;
  bySubject[r.subject].scores.push(r.percentage);
  });
  return Object.entries(bySubject).map(([subject, data]) => ({
  subject,
  count: data.count,
  avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
  }));
  }, [results])

  return (
    <DashboardLayout hideTopBar={true}>
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm w-full sticky top-0 z-40 -mx-container-padding-mobile px-container-padding-mobile">
        <div className="flex items-center justify-between h-16 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Icon
              name="arrow_back"
              className="text-primary cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate('/student/dashboard')}
            />
            <h1 className="font-title-lg text-title-lg text-primary font-bold">{t('studentResultReport.title')}</h1>
          </div>
          <button className="text-primary p-2 hover:bg-surface-container rounded-full transition-colors">
            <Icon name="more_vert" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto mt-4 space-y-stack-lg pb-10">
        
        {/* Search Bar */}
        <section className="w-full">
          <div className="relative group">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm text-sm" 
              placeholder={t('studentResultReport.searchPlaceholder')}
              type="text"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          
          {/* Left Column: Student Profile Card */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant flex flex-col items-center text-center self-start">
            <div className="relative mb-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-primary-fixed shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-fixed border-4 border-primary-fixed shadow-sm flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{t('studentResultReport.proBadge')}</div>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold mb-1">{user?.full_name}</h2>
            <div className="flex gap-2 mb-4">
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-semibold text-xs">{t('studentResultReport.rollNumber', { n: user?.roll_number })}</span>
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-semibold text-xs">{t('studentResultReport.gradeSection', { grade: user?.grade, section: user?.section })}</span>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 border-t border-outline-variant pt-4">
              <div>
                <p className="text-on-surface-variant text-xs font-semibold">{t('studentDashboard.currentRank')}</p>
                <p className="text-primary font-bold text-lg">{currentRank}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-semibold">{t('studentResultReport.avgMarks')}</p>
                <p className="text-primary font-bold text-lg">{avgMarks}%</p>
              </div>
            </div>
          </div>

          {/* Right Column: Analytics & Summary Cards */}
          <div className="lg:col-span-8 space-y-stack-md">
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <button 
                onClick={() => setTestLimit(5)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                  testLimit === 5 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {t('studentResultReport.last5Tests')}
              </button>
              <button
                onClick={() => setTestLimit(10)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                  testLimit === 10
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {t('studentResultReport.last10Tests')}
              </button>
              <button
                onClick={() => setTestLimit(100)}
                className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                  testLimit === 100
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {t('studentResultReport.allTests')}
              </button>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <Icon name="analytics" className="text-primary mb-2" />
                <p className="text-on-surface-variant text-xs font-semibold">{t('studentResultReport.avgMarks')}</p>
                <h3 className="font-bold text-lg">{avgMarks}%</h3>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <Icon name="military_tech" className="text-primary mb-2" />
                <p className="text-on-surface-variant text-xs font-semibold">{t('common.highest')}</p>
                <h3 className="font-bold text-lg">{highestScore}%</h3>
                <p className="text-on-surface-variant text-[10px]">{t('studentResultReport.recentHigh')}</p>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <Icon name="leaderboard" className="text-primary mb-2" />
                <p className="text-on-surface-variant text-xs font-semibold">{t('studentResultReport.rank')}</p>
                <h3 className="font-bold text-lg">{currentRank}</h3>
                <p className="text-on-surface-variant text-[10px]">{rankPercentile}</p>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <Icon name="history_edu" className="text-primary mb-2" />
                <p className="text-on-surface-variant text-xs font-semibold">{t('studentResultReport.totalTests')}</p>
                <h3 className="font-bold text-lg">{totalTests}</h3>
              </div>
            </div>

          </div>

        </div>

        {/* Main Analytics Bento Grid - New Improved Visualizations */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
          
          {/* Performance Trend - Area Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title-lg text-title-lg font-bold">{t('teacherPerfAnalytics.performanceTrend')}</h3>
            </div>

            {performanceTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant font-semibold">
                {t('studentResultReport.noTestResultsYet')}
              </div>
            ) : (
              <PerformanceAreaChart 
                trendData={performanceTrend} 
                height={220}
                showClassAvg={true}
                showTopper={true}
                showTarget={true}
                targetValue={75}
              />
            )}
          </div>

          {/* Subject Mastery Radar */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <h3 className="font-title-lg text-title-lg font-bold mb-4">{t('studentResultReport.subjectMastery')}</h3>
            {subjectBreakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant font-semibold">
                {t('studentResultReport.noSubjectData')}
              </div>
            ) : (
              <SubjectMasteryRadar 
                subjects={subjectBreakdown.map(s => ({ subject: s.subject, score: s.avg }))}
                size={240}
                showLegend={true}
              />
            )}
          </div>

          {/* Test Results Distribution - Pie Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <h3 className="font-title-lg text-title-lg font-bold mb-4">{t('studentResultReport.testDistribution')}</h3>
            <TestResultsPieChart 
              results={pieData}
              size={280}
              innerRadius={50}
              showLegend={true}
              title={t('studentResultReport.testsBySubject')}
            />
          </div>

          {/* Score Distribution Histogram */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <h3 className="font-title-lg text-title-lg font-bold mb-4">{t('adminDashboard.scoreDistribution')}</h3>
            <ScoreDistributionHistogram 
              scores={results.map(r => r.percentage)}
              height={220}
              binCount={10}
              showNormalCurve={true}
              targetLine={40}
            />
          </div>

          {/* Test Performance Table */}
          <div className="lg:col-span-3 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title-lg text-title-lg font-bold">{t('studentResultReport.recentTestPerformance')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="pb-3 font-bold text-xs text-on-surface-variant">{t('studentResultReport.testNameCol')}</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant">{t('studentResultReport.dateCol')}</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant text-right">{t('studentResultReport.marksCol')}</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant text-right">{t('studentResultReport.classAvgCol')}</th>
                    <th className="pb-3 font-bold text-xs text-on-surface-variant text-center">{t('studentResultReport.gradeCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-on-surface-variant text-sm">{t('studentResultReport.loadingTestRecords')}</td>
                    </tr>
                  ) : filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-on-surface-variant text-sm">{t('studentResultReport.noTestRecordsFound')}</td>
                    </tr>
                  ) : (
                    filteredResults.map((r, idx) => {
                      const trendMatch = performanceTrend.find(t => t.test_title === r.test_title && t.subject === r.subject)
                      return (
                        <tr key={r.id || idx} className="hover:bg-surface-container-low transition-colors group">
                          <td className="py-4 text-sm font-bold">{r.test_title}</td>
                          <td className="py-4 text-on-surface-variant text-xs font-semibold">{formatDate(r.test_date || r.created_at)}</td>
                          <td className="py-4 text-right font-bold text-sm">{r.marks_obtained}/{r.total_marks}</td>
                          <td className="py-4 text-right text-on-surface-variant text-sm">
                            {trendMatch ? `${trendMatch.class_average}%` : '—'}
                          </td>
                          <td className="py-4 text-center">
                            <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-1 rounded text-[10px] font-bold">
                              {r.grade_letter || '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Remarks — real, from the most recent result that actually has a remark on it */}
          {latestRemark && (
            <div className="lg:col-span-3 bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed border border-outline-variant flex items-center justify-center font-bold text-primary">
                  {latestRemark.created_by_name?.[0] || 'T'}
                </div>
                <div>
                  <h4 className="font-title-lg text-base font-bold leading-tight">{t('studentResultReport.teachersRemarks')}</h4>
                  <p className="text-on-surface-variant text-xs">{latestRemark.created_by_name || t('studentResultReport.teacherFallback')} • {latestRemark.subject}</p>
                </div>
              </div>
              <blockquote className="bg-surface p-4 rounded-xl italic border-l-4 border-primary text-xs text-on-surface-variant leading-relaxed">
                "{latestRemark.remarks}"
              </blockquote>
              <p className="text-right text-[10px] text-outline">{t('studentResultReport.onTestLabel', { title: latestRemark.test_title })}</p>
            </div>
          )}

        </section>

        {/* Actions Footer Area */}
        <section className="flex flex-col md:flex-row gap-4 justify-end">
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-semibold text-sm hover:bg-surface-dim transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="file_download" />
            {t('studentResultReport.downloadExcel')}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="picture_as_pdf" />
            {t('studentResultReport.downloadPdfReport')}
          </button>
        </section>

      </div>
    </DashboardLayout>
  )
}
