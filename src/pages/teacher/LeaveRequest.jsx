import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function LeaveRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [leaveMode, setLeaveMode] = useState('full') // full | partial
  
  // Form fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [reason, setReason] = useState('')
  const [attachment, setAttachment] = useState(null)
  
  const [leaveHistory, setLeaveHistory] = useState([])
  const [filterStatus, setFilterStatus] = useState('all') // all | pending
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Student Leaves Approval states
  const [viewTab, setViewTab] = useState('my-leaves') // my-leaves | student-leaves
  const [studentLeaves, setStudentLeaves] = useState([])
  const [studentLoading, setStudentLoading] = useState(false)

  const availableSubjects = user?.subjects || ['Mathematics', 'Science', 'English']

  // Load history
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

  async function loadStudentLeaves() {
    setStudentLoading(true)
    setMessage('')
    try {
      const res = await api.get('/leave')
      if (res.data) {
        const filtered = res.data.filter(item => item.user?.role === 'student')
        setStudentLeaves(filtered)
      }
    } catch (err) {
      console.error('Failed to load student leaves:', err)
      setMessage('Error loading student leave requests.')
    } finally {
      setStudentLoading(false)
    }
  }

  const handleLeaveAction = async (leaveId, actionStatus) => {
    setMessage('')
    try {
      await api.patch(`/leave/${leaveId}`, { status: actionStatus })
      setMessage(`Leave request ${actionStatus} successfully!`)
      loadStudentLeaves()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to update student leave status:', err)
      setMessage('Failed to update leave status.')
    }
  }

  useEffect(() => {
    loadHistory()
    loadStudentLeaves()
  }, [user])

  // Submit Leave Request
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
      const subList = selectedSubjects.length > 0 ? ` (${selectedSubjects.join(', ')})` : ''
      type = `Partial Leave${subList}`
    }

    try {
      await api.post('/leave', {
        leave_type: type,
        start_date: start,
        end_date: end,
        reason: reason
      })

      setMessage('Leave request submitted successfully!')
      // Clear form
      setStartDate('')
      setEndDate('')
      setSingleDate('')
      setSelectedSubjects([])
      setReason('')
      setAttachment(null)

      // Reload history
      loadHistory()

      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to request leave:', err)
      setMessage('Failed to submit leave request.')
    }
  }

  // Handle subject check
  const handleSubjectCheck = (subj) => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    )
  }

  // Filter history
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
            onClick={() => navigate('/teacher/dashboard')}
            className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            arrow_back
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              Leave Request
            </h2>
            <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
              Submit requests & track approval status
            </p>
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
          
          {/* Left Column: Student Leaves Approval (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <div>
                  <h3 className="font-title-lg text-base text-on-surface font-bold">Student Leave Applications</h3>
                  <p className="text-xs text-on-surface-variant">Review and approve/reject student leave requests</p>
                </div>
                <button 
                  onClick={loadStudentLeaves}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low text-primary rounded-xl font-bold text-xs hover:bg-surface-container-high transition-colors active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Refresh</span>
                </button>
              </div>

              {studentLoading ? (
                <div className="flex justify-center items-center py-12">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
                </div>
              ) : studentLeaves.length === 0 ? (
                <div className="text-center py-16 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant p-6">
                  No student leave requests found.
                </div>
              ) : (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {studentLeaves.map(item => {
                    const isPending = item.status === 'pending'
                    const isApproved = item.status === 'approved'

                    return (
                      <div 
                        key={item.id}
                        className="bg-surface-container-low border border-outline-variant/20 rounded-[24px] p-4 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-all duration-300"
                      >
                        <div>
                          {/* Student Details Header */}
                          <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-3 mb-3">
                            {item.user?.avatar ? (
                              <img src={item.user.avatar} alt="Profile" className="w-8 h-8 rounded-xl object-cover border border-outline-variant" />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {item.user?.first_name?.[0]}{item.user?.last_name?.[0]}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-xs text-on-surface">{item.user?.full_name || `${item.user?.first_name} ${item.user?.last_name}`}</h4>
                              <p className="text-[9px] text-on-surface-variant font-semibold">Student • {item.leave_type}</p>
                            </div>
                          </div>

                          {/* Dates and Reason */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-1.5 text-[9px] text-primary font-bold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              <span>{item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/10">{item.reason}</p>
                          </div>
                        </div>

                        {/* Status / Action Footer */}
                        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-auto">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isPending ? 'bg-primary-container/20 text-primary' :
                              isApproved ? 'bg-emerald-100 text-emerald-800' :
                              'bg-error-container text-on-error-container'
                            }`}>
                              <span className="material-symbols-outlined text-[9px]">
                                {isPending ? 'pending' : isApproved ? 'check_circle' : 'cancel'}
                              </span>
                              <span>{item.status}</span>
                            </span>
                          </div>

                          {isPending ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLeaveAction(item.id, 'rejected')}
                                className="px-2.5 py-1 bg-red-50 text-error rounded-xl font-bold text-[10px] hover:bg-red-100 active:scale-95 transition-all"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleLeaveAction(item.id, 'approved')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-[10px] hover:bg-emerald-100 active:scale-95 transition-all"
                              >
                                Approve
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-outline font-semibold italic">Processed</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Teacher's Own Leaves (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Request Leave Form */}
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
                  Full Day
                </button>
                <button 
                  onClick={() => setLeaveMode('partial')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    leaveMode === 'partial' 
                      ? 'bg-primary text-on-primary shadow-sm' 
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Partial Leave
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Day fields */}
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
                  /* Partial Leave fields */
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Date</label>
                      <input 
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Select Subjects Affected</label>
                      <div className="flex flex-wrap gap-2 py-1">
                        {availableSubjects.map(subj => {
                          const isChecked = selectedSubjects.includes(subj)
                          return (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => handleSubjectCheck(subj)}
                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                                isChecked 
                                  ? 'bg-secondary-container text-on-secondary-container border-secondary-container' 
                                  : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              {subj}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Reason for Leave</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for leave (medical, personal emergency, etc.)"
                    rows="3"
                    className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* File Attachment Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Attachment (Optional)</label>
                  <div className="border-2 border-dashed border-outline-variant/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group">
                    <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-105 transition-transform">upload_file</span>
                    <p className="text-[10px] text-on-surface-variant font-bold text-center">Upload medical certificate or proof</p>
                    <p className="text-[9px] text-outline italic">PDF, PNG, JPG up to 5MB</p>
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Submit Leave Request</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>

            {/* Leave History */}
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

              {/* List */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 p-6 rounded-2xl border border-outline-variant/20">
                  No leave requests found.
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
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
                              <span className="material-symbols-outlined text-[9px]">
                                {isPending ? 'pending' : isApproved ? 'check_circle' : 'cancel'}
                              </span>
                              <span>{item.status}</span>
                            </span>
                          </div>
                          <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right">
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
