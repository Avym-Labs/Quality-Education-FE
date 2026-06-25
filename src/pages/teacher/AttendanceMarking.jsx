import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function AttendanceMarking() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Date defaults to today's date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })

  // Parse classes and sections
  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '10-A')
  
  // Subjects
  const subjects = user?.subjects || ['Mathematics', 'Science']
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Mathematics')

  const [students, setStudents] = useState([])
  const [attendanceStates, setAttendanceStates] = useState({}) // student user_id -> 'present' | 'absent' | 'late'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Bottom Sheet selected student
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [studentStats, setStudentStats] = useState(null)
  const [studentNotes, setStudentNotes] = useState('')

  // Load students and existing attendance when class changes
  useEffect(() => {
    async function loadStudentsAndAttendance() {
      if (!selectedClass) return
      setLoading(true)
      setMessage('')
      try {
        const [grade, section] = selectedClass.split('-')
        
        // Fetch students
        const studRes = await api.get('/students', {
          params: { grade, section: section || '' }
        })
        const studentList = studRes.data || []
        setStudents(studentList)

        // Fetch existing attendance for this class, subject and date
        const attRes = await api.get('/attendance', {
          params: {
            grade,
            section: section || '',
            subject: selectedSubject,
            date: selectedDate
          }
        })
        const attRecords = attRes.data || []

        // Map existing attendance or default to 'present'
        const initialStates = {}
        studentList.forEach(s => {
          // Find if there is an existing record
          const record = attRecords.find(r => r.student_id === s.user_id)
          initialStates[s.user_id] = record ? record.status : 'present'
        })
        setAttendanceStates(initialStates)
      } catch (err) {
        console.error('Failed to load attendance marking data:', err)
        setMessage('Error loading students list.')
      } finally {
        setLoading(false)
      }
    }
    loadStudentsAndAttendance()
  }, [selectedClass, selectedSubject, selectedDate])

  // Open bottom sheet profile
  const handleOpenProfile = async (student) => {
    setSelectedStudent(student)
    setSheetOpen(true)
    setStudentStats(null)
    
    // Load student notes from localStorage if available
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

  // Save student remarks
  const handleSaveNotes = () => {
    if (selectedStudent) {
      localStorage.setItem(`note_${selectedStudent.id}`, studentNotes)
      setMessage(`Remarks updated for ${selectedStudent.full_name}`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Toggle student status
  const toggleStatus = (userId, status) => {
    setAttendanceStates(prev => ({
      ...prev,
      [userId]: status
    }))
  }

  // Get live counts
  const presentCount = Object.values(attendanceStates).filter(s => s === 'present').length
  const absentCount = Object.values(attendanceStates).filter(s => s === 'absent').length
  const lateCount = Object.values(attendanceStates).filter(s => s === 'late').length

  // Submit attendance
  const handleSubmitAttendance = async () => {
    setMessage('')
    try {
      const [grade, section] = selectedClass.split('-')
      const entries = Object.keys(attendanceStates).map(userId => ({
        student_id: userId,
        status: attendanceStates[userId]
      }))

      if (entries.length === 0) {
        setMessage('No student records found to mark.')
        return
      }

      await api.post('/attendance', {
        date: selectedDate,
        grade,
        section: section || '',
        subject: selectedSubject,
        entries
      })

      setMessage('Attendance submitted successfully!')
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to submit attendance:', err)
      setMessage('Failed to submit attendance records.')
    }
  }

  // Filter students based on search query
  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-36">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Attendance Manager
              </h2>
              <p className="text-on-surface-variant text-xs font-medium mt-0.5">
                {formattedDate}
              </p>
            </div>
          </div>
          
          {/* Top Selection Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {assignedClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Subjects horizontal selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
          {subjects.map(subj => {
            const isSelected = selectedSubject === subj
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all shadow-sm ${
                  isSelected 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {subj}
              </button>
            )
          })}
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold ${
            message.includes('success') 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-primary-container/20 text-primary border border-primary/20'
          }`}>
            {message}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
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
        </div>

        {/* Loading Indicator */}
        {loading ? (
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
          /* High Density List */
          <div className="space-y-2">
            {filteredStudents.map((student, idx) => {
              const status = attendanceStates[student.user_id] || 'present'
              // Dummy condition for needs attention
              const alertStatus = (idx === 1 || idx === 5)
              return (
                <div 
                  key={student.id} 
                  className="flex items-center bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20 hover:bg-surface-container-low transition-all"
                >
                  <div className="w-8 font-numeric-bold text-on-surface-variant text-xs">
                    {student.roll_number || String(idx + 1).padStart(2, '0')}
                  </div>
                  
                  {/* Click name to open bottom sheet */}
                  <div 
                    onClick={() => handleOpenProfile(student)}
                    className="flex-1 font-label-md text-xs font-bold text-on-surface flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                  >
                    <span>{student.full_name}</span>
                    {alertStatus && (
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    )}
                  </div>

                  {/* Attendance toggle buttons */}
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => toggleStatus(student.user_id, 'present')}
                      className={`w-9 h-9 rounded-lg border font-bold text-xs transition-all active:scale-95 ${
                        status === 'present' 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      P
                    </button>
                    <button 
                      onClick={() => toggleStatus(student.user_id, 'absent')}
                      className={`w-9 h-9 rounded-lg border font-bold text-xs transition-all active:scale-95 ${
                        status === 'absent' 
                          ? 'bg-error border-error text-white shadow-sm' 
                          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      A
                    </button>
                    <button 
                      onClick={() => toggleStatus(student.user_id, 'late')}
                      className={`w-9 h-9 rounded-lg border font-bold text-xs transition-all active:scale-95 ${
                        status === 'late' 
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      L
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Live Counters and Submit Footer Panel */}
        <div className="fixed bottom-16 left-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-md px-container-padding-mobile py-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 border-t border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Present</span>
              <span className="text-base font-numeric-bold text-emerald-600">{presentCount}</span>
            </div>
            <div className="w-px h-6 bg-outline-variant/30"></div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Absent</span>
              <span className="text-base font-numeric-bold text-error">{absentCount}</span>
            </div>
            <div className="w-px h-6 bg-outline-variant/30"></div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Late</span>
              <span className="text-base font-numeric-bold text-amber-500">{lateCount}</span>
            </div>
          </div>
          <button 
            onClick={handleSubmitAttendance}
            className="flex-1 bg-primary text-on-primary py-3 rounded-2xl font-bold text-xs shadow-md shadow-primary/20 active:scale-95 transition-transform max-w-[200px]"
          >
            Submit Attendance
          </button>
        </div>

        {/* Detailed Student Bottom Sheet */}
        {sheetOpen && selectedStudent && (
          <>
            {/* Sheet Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300"
              onClick={() => setSheetOpen(false)}
            />
            {/* Sliding Panel */}
            <div className="fixed bottom-0 left-0 w-full h-[85vh] bg-surface rounded-t-[32px] z-[70] overflow-y-auto px-6 pt-6 pb-20 shadow-2xl transition-all duration-300 flex flex-col">
              
              {/* Drag Handle */}
              <div 
                className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-6 cursor-pointer hover:bg-outline-variant"
                onClick={() => setSheetOpen(false)}
              />

              {/* Student Header */}
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
                  <div className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase mb-1.5">
                    <span className="material-symbols-outlined text-[10px]">warning</span>
                    <span>Needs Attention</span>
                  </div>
                  <h3 className="font-headline-lg-mobile text-base text-on-surface font-bold truncate">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-on-surface-variant text-[11px] font-medium">
                    Roll No: {selectedStudent.roll_number} • Class {selectedClass}
                  </p>
                  
                  {/* Quick Contact Buttons */}
                  <div className="flex gap-2 mt-2.5">
                    <a 
                      href={`tel:${selectedStudent.phone || '9999999999'}`}
                      className="bg-primary-container text-on-primary-container p-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                    </a>
                    <button 
                      onClick={() => navigate('/teacher/chat')}
                      className="bg-emerald-100 text-emerald-700 p-2 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/20">
                  <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Attendance Rate</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-xl font-numeric-bold text-primary font-bold">
                      {studentStats ? `${studentStats.attendance_percentage}%` : 'N/A'}
                    </span>
                    {studentStats && studentStats.attendance_percentage < 75 && (
                      <span className="text-[10px] text-error font-bold mb-0.5">- Critical</span>
                    )}
                  </div>
                  <div className="w-full h-1 bg-surface-container-high rounded-full mt-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        studentStats && studentStats.attendance_percentage < 75 ? 'bg-error' : 'bg-primary'
                      }`}
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
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">trending_up</span>
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

              {/* Academic Progress Sparkline */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-title-lg text-xs text-on-surface font-bold">Recent Academic Trend</h4>
                  <span className="text-emerald-600 font-bold text-[11px]">+5.2% Improvement</span>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/20">
                  <div className="h-16 w-full flex items-end gap-1">
                    <div className="flex-1 bg-primary/10 h-[40%] rounded-t"></div>
                    <div className="flex-1 bg-primary/10 h-[60%] rounded-t"></div>
                    <div className="flex-1 bg-primary/10 h-[45%] rounded-t"></div>
                    <div className="flex-1 bg-primary/10 h-[70%] rounded-t"></div>
                    <div className="flex-1 bg-primary/15 h-[55%] rounded-t"></div>
                    <div className="flex-1 bg-primary/20 h-[80%] rounded-t"></div>
                    <div className="flex-1 bg-primary/20 h-[75%] rounded-t"></div>
                    <div className="flex-1 bg-primary h-[90%] rounded-t shadow-sm"></div>
                  </div>
                </div>
              </div>

              {/* Private Notes block */}
              <div className="space-y-2 mb-6">
                <h4 className="font-title-lg text-xs text-on-surface font-bold">Teacher Private Notes</h4>
                <textarea 
                  value={studentNotes}
                  onChange={(e) => setSheetOpen(true) & setStudentNotes(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none min-h-[80px]"
                  placeholder="Enter notes about behavior, remedial classes recommended, or parent-teacher meeting notes..."
                />
                <button
                  onClick={handleSaveNotes}
                  className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all shadow-sm active:scale-95"
                >
                  Save Remarks
                </button>
              </div>

              <button 
                onClick={() => setSheetOpen(false)}
                className="w-full bg-surface-variant hover:bg-surface-container-high text-on-surface font-bold py-3 rounded-2xl text-xs active:scale-95 transition-all shrink-0"
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
