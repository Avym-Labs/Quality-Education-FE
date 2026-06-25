import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function StudentAttendanceReport() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({ percentage: 94.2 })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReportData() {
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
        console.error('Failed to load report data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [user])

  const attendancePct = stats?.percentage ?? 94.2
  const rating = attendancePct >= 90 ? 'Excellent Rating' : attendancePct >= 75 ? 'Satisfactory' : 'Needs Review'

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const filteredRecords = records.filter((r) => {
    const matchesSearch = (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.date || '').includes(searchQuery)
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout hideTopBar={true}>
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm w-full sticky top-0 z-40 -mx-container-padding-mobile px-container-padding-mobile">
        <div className="flex items-center justify-between h-16 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <span 
              className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate('/student/attendance')}
            >
              arrow_back
            </span>
            <h1 className="font-title-lg text-title-lg text-primary font-bold">Reports Center</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-4 space-y-stack-lg">
        
        {/* Student Profile Premium Card */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-1 ring-outline-variant">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
                  {user?.full_name}
                </h2>
                <span className="bg-primary-container/10 text-primary px-3 py-1 rounded-full font-semibold text-xs">
                  {rating}
                </span>
              </div>
              <p className="text-on-surface-variant font-medium text-sm flex items-center gap-2">
                <span className="font-bold">Roll No: {user?.roll_number}</span> • Grade {user?.grade}-{user?.section}
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <span className="text-outline text-[10px] uppercase tracking-wider font-bold">Attendance Score</span>
                  <span className="text-primary font-bold text-lg">{attendancePct}%</span>
                </div>
                <div className="w-[1px] bg-outline-variant h-8 self-center"></div>
                <div className="flex flex-col">
                  <span className="text-outline text-[10px] uppercase tracking-wider font-bold">Academic Year</span>
                  <span className="text-on-surface-variant font-semibold text-sm">2026-27</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="bg-primary text-on-primary px-6 py-3 rounded-full font-semibold text-sm hover:shadow-lg transition-shadow flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">download</span> Export Report
              </button>
            </div>
          </div>
        </section>

        {/* Filter Panel and Grid list */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Attendance Log</h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'present', 'absent', 'late'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                    filterStatus === status
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
              placeholder="Filter by subject or date (YYYY-MM-DD)..." 
              type="text"
            />
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-3 font-bold text-xs text-on-surface-variant">Date</th>
                  <th className="px-6 py-3 font-bold text-xs text-on-surface-variant">Subject</th>
                  <th className="px-6 py-3 font-bold text-xs text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-on-surface-variant">Loading records...</td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-on-surface-variant">No matching records found.</td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => (
                    <tr key={r.id || index} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold">{formatDate(r.date)}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{r.subject || 'Class Session'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${
                          r.status === 'present' ? 'bg-green-500/10 text-green-700 border-green-200' :
                          r.status === 'late' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-200' :
                          'bg-red-500/10 text-red-700 border-red-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
