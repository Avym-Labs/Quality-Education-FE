import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import PointsCard from '../../components/common/PointsCard'
import AttendanceDonut from '../../components/charts/AttendanceDonut'
import PerformanceAreaChart from '../../components/charts/PerformanceAreaChart'
import SubjectMasteryRadar from '../../components/charts/SubjectMasteryRadar'
import TestResultsPieChart from '../../components/charts/TestResultsPieChart'
import SubjectAttendanceBars from '../../components/charts/SubjectAttendanceBars'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    attendance_percentage: 0,
    average_score: 0,
    total_tests: 0,
    attendance_points: { total_attendance_points: 0, current_streak: 0 },
    test_points: { total_test_points: 0, test_count: 0, breakdown: [] },
    total_points: 0,
    weekly_attendance: [],
    performance_trend: []
  })
  const [leaderboard, setLeaderboard] = useState([])
  const [homeworkCount, setHomeworkCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Mobile only: auto-cycle between the two charts in the same spot every 5s
  const [activeChart, setActiveChart] = useState('attendance')
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveChart(prev => prev === 'attendance' ? 'performance' : 'attendance')
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.student_id) {
        setLoading(false)
        return
      }
      try {
        const [statsRes, hwRes, lbRes] = await Promise.all([
          api.get(`/students/${user.student_id}/stats`),
          api.get('/homework', { params: { grade: user.grade, section: user.section } }),
          api.get('/students/leaderboard'),
        ])
        if (statsRes.data) {
          setStats(statsRes.data)
        }
        if (hwRes.data) {
          setHomeworkCount(hwRes.data.length)
        }
        if (lbRes.data) {
          setLeaderboard(lbRes.data)
        }
      } catch (err) {
        console.error('Failed to load real dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [user])

  // Attendance pop-up: the web app has no live push channel, so this polls
  // /notifications while the student is on this page and pops up a 3s toast
  // the moment a NEW "attendance" notification appears (mirrors the app's
  // live push popup, which fires instantly there via FCM). The first poll
  // only establishes a baseline of already-existing notifications — it
  // never pops up for attendance history that predates this page load.
  const [attendancePopup, setAttendancePopup] = useState(null)
  const seenNotifIds = useRef(new Set())
  const isFirstPoll = useRef(true)
  useEffect(() => {
    let cancelled = false

    async function pollNotifications() {
      try {
        const res = await api.get('/notifications')
        const items = res.data || []
        if (cancelled) return
        if (isFirstPoll.current) {
          items.forEach(n => seenNotifIds.current.add(n.id))
          isFirstPoll.current = false
          return
        }
        const newAttendance = items.find(n => n.type === 'attendance' && !seenNotifIds.current.has(n.id))
        items.forEach(n => seenNotifIds.current.add(n.id))
        if (newAttendance) {
          setAttendancePopup({
            title: newAttendance.title,
            message: newAttendance.message,
            status: newAttendance.data?.status,
          })
          setTimeout(() => setAttendancePopup(null), 3000)
        }
      } catch (err) {
        console.error('Failed to poll notifications for attendance popup:', err)
      }
    }

    pollNotifications()
    const intervalId = setInterval(pollNotifications, 15000)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  // Dynamic values
  const attendance = stats?.attendance_percentage ?? 0
  const score = stats?.average_score ?? 0
  const testsCount = stats?.total_tests ?? 0

  const attendancePoints = stats?.attendance_points ?? { total_attendance_points: 0, current_streak: 0 }
  const testPoints = stats?.test_points ?? { total_test_points: 0, test_count: 0, breakdown: [] }
  const totalPoints = stats?.total_points ?? 0
  const rank = stats?.class_rank ? `#${stats.class_rank}` : '—'
  const rankPercentile = stats?.class_rank && stats?.class_size
    ? t('studentDashboard.topPercent', { pct: Math.max(1, Math.round((stats.class_rank / stats.class_size) * 100)) })
    : t('studentDashboard.notRankedYet')
  const tier = score >= 90 ? t('topbar.legendTier') : score >= 80 ? t('topbar.eliteTier') : t('topbar.aspirantTier')

  const trendData = stats?.performance_trend || []
  const subjectAttendance = stats?.subject_attendance || []

  const getPoints = (key) => {
    if (!trendData || trendData.length === 0) return ''
    const step = 400 / Math.max(1, trendData.length - 1)
    return trendData.map((d, idx) => {
      const x = idx * step
      const y = 100 - ((d[key] || 0) * 0.8 + 10)
      return `${x},${y}`
    }).join(' ')
  }

  const getGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs >= 5 && hrs < 12) return t('common.goodMorning')
    if (hrs >= 12 && hrs < 18) return t('common.goodAfternoon')
    return t('common.goodEvening')
  }

  return (
    <DashboardLayout hideTopBar={false}>
      <div className="flex flex-col gap-4 mt-stack-md pb-4 text-left">
        
        {/* Welcome Greeting Banner Widget */}
        <section className="bg-gradient-to-br from-[#6351E0] to-[#8F43F2] p-5 rounded-[24px] text-white shadow-lg relative overflow-hidden flex flex-col justify-between select-none animate-fadeIn flex-shrink-0">
          {/* Decorative glowing background circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Mobile: greeting leads with the student's total points */}
          <div className="md:hidden z-10 text-left">
            <h2 className="text-xl font-black tracking-tight leading-tight">
              {getGreeting()}, {t('studentDashboard.totalPointsAre')}
            </h2>
            <p className="text-3xl font-black tracking-tight mt-1 flex items-center gap-1.5">
              <Icon name="stars" className="text-2xl text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} filled />
              {totalPoints} <span className="text-sm font-bold">{t('common.pts')}</span>
            </p>
          </div>

          {/* Desktop: greeting by name, plus tier tag and class detail line */}
          <div className="hidden md:flex justify-between items-center gap-4 z-10 text-left">
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || t('studentDashboard.greetingName')}! 👋
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold shrink-0">
                  <Icon name="stars" className="text-[11px]" filled />
                  {tier}
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  {t('topbar.grade')} {user?.grade || '10'}-{user?.section || 'A'} • {t('topbar.academicPrecisionSchool')}
                </span>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md cursor-default select-none flex items-center gap-1.5 shrink-0">
              <Icon name="stars" className="text-sm text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} filled />
              <span>{totalPoints} {t('common.points')}</span>
            </div>
          </div>
        </section>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-start">

          {/* Left Column - Stats & Charts */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Stats Section (Gamified) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
              {/* Attendance Card */}
              <div 
                onClick={() => navigate('/student/attendance')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-all h-32 text-left animate-fade-in"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-2.5 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-[#e2dfff] flex items-center justify-center text-primary shrink-0">
                    <Icon name="calendar_today" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">{t('nav.attendance')}</span>
                </div>
                <div className="flex items-baseline justify-between mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{attendance}%</h3>
                  <span className="text-[9px] font-bold text-primary bg-primary-fixed-dim px-2 py-0.5 rounded shrink-0">
                    {attendance >= 75 ? '+2.4%' : '-1.2%'}
                  </span>
                </div>
              </div>

              {/* Points Card (cycles between attendance points / test points every 5s) */}
              <PointsCard attendancePoints={attendancePoints} testPoints={testPoints} totalPoints={totalPoints} />

              {/* Current Rank Card */}
              <div 
                onClick={() => navigate('/student/results')}
                className="bg-primary-container p-5 rounded-[24px] shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-all h-32 text-left animate-fade-in"
              >
                <div className="absolute -right-2 -top-2 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                <div className="flex items-center gap-2.5 z-10 w-full text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Icon name="trophy" className="text-base" filled />
                  </div>
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider block truncate">{t('studentDashboard.currentRank')}</span>
                </div>
                <div className="flex items-baseline justify-between mt-auto z-10 w-full text-white">
                  <h3 className="text-3xl font-black tracking-tight leading-none">{rank}</h3>
                  <span className="text-[9px] font-bold text-white bg-white/20 px-2 py-0.5 rounded shrink-0">{rankPercentile}</span>
                </div>
              </div>
            </section>

            {/* Charts & Performance - New improved visualizations */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

              {/* Attendance Overview - Radial Gauge + Heatmap Calendar */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center gap-2 mb-4 w-full">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold truncate pr-1">{t('studentDashboard.attendanceOverview')}</h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-10">
                  {/* Donut showing present vs. absent share */}
                  <AttendanceDonut
                    percentage={attendance}
                    size={190}
                    showLabel={true}
                  />

                  {/* Subject-wise attendance breakdown */}
                  <div className="w-full">
                    <h4 className="font-title-lg text-xs text-on-surface font-bold text-center mb-3">{t('studentDashboard.attendanceBySubject')}</h4>
                    <SubjectAttendanceBars data={subjectAttendance} />
                  </div>
                </div>
              </div>

              {/* Performance Trend - Area Chart + Subject Mastery Radar */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center gap-2 mb-4 w-full">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold truncate pr-1">{t('studentDashboard.performanceAnalytics')}</h3>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Area Chart for trend */}
                  <div className="h-[210px]">
                    <PerformanceAreaChart
                      trendData={trendData}
                      height={210}
                      showClassAvg={true}
                      showTopper={true}
                      showTarget={true}
                      targetValue={75}
                    />
                  </div>

                  {/* Subject Mastery Radar */}
                  <div>
                    <SubjectMasteryRadar
                      subjects={useMemo(() => {
                        // Extract subject breakdown from test_points breakdown or performance_trend
                        const subjectMap = {};
                        trendData.forEach(t => {
                          if (t.subject && !subjectMap[t.subject]) {
                            subjectMap[t.subject] = { scores: [], count: 0 };
                          }
                          if (t.subject) {
                            subjectMap[t.subject].scores.push(t.personal || 0);
                            subjectMap[t.subject].count++;
                          }
                        });
                        return Object.entries(subjectMap).map(([subject, data]) => ({
                          subject,
                          score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0
                        }));
                      }, [trendData])}
                      size={220}
                      showLegend={true}
                    />
                  </div>
                </div>
              </div>

            </section>

            {/* Test Results Distribution - Pie Chart */}
            <section className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 lg:col-span-2">
              <TestResultsPieChart
                results={useMemo(() => {
                  // test_points.breakdown is one entry per test taken; aggregate by subject
                  const breakdown = testPoints?.breakdown || [];
                  const bySubject = {};
                  breakdown.forEach(b => {
                    if (!b.subject) return;
                    bySubject[b.subject] = bySubject[b.subject] || { count: 0, totalPct: 0 };
                    bySubject[b.subject].count++;
                    bySubject[b.subject].totalPct += b.percentage || 0;
                  });
                  return Object.entries(bySubject).map(([subject, d]) => ({
                    subject,
                    count: d.count,
                    avgScore: Math.round(d.totalPct / d.count)
                  }));
                }, [testPoints])}
                size={280}
                innerRadius={50}
                showLegend={true}
                title={t('studentDashboard.testDistributionBySubject')}
              />
            </section>

          </div>

          {/* Right Column - Actions & Rankings */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full lg:min-h-0">
            
            {/* Quick Actions Grid */}
            <section className="bg-white p-4 rounded-[24px] shadow-sm border border-outline-variant/35 space-y-3 flex-shrink-0">
              <h3 className="font-title-lg text-sm text-on-surface font-bold text-left">{t('studentDashboard.actionItems')}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Test Performance Action */}
                <div 
                  onClick={() => navigate('/student/results')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="event" className="text-error group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">{testsCount}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">{t('studentDashboard.classTests')}</p>
                  </div>
                </div>

                {/* Achievements Action */}
                <div 
                  onClick={() => navigate('/student/profile/achievements')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="workspace_premium" className="text-secondary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">{t('studentDashboard.cabinet')}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">{t('studentDashboard.achievements')}</p>
                  </div>
                </div>

                {/* Reports Card Action */}
                <div 
                  onClick={() => navigate('/student/reports')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="analytics" className="text-primary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">{t('studentDashboard.report')}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">{t('studentDashboard.analytics')}</p>
                  </div>
                </div>

                {/* Calendar Schedule Action */}
                <div
                  onClick={() => navigate('/student/schedule')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="calendar_today" className="text-secondary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">{t('studentDashboard.schedule')}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">{t('studentDashboard.lectures')}</p>
                  </div>
                </div>

                {/* Leave Request Action */}
                <div
                  onClick={() => navigate('/student/leave')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="event_busy" className="text-primary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">{t('studentDashboard.apply')}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">{t('studentDashboard.leaveRequest')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance Rankers (Leaderboard) */}
            <section className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col lg:flex-1 lg:min-h-0 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-sm text-on-surface font-bold">{t('studentDashboard.attendanceRankers')}</h3>
                <span onClick={() => navigate('/student/profile/achievements')} className="text-primary font-bold text-xs hover:underline cursor-pointer">
                  {t('common.viewAll')}
                </span>
              </div>

              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0.5 hide-scrollbar space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-4 text-xs text-on-surface-variant font-semibold">
                    {t('studentDashboard.noClassmates')}
                  </div>
                ) : leaderboard.map((entry, idx) => {
                  const rank = idx + 1
                  const badgeColor = rank === 1 ? 'bg-yellow-400' : rank === 3 ? 'bg-orange-400' : 'bg-slate-400'
                  const isMe = entry.is_me
                  return (
                    <div
                      key={entry.user_id || idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-colors border ${
                        isMe ? 'bg-primary-fixed/20 hover:bg-primary-fixed/30 border-primary/10' : 'hover:bg-slate-50 border-outline-variant/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-fixed border border-primary flex items-center justify-center">
                              <span className="text-primary font-bold text-xs">{entry.name?.[0] || '?'}</span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${badgeColor} rounded-full border border-white flex items-center justify-center`}>
                            <span className="text-[9px] font-bold text-white font-numeric-bold">{rank}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">
                              {isMe ? `${entry.name?.split(' ')[0] || t('common.you')} (${t('common.you')})` : entry.name}
                            </span>
                          </div>
                          <p className="text-[9px] text-on-surface-variant flex items-center gap-1 font-semibold mt-0.5">
                            <Icon name="local_fire_department" className="text-[10px] text-tertiary" filled />
                            {t('studentDashboard.dayStreak', { count: entry.streak_days })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-on-surface font-numeric-bold">{entry.attendance_pct}%</p>
                        <p className="text-[8px] uppercase font-bold text-on-surface-variant">{entry.total_points} {t('common.pts')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

          </div>

        </div>

      </div>

      {attendancePopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-[100] animate-fadeIn duration-200 p-4">
          <div className="bg-surface w-full max-w-xs rounded-3xl shadow-xl p-6 text-center space-y-3">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
              attendancePopup.status === 'present'
                ? 'bg-emerald-100 text-emerald-600'
                : attendancePopup.status === 'late'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-error-container text-error'
            }`}>
              <Icon
                name={attendancePopup.status === 'present' ? 'check_circle' : attendancePopup.status === 'late' ? 'schedule' : 'cancel'}
                className="text-3xl"
                filled
              />
            </div>
            <h3 className="text-sm font-black text-on-surface">{attendancePopup.title}</h3>
            <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">{attendancePopup.message}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
