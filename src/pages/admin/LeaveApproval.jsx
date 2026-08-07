import { useEffect, useState } from 'react'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function LeaveApproval() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Active Tab: 'pending' | 'approved' | 'rejected'
  const [activeTab, setActiveTab] = useState('pending')
  // Remarks mapping state: { leaveId: 'remarkText' }
  const [remarks, setRemarks] = useState({})
  const [processingId, setProcessingId] = useState(null)

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      // Fetch all leaves to compute count badges locally
      const res = await api.get('/leave')
      setLeaves(res.data || [])
    } catch (err) {
      console.error('Failed to load leaves:', err)
      setError('Could not fetch leave approval records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleAction = async (leaveId, status) => {
    setProcessingId(leaveId)
    try {
      const remark = remarks[leaveId] || ''
      // Body payload
      await api.patch(`/leave/${leaveId}`, { status })
      // Refresh list
      await fetchLeaves()
      // Clear remark
      setRemarks(prev => {
        const copy = { ...prev }
        delete copy[leaveId]
        return copy
      })
    } catch (err) {
      console.error(`Failed to ${status} leave:`, err)
      alert(`Failed to update leave request status.`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemarkChange = (leaveId, val) => {
    setRemarks(prev => ({
      ...prev,
      [leaveId]: val
    }))
  }

  const allLeaves = leaves

  // Compute tab counts
  const pendingLeaves = allLeaves.filter(l => l.status === 'pending')
  const approvedLeaves = allLeaves.filter(l => l.status === 'approved')
  const rejectedLeaves = allLeaves.filter(l => l.status === 'rejected')

  const activeLeaves = activeTab === 'pending' 
    ? pendingLeaves 
    : activeTab === 'approved' 
      ? approvedLeaves 
      : rejectedLeaves

  // Date duration helper
  const calculateDays = (start, end) => {
    try {
      const s = new Date(start)
      const e = new Date(end)
      const diffTime = Math.abs(e - s)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays === 1 ? '1 Day' : `${diffDays} Days`
    } catch {
      return '1 Day'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
        {/* Header Title */}
        <section className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">Leave Approvals</h2>
          </div>
          <Icon name="pending_actions" className="text-primary text-2xl" />
        </section>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant/15 pb-3">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-full font-semibold text-xs transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'pending'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Pending ({pendingLeaves.length})
          </button>
          <button 
            onClick={() => setActiveTab('approved')}
            className={`px-5 py-2 rounded-full font-semibold text-xs transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'approved'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Approved ({approvedLeaves.length})
          </button>
          <button 
            onClick={() => setActiveTab('rejected')}
            className={`px-5 py-2 rounded-full font-semibold text-xs transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'rejected'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Rejected ({rejectedLeaves.length})
          </button>
        </section>

        {/* Leaves List */}
        {loading && leaves.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-stack-lg max-w-3xl mx-auto">
            {activeLeaves.length > 0 ? (
              activeLeaves.map((request) => {
                const requester = request.user || {}
                const name = requester.full_name || `${requester.first_name || ''} ${requester.last_name || ''}`.trim() || 'Academic Requester'
                const roleLabel = requester.role === 'teacher' ? 'Faculty Member' : 'Student'
                
                const classLabel = request.class_info || (requester.role === 'teacher' ? 'Department not set' : 'Class not set')
                const attendanceRate = request.attendance_rate
                const daysLabel = calculateDays(request.start_date, request.end_date)
                
                return (
                  <div 
                    key={request.id} 
                    className="bg-surface-container-lowest rounded-[24px] p-stack-md shadow-sm border border-outline-variant/30 transition-all hover:shadow-md animate-fadeIn"
                  >
                    <div className="flex flex-col sm:flex-row gap-stack-md">
                      
                      {/* Left side: Profile and Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {requester.avatar ? (
                          <img alt={name} className="w-14 h-14 rounded-full object-cover border border-outline-variant shrink-0" src={requester.avatar}/>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface shrink-0">
                            {requester.first_name?.[0] || 'A'}{requester.last_name?.[0] || 'R'}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-title-lg text-base text-on-surface font-bold truncate">{name}</h3>
                          <p className="font-label-md text-xs text-on-surface-variant font-medium">
                            {roleLabel} • {classLabel}
                          </p>
                          {requester.role !== 'teacher' && attendanceRate && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold mt-1">
                              Attendance: {attendanceRate}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Dates and Duration */}
                      <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1 shrink-0">
                        <p className="font-numeric-bold text-sm text-primary font-bold">
                          {request.start_date} - {request.end_date}
                        </p>
                        <p className="font-label-md text-xs text-on-surface-variant font-semibold">{daysLabel}</p>
                      </div>

                    </div>

                    {/* Reason block */}
                    <div className="mt-stack-md p-stack-md bg-surface-container rounded-xl border-l-4 border-primary">
                      <p className="font-label-md text-xs font-bold text-primary mb-1">Reason for Leave:</p>
                      <p className="font-body-md text-xs text-on-surface leading-relaxed">
                        {request.reason}
                      </p>
                    </div>

                    {/* Pending Actions / Status Alerts */}
                    {request.status === 'pending' ? (
                      <div className="mt-stack-lg space-y-stack-md">
                        <div>
                          <label className="font-semibold text-xs text-on-surface-variant mb-1 block">
                            Internal Remark (Optional)
                          </label>
                          <input 
                            value={remarks[request.id] || ''}
                            onChange={(e) => handleRemarkChange(request.id, e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-stack-md py-2 text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                            placeholder="Add administrative notes or instructions..." 
                            type="text"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-stack-md">
                          <button 
                            disabled={processingId === request.id}
                            onClick={() => handleAction(request.id, 'rejected')}
                            className="h-11 border border-primary text-primary font-bold text-xs rounded-full hover:bg-primary-fixed transition-all active:scale-95 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button 
                            disabled={processingId === request.id}
                            onClick={() => handleAction(request.id, 'approved')}
                            className="h-11 bg-primary text-on-primary font-bold text-xs rounded-full shadow-md hover:bg-opacity-95 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display resolved stamp */
                      <div className="mt-4 flex items-center justify-end gap-1.5 text-xs font-bold">
                        <Icon
                          name={request.status === 'approved' ? 'check_circle' : 'cancel'}
                          className={`text-sm ${request.status === 'approved' ? 'text-green-600' : 'text-error'}`}
                        />
                        <span className={request.status === 'approved' ? 'text-green-700' : 'text-error'}>
                          {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                    )}

                  </div>
                )
              })
            ) : (
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-10 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
                <Icon name="inbox" className="text-4xl text-outline" />
                <p className="font-semibold">No leave requests in this category.</p>
                <p className="text-xs">All caught up with institutional leave approvals!</p>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
