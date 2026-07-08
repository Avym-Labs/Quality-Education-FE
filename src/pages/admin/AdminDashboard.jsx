import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Analytics Filter States
  const [analyticsType, setAnalyticsType] = useState('overall')
  const [classId, setClassId] = useState('10-A')
  const [teacherId, setTeacherId] = useState('')
  const [teacherOptions, setTeacherOptions] = useState([])
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
    loadTeachers()
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
        setError('Failed to fetch analytics data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [analyticsType, classId, teacherId])

  // Map analytics values from backend response (with design mockups as defaults)
  const totalStudents = analyticsData?.total_students ?? 1240
  const totalTeachers = analyticsData?.total_teachers ?? 86
  const attendanceRate = analyticsData?.attendance_rate ?? '94.2'
  const avgResults = analyticsData?.avg_results ?? '78.4'
  const subjectPerformance = analyticsData?.subject_performance ?? [
    { name: 'Mathematics', score: 82 },
    { name: 'Science', score: 76 },
    { name: 'History', score: 68 },
    { name: 'Literature', score: 89 }
  ]
  const attendanceTrend = analyticsData?.attendance_trend ?? [
    { month: 'Jan', rate: 85.0 },
    { month: 'Feb', rate: 92.0 },
    { month: 'Mar', rate: 78.0 },
    { month: 'Apr', rate: 94.0 },
    { month: 'May', rate: 88.0 },
    { month: 'Jun', rate: 94.2 }
  ]
  const gradeTrend = analyticsData?.grade_trend ?? [
    { label: 'Midterm 1', score: 74 },
    { label: 'Semester 1', score: 77 },
    { label: 'Midterm 2', score: 78.4 }
  ]
  const sectionComparison = analyticsData?.section_comparison ?? [
    { section: 'Sec A', grade10: 80, grade11: 75 },
    { section: 'Sec B', grade10: 70, grade11: 78 },
    { section: 'Sec C', grade10: 85, grade11: 65 }
  ]
  const facultySpotlight = analyticsData?.faculty_spotlight ?? [
    {
      name: 'Dr. Julian Scott',
      department: 'Mathematics',
      rating: '4.9',
      success: '92%',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAAZlPTMAy2a8AxS6zYKIPQ_zDC6-ViPa3H6fKzXWKnzGsIOhDmF3UrmpNh3M7-6JKoANp6ZSmp5gHg4Ny-V3etrqutkjbWxj-F7iwGQH0i4S8_rCeoFAo6hLNd-sUrXQ3x8RPMpdUW8hCLRXcy1yb3h1lOPB07sYGMQuD7UGpXZh_nJyInkkEleBiFdZzZsYs5eEEGzxrVQcR3k4BwCUojOZBeitBxOR4Mk6DtE5uEi6GD_kDt75Zqh3hpzk4vxE6PDZQfgSpndc'
    },
    {
      name: 'Prof. Alice Murray',
      department: 'Literature',
      rating: '4.8',
      success: '88%',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJkEuQKA0Va3ZMLFRegDGBUEMP-Pj-ApY1K1NS4-nbKlvEOSThn1jyauz_eJTEJeQEkRg7maylTqekDH4vWCDZ10NQV2-vWuAskkzf8qDSZup2jSHinDjdjkui-lbo0PurZkYNZ1fpgUDxPmVDBsjclKh9lXlREox1jSK5y2NtjKI3VqJwvngKxp4FBN1Uzo3j-_64kWJhKsbUI4ElfxsGw8sdcdBJ78r5cp-MwdQxrs7BdQ9zsQp9WXEnY1GhsAN9qyC6YXd3u8'
    }
  ]
  const highPerformers = analyticsData?.high_performers ?? [
    { name: 'Liam Wilson', grade: '12th Grade', section: 'Sec A', gpa: '3.98 GPA', initials: 'LW', bg: 'bg-green-100 text-green-700' },
    { name: 'Emma Smith', grade: '11th Grade', section: 'Sec B', gpa: '3.95 GPA', initials: 'ES', bg: 'bg-blue-100 text-blue-700' }
  ]
  const attendanceWarnings = analyticsData?.attendance_warnings ?? [
    { name: 'Ryan Baker', grade: '10th Grade', section: 'Sec C', rate: '62%', initials: 'RB' },
    { name: 'Mia Park', grade: '12th Grade', section: 'Sec A', rate: '71%', initials: 'MP' }
  ]

  return (
    <DashboardLayout hideTopBar={false}>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
        {/* Dashboard Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
              Administrative Dashboard
            </h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              Real-time institutional performance analytics
            </p>
          </div>

          {/* Scope Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Scope:</span>
              <select
                value={analyticsType}
                onChange={(e) => {
                  setAnalyticsType(e.target.value)
                  if (e.target.value === 'class') setClassId('10-A')
                  if (e.target.value === 'teacher' && teacherOptions.length > 0) setTeacherId(teacherOptions[0].id)
                }}
                className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:ring-0 outline-none"
              >
                <option value="overall">Overall</option>
                <option value="class">Class Wise</option>
                <option value="teacher">Teacher Wise</option>
              </select>
            </div>

            {analyticsType === 'class' && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Class:</span>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:ring-0 outline-none"
                >
                  <option value="9-A">9-A</option>
                  <option value="9-B">9-B</option>
                  <option value="10-A">10-A</option>
                  <option value="10-B">10-B</option>
                  <option value="11-A">11-A</option>
                  <option value="11-B">11-B</option>
                  <option value="12-A">12-A</option>
                  <option value="12-B">12-B</option>
                </select>
              </div>
            )}

            {analyticsType === 'teacher' && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Teacher:</span>
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
            <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {/* Total Students */}
              <div 
                onClick={() => navigate('/admin/students')}
                className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
              >
                <span className="material-symbols-outlined text-primary text-3xl">groups</span>
                <div>
                  <div className="font-numeric-bold text-headline-lg text-on-surface font-bold">{totalStudents.toLocaleString()}</div>
                  <div className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Students</div>
                </div>
              </div>

              {/* Total Teachers */}
              <div 
                onClick={() => navigate('/admin/teachers')}
                className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
              >
                <span className="material-symbols-outlined text-secondary text-3xl">person_celebrate</span>
                <div>
                  <div className="font-numeric-bold text-headline-lg text-on-surface font-bold">{totalTeachers}</div>
                  <div className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Teachers</div>
                </div>
              </div>

              {/* Attendance Rate */}
              <div 
                onClick={() => navigate('/admin/reports')}
                className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
              >
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-error text-3xl">how_to_reg</span>
                  <div className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold gap-0.5 print:hidden">
                    <span className="material-symbols-outlined text-[12px]">trending_up</span>
                    2.1%
                  </div>
                </div>
                <div>
                  <div className="font-numeric-bold text-headline-lg text-on-surface font-bold">{attendanceRate}%</div>
                  <div className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Attendance Rate</div>
                </div>
              </div>

              {/* Avg. Results */}
              <div 
                onClick={() => navigate('/admin/reports')}
                className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-pointer hover:bg-surface-container-low transition-colors duration-200"
              >
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-tertiary text-3xl">insights</span>
                  <div className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold gap-0.5 print:hidden">
                    <span className="material-symbols-outlined text-[12px]">trending_up</span>
                    1.5%
                  </div>
                </div>
                <div>
                  <div className="font-numeric-bold text-headline-lg text-on-surface font-bold">{avgResults}%</div>
                  <div className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Avg. Results</div>
                </div>
              </div>
            </section>

            {/* Quick Audit Action Panel */}
            <section className="flex flex-wrap gap-3 mt-1 justify-start">
              <button 
                type="button"
                onClick={() => navigate('/admin/chat-logs')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>Audit Chat Logs</span>
              </button>
              <button 
                type="button"
                onClick={() => navigate('/admin/sms-logs')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:bg-opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">sms</span>
                <span>Audit SMS Logs</span>
              </button>
              <button 
                type="button"
                onClick={() => navigate('/admin/announcements')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-outline-variant/30 transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">campaign</span>
                <span>Send Notice Announcement</span>
              </button>
              <button 
                type="button"
                onClick={() => navigate('/admin/schedule')}
                className="flex items-center gap-2 px-4.5 py-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-outline-variant/30 transition-all active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span>Manage Class Schedules</span>
              </button>
            </section>

            {/* Main Analytics Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
              
              {/* Left: Charting Sections (Column 1-8) */}
              <div className="lg:col-span-8 flex flex-col gap-stack-lg">
                
                {/* Trend Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  
                  {/* Attendance Trend */}
                  <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 h-[320px] flex flex-col justify-between">
                    <h3 className="font-title-lg text-title-lg flex items-center gap-2 text-on-surface font-bold">
                      <span className="material-symbols-outlined text-primary">calendar_month</span>
                      Attendance Trend
                    </h3>
                    <div className="flex-1 flex items-end gap-3 pb-2 px-2 pt-6">
                      {attendanceTrend.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-500 hover:opacity-90 ${
                              idx === attendanceTrend.length - 1 ? 'bg-primary' : 'bg-primary-fixed-dim'
                            }`}
                            style={{ height: `${item.rate}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider pt-2 border-t border-outline-variant/20">
                      {attendanceTrend.map((item, idx) => (
                        <span key={idx} className="w-8 text-center">{item.month}</span>
                      ))}
                    </div>
                  </div>

                  {/* Academic Grade Trend */}
                  <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 h-[320px] flex flex-col justify-between">
                    <h3 className="font-title-lg text-title-lg flex items-center gap-2 text-on-surface font-bold">
                      <span className="material-symbols-outlined text-secondary">show_chart</span>
                      Academic Grade Trend
                    </h3>
                    <div className="flex-1 relative flex items-center justify-center min-h-[160px] my-2">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                        <path d="M0,160 Q100,135 200,110 T400,75" fill="none" stroke="#4648d4" strokeWidth="4" strokeLinecap="round"></path>
                        <circle cx="0" cy="160" fill="#4648d4" r="5"></circle>
                        <circle cx="200" cy="110" fill="#4648d4" r="5"></circle>
                        <circle className="animate-pulse" cx="400" cy="75" fill="#4648d4" r="7"></circle>
                      </svg>
                      <div className="absolute inset-0 flex justify-between items-end opacity-5 pointer-events-none">
                        <div className="w-px h-full bg-outline"></div>
                        <div className="w-px h-full bg-outline"></div>
                        <div className="w-px h-full bg-outline"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider pt-2 border-t border-outline-variant/20">
                      {gradeTrend.map((item, idx) => (
                        <span key={idx}>{item.label}</span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Comparison Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  
                  {/* Subject-wise */}
                  <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                    <h3 className="font-title-lg text-title-lg mb-4 flex items-center gap-2 text-on-surface font-bold">
                      <span className="material-symbols-outlined text-tertiary">bar_chart</span>
                      Subject Performance
                    </h3>
                    <div className="flex flex-col gap-4">
                      {subjectPerformance.map((subj, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-on-surface">{subj.name}</span>
                            <span className="text-primary">{subj.score}%</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-700 ease-out" 
                              style={{ width: `${subj.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section-wise */}
                  <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                    <h3 className="font-title-lg text-title-lg mb-4 flex items-center gap-2 text-on-surface font-bold">
                      <span className="material-symbols-outlined text-secondary">leaderboard</span>
                      Section Comparison
                    </h3>
                    <div className="flex items-end justify-around h-32 pt-4">
                      {/* Sec A */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1.5 items-end">
                          <div className="w-4 bg-primary h-24 rounded-t-md hover:opacity-90 transition-opacity" title="Grade 10: 80%"></div>
                          <div className="w-4 bg-secondary h-20 rounded-t-md hover:opacity-90 transition-opacity" title="Grade 11: 75%"></div>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Sec A</span>
                      </div>
                      
                      {/* Sec B */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1.5 items-end">
                          <div className="w-4 bg-primary h-20 rounded-t-md hover:opacity-90 transition-opacity" title="Grade 10: 70%"></div>
                          <div className="w-4 bg-secondary h-22 rounded-t-md hover:opacity-90 transition-opacity" title="Grade 11: 78%"></div>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Sec B</span>
                      </div>

                      {/* Sec C */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1.5 items-end">
                          <div className="w-4 bg-primary h-26 rounded-t-md hover:opacity-90 transition-opacity" title="Grade 10: 85%"></div>
                          <div className="w-4 bg-secondary h-16 rounded-t-md hover:opacity-90 transition-opacity" title="Grade 11: 65%"></div>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant">Sec C</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                        <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div> Grade 10
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant">
                        <div className="w-2.5 h-2.5 bg-secondary rounded-sm"></div> Grade 11
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right: Lists & Spotlight (Column 9-12) */}
              <div className="lg:col-span-4 flex flex-col gap-stack-lg">
                
                {/* Faculty Spotlight Card */}
                <div className="bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden">
                  <div className="p-stack-md bg-surface-container-low border-b border-outline-variant/20">
                    <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Faculty Spotlight</h3>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {facultySpotlight.map((fac, idx) => (
                      <div key={idx} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors duration-200">
                        <img 
                          alt={fac.name} 
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                          src={fac.avatar}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface truncate text-sm">{fac.name}</p>
                          <p className="text-[11px] text-on-surface-variant font-medium">{fac.department} • {fac.rating} Rating</p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-bold text-sm">{fac.success}</p>
                          <p className="text-[9px] uppercase font-bold text-on-surface-variant">Success</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students Spotlight */}
                <div className="bg-surface-container-lowest rounded-[24px] shadow-sm border border-outline-variant/30 overflow-hidden">
                  <div className="p-stack-md bg-surface-container-low border-b border-outline-variant/20">
                    <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Student Spotlight</h3>
                  </div>
                  <div className="p-stack-md">
                    
                    {/* High Performers */}
                    <p className="text-[10px] font-bold text-on-surface-variant mb-3 uppercase tracking-wider">High Performers</p>
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

                    {/* Attendance Warnings */}
                    <p className="text-[10px] font-bold text-on-surface-variant mt-6 mb-3 uppercase tracking-wider">Attendance Alerts</p>
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
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </DashboardLayout>
  )
}
