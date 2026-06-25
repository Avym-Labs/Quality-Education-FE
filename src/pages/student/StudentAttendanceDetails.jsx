import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function StudentAttendanceDetails() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 94.2
  })
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAttendanceData() {
      if (!user?.id) return
      try {
        const [statsRes, recordsRes] = await Promise.all([
          api.get(`/attendance/stats/${user.id}`),
          api.get('/attendance', { params: { student_id: user.id } })
        ])
        if (statsRes.data) {
          setStats(statsRes.data)
        }
        if (recordsRes.data) {
          setRecords(recordsRes.data)
        }
      } catch (err) {
        console.error('Failed to load attendance tracker data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendanceData()
  }, [user])

  const attendancePct = stats?.percentage ?? 94.2
  const attendanceScore = Math.round(attendancePct * 9)
  const classRank = attendancePct >= 95 ? '#1' : attendancePct >= 90 ? '#2' : '#3'

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
          <div className="flex items-center gap-3">
            <span 
              className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform" 
              onClick={() => navigate('/student/dashboard')}
            >
              arrow_back
            </span>
            <h1 className="font-title-lg text-title-lg text-primary font-bold">Attendance Tracker</h1>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95">
            more_vert
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-4 space-y-stack-lg">
        
        {/* Key Metrics Row (Bento Grid Inspired) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
          {/* Attendance Percentage */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:bg-surface-container transition-colors duration-300">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Attendance Percentage</span>
            <div className="flex items-end justify-between">
              <span className="font-display-lg text-4xl font-bold text-primary">{attendancePct}%</span>
              <span className="text-success flex items-center text-sm font-bold text-green-600">
                <span className="material-symbols-outlined text-sm">trending_up</span> 1.2%
              </span>
            </div>
          </div>

          {/* Attendance Score */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:bg-surface-container transition-colors duration-300">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Attendance Score</span>
            <div className="flex items-end justify-between">
              <span className="font-display-lg text-4xl font-bold text-secondary">{attendanceScore}</span>
              <span className="font-label-md text-sm text-on-surface-variant">/ 1000 pts</span>
            </div>
          </div>

          {/* Current Rank */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:bg-surface-container transition-colors duration-300">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Current Rank</span>
            <div className="flex items-end justify-between">
              <span className="font-display-lg text-4xl font-bold text-tertiary">{classRank}</span>
              <span className="font-label-md text-sm text-on-surface-variant">in Grade {user?.grade || '10'}-{user?.section || 'A'}</span>
            </div>
          </div>
        </section>

        {/* Status Badges Section */}
        <section className="flex flex-wrap gap-stack-sm items-center">
          <div className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-full flex items-center gap-2 border border-tertiary-container shadow-sm">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <span className="font-label-md text-sm font-semibold">Excellent Attendance</span>
          </div>
          <div className="bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant shadow-sm">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              military_tech
            </span>
            <span className="font-label-md text-sm font-semibold">Punctuality Pro</span>
          </div>
          <div className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant shadow-sm opacity-60">
            <span className="material-symbols-outlined text-lg">hotel</span>
            <span className="font-label-md text-sm font-semibold">Perfect Month Goal</span>
          </div>
        </section>

        {/* Visual Analytics Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-stack-lg">
          {/* Monthly Trend Line Chart */}
          <div className="lg:col-span-3 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Monthly Attendance Trend</h2>
              <span className="font-label-md text-sm font-semibold text-primary">Last 6 Months</span>
            </div>
            <div className="h-48 w-full relative flex items-end justify-between px-2 pt-4 group">
              <div className="absolute inset-x-0 bottom-0 h-px bg-outline-variant"></div>
              
              <div className="relative w-8 bg-primary-container/20 rounded-t-lg h-[80%] flex flex-col items-center justify-end hover:bg-primary-container/40 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-primary mb-[-4px] z-10"></div>
                <span className="absolute -bottom-6 font-label-md text-[10px] text-on-surface-variant font-bold">SEP</span>
              </div>
              <div className="relative w-8 bg-primary-container/20 rounded-t-lg h-[85%] flex flex-col items-center justify-end hover:bg-primary-container/40 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-primary mb-[-4px] z-10"></div>
                <span className="absolute -bottom-6 font-label-md text-[10px] text-on-surface-variant font-bold">OCT</span>
              </div>
              <div className="relative w-8 bg-primary-container/40 rounded-t-lg h-[92%] flex flex-col items-center justify-end hover:bg-primary-container/60 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-primary mb-[-4px] z-10"></div>
                <span className="absolute -bottom-6 font-label-md text-[10px] text-on-surface-variant font-bold">NOV</span>
              </div>
              <div className="relative w-8 bg-primary-container/20 rounded-t-lg h-[75%] flex flex-col items-center justify-end hover:bg-primary-container/40 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-primary mb-[-4px] z-10"></div>
                <span className="absolute -bottom-6 font-label-md text-[10px] text-on-surface-variant font-bold">DEC</span>
              </div>
              <div className="relative w-8 bg-primary-container/20 rounded-t-lg h-[88%] flex flex-col items-center justify-end hover:bg-primary-container/40 transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-primary mb-[-4px] z-10"></div>
                <span className="absolute -bottom-6 font-label-md text-[10px] text-on-surface-variant font-bold">JAN</span>
              </div>
              <div className="relative w-8 bg-primary rounded-t-lg h-[94%] flex flex-col items-center justify-end transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-primary mb-[-4px] z-10 ring-4 ring-primary/20"></div>
                <span className="absolute -bottom-6 font-label-md text-[10px] text-primary font-bold">FEB</span>
              </div>
            </div>
          </div>

          {/* Subject-wise Attendance */}
          <div className="lg:col-span-2 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant shadow-sm space-y-stack-md">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-2 font-bold">Subject Performance</h2>
            <div className="space-y-4">
              {/* Mathematics */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Mathematics</span>
                  <span className="text-primary font-bold">98%</span>
                </div>
                <div className="h-2 w-full bg-primary-fixed rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>

              {/* Physics */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Physics</span>
                  <span className="text-primary font-bold">92%</span>
                </div>
                <div className="h-2 w-full bg-primary-fixed rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              {/* Chemistry */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Chemistry</span>
                  <span className="text-primary font-bold">85%</span>
                </div>
                <div className="h-2 w-full bg-primary-fixed rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              {/* English */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>English Literature</span>
                  <span className="text-primary font-bold">95%</span>
                </div>
                <div className="h-2 w-full bg-primary-fixed rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attendance History Table */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden pb-6">
          <div className="p-stack-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="font-title-lg text-title-lg text-on-surface font-bold">Recent Attendance</h2>
            <button 
              onClick={() => navigate('/student/attendance/report')}
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer"
            >
              View Full Report <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            {records.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-medium">
                No recent attendance records found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest">
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant">Date</th>
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant">Subject</th>
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant">Period</th>
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {records.slice(0, 5).map((r, index) => (
                    <tr key={r.id || index} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold">{formatDate(r.date)}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{r.subject || 'Class Session'}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">Period {index + 1}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold border ${
                          r.status === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                          r.status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
