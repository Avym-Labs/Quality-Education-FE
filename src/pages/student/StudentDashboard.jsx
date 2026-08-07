import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import PointsCard from '../../components/common/PointsCard'

export default function StudentDashboard() {
  const { user } = useAuth()
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

  // Dynamic values
  const attendance = stats?.attendance_percentage ?? 0
  const score = stats?.average_score ?? 0
  const testsCount = stats?.total_tests ?? 0

  const attendancePoints = stats?.attendance_points ?? { total_attendance_points: 0, current_streak: 0 }
  const testPoints = stats?.test_points ?? { total_test_points: 0, test_count: 0, breakdown: [] }
  const totalPoints = stats?.total_points ?? 0
  const rank = score >= 90 ? '#1' : score >= 80 ? '#2' : '#3'
  const rankPercentile = score >= 90 ? 'Top 0.5%' : score >= 80 ? 'Top 1%' : 'Top 5%'
  const tier = score >= 90 ? 'Legend Tier' : score >= 80 ? 'Elite Tier' : 'Aspirant Tier'

  const trendData = stats?.performance_trend || []
  const weeklyAttendance = stats?.weekly_attendance || []

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
    if (hrs >= 5 && hrs < 12) return 'Good Morning'
    if (hrs >= 12 && hrs < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <DashboardLayout hideTopBar={false}>
      <div className="flex flex-col gap-4 mt-stack-md lg:h-[calc(100vh-100px)] lg:overflow-hidden pb-4 text-left">
        
        {/* Welcome Greeting Banner Widget */}
        <section className="bg-gradient-to-br from-[#6351E0] to-[#8F43F2] p-5 rounded-[24px] text-white shadow-lg relative overflow-hidden flex flex-col justify-between select-none animate-fadeIn flex-shrink-0">
          {/* Decorative glowing background circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Mobile: greeting leads with the student's total points */}
          <div className="md:hidden z-10 text-left">
            <h2 className="text-xl font-black tracking-tight leading-tight">
              {getGreeting()}, your total points are:
            </h2>
            <p className="text-3xl font-black tracking-tight mt-1 flex items-center gap-1.5">
              <Icon name="stars" className="text-2xl text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} filled />
              {totalPoints} <span className="text-sm font-bold">pts</span>
            </p>
          </div>

          {/* Desktop: greeting by name, plus tier tag and class detail line */}
          <div className="hidden md:flex justify-between items-center gap-4 z-10 text-left">
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold shrink-0">
                  <Icon name="stars" className="text-[11px]" filled />
                  {tier}
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  Grade {user?.grade || '10'}-{user?.section || 'A'} • Academic Precision School
                </span>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md cursor-default select-none flex items-center gap-1.5 shrink-0">
              <Icon name="stars" className="text-sm text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} filled />
              <span>{totalPoints} Points</span>
            </div>
          </div>
        </section>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 lg:min-h-0 lg:items-stretch">
          
          {/* Left Column - Stats & Charts */}
          <div className="lg:col-span-8 flex flex-col gap-4 lg:h-full lg:min-h-0">
            
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
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">Attendance</span>
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
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider block truncate">Current Rank</span>
                </div>
                <div className="flex items-baseline justify-between mt-auto z-10 w-full text-white">
                  <h3 className="text-3xl font-black tracking-tight leading-none">{rank}</h3>
                  <span className="text-[9px] font-bold text-white bg-white/20 px-2 py-0.5 rounded shrink-0">{rankPercentile}</span>
                </div>
              </div>
            </section>

            {/* Charts & Performance - shown side-by-side at equal size on desktop */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:flex-1 lg:min-h-0">

              {/* Weekly Consistency (Attendance) Chart */}
              <div className={`bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex-col justify-between lg:min-h-0 ${activeChart === 'attendance' ? 'flex' : 'hidden'} lg:flex`}>
                <div className="flex justify-between items-center gap-2 mb-2 w-full">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold truncate pr-1">Weekly Consistency</h3>
                  <div className="flex gap-1.5 items-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Present</span>
                  </div>
                </div>

                <div className="flex-1 transition-all duration-300 lg:min-h-0">
                  {weeklyAttendance.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-semibold">
                      No attendance recorded yet
                    </div>
                  ) : (
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex items-end justify-between px-2 gap-3 pt-2 flex-grow min-h-0">
                      {weeklyAttendance.map((d, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                          <div
                            className={`w-full max-w-[32px] rounded-t-md transition-all duration-500 hover:opacity-90 ${d.rate < 50 ? 'bg-[#e2dfff]' : 'bg-primary'}`}
                            style={{ height: `${d.rate}%` }}
                          ></div>
                          <span className="text-[10px] font-bold text-on-surface-variant">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Performance Trend Chart */}
              <div className={`bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex-col justify-between lg:min-h-0 ${activeChart === 'performance' ? 'flex' : 'hidden'} lg:flex`}>
                <div className="flex justify-between items-center gap-2 mb-2 w-full">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold truncate pr-1">Performance Trend</h3>
                </div>

                <div className="flex-1 transition-all duration-300 lg:min-h-0">
                  {trendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-semibold">
                      No test results recorded yet
                    </div>
                  ) : (
                  <div className="h-full flex flex-col justify-between">
                    {/* Legend for the 3 lines */}
                    <div className="flex items-center gap-4 justify-start mb-2 px-1 text-[9px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                        <span className="text-on-surface-variant">Personal</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                        <span className="text-on-surface-variant">Class Avg</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        <span className="text-on-surface-variant">Topper</span>
                      </div>
                    </div>

                    <div className="relative flex-grow w-full min-h-0 pt-2 flex flex-col justify-between">
                      <div className="flex-1 relative min-h-0">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                          {/* Grid lines */}
                          <line x1="0" y1="10" x2="400" y2="10" stroke="#e2e8f0" strokeDasharray="3,3" />
                          <line x1="0" y1="50" x2="400" y2="50" stroke="#e2e8f0" strokeDasharray="3,3" />
                          <line x1="0" y1="90" x2="400" y2="90" stroke="#e2e8f0" strokeDasharray="3,3" />

                          {/* Topper line */}
                          <polyline points={getPoints('topper')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Class Avg line */}
                          <polyline points={getPoints('class_average')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,4" />
                          {/* Personal line */}
                          <polyline points={getPoints('personal')} fill="none" stroke="#3525cd" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Data dots */}
                          {trendData.map((d, idx) => {
                            const step = 400 / Math.max(1, trendData.length - 1)
                            const x = idx * step
                            return (
                              <g key={idx}>
                                <circle cx={x} cy={100 - ((d.topper || 0) * 0.8 + 10)} r="3" fill="#f59e0b" />
                                <circle cx={x} cy={100 - ((d.class_average || 0) * 0.8 + 10)} r="3" fill="#94a3b8" />
                                <circle cx={x} cy={100 - ((d.personal || 0) * 0.8 + 10)} r="4" fill="#3525cd" className={idx === trendData.length - 1 ? "animate-pulse" : ""} />
                              </g>
                            )
                          })}
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2 font-semibold">
                        <span className="text-[10px] text-on-surface-variant">{trendData[0]?.test_title}</span>
                        <span className="text-[10px] text-on-surface-variant">{trendData[trendData.length - 1]?.test_title}</span>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>

            </section>

          </div>

          {/* Right Column - Actions & Rankings */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full lg:min-h-0">
            
            {/* Quick Actions Grid */}
            <section className="bg-white p-4 rounded-[24px] shadow-sm border border-outline-variant/35 space-y-3 flex-shrink-0">
              <h3 className="font-title-lg text-sm text-on-surface font-bold text-left">Action Items</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Test Performance Action */}
                <div 
                  onClick={() => navigate('/student/results')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="event" className="text-error group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">{testsCount}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Class Tests</p>
                  </div>
                </div>

                {/* Achievements Action */}
                <div 
                  onClick={() => navigate('/student/profile/achievements')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="workspace_premium" className="text-secondary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">Cabinet</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Achievements</p>
                  </div>
                </div>

                {/* Reports Card Action */}
                <div 
                  onClick={() => navigate('/student/reports')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="analytics" className="text-primary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">Report</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Analytics</p>
                  </div>
                </div>

                {/* Calendar Schedule Action */}
                <div
                  onClick={() => navigate('/student/schedule')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="calendar_today" className="text-secondary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">Schedule</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Lectures</p>
                  </div>
                </div>

                {/* Leave Request Action */}
                <div
                  onClick={() => navigate('/student/leave')}
                  className="bg-slate-50 p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer border border-outline-variant/30 flex flex-col items-center justify-center gap-1.5 group text-center active:scale-98"
                >
                  <Icon name="event_busy" className="text-primary group-hover:scale-105 transition-transform text-lg" />
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">Apply</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Leave Request</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance Rankers (Leaderboard) */}
            <section className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col lg:flex-1 lg:min-h-0 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-sm text-on-surface font-bold">Attendance Rankers</h3>
                <span onClick={() => navigate('/student/profile/achievements')} className="text-primary font-bold text-xs hover:underline cursor-pointer">
                  View All
                </span>
              </div>
              
              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0.5 hide-scrollbar space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-4 text-xs text-on-surface-variant font-semibold">
                    No classmates to rank yet
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
                              {isMe ? `${entry.name?.split(' ')[0] || 'You'} (You)` : entry.name}
                            </span>
                          </div>
                          <p className="text-[9px] text-on-surface-variant flex items-center gap-1 font-semibold mt-0.5">
                            <Icon name="local_fire_department" className="text-[10px] text-tertiary" filled />
                            {entry.streak_days} Day Streak
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-on-surface font-numeric-bold">{entry.attendance_pct}%</p>
                        <p className="text-[8px] uppercase font-bold text-on-surface-variant">{entry.total_points} pts</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
