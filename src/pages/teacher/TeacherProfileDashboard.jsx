import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function TeacherProfileDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const qualifications = user?.qualifications || []
  const department = user?.department || 'Department not set'
  const assignedClasses = user?.assigned_classes || []
  const subjects = user?.subjects || []

  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/teachers/stats')
        if (res.data) setStats(res.data)
      } catch (err) {
        console.error('Failed to load teacher profile stats:', err)
      }
    }
    fetchStats()
  }, [])

  const memberSince = stats?.member_since
    ? new Date(stats.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24">
        
        {/* Header Back Button */}
        <section className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Academic Profile
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                Faculty credentials & achievements
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/teacher/settings')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full text-xs font-bold active:scale-95 transition-all border border-outline-variant/35 shadow-sm"
          >
            <Icon name="settings" className="text-[16px]" />
            <span>Settings</span>
          </button>
        </section>

        {/* Profile Card Section */}
        <section className="bg-surface-container-lowest rounded-[28px] p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center md:flex-row md:gap-8 text-center md:text-left">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-fixed ring-4 ring-primary-container/10 bg-surface-container-low flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon name="face" className="text-5xl text-primary/40" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-white shadow-md flex items-center justify-center">
              <Icon name="verified" className="text-[14px]" filled />
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex-1">
            <h3 className="font-headline-lg-mobile text-base text-on-surface font-bold">
              {user?.full_name || 'Teacher'}
            </h3>
            <p className="text-on-surface-variant text-xs font-semibold flex items-center justify-center md:justify-start gap-1 mt-1">
              <Icon name="functions" className="text-primary text-[16px]" />
              <span>{department}</span>
            </p>
          </div>
        </section>

        {/* Assigned Classes */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-title-lg text-xs text-on-surface font-bold">Assigned Classes</h4>
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="text-primary font-bold text-xs hover:underline"
            >
              View Schedule
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {assignedClasses.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-semibold py-2">No classes assigned yet</p>
            ) : assignedClasses.map((cls, idx) => (
              <div
                key={cls}
                onClick={() => navigate('/teacher/attendance/mark')}
                className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl shadow-sm hover:border-primary transition-all cursor-pointer group min-w-[140px]"
              >
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Class {cls}</p>
                <h5 className="font-numeric-bold text-xs font-bold text-on-surface mt-1">
                  {subjects[idx] || subjects[0] || ''}
                </h5>
                <div className="mt-2.5 flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all text-[11px] font-bold">
                  <span>Mark Attendance</span>
                  <Icon name="arrow_forward" className="text-[12px]" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center mb-3">
              <Icon name="groups" className="text-primary text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Students Handled</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.total_students ?? 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-secondary-container/15 flex items-center justify-center mb-3">
              <Icon name="upload_file" className="text-secondary text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Results Uploaded</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.results_uploaded_count ?? 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center mb-3">
              <Icon name="description" className="text-tertiary text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Homeworks Assigned</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.homework_assigned_count ?? 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <Icon name="event_available" className="text-emerald-700 text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Personal Attendance</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.attendance_rate ?? 0}%</p>
            </div>
          </div>
        </section>

        {/* Subject Performance — average score per subject, from results this teacher has personally recorded */}
        <section className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-3xl shadow-sm space-y-3">
          <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Subject Performance</h4>
          {(!stats?.subject_performance || stats.subject_performance.length === 0) ? (
            <p className="text-xs text-on-surface-variant font-semibold py-4 text-center">No results recorded yet</p>
          ) : (
            <div className="flex items-end gap-3 h-24 pt-2">
              {stats.subject_performance.map((s, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-on-surface-variant">{s.score}%</span>
                  <div className="w-full max-w-[36px] bg-primary rounded-t transition-all" style={{ height: `${s.score}%` }}></div>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase truncate">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Academic details panel */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low/40">
            <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Professional Credentials</h4>
          </div>
          <div className="p-5 grid gap-6 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="school" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Academic Qualifications</p>
                <div className="space-y-1 mt-1 text-xs font-semibold text-on-surface">
                  {qualifications.length === 0 ? (
                    <p className="text-on-surface-variant font-semibold">Not provided</p>
                  ) : qualifications.map((q, idx) => (
                    <p key={idx}>{q}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="mail" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Contact Information</p>
                <p className="text-xs font-bold text-on-surface mt-1">{user?.email || 'Not provided'}</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{user?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="history" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Platform Tenure</p>
                <p className="text-xs font-bold text-on-surface mt-1">{memberSince ? `Member since ${memberSince}` : 'Loading...'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="verified_user" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Security Role</p>
                <p className="text-xs font-bold text-on-surface mt-1">Authorized Teacher</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">Full grade management and attendance permissions</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
