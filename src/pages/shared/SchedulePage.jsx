import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function SchedulePage({ embed = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'student'

  // Current calendar scope
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  //  filters (only for Teacher/Admin)
  const [classFilter, setClassFilter] = useState(user?.assigned_classes?.[0] || '10-A')

  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formSubject, setFormSubject] = useState('Mathematics')
  const [formClass, setFormClass] = useState(user?.assigned_classes?.[0] || '10-A')
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0])
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formRoom, setFormRoom] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)

  // Desktop CRM-style calendar (Teacher/Admin only)
  const [viewMode, setViewMode] = useState('day') // 'month' | 'week' | 'day'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'upcoming' | 'past' | 'all'

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const DAY_START_HOUR = 8
  const DAY_END_HOUR = 18
  const HOUR_PX = 60

  const SUBJECT_COLORS = {
    mathematics: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700' },
    physics: { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700' },
    chemistry: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
    biology: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
    english: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
    'computer science': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  }
  const getSubjectColors = (subject) =>
    SUBJECT_COLORS[(subject || '').toLowerCase()] || { bg: 'bg-[#6351E0]/5', border: 'border-[#6351E0]/25', text: 'text-[#6351E0]' }

  const addDays = (date, n) => {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    return d
  }
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const loadSchedules = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (role === 'student') {
        params.grade = `${user.grade}-${user.section}`
      } else {
        params.grade = classFilter
      }
      const { data } = await api.get('/schedules', { params })
      setSchedules(data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to fetch scheduled events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSchedules()
    }
  }, [user, classFilter])

  // Keep the month grid/mini-calendar in sync when the selected day is navigated (Day/Week views)
  useEffect(() => {
    if (selectedDate.getMonth() !== currentDate.getMonth() || selectedDate.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day) => {
    setSelectedDate(new Date(year, month, day))
  }

  // Toolbar navigation for the desktop CRM-style calendar (Month/Week/Day aware)
  const handleToolbarPrev = () => {
    if (viewMode === 'day') setSelectedDate(d => addDays(d, -1))
    else if (viewMode === 'week') setSelectedDate(d => addDays(d, -7))
    else handlePrevMonth()
  }
  const handleToolbarNext = () => {
    if (viewMode === 'day') setSelectedDate(d => addDays(d, 1))
    else if (viewMode === 'week') setSelectedDate(d => addDays(d, 7))
    else handleNextMonth()
  }
  const handleToday = () => {
    const t = new Date()
    setSelectedDate(t)
    setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1))
  }

  // Check if a day has events
  const getEventsForDay = (day) => {
    const checkStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return schedules.filter(ev => {
      const evDate = ev.start_time.split('T')[0]
      return evDate === checkStr
    })
  }

  // Handle Edit/Create trigger
  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormTitle('')
    setFormSubject(user?.subjects?.[0] || 'Mathematics')
    setFormClass(classFilter)
    setFormDate(selectedDate.toISOString().split('T')[0])
    setFormStartTime('09:00')
    setFormEndTime('10:00')
    setFormRoom('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (ev) => {
    setEditingId(ev.id)
    setFormTitle(ev.title)
    setFormSubject(ev.subject)
    setFormClass(ev.grade)
    
    // Parse times
    const startStr = ev.start_time.split('T')
    const endStr = ev.end_time.split('T')
    
    setFormDate(startStr[0])
    setFormStartTime(startStr[1].substring(0, 5))
    setFormEndTime(endStr[1].substring(0, 5))
    setFormRoom(ev.room || '')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmittingForm(true)
    setError('')
    setSuccess('')
    
    try {
      const startIso = `${formDate}T${formStartTime}:00Z`
      const endIso = `${formDate}T${formEndTime}:00Z`
      
      const payload = {
        title: formTitle,
        subject: formSubject,
        grade: formClass,
        start_time: startIso,
        end_time: endIso,
        room: formRoom
      }

      if (editingId) {
        await api.put(`/schedules/${editingId}`, payload)
        setSuccess('Schedule updated successfully! Students notified.')
      } else {
        await api.post('/schedules', payload)
        setSuccess('New class lecture scheduled successfully!')
      }

      setModalOpen(false)
      loadSchedules()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      console.error(err)
      setError('Failed to save schedule record.')
    } finally {
      setSubmittingForm(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this lecture schedule?')) return
    setError('')
    setSuccess('')
    try {
      await api.delete(`/schedules/${id}`)
      setSuccess('Schedule cancelled successfully.')
      loadSchedules()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setError('Failed to cancel schedule.')
    }
  }

  // Selected Day's active schedules
  const selectedDayEvents = schedules.filter(ev => {
    const evDate = ev.start_time.split('T')[0]
    const selDateStr = selectedDate.toISOString().split('T')[0]
    return evDate === selDateStr
  })

  const formatEventTime = (isoStr) => {
    try {
      const date = new Date(isoStr)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoStr
    }
  }

  const isTeacherOrAdmin = role === 'teacher' || role === 'admin'

  // ----------------------------------------------------
  // DESKTOP CRM-STYLE CALENDAR (Teacher/Admin only)
  // ----------------------------------------------------
  const now = new Date()
  const searchedSchedules = schedules.filter(ev => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (ev.title || '').toLowerCase().includes(q) ||
      (ev.subject || '').toLowerCase().includes(q) ||
      (ev.teacher_name || '').toLowerCase().includes(q)
  })
  const visibleSchedules = searchedSchedules.filter(ev => {
    if (statusFilter === 'all') return true
    const isPast = new Date(ev.end_time) < now
    return statusFilter === 'past' ? isPast : !isPast
  })

  const dayViewEvents = visibleSchedules.filter(ev => isSameDay(new Date(ev.start_time), selectedDate))

  const weekStart = addDays(selectedDate, -selectedDate.getDay())
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  const toolbarLabel = viewMode === 'month'
    ? `${monthNames[month]} ${year}`
    : viewMode === 'week'
      ? (weekStart.getMonth() === weekDays[6].getMonth()
          ? `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
          : `${monthNames[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} - ${monthNames[weekDays[6].getMonth()].slice(0, 3)} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`)
      : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const getEventBlockStyle = (ev) => {
    const s = new Date(ev.start_time)
    const e = new Date(ev.end_time)
    const startMins = Math.max(0, (s.getHours() - DAY_START_HOUR) * 60 + s.getMinutes())
    const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (e.getHours() - DAY_START_HOUR) * 60 + e.getMinutes())
    const top = (startMins / 60) * HOUR_PX
    const height = Math.max(((endMins - startMins) / 60) * HOUR_PX, 34)
    return { top: `${top}px`, height: `${height}px` }
  }

  const content = (
    <div className="space-y-stack-md mt-stack-sm pb-24 text-left">
      
      {/* Header bar */}
      {!embed && (
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/${role}/dashboard`)}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Lecture Calendar
              </h2>
            </div>
          </div>

          {/* Class filter for Teachers & Admins */}
          {role !== 'student' && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-outline">Class:</label>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none"
              >
                {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}

        {/* Notifications alerts banner */}
        {success && (
          <div className="p-3 bg-green-50 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2 mb-2 animate-fadeIn border border-green-200">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-3 bg-error-container text-error rounded-xl text-xs font-bold flex items-center gap-2 mb-2 animate-fadeIn border border-error/20">
            <span className="material-symbols-outlined text-xs">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:hidden">

          {/* LEFT: Monthly Grid Calendar */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm space-y-4">
            
            {/* Calendar month controls */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                {monthNames[month]} {year}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center border-none cursor-pointer text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center border-none cursor-pointer text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Grid days layout */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              
              {/* Day Titles headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="font-bold text-[10px] text-outline uppercase py-1 border-b border-outline-variant/10">
                  {d}
                </div>
              ))}

              {/* Blank prefix padding cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 opacity-0"></div>
              ))}

              {/* Days grid cards */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dNum = i + 1
                const dayEvents = getEventsForDay(dNum)
                const isSelected = selectedDate.getDate() === dNum && selectedDate.getMonth() === month && selectedDate.getFullYear() === year
                
                const hasEvents = dayEvents.length > 0
                return (
                  <div 
                    key={dNum}
                    onClick={() => handleDayClick(dNum)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-between cursor-pointer select-none active:scale-95 duration-200 min-h-[52px] relative transition-all border ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#6351E0] to-[#8F43F2] text-white shadow-md ring-4 ring-[#6351E0]/20 transform scale-105 font-black border-transparent' 
                        : hasEvents
                          ? 'bg-[#6351E0]/5 text-[#6351E0] border-[#6351E0]/20 font-bold hover:bg-[#6351E0]/10 hover:-translate-y-0.5 hover:shadow-xs'
                          : 'bg-slate-50 text-on-surface border-transparent hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-xs'
                    }`}
                  >
                    <span className="text-[10px]">{dNum}</span>
                    
                    {/* Event indicators */}
                    {hasEvents && (
                      <div className="flex gap-0.5 justify-center mt-1 w-full flex-wrap max-w-full pointer-events-none">
                        {dayEvents.slice(0, 3).map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-[#6351E0]'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

            </div>
          </div>

          {/* RIGHT: Scheduled Lectures detail Roster */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5 mb-4">
                <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                  Schedules for {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </h3>

                {/* Add Event trigger for Teachers & Admins */}
                {(role === 'teacher' || role === 'admin') && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-[10px] font-bold shadow-xs hover:bg-opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                    <span>Add Event</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center text-outline font-semibold">Querying calendar...</div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">No lectures scheduled for this date.</div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {selectedDayEvents.map(ev => (
                    <div key={ev.id} className="p-3.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low/10 flex items-center justify-between gap-3 text-left">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-primary-fixed text-primary text-[8px] font-black uppercase rounded-md">
                            {ev.subject}
                          </span>
                          {ev.room && (
                            <span className="text-[8px] text-outline font-bold uppercase">Room {ev.room}</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-on-surface mt-1.5 truncate">{ev.title}</h4>
                        <p className="text-[9px] text-outline font-medium mt-0.5 truncate">Prof: {ev.teacher_name}</p>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <span className="text-[10px] font-black text-primary bg-primary-fixed/20 px-2 py-0.5 rounded-lg shadow-xs">
                          {formatEventTime(ev.start_time)} - {formatEventTime(ev.end_time)}
                        </span>
                        
                        {/* Edit options for Teachers & Admins */}
                        {(role === 'teacher' || role === 'admin') && (
                          <div className="flex gap-1 pt-1.5 border-t border-outline-variant/10 w-full justify-end">
                            <button
                              onClick={() => handleOpenEditModal(ev)}
                              className="material-symbols-outlined text-xs p-1 rounded-md text-outline hover:bg-surface-container hover:text-on-surface cursor-pointer border-none bg-transparent"
                              title="Edit Event"
                            >
                              edit
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="material-symbols-outlined text-xs p-1 rounded-md text-error hover:bg-red-50 cursor-pointer border-none bg-transparent"
                              title="Delete Event"
                            >
                              delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="text-[8px] text-outline font-semibold uppercase tracking-wider text-center border-t border-outline-variant/15 pt-3 mt-4 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
              <span>All schedule edits notify the class student list matches to grade subject.</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            DESKTOP CRM-STYLE LECTURE CALENDAR (all roles; Students are read-only)
            ---------------------------------------------------- */}
        <div className="hidden lg:block space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col gap-3 pb-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToday}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-xs font-bold border-none cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleToolbarPrev}
                    className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center border-none cursor-pointer text-on-surface"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button
                    onClick={handleToolbarNext}
                    className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center border-none cursor-pointer text-on-surface"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <h3 className="text-sm font-black text-on-surface ml-1">{toolbarLabel}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="material-symbols-outlined text-outline text-sm absolute left-3 top-1/2 -translate-y-1/2">search</span>
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search lectures..."
                      className="pl-9 pr-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold outline-none focus:border-primary w-56"
                    />
                  </div>
                  {isTeacherOrAdmin && (
                    <button
                      onClick={handleOpenCreateModal}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Create New Record</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="flex items-center bg-surface-container-low rounded-xl p-1 gap-1">
                  {['month', 'week', 'day'].map(v => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold capitalize border-none cursor-pointer transition-all ${
                        viewMode === v ? 'bg-white shadow-xs text-primary' : 'bg-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">

              {/* Main calendar surface */}
              <div className="col-span-8 bg-white p-5 rounded-[24px] border border-outline-variant/30 shadow-sm">

                {/* DAY VIEW */}
                {viewMode === 'day' && (
                  <div className="relative">
                    {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }).map((_, i) => {
                      const hour = DAY_START_HOUR + i
                      const label = hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`
                      return (
                        <div key={hour} className="flex" style={{ height: `${HOUR_PX}px` }}>
                          <div className="w-14 shrink-0 text-right pr-2 pt-1 text-[9px] font-bold text-outline uppercase border-r border-outline-variant/15">
                            {label}
                          </div>
                          <div className="flex-1 border-b border-outline-variant/10"></div>
                        </div>
                      )
                    })}

                    <div className="absolute top-0 left-14 right-0 bottom-0">
                      {dayViewEvents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-outline text-xs font-semibold">
                          No lectures scheduled for this day.
                        </div>
                      )}
                      {dayViewEvents.map(ev => {
                        const colors = getSubjectColors(ev.subject)
                        return (
                          <div
                            key={ev.id}
                            onClick={isTeacherOrAdmin ? () => handleOpenEditModal(ev) : undefined}
                            style={getEventBlockStyle(ev)}
                            className={`absolute left-1 right-1 rounded-xl border px-2.5 py-1.5 overflow-hidden shadow-xs transition-all ${colors.bg} ${colors.border} ${
                              isTeacherOrAdmin ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                            }`}
                          >
                            <p className={`text-[9px] font-black uppercase truncate ${colors.text}`}>
                              {formatEventTime(ev.start_time)} - {formatEventTime(ev.end_time)}
                            </p>
                            <p className="text-[10px] font-bold text-on-surface truncate">{ev.title}</p>
                            {ev.room && <p className="text-[8px] text-outline font-semibold truncate">Room {ev.room}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* WEEK VIEW */}
                {viewMode === 'week' && (
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(d => {
                      const dayEvents = visibleSchedules.filter(ev => isSameDay(new Date(ev.start_time), d))
                      const isToday = isSameDay(d, new Date())
                      const isSelected = isSameDay(d, selectedDate)
                      return (
                        <div
                          key={d.toISOString()}
                          onClick={() => { setSelectedDate(d); setViewMode('day') }}
                          className={`rounded-2xl border p-2 min-h-[240px] flex flex-col gap-1.5 cursor-pointer transition-all ${
                            isSelected ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant/20 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-center pb-1.5 border-b border-outline-variant/10">
                            <p className="text-[8px] font-bold text-outline uppercase">{d.toLocaleDateString([], { weekday: 'short' })}</p>
                            <p className={`text-sm font-black ${isToday ? 'text-primary' : 'text-on-surface'}`}>{d.getDate()}</p>
                          </div>
                          <div className="flex-1 space-y-1 overflow-y-auto">
                            {dayEvents.map(ev => {
                              const colors = getSubjectColors(ev.subject)
                              return (
                                <div key={ev.id} className={`px-1.5 py-1 rounded-lg border text-[8px] font-bold truncate ${colors.bg} ${colors.border} ${colors.text}`}>
                                  {formatEventTime(ev.start_time)} {ev.title}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* MONTH VIEW */}
                {viewMode === 'month' && (
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="font-bold text-[10px] text-outline uppercase py-1.5 border-b border-outline-variant/10">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`pad-${i}`} className="opacity-0" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dNum = i + 1
                      const cellDate = new Date(year, month, dNum)
                      const dayEvents = visibleSchedules.filter(ev => isSameDay(new Date(ev.start_time), cellDate))
                      const isSelected = isSameDay(cellDate, selectedDate)
                      const isToday = isSameDay(cellDate, new Date())
                      return (
                        <div
                          key={dNum}
                          onClick={() => { setSelectedDate(cellDate); setViewMode('day') }}
                          className={`min-h-[76px] p-2 rounded-xl border cursor-pointer flex flex-col items-start gap-1 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#6351E0] to-[#8F43F2] text-white border-transparent shadow-md'
                              : isToday
                                ? 'border-primary/40 bg-primary-fixed/10'
                                : 'border-outline-variant/15 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-on-surface'}`}>{dNum}</span>
                          <div className="flex flex-col gap-0.5 w-full">
                            {dayEvents.slice(0, 2).map(ev => {
                              const colors = getSubjectColors(ev.subject)
                              return (
                                <span
                                  key={ev.id}
                                  className={`text-[7px] px-1 py-0.5 rounded truncate font-bold ${isSelected ? 'bg-white/20 text-white' : `${colors.bg} ${colors.text}`}`}
                                >
                                  {ev.title}
                                </span>
                              )
                            })}
                            {dayEvents.length > 2 && (
                              <span className={`text-[7px] font-bold ${isSelected ? 'text-white/80' : 'text-outline'}`}>+{dayEvents.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right rail: mini calendar + filters */}
              <div className="col-span-4 bg-white p-5 rounded-[24px] border border-outline-variant/30 shadow-sm space-y-5">

                {/* Mini month calendar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center border-none cursor-pointer text-on-surface"
                    >
                      <span className="material-symbols-outlined text-xs">chevron_left</span>
                    </button>
                    <h4 className="text-[11px] font-black uppercase text-on-surface">{monthNames[month]} {year}</h4>
                    <button
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center border-none cursor-pointer text-on-surface"
                    >
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                      <div key={idx} className="text-[8px] font-bold text-outline">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`mp-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dNum = i + 1
                      const cellDate = new Date(year, month, dNum)
                      const hasEvents = visibleSchedules.some(ev => isSameDay(new Date(ev.start_time), cellDate))
                      const isSelected = isSameDay(cellDate, selectedDate)
                      const isToday = isSameDay(cellDate, new Date())
                      return (
                        <button
                          key={dNum}
                          type="button"
                          onClick={() => { setSelectedDate(cellDate); setViewMode('day') }}
                          className={`w-7 h-7 mx-auto rounded-full text-[9px] font-bold flex items-center justify-center relative border-none cursor-pointer ${
                            isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary-fixed/30 text-primary' : 'bg-transparent text-on-surface hover:bg-slate-100'
                          }`}
                        >
                          {dNum}
                          {hasEvents && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary"></span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-4 pt-4 border-t border-outline-variant/15">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-outline tracking-wider">Class</h4>
                    {isTeacherOrAdmin ? (
                      <select
                        value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                      >
                        {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(cls => (
                          <option key={cls} value={cls}>Class {cls}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        Class {user?.grade}-{user?.section}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-outline tracking-wider">Status</h4>
                    {[
                      { v: 'upcoming', l: 'Upcoming Lectures' },
                      { v: 'past', l: 'Past Lectures' },
                      { v: 'all', l: 'All Lectures' },
                    ].map(opt => (
                      <label key={opt.v} className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                        <input
                          type="radio"
                          name="scheduleStatusFilter"
                          checked={statusFilter === opt.v}
                          onChange={() => setStatusFilter(opt.v)}
                          className="accent-primary w-3.5 h-3.5 cursor-pointer"
                        />
                        {opt.l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Create / Edit Form Modal (Teachers & Admins Only) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] animate-fadeIn p-4">
            <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-[28px] border border-outline-variant/30 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs text-left animate-scaleIn">
              
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
                <h3 className="text-xs font-black uppercase text-primary tracking-wider">
                  {editingId ? 'Modify Lecture Schedule' : 'Schedule New Class Event'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] uppercase text-outline">Event Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Calculus Basics Intro"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Class Room</label>
                  <select
                    value={formClass}
                    onChange={e => setFormClass(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Subject</label>
                  <select
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] uppercase text-outline">Scheduled Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Start Time</label>
                  <input 
                    type="time"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">End Time</label>
                  <input 
                    type="time"
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] uppercase text-outline">Room (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Lab 4B"
                  value={formRoom}
                  onChange={e => setFormRoom(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-outline-variant/15 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-5 bg-surface-variant hover:bg-surface-container-high font-bold text-xs rounded-xl cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="py-2.5 px-5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer border-none"
                >
                  {submittingForm ? 'Saving...' : editingId ? 'Update and Notify Class' : 'Schedule Event'}
                </button>
              </div>

            </form>
          </div>
        )}

    </div>
  )

  if (embed) return content
  return <DashboardLayout>{content}</DashboardLayout>
}
