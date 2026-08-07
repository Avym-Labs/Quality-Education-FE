import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function StudentProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Decide default tab based on URL path
  const isAchievementsRoute = location.pathname.endsWith('/achievements')
  const [activeTab, setActiveTab] = useState(isAchievementsRoute ? 'achievements' : 'profile')

  const [studentInfo, setStudentInfo] = useState(null)
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [results, setResults] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [leaves, setLeaves] = useState([])
  const [studentStats, setStudentStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProfileData() {
      if (!user?.student_id) {
        setLoading(false)
        return
      }
      try {
        setError('')
        const [studentRes, attStatsRes, attRecRes, resultsRes, hwRes, leavesRes, statsRes] = await Promise.all([
          api.get(`/students/${user.student_id}`),
          api.get(`/attendance/stats/${user.id}`).catch(() => ({ data: null })),
          api.get('/attendance', { params: { student_id: user.id } }).catch(() => ({ data: [] })),
          api.get('/results', { params: { student_id: user.id } }).catch(() => ({ data: [] })),
          api.get('/homework', { params: { grade: user.grade, section: user.section } }).catch(() => ({ data: [] })),
          api.get('/leave', { params: { user_id: user.id } }).catch(() => ({ data: [] })),
          api.get(`/students/${user.student_id}/stats`).catch(() => ({ data: null })),
        ])

        setStudentInfo(studentRes.data)
        setAttendanceStats(attStatsRes.data)
        setAttendanceRecords(attRecRes.data)
        setResults(resultsRes.data)
        setHomeworks(hwRes.data)
        setLeaves(leavesRes.data)
        setStudentStats(statsRes.data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch profile details.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [user])

  // Sync tab state with route changes (e.g., clicking quick action to achievements)
  useEffect(() => {
    const isAch = location.pathname.endsWith('/achievements')
    setActiveTab(isAch ? 'achievements' : 'profile')
  }, [location.pathname])

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    if (tab === 'achievements') {
      navigate('/student/profile/achievements', { replace: true })
    } else {
      navigate('/student/profile', { replace: true })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const attendancePct = attendanceStats?.percentage ?? 0
  const classRank = studentStats?.class_rank
  const classSize = studentStats?.class_size
  const performancePct = statsAveragePercentage()
  const isTopFivePercent = classRank && classSize ? (classRank / classSize) <= 0.05 : false

  function statsAveragePercentage() {
    if (!results || results.length === 0) return 0
    const sum = results.reduce((acc, curr) => acc + (curr.percentage || 0), 0)
    return Math.round(sum / results.length)
  }

  // Real month-wise attendance for the last 4 months (including the current
  // one), derived from already-fetched attendance records — no fabricated
  // Sept/Oct/Nov bars.
  function monthlyAttendance() {
    const now = new Date()
    const months = []
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }) })
    }
    const buckets = Object.fromEntries(months.map(m => [m.key, { present: 0, total: 0 }]))
    attendanceRecords.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (buckets[key]) {
        buckets[key].total += 1
        if (r.status === 'present' || r.status === 'late') buckets[key].present += 1
      }
    })
    return months.map(m => ({
      label: m.label,
      pct: buckets[m.key].total > 0 ? Math.round((buckets[m.key].present / buckets[m.key].total) * 100) : 0
    }))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <DashboardLayout hideTopBar={true}>
      {/* Custom TopAppBar from design */}
      <header className="w-full sticky top-0 bg-surface dark:bg-surface-dim shadow-sm z-40 -mx-container-padding-mobile px-container-padding-mobile">
        <div className="flex items-center justify-between h-16 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Icon
              name="arrow_back"
              className="text-primary cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate('/student/dashboard')}
            />
            <h1 className="font-title-lg text-title-lg text-primary font-bold">Student Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <Icon
              name="logout"
              className="text-primary cursor-pointer active:scale-95 transition-transform"
              onClick={handleLogout}
              title="Logout"
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-stack-md space-y-stack-lg">
        {/* Hero Section: Student Identity */}
        <section className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-center gap-stack-lg">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary/10 shadow-lg">
              {studentInfo?.avatar ? (
                <img src={studentInfo.avatar} alt={studentInfo.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {studentInfo?.first_name?.[0]}{studentInfo?.last_name?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-on-primary p-1 rounded-full border-2 border-surface shadow-md">
              <Icon name="verified" className="text-[16px] block" filled />
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              {studentInfo?.full_name || 'Alex Johnson'}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <span className="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-semibold rounded-full">
                Grade {studentInfo?.grade || '10'}-{studentInfo?.section || 'A'}
              </span>
              <span className="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs font-semibold rounded-full">
                Roll No: {studentInfo?.roll_number || 'N/A'}
              </span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-primary text-on-primary px-6 py-2 rounded-full font-semibold text-sm hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95"
            >
              Print Details
            </button>
          </div>
        </section>

        {/* Bento Grid Performance Stats */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Attendance */}
          <div 
            onClick={() => handleTabClick('attendance')}
            className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:h-32 transition-transform duration-200 cursor-pointer active:scale-95"
          >
            <div className="flex justify-between items-start">
              <Icon name="event_available" className="text-primary" />
              <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                +2% <Icon name="arrow_upward" className="text-[12px]" />
              </span>
            </div>
            <div>
              <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">{attendancePct}%</p>
              <p className="text-xs font-semibold text-on-surface-variant">Attendance</p>
            </div>
          </div>

          {/* Rank */}
          <div 
            onClick={() => handleTabClick('results')}
            className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:h-32 transition-transform duration-200 cursor-pointer active:scale-95"
          >
            <div className="flex justify-between items-start">
              <Icon name="military_tech" className="text-tertiary" />
            </div>
            <div>
              <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">{classRank ? `#${classRank}` : '—'}</p>
              <p className="text-xs font-semibold text-on-surface-variant">Class Rank {classSize ? `of ${classSize}` : ''}</p>
            </div>
          </div>

          {/* Average Marks */}
          <div 
            onClick={() => handleTabClick('results')}
            className="col-span-2 md:col-span-1 bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/20 shadow-sm flex flex-col justify-between md:h-32 transition-transform duration-200 cursor-pointer active:scale-95"
          >
            <div className="flex justify-between items-start">
              <Icon name="analytics" className="text-secondary" />
              <div className="h-1.5 w-24 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${performancePct}%` }}></div>
              </div>
            </div>
            <div>
              <p className="font-numeric-bold text-numeric-bold text-on-surface font-bold">{performancePct}%</p>
              <p className="text-xs font-semibold text-on-surface-variant">Avg. Performance</p>
            </div>
          </div>
        </section>

        {/* Horizontal Tab Navigation */}
        <nav className="flex gap-4 overflow-x-auto no-scrollbar pb-2 border-b border-outline-variant/20">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'results', label: 'Results' },
            { id: 'homework', label: 'Homework' },
            { id: 'leave', label: 'Leave History' },
            { id: 'achievements', label: 'Achievements' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Tab Content Sections */}
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-stack-md">
            {/* Personal Details */}
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                    <Icon name="email" className="text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Email Address</p>
                    <p className="text-sm font-semibold text-on-surface">{studentInfo?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                    <Icon name="phone" className="text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Phone Number</p>
                    <p className="text-sm font-semibold text-on-surface">{studentInfo?.phone || 'N/A'}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Parent Contact */}
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Parent Contact Information</h3>
              <div className="space-y-3">
                {/* Father */}
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="man" className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{studentInfo?.father_name || 'Not provided'}</p>
                      <p className="text-xs text-on-surface-variant">Father</p>
                    </div>
                  </div>
                </div>
                {/* Mother */}
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="woman" className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{studentInfo?.mother_name || 'Not provided'}</p>
                      <p className="text-xs text-on-surface-variant">Mother</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-stack-md">
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-6">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Monthly Attendance</h3>
              <div className="h-48 flex items-end justify-around gap-2 px-4 pt-2">
                {monthlyAttendance().map((m, idx, arr) => (
                  <div key={m.label} className={`w-full bg-primary-container/20 rounded-t-lg relative group h-[85%] ${idx === arr.length - 1 ? 'border-2 border-dashed border-primary' : ''}`}>
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-lg" style={{ height: `${m.pct}%` }}></div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-on-surface-variant">{m.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-12 text-center text-sm font-semibold text-on-surface-variant">
                Current term status: <span className="text-primary font-bold">{attendancePct >= 85 ? 'Excellent' : 'Needs Attention'}</span>
              </p>
            </div>
            
            {/* Logs List */}
            {attendanceRecords.length > 0 && (
              <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Recent Records</h3>
                <div className="space-y-2">
                  {attendanceRecords.slice(0, 10).map((r) => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded-lg">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{r.subject || 'General Class'}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(r.date)}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        r.status === 'present' ? 'bg-green-100 text-green-700' :
                        r.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-stack-md">
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Mid-Term Results</h3>
              {results.length === 0 ? (
                <p className="text-sm text-on-surface-variant font-semibold text-center py-6">No results recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {results.map((res, index) => (
                    <div key={res.id || index} className="flex justify-between items-center py-3 border-b border-outline-variant/10 last:border-b-0">
                      <div>
                        <span className="text-sm font-bold text-on-surface block">{res.subject}</span>
                        <span className="text-xs text-on-surface-variant">{res.test_title} ({res.test_type || 'Test'})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">{res.marks_obtained}/{res.total_marks}</span>
                        <span className="text-xs text-on-surface-variant block">{res.grade_letter} ({res.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Homework Tab */}
        {activeTab === 'homework' && (
          <div className="space-y-stack-md">
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Pending Tasks</h3>
                <span className="bg-error text-on-error text-xs px-2.5 py-1 rounded-full font-bold">
                  {homeworks.length} Active
                </span>
              </div>
              <div className="space-y-4">
                {homeworks.length === 0 ? (
                  <p className="text-sm text-on-surface-variant font-semibold text-center py-6">No homework assigned yet.</p>
                ) : (
                  homeworks.map((hw) => (
                    <div key={hw.id} className="p-4 border border-outline-variant/30 hover:border-primary/20 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-on-surface">{hw.title}</p>
                        <span className="text-[10px] font-bold bg-primary-fixed text-primary px-2 py-0.5 rounded-full uppercase">
                          {hw.subject}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{hw.description}</p>
                      <p className="text-[10px] font-bold text-error bg-error-container/40 inline-block px-2 py-0.5 rounded mt-2">
                        Due: {formatDate(hw.due_date)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leave Tab */}
        {activeTab === 'leave' && (
          <div className="space-y-stack-md">
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Recent Leave Requests</h3>
              {leaves.length === 0 ? (
                <p className="text-sm text-on-surface-variant font-semibold text-center py-6">No leave requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {leaves.map((l) => (
                    <div 
                      key={l.id} 
                      className={`flex items-center justify-between p-4 bg-surface-container-low rounded-lg border-l-4 ${
                        l.status === 'approved' ? 'border-green-500' :
                        l.status === 'rejected' ? 'border-red-500' : 'border-amber-500'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-on-surface">{l.reason}</p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(l.start_date)} - {formatDate(l.end_date)} ({l.status})
                        </p>
                      </div>
                      <Icon
                        name={l.status === 'approved' ? 'check_circle' : l.status === 'rejected' ? 'cancel' : 'pending'}
                        className={
                          l.status === 'approved' ? 'text-green-500' :
                          l.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-stack-md">
            <div className="bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant/20 space-y-4">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Achievement Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Consistency King — only awarded on real sustained attendance */}
                {attendancePct >= 85 && (
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-3 shadow-md">
                      <Icon name="workspace_premium" className="text-on-primary-container text-3xl" />
                    </div>
                    <p className="font-bold text-on-surface">Consistency King</p>
                    <p className="text-xs text-on-surface-variant mt-1">Awarded for {attendancePct}% overall attendance</p>
                  </div>
                )}

                {/* Top Scorer — only awarded on real top-5% class rank */}
                {isTopFivePercent && (
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-tertiary/5 border border-tertiary/10">
                    <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center mb-3 shadow-md">
                      <Icon name="military_tech" className="text-on-tertiary-container text-3xl" />
                    </div>
                    <p className="font-bold text-on-surface">Top Scorer</p>
                    <p className="text-xs text-on-surface-variant mt-1">Ranked #{classRank} of {classSize} in your class ({performancePct}% avg)</p>
                  </div>
                )}

                {attendancePct < 85 && !isTopFivePercent && (
                  <p className="text-sm text-on-surface-variant font-semibold text-center py-6 md:col-span-3">
                    No achievements unlocked yet. Keep up your attendance and test scores!
                  </p>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
