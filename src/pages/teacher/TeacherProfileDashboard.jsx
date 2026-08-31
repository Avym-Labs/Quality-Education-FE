import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function TeacherProfileDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const qualifications = user?.qualifications || []
  const department = user?.department || t('teacherProfile.departmentNotSet')
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
                {t('teacherProfile.academicProfile')}
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                {t('teacherProfile.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/teacher/settings')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full text-xs font-bold active:scale-95 transition-all border border-outline-variant/35 shadow-sm"
          >
            <Icon name="settings" className="text-[16px]" />
            <span>{t('teacherProfile.settings')}</span>
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
              {user?.full_name || t('teacherProfile.teacherFallback')}
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
            <h4 className="font-title-lg text-xs text-on-surface font-bold">{t('teacherProfile.assignedClasses')}</h4>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="text-primary font-bold text-xs hover:underline"
            >
              {t('teacherProfile.viewSchedule')}
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {assignedClasses.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-semibold py-2">{t('teacherProfile.noClassesAssignedYet')}</p>
            ) : assignedClasses.map((cls, idx) => (
              <div
                key={cls}
                onClick={() => navigate('/teacher/attendance/mark')}
                className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl shadow-sm hover:border-primary transition-all cursor-pointer group min-w-[140px]"
              >
                <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">{t('teacherProfile.classLabel', { cls })}</p>
                <h5 className="font-numeric-bold text-xs font-bold text-on-surface mt-1">
                  {subjects[idx] || subjects[0] || ''}
                </h5>
                <div className="mt-2.5 flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all text-[11px] font-bold">
                  <span>{t('teacherProfile.markAttendance')}</span>
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
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">{t('teacherProfile.studentsHandled')}</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.total_students ?? 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-secondary-container/15 flex items-center justify-center mb-3">
              <Icon name="upload_file" className="text-secondary text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">{t('teacherProfile.resultsUploaded')}</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.results_uploaded_count ?? 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center mb-3">
              <Icon name="description" className="text-tertiary text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">{t('teacherProfile.homeworksAssigned')}</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.homework_assigned_count ?? 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <Icon name="event_available" className="text-emerald-700 text-lg" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">{t('teacherProfile.personalAttendance')}</p>
              <p className="font-numeric-bold text-xl font-bold text-on-surface mt-0.5">{stats?.attendance_rate ?? 0}%</p>
            </div>
          </div>
        </section>

        {/* Subject Performance — average score per subject, from results this teacher has personally recorded */}
        <section className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-3xl shadow-sm space-y-3">
          <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">{t('teacherProfile.subjectPerformance')}</h4>
          {(!stats?.subject_performance || stats.subject_performance.length === 0) ? (
            <p className="text-xs text-on-surface-variant font-semibold py-4 text-center">{t('teacherProfile.noResultsRecordedYet')}</p>
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
            <h4 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">{t('teacherProfile.professionalCredentials')}</h4>
          </div>
          <div className="p-5 grid gap-6 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="school" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">{t('teacherProfile.academicQualifications')}</p>
                <div className="space-y-1 mt-1 text-xs font-semibold text-on-surface">
                  {qualifications.length === 0 ? (
                    <p className="text-on-surface-variant font-semibold">{t('teacherProfile.notProvided')}</p>
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
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">{t('teacherProfile.contactInformation')}</p>
                <p className="text-xs font-bold text-on-surface mt-1">{user?.email || t('teacherProfile.notProvided')}</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{user?.phone || t('teacherProfile.notProvided')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="history" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">{t('teacherProfile.platformTenure')}</p>
                <p className="text-xs font-bold text-on-surface mt-1">{memberSince ? t('teacherProfile.memberSince', { date: memberSince }) : t('teacherProfile.loading')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                <Icon name="verified_user" className="text-primary" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">{t('teacherProfile.securityRole')}</p>
                <p className="text-xs font-bold text-on-surface mt-1">{t('teacherProfile.authorizedTeacher')}</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{t('teacherProfile.fullGradeManagement')}</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
