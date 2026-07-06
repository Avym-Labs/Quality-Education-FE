import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function SchedulePage() {
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

  // Roster filters (only for Teacher/Admin)
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

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

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-24 text-left">
        
        {/* Header bar */}
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
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                Track lecture timings, exams, and class details.
              </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
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
                
                return (
                  <div 
                    key={dNum}
                    onClick={() => handleDayClick(dNum)}
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-between cursor-pointer select-none active:scale-95 duration-100 min-h-[50px] relative transition-colors ${
                      isSelected 
                        ? 'bg-primary text-on-primary font-bold shadow-xs' 
                        : 'bg-surface-container-low/20 hover:bg-surface-container hover:text-on-surface text-on-surface-variant'
                    }`}
                  >
                    <span className="text-[10px]">{dNum}</span>
                    
                    {/* Event indicators */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 justify-center mt-1 w-full flex-wrap max-w-full">
                        {dayEvents.slice(0, 3).map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`w-1 h-1 rounded-full ${
                              isSelected ? 'bg-on-primary' : 'bg-primary'
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
    </DashboardLayout>
  )
}
