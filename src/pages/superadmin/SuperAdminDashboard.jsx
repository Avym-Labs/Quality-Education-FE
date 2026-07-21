import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
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
        setError('Failed to load system-wide analytics.')
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
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 mt-stack-md lg:h-[calc(100vh-100px)] lg:overflow-hidden pb-4">
        
        {/* Welcome Section */}
        <section className="flex flex-col gap-1 pb-4 border-b border-outline-variant/20">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Super Admin Suite</h2>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">error</span>
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
                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">shield</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">System Administrators</p>
            <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats.total_admins}</h3>
          </div>

          {/* Teachers Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Active Teachers</p>
            <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats.total_teachers}</h3>
          </div>

          {/* Students Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Registered Students</p>
            <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats.total_students}</h3>
          </div>

        </section>

        {/* Quick Operations Section */}
        <section className="space-y-stack-sm">
          <h3 className="px-1 text-[11px] font-bold text-primary uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Action 1 */}
            <button 
              onClick={() => navigate('/superadmin/admins')}
              className="flex items-center gap-4 p-4 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 rounded-2xl text-left transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">person_add</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Manage Administrators</p>
                <p className="text-[10px] text-on-surface-variant font-semibold">Create, search, or edit system admin accounts</p>
              </div>
              <span className="material-symbols-outlined text-outline ml-auto group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>

            {/* Action 2 */}
            <button 
              onClick={() => navigate('/superadmin/payments')}
              className="flex items-center gap-4 p-4 bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/30 rounded-2xl text-left transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">credit_card</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">View Payments Ledger</p>
                <p className="text-[10px] text-on-surface-variant font-semibold">Track tuition fees and invoice states</p>
              </div>
              <span className="material-symbols-outlined text-outline ml-auto group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>

          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
