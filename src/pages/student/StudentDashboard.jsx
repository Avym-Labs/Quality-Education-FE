import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    attendance_percentage: 94.2,
    average_score: 85.0,
    total_tests: 8
  })
  const [homeworkCount, setHomeworkCount] = useState(3)
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
        const [statsRes, hwRes] = await Promise.all([
          api.get(`/students/${user.student_id}/stats`),
          api.get('/homework', { params: { grade: user.grade, section: user.section } }),
        ])
        if (statsRes.data) {
          setStats(statsRes.data)
        }
        if (hwRes.data) {
          setHomeworkCount(hwRes.data.length)
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
  const attendance = stats?.attendance_percentage ?? 94.2
  const score = stats?.average_score ?? 85.0
  const testsCount = stats?.total_tests ?? 8
  
  // Custom calculations for gamification matching the premium look
  const attendancePts = Math.round(attendance * 9)
  const streakDays = Math.round(attendance / 8)
  const rank = score >= 90 ? '#1' : score >= 80 ? '#2' : '#3'
  const rankPercentile = score >= 90 ? 'Top 0.5%' : score >= 80 ? 'Top 1%' : 'Top 5%'
  const tier = score >= 90 ? 'Legend Tier' : score >= 80 ? 'Elite Tier' : 'Aspirant Tier'

  const trendData = stats?.performance_trend && stats.performance_trend.length > 0
    ? stats.performance_trend
    : [
        { test_title: 'Test 1', personal: 76, class_average: 70, topper: 90 },
        { test_title: 'Test 2', personal: 82, class_average: 72, topper: 92 },
        { test_title: 'Test 3', personal: 80, class_average: 74, topper: 95 },
        { test_title: 'Test 4', personal: 88, class_average: 75, topper: 96 },
        { test_title: 'Test 5', personal: score, class_average: 77, topper: 98 }
      ]

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
              <span className="material-symbols-outlined text-2xl text-yellow-300 animate-spin" style={{ fontVariationSettings: "'FILL' 1", animationDuration: '3s' }}>stars</span>
              {attendancePts} <span className="text-sm font-bold">pts</span>
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
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {tier}
                </span>
                <span className="text-xs text-white/80 font-semibold">
                  Grade {user?.grade || '10'}-{user?.section || 'A'} • Academic Precision School
                </span>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md cursor-default select-none flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-sm text-yellow-300 animate-spin" style={{ fontVariationSettings: "'FILL' 1", animationDuration: '3s' }}>stars</span>
              <span>{attendancePts} Points</span>
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
                    <span className="material-symbols-outlined text-base">calendar_today</span>
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

              {/* Attendance Score Card */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant flex flex-col justify-between relative overflow-hidden group h-32 text-left animate-fade-in">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-2.5 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-tertiary shrink-0">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">Attendance Score</span>
                </div>
                <div className="flex items-baseline justify-between mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">
                    {attendancePts}<span className="text-xs font-bold text-on-surface-variant ml-0.5">pts</span>
                  </h3>
                  <span className="text-[9px] font-bold text-tertiary bg-tertiary-fixed-dim px-2 py-0.5 rounded shrink-0">
                    Streak: {streakDays}d
                  </span>
                </div>
              </div>

              {/* Current Rank Card */}
              <div 
                onClick={() => navigate('/student/results')}
                className="bg-primary-container p-5 rounded-[24px] shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-all h-32 text-left animate-fade-in"
              >
                <div className="absolute -right-2 -top-2 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                <div className="flex items-center gap-2.5 z-10 w-full text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
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
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex items-end justify-between px-2 gap-3 pt-2 flex-grow min-h-0">
                      <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-primary rounded-t-md transition-all duration-500 hover:opacity-90" style={{ height: '90%' }}></div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Mon</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-primary rounded-t-md transition-all duration-500 hover:opacity-90" style={{ height: '100%' }}></div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Tue</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-[#e2dfff] rounded-t-md transition-all duration-500 hover:opacity-90" style={{ height: '20%' }}></div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Wed</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-primary rounded-t-md transition-all duration-500 hover:opacity-90" style={{ height: '85%' }}></div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Thu</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                        <div className="w-full max-w-[32px] bg-primary rounded-t-md transition-all duration-500 hover:opacity-90" style={{ height: '95%' }}></div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Fri</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Trend Chart */}
              <div className={`bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex-col justify-between lg:min-h-0 ${activeChart === 'performance' ? 'flex' : 'hidden'} lg:flex`}>
                <div className="flex justify-between items-center gap-2 mb-2 w-full">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold truncate pr-1">Performance Trend</h3>
                </div>

                <div className="flex-1 transition-all duration-300 lg:min-h-0">
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
                        <span className="text-[10px] text-on-surface-variant">{trendData[0]?.test_title || 'Test 1'}</span>
                        <span className="text-[10px] text-on-surface-variant">{trendData[trendData.length - 1]?.test_title || 'Latest'}</span>
                      </div>
                    </div>
                  </div>
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
                  <span className="material-symbols-outlined text-error group-hover:scale-105 transition-transform text-lg">
                    event
                  </span>
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
                  <span className="material-symbols-outlined text-secondary group-hover:scale-105 transition-transform text-lg">
                    workspace_premium
                  </span>
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
                  <span className="material-symbols-outlined text-primary group-hover:scale-105 transition-transform text-lg">
                    analytics
                  </span>
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
                  <span className="material-symbols-outlined text-secondary group-hover:scale-105 transition-transform text-lg">
                    calendar_today
                  </span>
                  <div>
                    <p className="font-numeric-bold text-xs text-on-surface font-bold leading-none">Schedule</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Lectures</p>
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
                {/* Rank 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img 
                        alt="Sara M." 
                        className="w-10 h-10 rounded-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwllW5K6RZn9ox5hHeLicw2iz0mhux5XyX2KhoVvq9h672Rdj-y4RYUk3uKyCUl4tHZHP1nQfvpce9IyKhcYBBTH5nHJbzrlM9ybpGrJu0QwvGVGQ6IC3oM1t1EJeg8VEugBS4QpeM_2A1CVhmdgLORNG9-y7pKKqPbHG9YwYKH2cRZuBBRHS7w5wugEW3oyvqQrwmhY0ZsTkB-hA8atxzFJzh-epZAGtVRW-qQrLx4LCC7AafdRKqkCcx3G5yKlPCHHPJteSJPCU"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border border-white flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white font-numeric-bold">1</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-on-surface">Sara M.</p>
                      <p className="text-[9px] text-on-surface-variant flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[10px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_fire_department
                        </span>
                        24 Day Streak
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-on-surface font-numeric-bold">99.8%</p>
                    <p className="text-[8px] uppercase font-bold text-on-surface-variant">1,240 pts</p>
                  </div>
                </div>

                {/* Rank 2 (User) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary-fixed/20 hover:bg-primary-fixed/30 transition-colors border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.full_name} className="w-10 h-10 rounded-full object-cover border border-primary" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-fixed border border-primary flex items-center justify-center">
                          <span className="text-primary font-bold text-xs">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-400 rounded-full border border-white flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white font-numeric-bold">2</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface">{user?.full_name?.split(' ')[0] || 'Arjun'} (You)</span>
                        <span className="bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black shrink-0 leading-none">
                          Rising
                        </span>
                      </div>
                      <p className="text-[9px] text-on-surface-variant flex items-center gap-1 font-semibold mt-0.5">
                        <span className="material-symbols-outlined text-[10px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_fire_department
                        </span>
                        {streakDays} Day Streak
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-on-surface font-numeric-bold">{attendance}%</p>
                    <p className="text-[8px] uppercase font-bold text-on-surface-variant">{attendancePts} pts</p>
                  </div>
                </div>

                {/* Rank 3 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img 
                        alt="Leo K." 
                        className="w-10 h-10 rounded-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTQvIo_mCoQh0zhKOauSP-pWWnkDK-t4UAaPM0uT6i5SSucEzuww9McfEvpAfANzK3-J3dR2PV6NAIYJtqYryA0llODiaiHBHaRxtffhA4rVC9kYpe8sL_Sinc19ERGUQPkqLoTzou1lwvueB3eDUY86CeAq3tPYsreYuD9UDDipPKDXjFa-DB9IrzAq0T8e17FBgWso3JLK7UCWfGUmu2JfngsO3j2Jf_980jBAKJmA172BiogZLuo90mIm8Bvmxq3XuOrB0zT9c"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full border border-white flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white font-numeric-bold">3</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-on-surface">Leo K.</p>
                      <p className="text-[9px] text-on-surface-variant flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[10px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_fire_department
                        </span>
                        8 Day Streak
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-on-surface font-numeric-bold">92.1%</p>
                    <p className="text-[8px] uppercase font-bold text-on-surface-variant">720 pts</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
