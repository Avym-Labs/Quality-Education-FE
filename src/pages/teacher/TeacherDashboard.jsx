import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [homeworkCount, setHomeworkCount] = useState(0)
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0)
  const [presentCount, setPresentCount] = useState(0)
  const [absentCount, setAbsentCount] = useState(0)
  const [presentCaption, setPresentCaption] = useState('')
  const [activeChart, setActiveChart] = useState('performance')

  const classOptions = user?.assigned_classes || []
  const subjectOptions = user?.subjects || []
  const [performerClass, setPerformerClass] = useState(null)
  const [performerSubject, setPerformerSubject] = useState(null)
  const [topPerformers, setTopPerformers] = useState([])
  const [bottomPerformers, setBottomPerformers] = useState([])

  const [teacherStats, setTeacherStats] = useState(null)

  useEffect(() => {
    if (classOptions.length > 0 && !performerClass) setPerformerClass(classOptions[0])
    if (subjectOptions.length > 0 && !performerSubject) setPerformerSubject(subjectOptions[0])
  }, [user])

  useEffect(() => {
    if (!performerClass || !performerSubject) return
    async function fetchPerformers() {
      try {
        const parts = performerClass.split('-')
        const grade = parts[0]
        const section = parts[1]

        const res = await api.get('/results', {
          params: {
            grade,
            section,
            subject: performerSubject
          }
        })

        if (res.data && res.data.length > 0) {
          const studentScores = {}
          res.data.forEach(r => {
            if (r.student && r.student.full_name) {
              const name = r.student.full_name
              if (!studentScores[name]) {
                studentScores[name] = []
              }
              studentScores[name].push(r.percentage)
            }
          })

          const sortedStudents = Object.keys(studentScores).map(name => {
            const scores = studentScores[name]
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length
            return {
              name,
              score: Math.round(avg * 10) / 10
            }
          }).sort((a, b) => b.score - a.score)

          setTopPerformers(sortedStudents.slice(0, 3))
          setBottomPerformers([...sortedStudents].reverse().slice(0, 3))
        } else {
          setTopPerformers([])
          setBottomPerformers([])
        }
      } catch (err) {
        console.error('Failed to load performance rankings:', err)
        setTopPerformers([])
        setBottomPerformers([])
      }
    }
    fetchPerformers()
  }, [performerClass, performerSubject])

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveChart(prev => prev === 'performance' ? 'attendance' : 'performance')
    }, 10000)
    return () => clearTimeout(timer)
  }, [activeChart])

  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [switchingTo, setSwitchingTo] = useState(null)
  const [switchError, setSwitchError] = useState('')
  const { user: currentUser, switchAccount, addAccount } = useAuth()
  const [savedAccounts, setSavedAccounts] = useState([])

  useEffect(() => {
    if (showSwitchModal) {
      const savedRaw = localStorage.getItem('educore_saved_accounts')
      let savedList = savedRaw ? JSON.parse(savedRaw) : []
      const exists = savedList.some(acc => acc.user_id === currentUser.id)
      
      if (!exists && currentUser) {
        savedList.push({
          user_id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          role: currentUser.role,
          avatar: currentUser.avatar,
          access_token: localStorage.getItem('access_token'),
          refresh_token: localStorage.getItem('refresh_token'),
          user_data: currentUser
        })
        localStorage.setItem('educore_saved_accounts', JSON.stringify(savedList))
      }
      
      setSavedAccounts(savedList.filter(acc => acc.user_id !== currentUser.id))
    }
  }, [showSwitchModal, currentUser])

  const handleSwitchProfile = (targetUserId) => {
    setSwitchError('')
    setSwitchingTo(targetUserId)
    try {
      const switched = switchAccount(targetUserId)
      if (switched) {
        setShowSwitchModal(false)
        navigate(`/${switched.role}/dashboard`, { replace: true })
      } else {
        setSwitchError('Failed to switch account profile.')
      }
    } catch (err) {
      console.error(err)
      setSwitchError('An error occurred during account switch.')
    } finally {
      setSwitchingTo(null)
    }
  }

  const handleAddNewAccount = () => {
    addAccount()
    navigate('/login')
  }

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        // Fetch homework count
        const hwRes = await api.get('/homework')
        if (hwRes.data) {
          setHomeworkCount(hwRes.data.length)
        }

        // Fetch leave count
        if (user?.id) {
          const leaveRes = await api.get('/leave', { params: { user_id: user.id, status: 'pending' } })
          if (leaveRes.data) {
            setPendingLeaveCount(leaveRes.data.length)
          }
        }

        // Fetch real teacher stats (total students, attendance rate, today's
        // schedule, weekly attendance, subject performance, attendance warnings)
        const statsRes = await api.get('/teachers/stats')
        if (statsRes.data) {
          setTeacherStats(statsRes.data)
        }
      } catch (err) {
        console.error('Failed to load teacher stats:', err)
      }
    }
    fetchDashboardStats()
  }, [user])

  // "Present Today" follows the teacher's live timetable: while a
  // ScheduleEvent is currently in session, it shows that class+subject's
  // count; when nothing is scheduled right now, it cycles through the
  // teacher's known class+subject pairs, swapping which one is displayed
  // every 5 seconds. Same stat card throughout — only the bound values change.
  const assignmentPairsRef = useRef([])
  const rotationIndexRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    let intervalId

    async function loadAssignmentPairs() {
      try {
        const res = await api.get('/teacher-assignments/mine')
        if (!cancelled) assignmentPairsRef.current = res.data || []
      } catch (err) {
        console.error('Failed to load teacher assignment pairs:', err)
      }
    }

    async function tick() {
      let target = null
      try {
        const activeRes = await api.get('/schedules/active-now')
        if (activeRes.data) {
          target = { classKey: activeRes.data.grade, subject: activeRes.data.subject }
        }
      } catch (err) {
        // No active period right now — fall through to the rotation below.
      }

      if (!target && assignmentPairsRef.current.length > 0) {
        const pairs = assignmentPairsRef.current
        const idx = rotationIndexRef.current % pairs.length
        rotationIndexRef.current = idx + 1
        target = { classKey: pairs[idx].class_key, subject: pairs[idx].subject }
      }

      if (cancelled) return
      try {
        const params = {}
        if (target) {
          const [grade, section] = target.classKey.split('-')
          params.grade = grade
          params.section = section || ''
          params.subject = target.subject
        }
        const summaryRes = await api.get('/attendance/today-summary', { params })
        if (cancelled) return
        setPresentCount(summaryRes.data.present)
        setAbsentCount(summaryRes.data.absent)
        setPresentCaption(target ? `Class ${target.classKey} · ${target.subject}` : '')
      } catch (err) {
        console.error('Failed to load present-today summary:', err)
      }
    }

    async function start() {
      await loadAssignmentPairs()
      if (cancelled) return
      await tick()
      if (cancelled) return
      intervalId = setInterval(tick, 5000)
    }
    start()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const formatTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    let hrs = d.getHours()
    const mins = d.getMinutes()
    const ampm = hrs >= 12 ? 'PM' : 'AM'
    hrs = hrs % 12
    if (hrs === 0) hrs = 12
    return `${hrs}:${mins.toString().padStart(2, '0')} ${ampm}`
  }

  const todayClasses = (teacherStats?.today_schedule || []).map(e => ({
    time: formatTime(e.start_time),
    grade: e.grade,
    subject: e.subject,
    room: e.room,
  }))
  const subjectPerformance = teacherStats?.subject_performance || []
  const weeklyAttendance = teacherStats?.weekly_attendance || []
  const attendanceWarnings = teacherStats?.attendance_warnings || []

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const getGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs >= 5 && hrs < 12) return 'Good Morning'
    if (hrs >= 12 && hrs < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 mt-stack-md lg:h-[calc(100vh-100px)] lg:overflow-hidden pb-4 text-left">
        
        {/* Welcome Greeting Banner Widget */}
        <section className="bg-gradient-to-br from-[#6351E0] to-[#8F43F2] p-5 rounded-[24px] text-white shadow-lg relative overflow-hidden flex flex-col justify-between select-none animate-fadeIn flex-shrink-0">
          {/* Decorative glowing background circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 z-10 text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Teacher'}! 👋
              </h2>
            </div>
            <button 
              onClick={() => setShowSwitchModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 w-fit border-none cursor-pointer self-start sm:self-center"
            >
              <Icon name="swap_horiz" className="text-sm" />
              <span>Switch Profile</span>
            </button>
          </div>
        </section>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 lg:min-h-0 lg:items-stretch">
          
          {/* Left Column - Main Stats & Graphs */}
          <div className="lg:col-span-8 flex flex-col gap-4 lg:h-full lg:min-h-0">
            
            {/* Stats Bento Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
              {/* Total Students handled */}
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 border-l-4 border-l-[#6351E0] flex flex-col justify-between h-32 cursor-default hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-left">
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-[#e2dfff] flex items-center justify-center text-[#6351E0] shrink-0">
                    <Icon name="groups" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">Total Students</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{teacherStats?.total_students ?? 0}</h3>
                </div>
              </div>

              {/* Present Today */}
              <div 
                onClick={() => navigate('/teacher/attendance')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 border-l-4 border-l-emerald-500 flex flex-col justify-between h-32 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Icon name="check_circle" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">Present Today</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{presentCount}</h3>
                  {presentCaption && (
                    <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wide truncate block mt-0.5">{presentCaption}</span>
                  )}
                </div>
              </div>

              {/* Average Attendance */}
              <div 
                onClick={() => navigate('/teacher/attendance')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 border-l-4 border-l-amber-500 flex flex-col justify-between h-32 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <Icon name="analytics" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">Average Attd.</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{teacherStats?.attendance_rate ?? 0}%</h3>
                </div>
              </div>

              {/* Leave Requests */}
              <div 
                onClick={() => navigate('/teacher/leave')}
                className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/30 border-l-4 border-l-purple-500 flex flex-col justify-between h-32 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2 z-10 w-full">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <Icon name="sick" className="text-base" />
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block truncate">Leave Requests</span>
                </div>
                <div className="mt-auto z-10 w-full">
                  <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{pendingLeaveCount}</h3>
                </div>
              </div>
            </section>

            {/* Consolidated Graphs Carousel */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col justify-between lg:flex-1 lg:min-h-0">
              <div className="flex justify-between items-center gap-2 mb-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold truncate">
                    {activeChart === 'performance' ? 'Class Performance Overview' : 'Weekly Class Attendance'}
                  </h3>
                  <span className="px-2 py-0.5 bg-[#e2dfff] text-[#3323cc] rounded-full text-[9px] font-bold shrink-0">Grade 10-A</span>
                </div>
                <select
                  value={activeChart}
                  onChange={(e) => setActiveChart(e.target.value)}
                  className="w-fit px-2 py-0.5 rounded-lg border border-outline bg-surface-container-low text-[10px] font-bold outline-none focus:border-primary cursor-pointer text-on-surface shrink-0"
                >
                  <option value="performance">Academics Performance</option>
                  <option value="attendance">Weekly Attendance</option>
                </select>
              </div>

              <div className="flex-1 transition-all duration-300 lg:min-h-0">
                {activeChart === 'performance' ? (
                  subjectPerformance.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-semibold">
                      No recorded results yet
                    </div>
                  ) : (
                  <div className="animate-fadeIn h-full flex flex-col justify-between">
                    {/* Custom Bar Graph */}
                    <div className="flex-1 flex items-end gap-4 pb-2 px-2 pt-4 min-h-0">
                      {subjectPerformance.map((s, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group" name={`bar-group-${idx}`}>
                          <div className="relative w-full h-full flex items-end justify-center">
                            <div
                              className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-90 bg-[#6351E0]"
                              style={{ height: `${s.score}%` }}
                            ></div>
                            <span className="absolute -top-7 bg-on-surface text-surface text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10">
                              {s.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider pt-2 border-t border-outline-variant/20">
                      {subjectPerformance.map((s, idx) => (
                        <span key={idx} className="flex-1 text-center truncate">{s.name}</span>
                      ))}
                    </div>
                  </div>
                  )
                ) : (
                  <div className="animate-fadeIn h-full flex flex-col justify-between">
                    {/* Weekly Attendance Bars */}
                    <div className="flex-1 flex items-end gap-4 pb-2 px-2 pt-4 min-h-0">
                      {weeklyAttendance.map((d, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="relative w-full h-full flex items-end justify-center">
                            <div
                              className="w-full max-w-[40px] rounded-t-lg bg-emerald-500 transition-all duration-500 hover:opacity-90"
                              style={{ height: `${d.rate}%` }}
                            ></div>
                            <span className="absolute -top-7 bg-on-surface text-surface text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10">
                              {d.rate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider pt-2 border-t border-outline-variant/20">
                      {weeklyAttendance.map((d, idx) => (
                        <span key={idx} className="flex-1 text-center truncate">{d.day}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Side Schedule, Actions & Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full lg:min-h-0">
            
            {/* Today's Schedule */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col lg:flex-1 lg:min-h-0 space-y-3">
              <h3 className="font-title-lg text-sm text-on-surface font-bold text-left">Today's Class Schedule</h3>
              <div className="space-y-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0.5 hide-scrollbar">
                {todayClasses.length === 0 ? (
                  <div className="text-center py-4 text-xs text-on-surface-variant font-semibold">
                    No classes scheduled today
                  </div>
                ) : todayClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#F2F2F2]/40 border border-outline-variant/20 hover:border-primary/30 transition-all duration-200 shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-[#e2dfff] flex flex-col items-center justify-center font-bold text-primary text-[10px] uppercase shrink-0">
                      <span>{cls.grade}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-xs text-on-surface truncate">{cls.subject}</p>
                      <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">{cls.time} &bull; {cls.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Performance Card (Top & Bottom Performers) */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 space-y-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-sm text-on-surface font-bold text-left">Student Performers</h3>
                {classOptions.length > 0 && subjectOptions.length > 0 && (
                <div className="flex gap-1.5">
                  {/* Class selector */}
                  <select
                    value={performerClass || ''}
                    onChange={(e) => setPerformerClass(e.target.value)}
                    className="px-1.5 py-0.5 rounded border border-outline bg-surface-container-low text-[10px] font-bold outline-none focus:border-primary cursor-pointer text-on-surface"
                  >
                    {classOptions.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  {/* Subject selector */}
                  <select
                    value={performerSubject || ''}
                    onChange={(e) => setPerformerSubject(e.target.value)}
                    className="px-1.5 py-0.5 rounded border border-outline bg-surface-container-low text-[10px] font-bold outline-none focus:border-primary cursor-pointer text-on-surface max-w-[80px]"
                  >
                    {subjectOptions.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                )}
              </div>

              {/* Top 3 & Bottom 3 display */}
              <div className="space-y-3">
                {/* Top Performers Section */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                    <Icon name="trending_up" className="text-[12px] font-variation-settings-fill" />
                    <span>Top 3 Students</span>
                  </div>
                  <div className="space-y-1">
                    {topPerformers.length === 0 && (
                      <div className="text-[10px] text-on-surface-variant font-semibold py-1">No results recorded yet</div>
                    )}
                    {topPerformers.map((student, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-emerald-50/40 rounded-lg border border-emerald-100/30">
                        <span className="font-medium text-on-surface flex items-center gap-1.5 truncate">
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/60 w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{student.name}</span>
                        </span>
                        <span className="font-bold text-emerald-700">{student.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Performers Section */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1 text-rose-600 font-bold text-[10px] uppercase tracking-wider">
                    <Icon name="trending_down" className="text-[12px]" />
                    <span>Bottom 3 Students</span>
                  </div>
                  <div className="space-y-1">
                    {bottomPerformers.length === 0 && (
                      <div className="text-[10px] text-on-surface-variant font-semibold py-1">No results recorded yet</div>
                    )}
                    {bottomPerformers.map((student, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-rose-50/40 rounded-lg border border-rose-100/30">
                        <span className="font-medium text-on-surface flex items-center gap-1.5 truncate">
                          <span className="text-[10px] font-black text-rose-700 bg-rose-100/60 w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{student.name}</span>
                        </span>
                        <span className="font-bold text-rose-700">{student.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Alerts */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-outline-variant/35 flex flex-col lg:flex-1 lg:min-h-0 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-sm text-on-surface font-bold">Low Attendance</h3>
                <span 
                  onClick={() => navigate('/teacher/attendance')}
                  className="text-primary font-bold text-xs cursor-pointer hover:underline"
                >
                  View History
                </span>
              </div>
              <div className="space-y-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0.5 hide-scrollbar">
                {attendanceWarnings.length === 0 ? (
                  <div className="text-center py-4 text-xs text-on-surface-variant font-semibold">
                    No attendance warnings
                  </div>
                ) : attendanceWarnings.map((w, idx) => {
                  const pct = parseFloat(w.rate)
                  const critical = pct < 60
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border ${
                        critical ? 'bg-error-container/10 border-error/15' : 'bg-orange-50 border-orange-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          critical ? 'bg-error-container text-on-error-container' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {w.initials}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-xs text-on-surface">{w.name}</h4>
                          <p className="text-[10px] text-on-surface-variant font-medium">{w.rate} Overall Attendance</p>
                        </div>
                      </div>
                      <div className={`font-bold text-xs uppercase tracking-wider ${critical ? 'text-error' : 'text-orange-500'}`}>
                        {critical ? 'Critical' : 'Warning'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
      {/* Switch Account Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md p-6 shadow-2xl border border-outline-variant/40 animate-scaleIn">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/15 mb-4">
              <h3 className="font-title-lg text-base text-on-surface font-bold flex items-center gap-2">
                <Icon name="swap_horiz" className="text-primary" />
                <span>Switch Profile</span>
              </h3>
              <button 
                onClick={() => setShowSwitchModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-surface-container"
              >
                <Icon name="close" />
              </button>
            </div>

            {switchError && (
              <div className="p-3 bg-error-container rounded-xl text-error text-xs font-semibold mb-3 flex items-center gap-2">
                <Icon name="error" className="text-xs" />
                <span>{switchError}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {savedAccounts.length === 0 ? (
                <div className="text-center py-4 bg-surface-container-low/40 rounded-2xl border border-outline-variant/15 text-xs text-on-surface-variant font-semibold">
                  No other profiles found. You can add an existing account to switch between profiles.
                </div>
              ) : (
                savedAccounts.map(acc => (
                  <div 
                    key={acc.user_id}
                    onClick={() => handleSwitchProfile(acc.user_id)}
                    className="flex items-center gap-4 p-3 rounded-2xl border border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer group"
                  >
                    {acc.avatar ? (
                      <img src={acc.avatar} alt={acc.full_name} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-extrabold uppercase">
                        {acc.full_name?.[0] || 'U'}
                      </div>
                    )}
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{acc.full_name}</h4>
                      <span className="text-[9px] uppercase font-bold text-primary-fixed-dim bg-primary-fixed px-1.5 py-0.5 rounded inline-block mt-0.5">{acc.role}</span>
                      <p className="text-[10px] text-outline font-semibold mt-1">{acc.email}</p>
                    </div>
                    {switchingTo === acc.user_id ? (
                      <Icon name="progress_activity" className="animate-spin text-primary ml-auto text-base" />
                    ) : (
                      <Icon name="chevron_right" className="text-outline ml-auto text-base group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                ))
              )}

              {/* Add Account Button */}
              <button 
                onClick={handleAddNewAccount}
                className="w-full flex items-center justify-center gap-2 mt-4 py-3 border-2 border-dashed border-outline-variant hover:bg-surface-container-low rounded-2xl transition-colors text-xs font-bold text-primary"
              >
                <Icon name="person_add" className="text-sm" />
                <span>Add Existing Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
