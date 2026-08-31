import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function AdminSmsLogs() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All') // All | Sent | Failed

  const loadSmsLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/admin/sms-logs')
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to load SMS logs:', err)
      setError(t('adminSmsLogs.failedToFetch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSmsLogs()
  }, [])

  // Format local browser time to IST
  const formatIST = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateStr
    }
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      log.recipient_name.toLowerCase().includes(searchLower) ||
      log.recipient_phone.toLowerCase().includes(searchLower) ||
      log.content.toLowerCase().includes(searchLower) ||
      log.sender_name.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'All' || log.status === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-24 text-left">
        
        {/* Header bar */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200 border-none bg-transparent cursor-pointer"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                {t('adminSmsLogs.title')}
              </h2>
              <p className="text-on-surface-variant text-xs font-medium mt-0.5">
                {t('adminSmsLogs.subtitle')}
              </p>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={loadSmsLogs}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-outline-variant/30 transition-colors shadow-xs active:scale-95 duration-100 cursor-pointer select-none"
          >
            <Icon name="refresh" className="text-sm" />
            <span>{t('adminSmsLogs.refreshLogs')}</span>
          </button>
        </section>

        {/* Filter Toolbar */}
        <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
            <input
              type="text"
              placeholder={t('adminSmsLogs.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low/30 border border-outline-variant rounded-xl py-2 pl-10 pr-4 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-xs font-semibold"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-bold text-outline shrink-0">{t('adminSmsLogs.status')}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-surface-container-low/30 border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none"
            >
              <option value="All">{t('adminSmsLogs.allLogs')}</option>
              <option value="Sent">{t('adminSmsLogs.sentSuccessfully')}</option>
              <option value="Failed">{t('adminSmsLogs.failedDelivery')}</option>
            </select>
          </div>
        </div>

        {/* Audit Log Stream */}
        {loading ? (
          <div className="py-20 text-center text-outline font-semibold flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span>{t('adminSmsLogs.fetchingLogs')}</span>
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl border border-outline-variant/30 shadow-xs">
            <Icon name="sms_failed" className="text-4xl text-outline" />
            <p className="text-xs text-outline font-bold mt-2">{t('adminSmsLogs.noLogsMatchFilters')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-surface-container-lowest p-4.5 rounded-3xl border border-outline-variant/25 shadow-xs flex flex-col gap-3 hover:border-primary/20 transition-all">
                
                {/* Meta header: Recipient Phone & status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/10 pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-on-surface">{t('adminSmsLogs.to', { name: log.recipient_name })}</span>
                    <span className="text-[10px] text-outline font-medium">({log.recipient_phone})</span>
                    <span className="text-[10px] text-outline">•</span>
                    <span className="text-[10px] text-outline font-semibold">{t('adminSmsLogs.sender', { name: log.sender_name })}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                      log.status === 'sent'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-error border-red-200'
                    }`}>
                      {log.status === 'sent' ? t('adminSmsLogs.sentSuccessfully') : t('adminSmsLogs.failedDelivery')}
                    </span>
                    <span className="text-[9px] text-outline font-bold bg-surface-container-low px-2 py-0.5 rounded-md shadow-xs">
                      {formatIST(log.created_at)}
                    </span>
                  </div>
                </div>

                {/* SMS Body Content */}
                <div className="text-xs leading-relaxed text-left pl-1.5 font-semibold text-on-surface-variant whitespace-pre-wrap">
                  {log.content}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
