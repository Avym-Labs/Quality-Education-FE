import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function StudentAttendanceDetails() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
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

  const attendancePct = stats?.percentage ?? 0
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

  // Derived client-side from already-fetched records — no extra API call.
  const subjectAttendance = (() => {
    const bySubject = {}
    records.forEach(r => {
      const subject = r.subject && r.subject.trim() ? r.subject : 'General'
      if (!bySubject[subject]) bySubject[subject] = []
      bySubject[subject].push(r)
    })
    return Object.keys(bySubject).map(subject => {
      const recs = bySubject[subject]
      const present = recs.filter(r => r.status === 'present' || r.status === 'late').length
      const pct = recs.length > 0 ? Math.round((present / recs.length) * 1000) / 10 : 0
      return { subject, pct }
    })
  })()

  const monthlyTrend = (() => {
    const byMonth = {}
    records.forEach(r => {
      if (!r.date || r.date.length < 7) return
      const key = r.date.substring(0, 7)
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(r)
    })
    const months = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return Object.keys(byMonth).sort().slice(-6).map(key => {
      const recs = byMonth[key]
      const present = recs.filter(r => r.status === 'present' || r.status === 'late').length
      const pct = recs.length > 0 ? Math.round((present / recs.length) * 1000) / 10 : 0
      const monthNum = parseInt(key.substring(5, 7), 10)
      return { label: months[monthNum] || key, pct }
    })
  })()

  return (
    <DashboardLayout hideTopBar={true}>
      {/* Custom TopAppBar from design */}
      <header className="w-full sticky top-0 bg-surface dark:bg-surface-dim shadow-sm z-40 -mx-container-padding-mobile px-container-padding-mobile">
        <div className="flex items-center justify-between h-16 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Icon
              name="arrow_back"
              className="text-primary cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate('/student/dashboard')}
            />
            <h1 className="font-title-lg text-title-lg text-primary font-bold">{t('studentAttendance.title')}</h1>
          </div>
          <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95">
            <Icon name="more_vert" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-4 space-y-stack-lg">
        
        {/* Key Metrics Row (Bento Grid Inspired) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
          {/* Attendance Percentage */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:bg-surface-container transition-colors duration-300">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">{t('studentAttendance.attendancePercentage')}</span>
            <div className="flex items-end justify-between">
              <span className="font-display-lg text-4xl font-bold text-primary">{attendancePct}%</span>
              <span className="text-success flex items-center text-sm font-bold text-green-600">
                <Icon name="trending_up" className="text-sm" /> 1.2%
              </span>
            </div>
          </div>

          {/* Attendance Score */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:bg-surface-container transition-colors duration-300">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">{t('studentAttendance.attendanceScore')}</span>
            <div className="flex items-end justify-between">
              <span className="font-display-lg text-4xl font-bold text-secondary">{attendanceScore}</span>
              <span className="font-label-md text-sm text-on-surface-variant">{t('studentAttendance.ptsOf1000')}</span>
            </div>
          </div>

          {/* Current Rank */}
          <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 hover:bg-surface-container transition-colors duration-300">
            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">{t('studentDashboard.currentRank')}</span>
            <div className="flex items-end justify-between">
              <span className="font-display-lg text-4xl font-bold text-tertiary">{classRank}</span>
              <span className="font-label-md text-sm text-on-surface-variant">{t('studentAttendance.inGrade', { grade: user?.grade || '10', section: user?.section || 'A' })}</span>
            </div>
          </div>
        </section>

        {/* Status Badges Section */}
        <section className="flex flex-wrap gap-stack-sm items-center">
          <div className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-full flex items-center gap-2 border border-tertiary-container shadow-sm">
            <Icon name="workspace_premium" className="text-lg" filled />
            <span className="font-label-md text-sm font-semibold">{t('studentAttendance.excellentAttendance')}</span>
          </div>
          <div className="bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant shadow-sm">
            <Icon name="military_tech" className="text-lg" filled />
            <span className="font-label-md text-sm font-semibold">{t('studentAttendance.punctualityPro')}</span>
          </div>
          <div className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant shadow-sm opacity-60">
            <Icon name="hotel" className="text-lg" />
            <span className="font-label-md text-sm font-semibold">{t('studentAttendance.perfectMonthGoal')}</span>
          </div>
        </section>

        {/* Visual Analytics Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-stack-lg">
          {/* Monthly Trend Line Chart */}
          <div className="lg:col-span-3 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold">{t('studentAttendance.monthlyAttendanceTrend')}</h2>
              <span className="font-label-md text-sm font-semibold text-primary">{t('studentAttendance.lastNMonths', { count: monthlyTrend.length })}</span>
            </div>
            {monthlyTrend.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-on-surface-variant font-semibold">
                {t('studentAttendance.noAttendanceHistory')}
              </div>
            ) : (
            <div className="h-48 w-full relative flex items-end justify-between px-2 pt-4 group">
              <div className="absolute inset-x-0 bottom-0 h-px bg-outline-variant"></div>
              {monthlyTrend.map((m, idx) => {
                const isLast = idx === monthlyTrend.length - 1
                return (
                  <div
                    key={idx}
                    className={`relative w-8 rounded-t-lg flex flex-col items-center justify-end transition-all duration-300 ${
                      isLast ? 'bg-primary' : 'bg-primary-container/20 hover:bg-primary-container/40'
                    }`}
                    style={{ height: `${Math.max(m.pct, 2)}%` }}
                  >
                    <div className={`w-2 h-2 rounded-full bg-primary mb-[-4px] z-10 ${isLast ? 'ring-4 ring-primary/20' : ''}`}></div>
                    <span className={`absolute -bottom-6 font-label-md text-[10px] font-bold ${isLast ? 'text-primary' : 'text-on-surface-variant'}`}>{m.label}</span>
                  </div>
                )
              })}
            </div>
            )}
          </div>

          {/* Subject-wise Attendance */}
          <div className="lg:col-span-2 bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant shadow-sm space-y-stack-md">
            <h2 className="font-title-lg text-title-lg text-on-surface mb-2 font-bold">{t('studentAttendance.subjectPerformance')}</h2>
            {subjectAttendance.length === 0 ? (
              <div className="text-sm text-on-surface-variant font-semibold py-6 text-center">
                {t('studentAttendance.noAttendanceHistory')}
              </div>
            ) : (
            <div className="space-y-4">
              {subjectAttendance.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{s.subject}</span>
                    <span className="text-primary font-bold">{s.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-primary-fixed rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </section>

        {/* Attendance History Table */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden pb-6">
          <div className="p-stack-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="font-title-lg text-title-lg text-on-surface font-bold">{t('studentAttendance.recentAttendance')}</h2>
            <button
              onClick={() => navigate('/student/attendance/report')}
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer"
            >
              {t('studentAttendance.viewFullReport')} <Icon name="open_in_new" className="text-sm" />
            </button>
          </div>
          <div className="overflow-x-auto">
            {records.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant font-medium">
                {t('studentAttendance.noRecentRecords')}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest">
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant">{t('studentResultReport.dateCol')}</th>
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant">{t('studentAttendance.subjectCol')}</th>
                    <th className="px-6 py-4 font-bold text-sm text-on-surface-variant text-right">{t('studentAttendance.statusCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {records.slice(0, 5).map((r, index) => (
                    <tr key={r.id || index} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold">{formatDate(r.date)}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{r.subject || t('studentAttendance.classSession')}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold border ${
                          r.status === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                          r.status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {r.status === 'present' ? t('common.statusPresent') : r.status === 'late' ? t('common.statusLate') : t('common.statusAbsent')}
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
