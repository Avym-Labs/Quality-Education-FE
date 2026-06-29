import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'

export default function PaymentsHistory() {
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
        setError('Failed to fetch payment records.')
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
            <span>Paid</span>
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>Pending</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            <span>Failed</span>
          </span>
        )
    }
  }

  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'card': return '💳 Card'
      case 'bank_transfer': return '🏦 Bank Transfer'
      case 'upi': return '📱 UPI'
      case 'cash': return '💵 Cash'
      default: return method
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md">
        
        {/* Header */}
        <section className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Payments Ledger</h2>
            <p className="text-xs text-on-surface-variant font-medium">Track student billing cycles, payments, and transaction history.</p>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container rounded-xl text-error text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              type="text"
              placeholder="Search by student or invoice #..."
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
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </section>

        {/* Table Ledger */}
        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
            <span className="material-symbols-outlined text-outline text-5xl">payments</span>
            <p className="text-sm text-on-surface-variant font-semibold mt-2">No transaction records found</p>
          </div>
        ) : (
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25">
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Invoice</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Student</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Amount</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Method</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Date</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Status</th>
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
