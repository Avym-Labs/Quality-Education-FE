import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    total_admins: 0,
    total_teachers: 0,
    total_students: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await api.get('/superadmin/analytics')
        setStats(data)
      } catch (err) {
        setError(t('superAdminDashboard.fetchFailed'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Icon name="progress_activity" className="animate-spin text-primary text-4xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 mt-stack-md lg:h-[calc(100vh-100px)] lg:overflow-hidden pb-4">
        
        {/* Welcome Section */}
        <section className="flex flex-col gap-1 pb-4 border-b border-outline-variant/20">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">{t('superAdminDashboard.suiteTitle')}</h2>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            <Icon name="error" className="text-sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Admins Card */}
          <div 
            onClick={() => navigate('/superadmin/admins')}
            className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.98] duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-fixed text-primary rounded-xl flex items-center justify-center">
                <Icon name="shield" className="text-2xl group-hover:scale-110 transition-transform" />
              </div>
              <Icon name="arrow_forward" className="text-outline group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{t('superAdminDashboard.systemAdministrators')}</p>
            <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats.total_admins}</h3>
          </div>

          {/* Teachers Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center">
                <Icon name="school" className="text-2xl" />
              </div>
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{t('superAdminDashboard.activeTeachers')}</p>
            <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats.total_teachers}</h3>
          </div>

          {/* Students Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-xl flex items-center justify-center">
                <Icon name="group" className="text-2xl" />
              </div>
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{t('superAdminDashboard.registeredStudents')}</p>
            <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats.total_students}</h3>
          </div>

        </section>

        {/* Quick Operations Section */}
        <section className="space-y-stack-sm">
          <h3 className="px-1 text-[11px] font-bold text-primary uppercase tracking-wider">{t('superAdminDashboard.quickActions')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Action 1 */}
            <button 
              onClick={() => navigate('/superadmin/admins')}
              className="flex items-center gap-4 p-4 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 rounded-2xl text-left transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="person_add" className="text-lg" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{t('superAdminDashboard.manageAdministrators')}</p>
                <p className="text-[10px] text-on-surface-variant font-semibold">{t('superAdminDashboard.manageAdministratorsDesc')}</p>
              </div>
              <Icon name="chevron_right" className="text-outline ml-auto group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Action 2 */}
            <button 
              onClick={() => navigate('/superadmin/payments')}
              className="flex items-center gap-4 p-4 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 rounded-2xl text-left transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="credit_card" className="text-lg" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{t('superAdminDashboard.viewPaymentsLedger')}</p>
                <p className="text-[10px] text-on-surface-variant font-semibold">{t('superAdminDashboard.viewPaymentsLedgerDesc')}</p>
              </div>
              <Icon name="chevron_right" className="text-outline ml-auto group-hover:translate-x-1 transition-transform" />
            </button>

          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
