import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function TeacherAttendance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'teacher'

  // View Mode: 'students' (Student Attendance - Default) | 'teacher' (My Attendance)
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

  const assignedClasses = user?.assigned_classes || []
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '')

  const subjects = user?.subjects || []
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '')

  const [students, setStudents] = useState([])
  const [attendanceStates, setAttendanceStates] = useState({}) // user_id -> 'present' | 'absent' | 'late'
  const [leavesList, setLeavesList] = useState([])
  const [attendanceRates, setAttendanceRates] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [markingLoading, setMarkingLoading] = useState(false)
  const [markingMessage, setMarkingMessage] = useState('')
  const [classHistory, setClassHistory] = useState([])
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [activeFilterTab, setActiveFilterTab] = useState('class')
  // Whether attendance has already been recorded for the selected date/class/subject
  const [attendanceTaken, setAttendanceTaken] = useState(false)

  const getAvatarColors = (index) => {
    const mod = index % 3
    if (mod === 0) {
      return { bg: 'bg-[#FDE8E4]', text: 'text-[#FF6B49]' }
    } else if (mod === 1) {
      return { bg: 'bg-[#EAE8FC]', text: 'text-[#6351E0]' }
    } else {
      return { bg: 'bg-[#E3EEFE]', text: 'text-[#4681F1]' }
    }
  }

  const getWeekDays = (refDateStr) => {
    if (!refDateStr) return []
    const refDate = new Date(refDateStr)
    const day = refDate.getDay()
    const sunday = new Date(refDate)
    sunday.setDate(refDate.getDate() - day)
    
    const week = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      week.push(d)
    }
    return week
  }

  const handleShiftWeek = (days) => {
    const d = new Date(markingDate)
    d.setDate(d.getDate() + days)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setMarkingDate(`${yyyy}-${mm}-${dd}`)
  }

  const getDayAttendanceStatus = (dayDate) => {
    const dStr = dayDate.toISOString().split('T')[0]
    
    const recordsOnDate = classHistory.filter(r => 
      r.date && r.date.split('T')[0] === dStr && r.subject === selectedSubject
    )
    
    if (recordsOnDate.length === 0) {
      const dayOfWeek = dayDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend'
      return 'norecord'
    }
    
    const total = recordsOnDate.length
    const present = recordsOnDate.filter(r => r.status === 'present').length
    const rate = (present / total) * 100
    return rate >= 75 ? 'present' : 'late'
  }

  // Bottom Sheet selected student
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [studentStats, setStudentStats] = useState(null)
  const [studentNotes, setStudentNotes] = useState('')

  // Load students and existing attendance when filters change
  useEffect(() => {
    // Guards against a slower, older request (e.g. from a date rapidly
    // tapped through) resolving after a newer one and overwriting state
    // with stale data.
    let cancelled = false
    async function loadStudentsAndAttendance() {
      if (viewMode !== 'students' || !selectedClass || !selectedSubject) return
      setMarkingLoading(true)
      setMarkingMessage('')
      try {
        const [grade, section] = selectedClass.split('-')

        // Fetch students — scoped to this exact class+subject; the backend
        // 403s if this teacher isn't actually assigned to teach this
        // subject in this class.
        const studRes = await api.get('/students', {
          params: { grade, section: section || '', subject: selectedSubject }
        })
        if (cancelled) return
        const studentList = studRes.data || []
        setStudents(studentList)

        // Fetch approved leaves
        const leavesRes = await api.get('/leave', {
          params: { status: 'approved' }
        })
        if (cancelled) return
        const approvedLeaves = leavesRes.data || []
        setLeavesList(approvedLeaves)

        // Fetch historical attendance to calculate rates
        const historyRes = await api.get('/attendance', {
          params: { grade, section: section || '' }
        })
        if (cancelled) return
        const classHistory = historyRes.data || []
        setClassHistory(classHistory)

        // Fetch existing attendance for the selected date
        const attRes = await api.get('/attendance', {
          params: {
            grade,
            section: section || '',
            subject: selectedSubject,
            date: markingDate
          }
        })
        if (cancelled) return
        const attRecords = attRes.data || []
        // A submitted lecture always writes one record per roster student, so
        // any existing record for this date/class/subject means it's locked.
        setAttendanceTaken(attRecords.length > 0)

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

        if (cancelled) return
        setAttendanceStates(initialStates)
        setAttendanceRates(computedRates)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load students list:', err)
        if (err.response?.status === 403) {
          setStudents([])
          setAttendanceStates({})
          setMarkingMessage(err.response?.data?.detail || `You are not assigned to teach ${selectedSubject} in ${selectedClass}.`)
        } else {
          setMarkingMessage('Error loading students list.')
        }
      } finally {
        if (!cancelled) setMarkingLoading(false)
      }
    }
    loadStudentsAndAttendance()
    return () => { cancelled = true }
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

  const handleStartChat = () => {
    if (!user || !selectedStudent) return
    const sortedIds = [user.id, selectedStudent.user_id].sort()
    const conversationId = `${sortedIds[0]}__${sortedIds[1]}`
    setSheetOpen(false)
    navigate(`/teacher/chat/${conversationId}`)
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

  // Whether a student is on approved leave for the currently viewed date, and
  // how many consecutive days (inclusive of the leave's start date) that leave
  // has run for as of that date — used to flag long absences in the list.
  const getLeaveInfo = (studentUserId) => {
    const leave = leavesList.find(l =>
      l.user_id === studentUserId &&
      markingDate >= l.start_date &&
      markingDate <= l.end_date
    )
    if (!leave) return { isOnLeave: false, daysSince: 0, leave: null }
    const daysSince = Math.floor((new Date(markingDate) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1
    return { isOnLeave: true, daysSince, leave }
  }

  const presentCount = Object.values(attendanceStates).filter(s => s === 'present').length
  const absentCount = Object.values(attendanceStates).filter(s => s === 'absent').length
  const lateCount = Object.values(attendanceStates).filter(s => s === 'late').length

  const handleSubmitAttendance = async () => {
    if (attendanceTaken) return
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

      setAttendanceTaken(true)
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

  // Desktop only: students grouped alphabetically by first name letter
  const studentsByLetter = {}
  filteredStudents.forEach(student => {
    const letter = student.full_name ? student.full_name.charAt(0).toUpperCase() : '#'
    if (!studentsByLetter[letter]) studentsByLetter[letter] = []
    studentsByLetter[letter].push(student)
  })
  const sortedLetters = Object.keys(studentsByLetter).sort()

  const formattedMarkingDate = new Date(markingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // =========================================================================
  // VIEW MODE 2: LEAVE REQUESTS (teacher's own leave history)
  // =========================================================================
  const [leaves, setLeaves] = useState([])
  const [personalLoading, setPersonalLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    async function loadLeaves() {
      if (viewMode !== 'teacher' || !user?.id) return
      setPersonalLoading(true)
      try {
        const res = await api.get('/leave', { params: { user_id: user.id } })
        setLeaves(res.data || [])
      } catch (err) {
        console.error('Failed to load leaves history:', err)
      } finally {
        setPersonalLoading(false)
      }
    }
    loadLeaves()
  }, [user, viewMode])

  // Leave Requests tab: partition the teacher's own leave history into
  // current (pending), approved, and rejected requests.
  const currentLeaveRequests = leaves.filter(l => l.status === 'pending')
  const approvedLeaveRequests = leaves.filter(l => l.status === 'approved')
  const pastLeaveRequests = leaves.filter(l => l.status === 'rejected')

  // Leave Requests tab also has a "Student Leave Applications" sub-view —
  // same Current/Approved/Rejected layout as the teacher's own leaves above,
  // but for students, with approve/reject actions on pending requests.
  const [leaveSubTab, setLeaveSubTab] = useState('my') // my | students
  const [studentLeaves, setStudentLeaves] = useState([])
  const [studentLeavesLoading, setStudentLeavesLoading] = useState(false)

  async function loadStudentLeaveApplications() {
    if (!user?.id) return
    setStudentLeavesLoading(true)
    try {
      const res = await api.get('/leave')
      const filtered = (res.data || []).filter(item => item.user?.role === 'student')
      setStudentLeaves(filtered)
    } catch (err) {
      console.error('Failed to load student leave applications:', err)
    } finally {
      setStudentLeavesLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'teacher' && leaveSubTab === 'students') {
      loadStudentLeaveApplications()
    }
  }, [viewMode, leaveSubTab, user])

  const handleStudentLeaveAction = async (leaveId, actionStatus) => {
    try {
      await api.patch(`/leave/${leaveId}`, { status: actionStatus })
      loadStudentLeaveApplications()
    } catch (err) {
      console.error('Failed to update student leave status:', err)
    }
  }

  const currentStudentLeaveRequests = studentLeaves.filter(l => l.status === 'pending')
  const approvedStudentLeaveRequests = studentLeaves.filter(l => l.status === 'approved')
  const rejectedStudentLeaveRequests = studentLeaves.filter(l => l.status === 'rejected')

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

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-36 text-left">
        
        {/* Header Block matching mockup */}
        <section className="flex items-center justify-between pb-3.5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <Icon
              name="arrow_back"
              className="text-primary cursor-pointer active:scale-95 transition-transform font-bold"
              onClick={() => navigate('/teacher/dashboard')}
            />
            <h1 className="text-[22px] font-bold text-on-surface">Attendance</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter Toggle Button */}
            <button 
              onClick={() => setFilterSheetOpen(true)}
              className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors border-none cursor-pointer active:scale-95 duration-100"
            >
              <Icon name="tune" className="text-[20px]" />
            </button>
          </div>
        </section>

        {/* Tab Selection Pill Container */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-full p-1 flex gap-1 max-w-md mx-auto mt-2 shadow-xs">
          <div 
            onClick={() => setViewMode('students')}
            className={`flex-1 text-center py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer select-none ${
              viewMode === 'students' 
                ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm font-black' 
                : 'text-on-surface-variant hover:bg-surface-container-low font-semibold'
            }`}
          >
            Student Attendance
          </div>
          <div
            onClick={() => setViewMode('teacher')}
            className={`flex-1 text-center py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer select-none ${
              viewMode === 'teacher'
                ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm font-black'
                : 'text-on-surface-variant hover:bg-surface-container-low font-semibold'
            }`}
          >
            Leave Requests
          </div>
        </div>

        {/* =========================================================================
            RENDER VIEW 1: STUDENT ATTENDANCE
            ========================================================================= */}
        {viewMode === 'students' && (assignedClasses.length === 0 || subjects.length === 0) && (
          <div className="bg-surface-container-lowest p-8 text-center rounded-2xl border border-outline-variant/30 animate-fadeIn">
            <Icon name="school" className="text-4xl text-on-surface-variant" />
            <p className="text-xs text-on-surface-variant font-bold mt-2">No classes or subjects are assigned to your profile yet. Contact your admin to get assigned before marking attendance.</p>
          </div>
        )}

        {viewMode === 'students' && assignedClasses.length > 0 && subjects.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6 items-start animate-fadeIn">
            {/* Left Control Panel Column (Calendar & Info) */}
            <div className="w-full lg:w-80 space-y-4 shrink-0 lg:sticky lg:top-20">
              {/* Week Strip Calendar View (Mobile / Tablet) */}
              <section className="lg:hidden p-4 w-full bg-white rounded-[24px] shadow-sm border border-outline-variant/35 space-y-3">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-on-surface">
                    {(() => {
                      const week = getWeekDays(markingDate)
                      const start = week[0]
                      const end = week[6]
                      return start.getMonth() === end.getMonth()
                        ? `${monthNames[start.getMonth()].slice(0, 3)} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`
                        : `${monthNames[start.getMonth()].slice(0, 3)} ${start.getDate()} - ${monthNames[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`
                    })()}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShiftWeek(-7)}
                      className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-lg transition-all border-none bg-transparent cursor-pointer text-sm font-bold"
                    >
                      <Icon name="chevron_left" />
                    </button>
                    <button
                      onClick={() => handleShiftWeek(7)}
                      className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-lg transition-all border-none bg-transparent cursor-pointer text-sm font-bold"
                    >
                      <Icon name="chevron_right" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getWeekDays(markingDate).map((d) => {
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    const isSelected = dateStr === markingDate
                    const status = getDayAttendanceStatus(d)
                    const isWeekend = status === 'weekend'

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setMarkingDate(dateStr)}
                        className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 font-numeric-bold text-xs cursor-pointer transition-all select-none relative border-none ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#6351E0] to-[#8F43F2] text-white shadow-md ring-2 ring-[#6351E0]/30 scale-105 font-black z-10'
                            : isWeekend
                              ? 'bg-transparent text-outline-variant/70 hover:bg-slate-100'
                              : 'bg-transparent text-on-surface hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="text-[8px] uppercase opacity-70">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]}</span>
                        <span className="leading-none text-sm">{d.getDate()}</span>
                        {!isSelected && status === 'present' && (
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>
                        )}
                        {!isSelected && status === 'late' && (
                          <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5"></span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Full Month Grid Calendar View (Desktop) */}
              <section className="hidden lg:block p-4 w-full bg-white rounded-[24px] shadow-sm border border-outline-variant/35 space-y-3">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-on-surface">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-lg transition-all border-none bg-transparent cursor-pointer text-sm font-bold"
                    >
                      <Icon name="chevron_left" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-lg transition-all border-none bg-transparent cursor-pointer text-sm font-bold"
                    >
                      <Icon name="chevron_right" />
                    </button>
                  </div>
                </div>

                {/* Day Names Header */}
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] uppercase font-bold tracking-wider text-on-surface-variant">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`m-off-${i}`} className="h-8"></div>
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                    const isSelected = dateStr === markingDate
                    const dayOfWeek = new Date(currentYear, currentMonth, dayNum).getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                    const hasRecord = classHistory.some(r => r.date && r.date.split('T')[0] === dateStr && r.subject === selectedSubject)

                    return (
                      <div 
                        key={`m-day-${dayNum}`}
                        onClick={() => setMarkingDate(dateStr)}
                        className={`h-8 rounded-xl flex flex-col items-center justify-center font-numeric-bold text-xs font-bold cursor-pointer transition-all select-none relative ${
                          isSelected 
                            ? 'bg-gradient-to-b from-[#6351E0] to-[#8F43F2] text-white shadow-md ring-2 ring-[#6351E0]/30 transform scale-105 font-black z-10' 
                            : isWeekend 
                              ? 'text-outline-variant/70 hover:bg-slate-100' 
                              : 'text-on-surface hover:bg-slate-100'
                        }`}
                      >
                        <span className="leading-none">{dayNum}</span>
                        {hasRecord && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-primary mt-0.5"></span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Active target Selection Bento Card Widget */}
              <div className="bg-gradient-to-br from-[#6351E0] to-[#9B51E0] p-5 rounded-[24px] text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-32 select-none hover:shadow-xl transition-all duration-300">
                {/* Decorative glowing background blur circles */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-lg pointer-events-none"></div>
                
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] uppercase tracking-widest font-black text-white/85">Attendance of</span>
                  <Icon name="radio_button_checked" className="text-[18px] text-white/90 animate-pulse" />
                </div>
                
                <div className="z-10 text-left">
                  <h3 className="text-lg font-black tracking-tight leading-none">Class {selectedClass}</h3>
                  <p className="text-xs font-semibold text-white/80 mt-1">{selectedSubject}</p>
                </div>
              </div>
            </div>

            {/* Right Main Content Column (Search & Student List Grid) */}
            <div className="flex-1 w-full space-y-4">
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

              {!markingLoading && !markingMessage && attendanceTaken && (
                <div className="p-3 rounded-xl text-center text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1.5">
                  <Icon name="check_circle" className="text-[16px]" />
                  Attendance already taken for Class {selectedClass} — {selectedSubject} on {formattedMarkingDate}.
                </div>
              )}

              {/* Search filter */}
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant text-[20px]" />
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
                  <Icon name="person_off" className="text-4xl text-on-surface-variant" />
                  <p className="text-xs text-on-surface-variant font-bold mt-2">No students found matching filters.</p>
                </div>
              ) : (
                (() => {
                  // Group filtered students by the first letter of their full_name
                  const groupedStudents = filteredStudents.reduce((acc, student) => {
                    const name = (student.full_name || 'Student').trim()
                    const firstLetter = name.charAt(0).toUpperCase()
                    const letterKey = /[A-Z]/.test(firstLetter) ? firstLetter : '#'
                    if (!acc[letterKey]) {
                      acc[letterKey] = []
                    }
                    acc[letterKey].push(student)
                    return acc
                  }, {})

                  const sortedLetters = Object.keys(groupedStudents).sort()

                  return (
                    <div className="space-y-6">
                      {sortedLetters.map((letter) => {
                        const groupList = groupedStudents[letter].sort((a, b) => 
                          (a.full_name || '').localeCompare(b.full_name || '')
                        )

                        return (
                          <div key={letter} className="space-y-3">
                            <h3 className="text-base font-black text-on-surface text-left pl-1 tracking-wider uppercase">
                              {letter}
                            </h3>
                            {/* Mobile: compact list rows */}
                            <div className="space-y-2 sm:hidden">
                              {groupList.map((student, idx) => {
                                const status = attendanceStates[student.user_id] || 'present'
                                const rate = attendanceRates[student.user_id] ?? 100
                                const isLowAttendance = rate < 75

                                const { isOnLeave, daysSince: leaveDaysSince } = getLeaveInfo(student.user_id)

                                return (
                                  <div
                                    key={student.id}
                                    className={`flex items-center gap-3 bg-white rounded-2xl p-3 shadow-xs border transition-all ${
                                      status === 'present'
                                        ? 'border-emerald-200/60'
                                        : status === 'absent'
                                          ? 'border-red-200/60'
                                          : 'border-outline-variant/30'
                                    }`}
                                  >
                                    {student.avatar ? (
                                      <img
                                        src={student.avatar}
                                        alt={student.full_name}
                                        className="w-11 h-11 rounded-full object-cover shrink-0 border border-outline-variant/20"
                                      />
                                    ) : (
                                      (() => {
                                        const initial = student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'
                                        const colors = getAvatarColors(idx)
                                        return (
                                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${colors.bg} ${colors.text}`}>
                                            {initial}
                                          </div>
                                        )
                                      })()
                                    )}

                                    <div
                                      onClick={() => handleOpenProfile(student)}
                                      className="flex-1 min-w-0 cursor-pointer"
                                    >
                                      <h4 className={`text-xs font-bold truncate hover:text-primary transition-colors ${
                                        isLowAttendance ? 'text-error' : 'text-[#1E1E1E]'
                                      }`}>
                                        {student.full_name}
                                      </h4>
                                      {(isLowAttendance || isOnLeave) && (
                                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                          {isLowAttendance && (
                                            <span className="px-1.5 py-0.5 bg-error-container text-error text-[8px] font-black uppercase rounded-md">
                                              {rate}% Att.
                                            </span>
                                          )}
                                          {isOnLeave && (
                                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md flex items-center gap-0.5 ${
                                              leaveDaysSince > 3 ? 'bg-error text-white animate-pulse' : 'bg-red-100 text-error'
                                            }`}>
                                              <Icon name="sick" className="text-[9px]" />
                                              <span>{leaveDaysSince > 3 ? `Absent ${leaveDaysSince} Days` : 'Leave'}</span>
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => !isOnLeave && !attendanceTaken && toggleStatus(student.user_id, 'present')}
                                        disabled={isOnLeave || attendanceTaken}
                                        title="Mark Present"
                                        className={`w-9 h-9 rounded-lg font-bold text-xs transition-all active:scale-95 ${attendanceTaken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                                          status === 'present'
                                            ? 'bg-[#00D284] text-white border-none shadow-sm font-black'
                                            : 'bg-white border border-[#D9D9D9] text-[#555] hover:bg-slate-50'
                                        }`}
                                      >
                                        P
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => !isOnLeave && !attendanceTaken && toggleStatus(student.user_id, 'absent')}
                                        disabled={isOnLeave || attendanceTaken}
                                        title="Mark Absent"
                                        className={`w-9 h-9 rounded-lg font-bold text-xs transition-all active:scale-95 ${attendanceTaken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                                          status === 'absent'
                                            ? 'bg-[#FF3B6B] text-white border-none shadow-sm font-black'
                                            : 'bg-white border border-[#D9D9D9] text-[#555] hover:bg-slate-50'
                                        }`}
                                      >
                                        A
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Tablet & up: original card grid */}
                            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                              {groupList.map((student, idx) => {
                                const status = attendanceStates[student.user_id] || 'present'
                                const rate = attendanceRates[student.user_id] ?? 100
                                const isLowAttendance = rate < 75

                                const { isOnLeave, daysSince: leaveDaysSince } = getLeaveInfo(student.user_id)

                                return (
                                  <div
                                    key={student.id}
                                    className={`flex flex-col items-center justify-between bg-white rounded-[24px] p-5 shadow-xs border transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden text-center min-h-[210px] ${
                                      status === 'present'
                                        ? 'border-emerald-200/60'
                                        : status === 'absent'
                                          ? 'border-red-200/60'
                                          : 'border-outline-variant/30'
                                    }`}
                                  >
                                    {/* Top Indicator Accent Bar */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 transition-colors duration-300 ${
                                      status === 'present'
                                        ? 'bg-[#00D284]'
                                        : status === 'absent'
                                          ? 'bg-[#FF3B6B]'
                                          : 'bg-transparent'
                                    }`} />

                                    {/* Top / Center Avatar & Name Container */}
                                    <div className="flex flex-col items-center w-full">
                                      {student.avatar ? (
                                        <img
                                          src={student.avatar}
                                          alt={student.full_name}
                                          className="w-16 h-16 rounded-full object-cover shadow-sm mb-3 border border-outline-variant/20"
                                        />
                                      ) : (
                                        (() => {
                                          const initial = student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'
                                          const colors = getAvatarColors(idx)
                                          return (
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl shadow-sm mb-3 ${colors.bg} ${colors.text} shrink-0`}>
                                              {initial}
                                            </div>
                                          )
                                        })()
                                      )}

                                      {/* Student Name */}
                                      <h4
                                        onClick={() => handleOpenProfile(student)}
                                        className={`text-sm font-bold leading-snug cursor-pointer hover:text-primary transition-colors text-center line-clamp-2 px-1 ${
                                          isLowAttendance ? 'text-error' : 'text-[#1E1E1E]'
                                        }`}
                                      >
                                        {student.full_name}
                                      </h4>

                                      {/* Badges / Information */}
                                      <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                                        {isLowAttendance && (
                                          <span className="px-1.5 py-0.5 bg-error-container text-error text-[8px] font-black uppercase rounded-md">
                                            {rate}% Att.
                                          </span>
                                        )}
                                        {isOnLeave && (
                                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md flex items-center gap-0.5 ${
                                            leaveDaysSince > 3 ? 'bg-error text-white animate-pulse' : 'bg-red-100 text-error'
                                          }`}>
                                            <Icon name="sick" className="text-[10px]" />
                                            <span>{leaveDaysSince > 3 ? `Absent ${leaveDaysSince} Days` : 'Leave'}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* P, A Action Buttons Row */}
                                    <div className="flex items-center justify-center gap-2 mt-4 pt-1 w-full">
                                      <button
                                        type="button"
                                        onClick={() => !isOnLeave && !attendanceTaken && toggleStatus(student.user_id, 'present')}
                                        disabled={isOnLeave || attendanceTaken}
                                        title="Mark Present"
                                        className={`px-5 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 ${attendanceTaken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                                          status === 'present'
                                            ? 'bg-[#00D284] text-white border-none shadow-sm font-black'
                                            : 'bg-white border border-[#D9D9D9] text-[#555] hover:bg-slate-50'
                                        }`}
                                      >
                                        P
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => !isOnLeave && !attendanceTaken && toggleStatus(student.user_id, 'absent')}
                                        disabled={isOnLeave || attendanceTaken}
                                        title="Mark Absent"
                                        className={`px-5 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 ${attendanceTaken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                                          status === 'absent'
                                            ? 'bg-[#FF3B6B] text-white border-none shadow-sm font-black'
                                            : 'bg-white border border-[#D9D9D9] text-[#555] hover:bg-slate-50'
                                        }`}
                                      >
                                        A
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}

              {/* Floating Live Counter Footer */}
              <div className="fixed bottom-16 md:bottom-0 left-0 md:left-64 w-full md:w-[calc(100%-16rem)] z-45 bg-surface-container-lowest/95 backdrop-blur-md px-container-padding-mobile md:px-8 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 border-t border-outline-variant/30">
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

                </div>
                <button
                  onClick={handleSubmitAttendance}
                  disabled={attendanceTaken}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-md transition-transform max-w-[180px] border-none flex items-center justify-center gap-1.5 ${
                    attendanceTaken
                      ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed shadow-none'
                      : 'bg-primary text-on-primary active:scale-95 cursor-pointer'
                  }`}
                >
                  {attendanceTaken && <Icon name="check_circle" className="text-[14px]" />}
                  {attendanceTaken ? 'Attendance Taken' : 'Submit Attendance'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            RENDER VIEW 2: LEAVE REQUESTS
            ========================================================================= */}
        {viewMode === 'teacher' && (
          <div className="space-y-5 animate-fadeIn max-w-2xl mx-auto w-full">
            {/* My Leaves / Student Applications sub-tabs */}
            <div className="bg-surface-container-low rounded-2xl p-1 flex gap-1 border border-outline-variant/25 max-w-md mx-auto">
              <button
                onClick={() => setLeaveSubTab('my')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  leaveSubTab === 'my'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                My Leaves
              </button>
              <button
                onClick={() => setLeaveSubTab('students')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  leaveSubTab === 'students'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Student Applications
              </button>
            </div>

            {leaveSubTab === 'my' ? (
              personalLoading ? (
                <div className="flex justify-center items-center py-16">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
                </div>
              ) : (
                <>
                  {/* Current Requests */}
                  <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="pending" className="text-base text-primary" />
                        <h3 className="font-title-lg text-sm text-on-surface font-bold">Current Requests</h3>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">{currentLeaveRequests.length}</span>
                    </div>
                    {currentLeaveRequests.length === 0 ? (
                      <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                        No pending leave requests.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentLeaveRequests.map(item => (
                          <div key={item.id} className="bg-surface-container-low rounded-[20px] border border-outline-variant/25 p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider">{item.leave_type}</span>
                              <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right">
                                {item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}
                              </span>
                            </div>
                            <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Approved Requests */}
                  <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="check_circle" className="text-base text-emerald-600" />
                        <h3 className="font-title-lg text-sm text-on-surface font-bold">Approved Requests</h3>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{approvedLeaveRequests.length}</span>
                    </div>
                    {approvedLeaveRequests.length === 0 ? (
                      <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                        No approved leave requests.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {approvedLeaveRequests.map(item => (
                          <div key={item.id} className="bg-surface-container-low rounded-[20px] border border-outline-variant/25 p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider">{item.leave_type}</span>
                              <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right">
                                {item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}
                              </span>
                            </div>
                            <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Rejected Requests */}
                  <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="cancel" className="text-base text-on-surface-variant" />
                        <h3 className="font-title-lg text-sm text-on-surface font-bold">Rejected Requests</h3>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">{pastLeaveRequests.length}</span>
                    </div>
                    {pastLeaveRequests.length === 0 ? (
                      <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                        No rejected leave requests.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pastLeaveRequests.map(item => (
                          <div key={item.id} className="bg-surface-container-low rounded-[20px] border border-outline-variant/25 p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider">{item.leave_type}</span>
                              <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right">
                                {item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}
                              </span>
                            </div>
                            <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )
            ) : studentLeavesLoading ? (
              <div className="flex justify-center items-center py-16">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
              </div>
            ) : (
              <>
                {/* Current Requests */}
                <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="pending" className="text-base text-primary" />
                      <h3 className="font-title-lg text-sm text-on-surface font-bold">Current Requests</h3>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">{currentStudentLeaveRequests.length}</span>
                  </div>
                  {currentStudentLeaveRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                      No pending student leave requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentStudentLeaveRequests.map(item => (
                        <div key={item.id} className="bg-surface-container-low rounded-[20px] border border-outline-variant/25 p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.user?.avatar ? (
                                <img src={item.user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover border border-outline-variant shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {item.user?.first_name?.[0]}{item.user?.last_name?.[0]}
                                </div>
                              )}
                              <span className="text-xs font-bold text-on-surface truncate">{item.user?.full_name || `${item.user?.first_name} ${item.user?.last_name}`}</span>
                            </div>
                            <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right shrink-0">
                              {item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider self-start">{item.leave_type}</span>
                          <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => handleStudentLeaveAction(item.id, 'rejected')}
                              className="flex items-center gap-1 px-3.5 py-2 bg-red-50 text-error rounded-xl font-bold text-xs hover:bg-red-100 active:scale-95 transition-all"
                            >
                              <Icon name="close" className="text-sm" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleStudentLeaveAction(item.id, 'approved')}
                              className="flex items-center gap-1 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-100 active:scale-95 transition-all"
                            >
                              <Icon name="check" className="text-sm" />
                              <span>Approve</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Approved Requests */}
                <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="check_circle" className="text-base text-emerald-600" />
                      <h3 className="font-title-lg text-sm text-on-surface font-bold">Approved Requests</h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{approvedStudentLeaveRequests.length}</span>
                  </div>
                  {approvedStudentLeaveRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                      No approved student leave requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {approvedStudentLeaveRequests.map(item => (
                        <div key={item.id} className="bg-surface-container-low rounded-[20px] border border-outline-variant/25 p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.user?.avatar ? (
                                <img src={item.user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover border border-outline-variant shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {item.user?.first_name?.[0]}{item.user?.last_name?.[0]}
                                </div>
                              )}
                              <span className="text-xs font-bold text-on-surface truncate">{item.user?.full_name || `${item.user?.first_name} ${item.user?.last_name}`}</span>
                            </div>
                            <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right shrink-0">
                              {item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider self-start">{item.leave_type}</span>
                          <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Rejected Requests */}
                <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-[28px] p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="cancel" className="text-base text-on-surface-variant" />
                      <h3 className="font-title-lg text-sm text-on-surface font-bold">Rejected Requests</h3>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">{rejectedStudentLeaveRequests.length}</span>
                  </div>
                  {rejectedStudentLeaveRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                      No rejected student leave requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rejectedStudentLeaveRequests.map(item => (
                        <div key={item.id} className="bg-surface-container-low rounded-[20px] border border-outline-variant/25 p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.user?.avatar ? (
                                <img src={item.user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover border border-outline-variant shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {item.user?.first_name?.[0]}{item.user?.last_name?.[0]}
                                </div>
                              )}
                              <span className="text-xs font-bold text-on-surface truncate">{item.user?.full_name || `${item.user?.first_name} ${item.user?.last_name}`}</span>
                            </div>
                            <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-wider text-right shrink-0">
                              {item.start_date === item.end_date ? item.start_date : `${item.start_date} - ${item.end_date}`}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/15 text-primary text-[9px] font-bold uppercase tracking-wider self-start">{item.leave_type}</span>
                          <p className="text-on-surface text-xs font-medium leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* Detailed Student Bottom Sheet */}
        {sheetOpen && selectedStudent && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300"
              onClick={() => setSheetOpen(false)}
            />
            <div className="fixed bottom-0 md:top-0 left-0 md:left-auto right-0 w-full md:w-96 h-[85vh] md:h-screen bg-white rounded-t-[32px] md:rounded-t-none md:rounded-l-[32px] z-[70] overflow-y-auto px-6 pt-6 pb-20 shadow-2xl transition-all duration-300 flex flex-col text-left">
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
                    <Icon name="face" className="text-4xl text-primary/40" />
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
                    {selectedStudent.phone ? (
                      <a
                        href={`tel:${selectedStudent.phone}`}
                        className="bg-primary-container text-on-primary-container p-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                      >
                        <Icon name="call" className="text-[16px]" />
                      </a>
                    ) : (
                      <span
                        title="No phone number on file"
                        className="bg-surface-container-high text-on-surface-variant/50 p-2 rounded-xl flex items-center justify-center cursor-not-allowed"
                      >
                        <Icon name="call" className="text-[16px]" />
                      </span>
                    )}
                    <button 
                      onClick={handleStartChat}
                      className="bg-emerald-100 text-emerald-700 p-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center border-none cursor-pointer"
                    >
                      <Icon name="chat" className="text-[16px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Long-absence alert (approved leave running more than 3 days) */}
              {(() => {
                const { isOnLeave, daysSince, leave } = getLeaveInfo(selectedStudent.user_id)
                if (!isOnLeave || daysSince <= 3) return null
                const startLabel = new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <div className="flex items-center gap-2.5 bg-error/10 border border-error/25 rounded-2xl p-3.5 mb-6">
                    <Icon name="sick" className="text-error text-xl shrink-0" />
                    <div>
                      <p className="text-xs font-black text-error">Absent since {daysSince} days</p>
                      <p className="text-[10px] font-semibold text-error/80 mt-0.5">On approved leave since {startLabel}</p>
                    </div>
                  </div>
                )
              })()}

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
                    <span className="text-on-surface font-bold">{selectedStudent.father_name || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant font-medium">Mother</span>
                    <span className="text-on-surface font-bold">{selectedStudent.mother_name || 'Not provided'}</span>
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

        {/* Filter Bottom Sheet Modal Overlay */}
        {filterSheetOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center z-50 animate-fadeIn duration-200">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] shadow-xl flex flex-col max-h-[85vh] animate-slideUp">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
                <h3 className="text-base font-black text-on-surface">Filter</h3>
                <button
                  onClick={() => setFilterSheetOpen(false)}
                  className="text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full border-none bg-transparent cursor-pointer active:scale-95"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Body split layout */}
              <div className="flex-1 flex overflow-hidden min-h-[300px]">
                {/* Left Tabs Sidebar */}
                <div className="w-1/3 bg-slate-50 border-r border-outline-variant/15 flex flex-col">
                  <div 
                    onClick={() => setActiveFilterTab('class')}
                    className={`py-4 px-5 text-xs font-bold cursor-pointer transition-all border-l-4 select-none ${
                      activeFilterTab === 'class'
                        ? 'bg-sky-50 text-[#6351E0] border-[#6351E0]'
                        : 'text-on-surface-variant border-transparent hover:bg-slate-100'
                    }`}
                  >
                    Class
                  </div>
                  <div 
                    onClick={() => setActiveFilterTab('subject')}
                    className={`py-4 px-5 text-xs font-bold cursor-pointer transition-all border-l-4 select-none ${
                      activeFilterTab === 'subject'
                        ? 'bg-sky-50 text-[#6351E0] border-[#6351E0]'
                        : 'text-on-surface-variant border-transparent hover:bg-slate-100'
                    }`}
                  >
                    Subject
                  </div>
                </div>

                {/* Right Options Content */}
                <div className="w-2/3 p-5 overflow-y-auto space-y-4">
                  {activeFilterTab === 'class' ? (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-outline">Select Class</span>
                      <div className="flex flex-wrap gap-2">
                        {assignedClasses.map(cls => {
                          const isSelected = selectedClass === cls
                          return (
                            <button
                              key={cls}
                              onClick={() => setSelectedClass(cls)}
                              className={`px-4 py-2 rounded-full font-bold text-xs transition-all border cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-[#6351E0] text-white border-none shadow-sm'
                                  : 'bg-white border-[#D9D9D9] text-[#1E1E1E] hover:bg-slate-50'
                              }`}
                            >
                              Class {cls}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-outline">Select Subject</span>
                      <div className="flex flex-wrap gap-2">
                        {subjects.map(subj => {
                          const isSelected = selectedSubject === subj
                          return (
                            <button
                              key={subj}
                              onClick={() => setSelectedSubject(subj)}
                              className={`px-4 py-2 rounded-full font-bold text-xs transition-all border cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-[#6351E0] text-white border-none shadow-sm'
                                  : 'bg-white border-[#D9D9D9] text-[#1E1E1E] hover:bg-slate-50'
                              }`}
                            >
                              {subj}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions footer */}
              <div className="p-4 border-t border-outline-variant/10 flex gap-3 bg-white">
                <button 
                  onClick={() => {
                    setSelectedClass(assignedClasses[0] || '')
                    setSelectedSubject(subjects[0] || '')
                    setFilterSheetOpen(false)
                  }}
                  className="flex-1 py-3 rounded-full border border-[#D9D9D9] text-[#1E1E1E] font-bold text-xs hover:bg-slate-50 border-none bg-transparent cursor-pointer"
                >
                  Reset
                </button>
                <button 
                  onClick={() => setFilterSheetOpen(false)}
                  className="flex-1 py-3 rounded-full bg-[#6351E0] text-white font-bold text-xs hover:opacity-95 shadow-md border-none cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
