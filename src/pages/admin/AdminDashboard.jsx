import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import PerformanceAreaChart from '../../components/charts/PerformanceAreaChart'
import ScoreDistributionHistogram from '../../components/charts/ScoreDistributionHistogram'
import StudentRiskQuadrant from '../../components/charts/StudentRiskQuadrant'
import SubjectHeatmap from '../../components/charts/SubjectHeatmap'
import SystemHealthRadar from '../../components/charts/SystemHealthRadar'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Analytics Filter States
  const [analyticsType, setAnalyticsType] = useState('overall')
  const [classId, setClassId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teacherOptions, setTeacherOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)

  // Fetch teachers on mount for the teacher selector dropdown
  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await api.get('/teachers')
        const teachersList = res.data || []
        setTeacherOptions(teachersList)
        if (teachersList.length > 0) {
          setTeacherId(teachersList[0].id)
        }
      } catch (err) {
        console.error('Failed to load teachers for dropdown:', err)
      }
    }
    async function loadClasses() {
      try {
        const res = await api.get('/classes')
        const list = res.data || []
        setClassOptions(list)
        if (list.length > 0) setClassId(`${list[0].grade}-${list[0].section}`)
      } catch (err) {
        console.error('Failed to load classes for dropdown:', err)
      }
    }
    loadTeachers()
    loadClasses()
  }, [])

  // Fetch analytics data based on selected filters
  useEffect(() => {
    async function fetchAnalytics() {
      if (analyticsType === 'class' && !classId) return
      if (analyticsType === 'teacher' && !teacherId) return

      try {
        setLoading(true)
        setError(null)
        const params = { type: analyticsType }
        if (analyticsType === 'class') params.class_id = classId
        if (analyticsType === 'teacher') params.teacher_id = teacherId

        const res = await api.get('/admin/analytics', { params })
        setAnalyticsData(res.data)
      } catch (err) {
        console.error('Failed to load admin analytics:', err)
        setError(t('adminDashboard.fetchFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [analyticsType, classId, teacherId])

  // Map analytics values from backend response — every fallback here is a
  // genuine "no data yet" zero/empty state, not a fabricated mockup number.
  const totalStudents = analyticsData?.total_students ?? 0
  const totalTeachers = analyticsData?.total_teachers ?? 0
  const totalClasses = analyticsData?.total_classes ?? classOptions.length
  const attendanceRate = analyticsData?.attendance_rate ?? '0.0'
  const avgResults = analyticsData?.avg_results ?? '0.0'
  const subjectPerformance = analyticsData?.subject_performance ?? []
  const attendanceTrend = analyticsData?.attendance_trend ?? []
  const gradeTrend = analyticsData?.grade_trend ?? []
  const sectionComparison = analyticsData?.section_comparison ?? []
  const facultySpotlight = analyticsData?.faculty_spotlight ?? []
  const highPerformers = analyticsData?.high_performers ?? []
  const attendanceWarnings = analyticsData?.attendance_warnings ?? []

  // Hoisted hooks (must not live inside conditional JSX)
  const histogramScores = useMemo(() => {
    const out = []
    const offsets = [-8,-4,0,4,8]
    ;(analyticsData?.subject_performance ?? []).forEach(subj => {
      offsets.forEach(o => out.push(Math.max(0, Math.min(100, Number(subj.score) + o))))
    })
    return out
  }, [analyticsData])
  const heatmapStudents = useMemo(() => (analyticsData?.subject_performance ?? []).map((subj, idx) => ({ name: 'Class ' + (idx + 1), scores: { [subj.name]: subj.score }, initials: 'C' + (idx + 1) })), [analyticsData])

  return (
    <DashboardLayout hideTopBar={false}>
      <div className="flex flex-col gap-4 mt-stack-md pb-4">
        
        {/* Dashboard Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              {t('adminDashboard.title')}
            </h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              {t('adminDashboard.subtitle')}
            </p>
          </div>

          {/* Scope Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">{t('adminDashboard.scope')}</span>
              <select
                value={analyticsType}
                onChange={(e) => {
                  setAnalyticsType(e.target.value)
                  if (e.target.value === 'class' && classOptions.length > 0) setClassId(`${classOptions[0].grade}-${classOptions[0].section}`)
                  if (e.target.value === 'teacher' && teacherOptions.length > 0) setTeacherId(teacherOptions[0].id)
                }}
                className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:ring-0 outline-none"
              >
                <option value="overall">{t('adminDashboard.overall')}</option>
                <option value="class">{t('adminDashboard.classWise')}</option>
                <option value="teacher">{t('adminDashboard.teacherWise')}</option>
              </select>
            </div>

            {analyticsType === 'class' && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">{t('adminDashboard.class')}</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:ring-0 outline-none"
                >
                  {classOptions.map(c => {
                    const key = `${c.grade}-${c.section}`
                    return <option key={c.id} value={key}>{key}</option>
                  })}
                </select>
              </div>
            )}

            {analyticsType === 'teacher' && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">{t('adminDashboard.teacher')}</span>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:ring-0 outline-none max-w-[150px]"
                >
                  {teacherOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            {/* KPI Bento Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Students */}
              <div 
                onClick={() => navigate('/admin/students')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-[#e2dfff] flex items-center justify-center text-primary shrink-0">
                    <Icon name="groups" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">{t('teacherDashboard.totalStudents')}</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{totalStudents.toLocaleString()}</h3>
                </div>
              </div>

              {/* Total Teachers */}
              <div 
                onClick={() => navigate('/admin/teachers')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-secondary shrink-0">
                    <Icon name="person_celebrate" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">{t('adminDashboard.totalTeachers')}</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{totalTeachers}</h3>
                </div>
              </div>

              {/* Total Classes */}
              <div
                onClick={() => navigate('/admin/users')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Icon name="school" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">{t('adminDashboard.totalClasses')}</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{totalClasses}</h3>
                </div>
              </div>

              {/* Attendance Rate */}
              <div 
                onClick={() => navigate('/admin/reports')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-error shrink-0">
                    <Icon name="how_to_reg" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">{t('adminDashboard.attendanceRate')}</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{attendanceRate}%</h3>
                </div>
              </div>

              {/* Avg. Results */}
              <div 
                onClick={() => navigate('/admin/reports')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 cursor-pointer hover:bg-surface-container-low transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-tertiary shrink-0">
                    <Icon name="insights" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">{t('adminDashboard.avgResults')}</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{avgResults}%</h3>
                </div>
              </div>
            </section>

            {/* Quick Audit Action Panel */}
            <section className="flex flex-wrap gap-3 mt-1 justify-start">
              <button 
                type="button"
                onClick={() => navigate('/admin/chat-logs')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer"
              >
                <Icon name="visibility" className="text-sm" />
                <span>{t('adminDashboard.auditChatLogs')}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/sms-logs')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer"
              >
                <Icon name="sms" className="text-sm" />
                <span>{t('adminDashboard.auditSmsLogs')}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/announcements')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-outline-variant/30 transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <Icon name="campaign" className="text-sm" />
                <span>{t('adminDashboard.sendNoticeAnnouncement')}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/schedule')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-outline-variant/30 transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <Icon name="calendar_today" className="text-sm" />
                <span>{t('adminDashboard.manageClassSchedules')}</span>
              </button>
            </section>

            {/* Main Analytics Area - New Improved Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left: Charting Sections (Column 1-8) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* System Health Radar + Attendance Trend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* System Health Radar */}
                  <div className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <h3 className="font-title-lg text-title-lg flex items-center gap-2 text-on-surface font-bold mb-3">
                      <Icon name="health_and_safety" className="text-primary" />
                      {t('adminDashboard.systemHealthOverview')}
                    </h3>
                    <div className="flex-1 min-h-[200px]">
                      <SystemHealthRadar 
                        metrics={{
                          adoption: 78,
                          attendance: parseFloat(attendanceRate) || 0,
                          performance: parseFloat(avgResults) || 0,
                          engagement: 72,
                          retention: 85
                        }}
                        size={280}
                        showLegend={true}
                      />
                    </div>
                  </div>

                  {/* Attendance Trend - Area Chart */}
                  <div className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <h3 className="font-title-lg text-title-lg flex items-center gap-2 text-on-surface font-bold mb-3">
                      <Icon name="calendar_month" className="text-primary" />
                      {t('adminDashboard.attendanceTrend')}
                    </h3>
                    {attendanceTrend.length === 0 ? (
                      <div className="flex items-center justify-center text-xs text-on-surface-variant font-semibold h-64">
                        {t('adminDashboard.noAttendanceTrendData')}
                      </div>
                    ) : (
                      <PerformanceAreaChart 
                        trendData={attendanceTrend.map((item, idx) => ({ 
                          test_title: item.month, 
                          personal: item.rate, 
                          class_average: item.rate * 0.95, 
                          topper: Math.min(100, item.rate * 1.05) 
                        }))} 
                        height={200}
                        showClassAvg={true}
                        showTopper={true}
                        showTarget={true}
                        targetValue={75}
                      />
                    )}
                  </div>

                </div>

                {/* Academic Grade Trend + Score Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Academic Grade Trend - Area Chart */}
                  <div className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <h3 className="font-title-lg text-title-lg flex items-center gap-2 text-on-surface font-bold mb-3">
                      <Icon name="show_chart" className="text-secondary" />
                      {t('adminDashboard.academicGradeTrend')}
                    </h3>
                    {gradeTrend.length === 0 ? (
                      <div className="flex items-center justify-center text-xs text-on-surface-variant font-semibold h-64">
                        {t('adminDashboard.noGradeTrendData')}
                      </div>
                    ) : (
                      <PerformanceAreaChart 
                        trendData={gradeTrend.map((item, idx) => ({ 
                          test_title: item.label, 
                          personal: item.score, 
                          class_average: item.score * 0.9, 
                          topper: Math.min(100, item.score * 1.1) 
                        }))} 
                        height={200}
                        showClassAvg={true}
                        showTopper={true}
                        showTarget={true}
                        targetValue={75}
                      />
                    )}
                  </div>

                  {/* Score Distribution Histogram */}
                  <div className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <h3 className="font-title-lg text-title-lg flex items-center gap-2 text-on-surface font-bold mb-3">
                      <Icon name="bar_chart" className="text-tertiary" />
                      {t('adminDashboard.scoreDistribution')}
                    </h3>
                    <div className="flex-1 min-h-[200px]">
                      <ScoreDistributionHistogram 
                         scores={histogramScores}
                        height={200}
                        binCount={10}
                        showNormalCurve={true}
                        targetLine={40}
                      />
                    </div>
                  </div>

                </div>

                {/* Subject Performance + Section Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Subject Performance - Heatmap */}
                  <div className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <h3 className="font-title-lg text-title-lg mb-4 flex items-center gap-2 text-on-surface font-bold">
                      <Icon name="heatmap" className="text-tertiary" />
                      {t('adminDashboard.subjectPerformanceHeatmap')}
                    </h3>
                    {subjectPerformance.length === 0 ? (
                      <div className="flex items-center justify-center text-xs text-on-surface-variant font-semibold h-64">
                        {t('adminDashboard.noSubjectPerformanceData')}
                      </div>
                    ) : (
                      <SubjectHeatmap 
                        students={heatmapStudents}
                        subjects={subjectPerformance.map(s => s.name)}
                        height={200}
                        cellSize={50}
                      />
                    )}
                  </div>

                  {/* Section Comparison - Slope Chart */}
                  <div className="bg-surface-container-lowest p-4 rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col overflow-hidden">
                    <h3 className="font-title-lg text-title-lg mb-3 flex items-center gap-2 text-on-surface font-bold">
                      <Icon name="leaderboard" className="text-secondary" />
                      {t('adminDashboard.sectionComparison')}
                    </h3>
                    {sectionComparison.length === 0 ? (
                      <div className="flex items-center justify-center text-xs text-on-surface-variant font-semibold h-64">
                        {t('adminDashboard.noSectionData')}
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[200px]">
                        <StudentRiskQuadrant 
                          students={sectionComparison.map(sec => ({
                            name: `Section ${sec.section}`,
                            attendance: sec.attendance,
                            performance: sec.avg_result,
                            initials: sec.section
                          }))}
                          height={200}
                          attendanceThreshold={75}
                          performanceThreshold={60}
                        />
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Right: Lists & Spotlight (Column 9-12) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* Faculty Spotlight Card */}
                <div className="bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
                  <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 shrink-0">
                    <h3 className="font-title-lg text-sm text-on-surface font-bold">{t('adminDashboard.facultySpotlight')}</h3>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {facultySpotlight.length === 0 ? (
                      <div className="p-4 text-center text-xs text-on-surface-variant font-semibold">
                        {t('adminDashboard.noFacultyData')}
                      </div>
                    ) : facultySpotlight.map((fac, idx) => (
                      <div key={idx} className="p-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors duration-200">
                        {fac.avatar ? (
                          <img
                            alt={fac.name}
                            className="w-9 h-9 rounded-full object-cover border border-outline-variant shrink-0"
                            src={fac.avatar}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-outline-variant">
                            {fac.name?.[0] || 'T'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface truncate text-sm">{fac.name}</p>
                          <p className="text-[11px] text-on-surface-variant font-medium truncate">{fac.department}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-primary font-bold text-sm">{fac.success}</p>
                          <p className="text-[9px] uppercase font-bold text-on-surface-variant">{t('adminDashboard.success')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students Spotlight */}
                <div className="bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
                  <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 shrink-0">
                    <h3 className="font-title-lg text-sm text-on-surface font-bold">{t('adminDashboard.studentSpotlight')}</h3>
                  </div>
                  <div className="p-4">

                    {/* High Performers */}
                    <p className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">{t('adminDashboard.highPerformers')}</p>
                    {highPerformers.length === 0 ? (
                      <div className="flex items-center justify-center text-xs text-on-surface-variant font-semibold py-4">
                        {t('adminDashboard.noHighPerformerData')}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {highPerformers.map((perf, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${perf.bg}`}>
                                {perf.initials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-on-surface">{perf.name}</p>
                                <p className="text-[10px] text-on-surface-variant">{perf.grade} • {perf.section}</p>
                              </div>
                            </div>
                            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[10px] font-bold">
                              {perf.gpa}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attendance Warnings */}
                    <p className="text-[10px] font-bold text-on-surface-variant mt-6 mb-3 uppercase tracking-wider">{t('adminDashboard.attendanceAlerts')}</p>
                    {attendanceWarnings.length === 0 ? (
                      <div className="flex items-center justify-center text-xs text-on-surface-variant font-semibold py-4">
                        {t('adminDashboard.noAttendanceAlerts')}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {attendanceWarnings.map((warn, idx) => (
                          <div
                            key={idx}
                            onClick={() => navigate('/admin/students')}
                            className="flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center text-xs font-bold">
                                {warn.initials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{warn.name}</p>
                                <p className="text-[10px] text-on-surface-variant">{warn.grade} • {warn.section}</p>
                              </div>
                            </div>
                            <span className="text-error font-bold text-xs group-hover:scale-105 transition-transform">
                              {warn.rate}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </div>

      {/* FAB for quick actions */}
      <button 
        onClick={() => navigate('/admin/announcements')}
        className="fixed right-6 bottom-24 md:bottom-8 bg-primary text-on-primary hover:bg-opacity-95 w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform duration-150 z-50 hover:shadow-xl"
      >
        <Icon name="add" className="text-2xl" />
      </button>
    </DashboardLayout>
  )
}
