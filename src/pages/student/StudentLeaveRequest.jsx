import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function StudentLeaveRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [leaveMode, setLeaveMode] = useState('full') // full | single

  // Form fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [reason, setReason] = useState('')

  const [leaveHistory, setLeaveHistory] = useState([])
  const [filterStatus, setFilterStatus] = useState('all') // all | pending
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function loadHistory() {
    if (!user?.id) return
    setLoading(true)
    setMessage('')
    try {
      const res = await api.get('/leave', {
        params: { user_id: user.id }
      })
      if (res.data) {
        setLeaveHistory(res.data)
      }
    } catch (err) {
      console.error('Failed to load leave history:', err)
      setMessage('Error loading leave history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!reason) {
      setMessage('Please enter a reason for your leave request.')
      return
    }

    let start = ''
    let end = ''
    let type = ''

    if (leaveMode === 'full') {
      if (!startDate || !endDate) {
        setMessage('Please select both start and end dates.')
        return
      }
      start = startDate
      end = endDate
      type = 'Full Day'
    } else {
      if (!singleDate) {
        setMessage('Please select a date.')
        return
      }
      start = singleDate
      end = singleDate
      type = 'Single Day'
    }

    setSubmitting(true)
    try {
      await api.post('/leave', {
        leave_type: type,
        start_date: start,
        end_date: end,
        reason: reason
      })

      setMessage('Leave request submitted successfully!')
      setStartDate('')
      setEndDate('')
      setSingleDate('')
      setReason('')

      loadHistory()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to request leave:', err)
      setMessage('Failed to submit leave request.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredHistory = leaveHistory.filter(item => {
    if (filterStatus === 'pending') return item.status === 'pending'
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24">

        {/* Header */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              Leave Request
            </h2>
          </div>
        </section>

        {/* Message Banner */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold ${
            message.includes('successfully')
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-primary-container/20 text-primary border border-primary/20'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">

          {/* Request Leave Form */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-6 shadow-sm space-y-4">
              <h3 className="font-title-lg text-base text-on-surface font-bold">Request Leave</h3>

              {/* Mode Toggle */}
              <div className="bg-surface-container-low rounded-2xl p-1 flex gap-1 border border-outline-variant/25">
                <button
                  onClick={() => setLeaveMode('full')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    leaveMode === 'full'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Multiple Days
                </button>
                <button
                  onClick={() => setLeaveMode('single')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    leaveMode === 'single'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Single Day
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {leaveMode === 'full' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">From Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">To Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Date</label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Reason for Leave</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for leave (medical, personal, family emergency, etc.)"
                    rows="4"
                    className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{submitting ? 'Submitting...' : 'Submit Leave Request'}</span>
                  <Icon name="send" className="text-sm" />
                </button>
              </form>
            </div>
          </div>

          {/* Leave History */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-title-lg text-base text-on-surface font-bold">Leave History</h3>
                <div className="flex gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant/20">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      filterStatus === 'all'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      filterStatus === 'pending'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant p-6">
                  No leave requests found.
                </div>
              ) : (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {filteredHistory.map(item => {
                    const isPending = item.status === 'pending'
                    const isApproved = item.status === 'approved'

                    return (
                      <div
                        key={item.id}
                        className="bg-surface-container-low rounded-[24px] border border-outline-variant/25 p-4 flex flex-col gap-3 shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider">
                              {item.leave_type}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                              isPending ? 'bg-primary-container/20 text-primary' :
                              isApproved ? 'bg-emerald-100 text-emerald-800' :
                              'bg-error-container text-on-error-container'
                            }`}>
                              <Icon name={isPending ? 'pending' : isApproved ? 'check_circle' : 'cancel'} className="text-[9px]" />
                              <span>{item.status}</span>
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right shrink-0">
                            {item.start_date === item.end_date
                              ? item.start_date
                              : `${item.start_date} - ${item.end_date}`
                            }
                          </span>
                        </div>
                        <div>
                          <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
