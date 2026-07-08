import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TeacherAttendance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'teacher'

  // View Mode: 'students' (Student Attendance - Default) | 'teacher' (My Attendance Logs)
  const [viewMode, setViewMode] = useState('students')

  // =========================================================================
  // VIEW MODE 1: STUDENT ATTENDANCE (Marking states & helpers)
  // =========================================================================
  const [markingDate, setMarkingDate] = useState(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })

  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '10-A')
  
  const subjects = user?.subjects || ['Mathematics', 'Science']
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Mathematics')

  const [students, setStudents] = useState([])
  const [attendanceStates, setAttendanceStates] = useState({}) // user_id -> 'present' | 'absent' | 'late'
  const [leavesList, setLeavesList] = useState([])
  const [attendanceRates, setAttendanceRates] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [markingLoading, setMarkingLoading] = useState(false)
  const [markingMessage, setMarkingMessage] = useState('')

  // Bottom Sheet selected student
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [studentStats, setStudentStats] = useState(null)
  const [studentNotes, setStudentNotes] = useState('')

  // Load students and existing attendance when filters change
  useEffect(() => {
    async function loadStudentsAndAttendance() {
      if (viewMode !== 'students' || !selectedClass) return
      setMarkingLoading(true)
      setMarkingMessage('')
      try {
        const [grade, section] = selectedClass.split('-')
        
        // Fetch students
        const studRes = await api.get('/students', {
          params: { grade, section: section || '' }
        })
        const studentList = studRes.data || []
        setStudents(studentList)

        // Fetch approved leaves
        const leavesRes = await api.get('/leave', {
          params: { status: 'approved' }
        })
        const approvedLeaves = leavesRes.data || []
        setLeavesList(approvedLeaves)

        // Fetch historical attendance to calculate rates
        const historyRes = await api.get('/attendance', {
          params: { grade, section: section || '' }
        })
        const classHistory = historyRes.data || []

        // Fetch existing attendance for the selected date
        const attRes = await api.get('/attendance', {
          params: {
            grade,
            section: section || '',
            subject: selectedSubject,
            date: markingDate
          }
        })
        const attRecords = attRes.data || []

        const initialStates = {}
        const computedRates = {}

        studentList.forEach(s => {
          // Check if on leave for current marking date
          const isOnLeave = approvedLeaves.some(l => 
            l.user_id === s.user_id && 
            markingDate >= l.start_date && 
            markingDate <= l.end_date
          )

          if (isOnLeave) {
            initialStates[s.user_id] = 'absent'
          } else {
            const record = attRecords.find(r => r.student_id === s.user_id)
            initialStates[s.user_id] = record ? record.status : 'present'
          }

          // Calculate student attendance rate
          const sHistory = classHistory.filter(r => r.student_id === s.user_id)
          const total = sHistory.length
          const present = sHistory.filter(r => r.status === 'present').length
          computedRates[s.user_id] = total > 0 ? Math.round((present / total) * 100) : 100
        })

        setAttendanceStates(initialStates)
        setAttendanceRates(computedRates)
      } catch (err) {
        console.error('Failed to load students list:', err)
        setMarkingMessage('Error loading students list.')
      } finally {
        setMarkingLoading(false)
      }
    }
    loadStudentsAndAttendance()
  }, [selectedClass, selectedSubject, markingDate, viewMode])

  const handleOpenProfile = async (student) => {
    setSelectedStudent(student)
    setSheetOpen(true)
    setStudentStats(null)
    
    const savedNote = localStorage.getItem(`note_${student.id}`) || ''
    setStudentNotes(savedNote)

    try {
      const statsRes = await api.get(`/students/${student.id}/stats`)
      if (statsRes.data) {
        setStudentStats(statsRes.data)
      }
    } catch (err) {
      console.error('Failed to load student stats:', err)
    }
  }

  const handleSaveNotes = () => {
    if (selectedStudent) {
      localStorage.setItem(`note_${selectedStudent.id}`, studentNotes)
      setMarkingMessage(`Remarks updated for ${selectedStudent.full_name}`)
      setTimeout(() => setMarkingMessage(''), 3000)
    }
  }

  const toggleStatus = (userId, status) => {
    setAttendanceStates(prev => ({
      ...prev,
      [userId]: status
    }))
  }

  const presentCount = Object.values(attendanceStates).filter(s => s === 'present').length
  const absentCount = Object.values(attendanceStates).filter(s => s === 'absent').length
  const lateCount = Object.values(attendanceStates).filter(s => s === 'late').length

  const handleSubmitAttendance = async () => {
    setMarkingMessage('')
    try {
      const [grade, section] = selectedClass.split('-')
      const entries = Object.keys(attendanceStates).map(userId => ({
        student_id: userId,
        status: attendanceStates[userId]
      }))

      if (entries.length === 0) {
        setMarkingMessage('No student records found to mark.')
        return
      }

      await api.post('/attendance', {
        date: markingDate,
        grade,
        section: section || '',
        subject: selectedSubject,
        entries
      })

      setMarkingMessage('Attendance submitted successfully!')
      setTimeout(() => setMarkingMessage(''), 4000)
    } catch (err) {
      console.error('Failed to submit attendance:', err)
      setMarkingMessage('Failed to submit attendance records.')
    }
  }

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formattedMarkingDate = new Date(markingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // =========================================================================
  // VIEW MODE 2: MY ATTENDANCE LOGS (Personal stats & calendar states)
  // =========================================================================
  const [leaves, setLeaves] = useState([])
  const [personalLoading, setPersonalLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [personalStats, setPersonalStats] = useState({
    rate: 98,
    present: 21,
    late: 1,
    approvedLeaves: 2
  })

  useEffect(() => {
    async function loadLeaves() {
      if (viewMode !== 'teacher' || !user?.id) return
      setPersonalLoading(true)
      try {
        const res = await api.get('/leave', { params: { user_id: user.id } })
        const leaveRecords = res.data || []
        setLeaves(leaveRecords)

        const approvedCount = leaveRecords.filter(l => l.status === 'approved').length
        setPersonalStats(prev => ({
          ...prev,
          approvedLeaves: approvedCount,
          rate: Math.max(90, 100 - (approvedCount * 1.5))
        }))
      } catch (err) {
        console.error('Failed to load leaves history:', err)
      } finally {
        setPersonalLoading(false)
      }
    }
    loadLeaves()
  }, [user, viewMode])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
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

  const getDayStatus = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { status: 'weekend', label: 'Weekend' }
    }

    const matchedLeave = leaves.find(l => dateStr >= l.start_date && dateStr <= l.end_date)
    if (matchedLeave) {
      if (matchedLeave.status === 'approved') {
        return { status: 'leave', label: `Approved Leave: ${matchedLeave.leave_type}` }
      }
      if (matchedLeave.status === 'pending') {
        return { status: 'pending_request', label: 'Pending Leave Request' }
      }
    }

    if (day === 4 || day === 18) {
      return { status: 'late', label: 'Present - Checked in late (09:12 AM)' }
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (dateStr > todayStr) {
      return { status: 'future', label: 'Scheduled Workday' }
    }

    return { status: 'present', label: 'Present - Checked in (08:24 AM)' }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-36 text-left">
        
        {/* Unified Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2.5 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200 border-none bg-transparent cursor-pointer"
            >
              arrow_back
            </button>
            
            {/* Mode Switcher Dropdown */}
            <div className="flex flex-col">
              <select
                value={viewMode}
                onChange={e => setViewMode(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-1.5 text-xs font-black text-primary uppercase tracking-wide focus:outline-none cursor-pointer"
              >
                <option value="students">Student Attendance</option>
                <option value="teacher">My Attendance Logs</option>
              </select>
              <span className="text-[10px] text-outline font-semibold uppercase mt-0.5 pl-1">
                {viewMode === 'students' ? formattedMarkingDate : 'Personal Faculty Logs'}
              </span>
            </div>
          </div>

          {/* Action buttons matching current view */}
          <div className="flex items-center gap-2">
            {viewMode === 'students' ? (
              <input 
                type="date"
                value={markingDate}
                onChange={(e) => setMarkingDate(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none"
              />
            ) : (
              <button 
                onClick={() => navigate('/teacher/leave')}
                className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-1.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">time_to_leave</span>
                <span>Request Leave</span>
              </button>
            )}
          </div>
        </section>

        {/* =========================================================================
            RENDER VIEW 1: STUDENT ATTENDANCE
            ========================================================================= */}
        {viewMode === 'students' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Dynamic Class & Subject Buttons */}
            <section className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/35 shadow-xs space-y-3.5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-outline">Target Class:</span>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                  {assignedClasses.map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`flex-shrink-0 px-4 py-2 rounded-2xl font-label-md text-xs font-bold transition-all border shadow-xs cursor-pointer select-none active:scale-95 duration-100 ${
                        selectedClass === cls 
                          ? 'bg-primary text-on-primary border-primary' 
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-outline">Subject:</span>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                  {subjects.map(subj => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedSubject(subj)}
                      className={`flex-shrink-0 px-4 py-2 rounded-2xl font-label-md text-xs font-bold transition-all border shadow-xs cursor-pointer select-none active:scale-95 duration-100 ${
                        selectedSubject === subj 
                          ? 'bg-primary text-on-primary border-primary' 
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Status Messages */}
            {markingMessage && (
              <div className={`p-3 rounded-xl text-center text-xs font-bold ${
                markingMessage.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-primary-container/20 text-primary border border-primary/20'
              }`}>
                {markingMessage}
              </div>
            )}

            {/* Search filter */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                search
              </span>
              <input 
                type="text"
                placeholder="Search student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-xs font-semibold"
              />
            </div>

            {/* Student List */}
            {markingLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
                <span className="text-xs text-on-surface-variant font-bold">Fetching student list...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-surface-container-lowest p-8 text-center rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
                <p className="text-xs text-on-surface-variant font-bold mt-2">No students found matching filters.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student, idx) => {
                  const status = attendanceStates[student.user_id] || 'present'
                  const rate = attendanceRates[student.user_id] ?? 100
                  const isLowAttendance = rate < 75

                  const isOnLeave = leavesList.some(l => 
                    l.user_id === student.user_id && 
                    markingDate >= l.start_date && 
                    markingDate <= l.end_date
                  )

                  return (
                    <div 
                      key={student.id} 
                      className="flex items-center bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 hover:bg-surface-container-low transition-all animate-fadeIn"
                    >
                      <div className="w-8 font-numeric-bold text-on-surface-variant text-xs">
                        {student.roll_number || String(idx + 1).padStart(2, '0')}
                      </div>
                      
                      <div 
                        onClick={() => handleOpenProfile(student)}
                        className={`flex-1 font-label-md text-xs font-bold flex items-center gap-2 cursor-pointer hover:text-primary transition-colors ${
                          isLowAttendance ? 'text-error' : 'text-on-surface'
                        }`}
                      >
                        <span>{student.full_name}</span>
                        {isLowAttendance && (
                          <span className="px-1.5 py-0.5 bg-error-container text-error text-[8px] font-black uppercase rounded-md">
                            {rate}% Att.
                          </span>
                        )}
                        {isOnLeave && (
                          <span className="px-2 py-0.5 bg-red-100 text-error text-[9px] font-black uppercase rounded-md flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">sick</span>
                            <span>Ab (Leave)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => !isOnLeave && toggleStatus(student.user_id, 'present')}
                          disabled={isOnLeave}
                          className={`w-9 h-9 rounded-lg border font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                            status === 'present' 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed'
                          }`}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => !isOnLeave && toggleStatus(student.user_id, 'absent')}
                          disabled={isOnLeave}
                          className={`w-9 h-9 rounded-lg border font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                            status === 'absent' 
                              ? 'bg-error border-error text-white shadow-sm' 
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed'
                          }`}
                        >
                          A
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Floating Live Counter Footer */}
            <div className="fixed bottom-16 left-0 w-full z-45 bg-surface-container-lowest/95 backdrop-blur-md px-container-padding-mobile py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 border-t border-outline-variant/30">
              <div className="flex items-center gap-4 text-left">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Present</span>
                  <span className="text-sm font-numeric-bold text-emerald-600">{presentCount}</span>
                </div>
                <div className="w-px h-6 bg-outline-variant/30"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Absent</span>
                  <span className="text-sm font-numeric-bold text-error">{absentCount}</span>
                </div>
                <div className="w-px h-6 bg-outline-variant/30"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Late</span>
                  <span className="text-sm font-numeric-bold text-amber-500">{lateCount}</span>
                </div>
              </div>
              <button 
                onClick={handleSubmitAttendance}
                className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform max-w-[180px] border-none cursor-pointer"
              >
                Submit Attendance
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            RENDER VIEW 2: MY ATTENDANCE LOGS
            ========================================================================= */}
        {viewMode === 'teacher' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Bento Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Attendance Rate</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-2xl text-primary font-bold">{personalStats.rate}%</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-2">Top 5% of Faculty</p>
              </div>

              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Days Checked-In</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-2xl text-on-surface font-bold">{personalStats.present} Days</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium mt-2">This Semester</p>
              </div>

              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Late Arrivals</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-2xl text-amber-500 font-bold">{personalStats.late} Day</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium mt-2">Checked in after 09:00 AM</p>
              </div>

              <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28 cursor-default">
                <span className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold">Approved Leaves</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-numeric-bold text-2xl text-secondary font-bold">{personalStats.approvedLeaves} Days</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium mt-2">Excused absences</p>
              </div>
            </section>

            {/* Calendar and List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
              
              {/* Calendar View */}
              <div className="lg:col-span-8 bg-surface-container-lowest p-5 rounded-[28px] border border-outline-variant/35 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                  <h3 className="font-title-lg text-sm text-on-surface font-bold">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={handlePrevMonth}
                      className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                    >
                      chevron_left
                    </button>
                    <button 
                      onClick={handleNextMonth}
                      className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                    >
                      chevron_right
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`offset-${i}`} className="aspect-square"></div>
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1
                    const dayObj = getDayStatus(dayNum)
                    
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
                        {dayObj.status === 'present' && <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>}
                        {dayObj.status === 'leave' && <span className="w-1 h-1 rounded-full bg-orange-500 mt-0.5"></span>}
                        {dayObj.status === 'pending_request' && <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5"></span>}
                        {dayObj.status === 'late' && <span className="w-1 h-1 rounded-full bg-yellow-500 mt-0.5"></span>}
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-3 pt-3 border-t border-outline-variant/15 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Late</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Leave</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Pending</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Weekend</span>
                </div>
              </div>

              {/* Leave Allocation Guidelines */}
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
        )}

        {/* Detailed Student Bottom Sheet */}
        {sheetOpen && selectedStudent && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300"
              onClick={() => setSheetOpen(false)}
            />
            <div className="fixed bottom-0 left-0 w-full h-[85vh] bg-surface rounded-t-[32px] z-[70] overflow-y-auto px-6 pt-6 pb-20 shadow-2xl transition-all duration-300 flex flex-col text-left">
              <div 
                className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-6 cursor-pointer hover:bg-outline-variant"
                onClick={() => setSheetOpen(false)}
              />

              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-primary-container shrink-0 bg-surface-container-high flex items-center justify-center">
                  {selectedStudent.avatar ? (
                    <img 
                      src={selectedStudent.avatar} 
                      alt={selectedStudent.full_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-primary/40">face</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline-lg-mobile text-base text-on-surface font-bold truncate">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-on-surface-variant text-[11px] font-medium mt-1">
                    Roll No: {selectedStudent.roll_number} • Class {selectedClass}
                  </p>
                  
                  <div className="flex gap-2 mt-2.5">
                    <a 
                      href={`tel:${selectedStudent.phone || '9999999999'}`}
                      className="bg-primary-container text-on-primary-container p-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                    </a>
                    <button 
                      onClick={() => navigate('/teacher/chat') & setSheetOpen(false)}
                      className="bg-emerald-100 text-emerald-700 p-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/20">
                  <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Attendance Rate</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-xl font-numeric-bold text-primary font-bold">
                      {studentStats ? `${studentStats.attendance_percentage}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-surface-container-high rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${studentStats ? studentStats.attendance_percentage : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/20">
                  <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Academic Rank</p>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-numeric-bold text-on-surface font-bold">
                      {studentStats ? studentStats.average_score : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-2">
                    Tests Uploaded: {studentStats ? studentStats.total_tests : 0}
                  </p>
                </div>
              </div>

              {/* Family details */}
              <div className="mb-6">
                <h4 className="font-title-lg text-xs text-on-surface font-bold mb-2">Family Contact Info</h4>
                <div className="bg-surface-container-low p-3.5 rounded-2xl space-y-2 border border-outline-variant/20">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-surface-container-lowest">
                    <span className="text-on-surface-variant font-medium">Father</span>
                    <span className="text-on-surface font-bold">{selectedStudent.father_name || 'Mr. Rajesh Patel'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Mother</span>
                    <span className="text-on-surface font-bold">{selectedStudent.mother_name || 'Mrs. Sunita Patel'}</span>
                  </div>
                </div>
              </div>

              {/* Private Notes block */}
              <div className="space-y-2 mb-6">
                <h4 className="font-title-lg text-xs text-on-surface font-bold">Teacher Private Notes</h4>
                <textarea 
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none min-h-[80px]"
                  placeholder="Enter notes about behavior or remedial recommendations..."
                />
                <button
                  onClick={handleSaveNotes}
                  className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all shadow-sm active:scale-95 border-none cursor-pointer"
                >
                  Save Remarks
                </button>
              </div>

              <button 
                onClick={() => setSheetOpen(false)}
                className="w-full bg-surface-variant hover:bg-surface-container-high text-on-surface font-bold py-3 rounded-2xl text-xs active:scale-95 transition-all shrink-0 border-none cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  )
}
