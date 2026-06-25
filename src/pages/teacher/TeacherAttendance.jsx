import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TeacherAttendance() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Personal statistics
  const [stats, setStats] = useState({
    rate: 98,
    present: 21,
    late: 1,
    approvedLeaves: 2
  })

  // Fetch approved leaves from DB to dynamically populate the calendar
  useEffect(() => {
    async function loadLeaves() {
      if (!user?.id) return
      setLoading(true)
      try {
        const res = await api.get('/leave', { params: { user_id: user.id } })
        const leaveRecords = res.data || []
        setLeaves(leaveRecords)

        const approvedCount = leaveRecords.filter(l => l.status === 'approved').length
        setStats(prev => ({
          ...prev,
          approvedLeaves: approvedCount,
          // Muted adjustments
          rate: Math.max(90, 100 - (approvedCount * 1.5))
        }))
      } catch (err) {
        console.error('Failed to load leaves history for personal calendar:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLeaves()
  }, [user])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Calendar calculations
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay() // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  // Get status of a specific day
  const getDayStatus = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // Check weekends
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { status: 'weekend', label: 'Weekend' }
    }

    // Check approved leaves
    const matchedLeave = leaves.find(l => {
      return dateStr >= l.start_date && dateStr <= l.end_date
    })

    if (matchedLeave) {
      if (matchedLeave.status === 'approved') {
        return { status: 'leave', label: `Approved Leave: ${matchedLeave.leave_type}` }
      }
      if (matchedLeave.status === 'pending') {
        return { status: 'pending_request', label: 'Pending Leave Request' }
      }
    }

    // Mocks for a couple of late days
    if (day === 4 || day === 18) {
      return { status: 'late', label: 'Present - Checked in late (09:12 AM)' }
    }

    // Default to present on active weekdays
    const todayStr = new Date().toISOString().split('T')[0]
    if (dateStr > todayStr) {
      return { status: 'future', label: 'Scheduled Workday' }
    }

    return { status: 'present', label: 'Present - Checked in (08:24 AM)' }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24">
        
        {/* Header */}
        <section className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                My Attendance Logs
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                Personal checks logs & leave balances
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/teacher/leave')}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">time_to_leave</span>
            <span>Request Leave</span>
          </button>
        </section>

        {/* Stats Bento Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
            <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Attendance Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-numeric-bold text-2xl text-primary font-bold">{stats.rate}%</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-2">Top 5% of Faculty</p>
          </div>

          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
            <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Days Checked-In</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-numeric-bold text-2xl text-on-surface font-bold">{stats.present} Days</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-2">This Semester</p>
          </div>

          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
            <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Late Arrivals</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-numeric-bold text-2xl text-amber-500 font-bold">{stats.late} Day</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-2">Checked in after 09:00 AM</p>
          </div>

          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
            <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Approved Leaves</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-numeric-bold text-2xl text-secondary font-bold">{stats.approvedLeaves} Days</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-2">Excused absences</p>
          </div>
        </section>

        {/* Calendar and List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          
          {/* Calendar View (Col Span 8) */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-5 rounded-[28px] border border-outline-variant/35 shadow-sm space-y-4">
            
            {/* Calendar header with months selector */}
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-title-lg text-sm text-on-surface font-bold">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handlePrevMonth}
                  className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-xl transition-all"
                >
                  chevron_left
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-xl transition-all"
                >
                  chevron_right
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days list grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty offsets */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`offset-${i}`} className="aspect-square"></div>
              ))}
              
              {/* Active days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1
                const dayObj = getDayStatus(dayNum)
                
                // Color mapping classes
                let colorClass = ''
                if (dayObj.status === 'present') colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200'
                else if (dayObj.status === 'leave') colorClass = 'bg-orange-50 text-orange-800 border-orange-200'
                else if (dayObj.status === 'pending_request') colorClass = 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                else if (dayObj.status === 'late') colorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200'
                else if (dayObj.status === 'weekend') colorClass = 'bg-surface-container-low text-on-surface-variant/40 border-outline-variant/10'
                else colorClass = 'bg-surface-container-lowest text-on-surface-variant/70 border-outline-variant/20'

                return (
                  <div 
                    key={`day-${dayNum}`}
                    title={dayObj.label}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 font-numeric-bold text-xs font-bold cursor-default hover:opacity-90 active:scale-95 transition-all ${colorClass}`}
                  >
                    <span>{dayNum}</span>
                    {/* Small indicator dots */}
                    {dayObj.status === 'present' && <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>}
                    {dayObj.status === 'leave' && <span className="w-1 h-1 rounded-full bg-orange-500 mt-0.5"></span>}
                    {dayObj.status === 'pending_request' && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5"></span>}
                    {dayObj.status === 'late' && <span className="w-1 h-1 rounded-full bg-yellow-500 mt-0.5"></span>}
                  </div>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-outline-variant/15 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Late</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Leave</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Pending</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Weekend</span>
            </div>

          </div>

          {/* Detailed status list (Col Span 4) */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-5 rounded-[28px] border border-outline-variant/35 shadow-sm space-y-4">
            <h3 className="font-title-lg text-xs text-on-surface font-bold uppercase tracking-wider">Leave Allocation</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                  <span>Casual Leaves</span>
                  <span>10 / 12 Remaining</span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                  <span>Sick Leaves</span>
                  <span>7 / 10 Remaining</span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                  <span>Maternity/Paternity Leaves</span>
                  <span>30 / 30 Remaining</span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 space-y-2">
              <h4 className="text-[10px] uppercase font-bold text-on-surface-variant">Quick Guidelines</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed font-semibold">
                - Leave requests must be submitted 24 hours in advance.<br />
                - Late check-ins are logged automatically via biometric gateway.<br />
                - Unexcused absences can affect performance rating metrics.
              </p>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
