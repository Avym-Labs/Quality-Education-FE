import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'

export default function PaymentsHistory() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true)
        const { data } = await api.get('/superadmin/payments')
        setPayments(data)
      } catch (err) {
        setError(t('paymentsHistory.failedToFetch'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  // Filter Logic
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.student_name.toLowerCase().includes(search.toLowerCase()) ||
                          payment.invoice_number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
            <span>{t('paymentsHistory.paid')}</span>
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>{t('paymentsHistory.pending')}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            <span>{t('paymentsHistory.failed')}</span>
          </span>
        )
    }
  }

  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'card': return `💳 ${t('paymentsHistory.card')}`
      case 'bank_transfer': return `🏦 ${t('paymentsHistory.bankTransfer')}`
      case 'upi': return `📱 ${t('paymentsHistory.upi')}`
      case 'cash': return `💵 ${t('paymentsHistory.cash')}`
      default: return method
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md">
        
        {/* Header */}
        <section className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">{t('paymentsHistory.title')}</h2>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            <Icon name="error" className="text-sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
            <input 
              type="text"
              placeholder={t('paymentsHistory.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface-container-lowest text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant rounded-xl bg-surface-container-lowest text-xs outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">{t('paymentsHistory.allStatuses')}</option>
              <option value="paid">{t('paymentsHistory.paid')}</option>
              <option value="pending">{t('paymentsHistory.pending')}</option>
              <option value="failed">{t('paymentsHistory.failed')}</option>
            </select>
          </div>
        </section>

        {/* Table Ledger */}
        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <Icon name="progress_activity" className="animate-spin text-primary text-3xl" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <Icon name="payments" className="text-outline text-5xl" />
            <p className="text-sm text-on-surface-variant font-semibold mt-2">{t('paymentsHistory.noTransactionsFound')}</p>
          </div>
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25">
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('paymentsHistory.invoice')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('paymentsHistory.student')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('paymentsHistory.amount')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('paymentsHistory.method')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('paymentsHistory.date')}</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">{t('paymentsHistory.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-4 text-xs font-bold text-primary">{payment.invoice_number}</td>
                      <td className="p-4 text-xs text-on-surface font-bold">{payment.student_name}</td>
                      <td className="p-4 text-xs text-on-surface font-bold">₹{payment.amount.toLocaleString()}</td>
                      <td className="p-4 text-xs text-on-surface-variant font-semibold">{formatPaymentMethod(payment.method)}</td>
                      <td className="p-4 text-xs text-outline font-semibold">
                        {new Date(payment.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-xs">{getStatusBadge(payment.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  )
}
