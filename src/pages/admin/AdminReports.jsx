import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function AdminReports() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('class') // 'class' | 'teacher' | 'subject' | 'student'

  // General Metadata
  const [stats, setStats] = useState({
    totalStudents: 1240,
    totalTeachers: 86,
    attendanceRate: 94.2,
    overallAverage: 78.4
  })

  // s for dropdown selectors
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])

  // Student specific report card states
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [studentStats, setStudentStats] = useState(null)
  const [loadingStudent, setLoadingStudent] = useState(false)

  // Scoped Data Lists
  const classReports = [
    { grade: '9-A', average: 76.5, attendance: 92.4, topStudent: 'Sarah Jenkins', status: 'Optimal' },
    { grade: '9-C', average: 69.2, attendance: 88.5, topStudent: 'Ryan Baker', status: 'Needs Improvement' },
    { grade: '10-A', average: 81.2, attendance: 95.4, topStudent: 'Liam Wilson', status: 'Optimal' },
    { grade: '10-B', average: 78.9, attendance: 92.4, topStudent: 'Arjun H.', status: 'Optimal' },
    { grade: '11-B', average: 75.8, attendance: 93.1, topStudent: 'Emma Smith', status: 'Optimal' },
    { grade: '12-A', average: 84.5, attendance: 96.0, topStudent: 'Sofia Rodriguez', status: 'Optimal' }
  ]

  const subjectReports = [
    { subject: 'Mathematics', faculty: 'Dr. Julian Scott, Prof. Sarah Mitchell', avgScore: 82, passRate: 94 },
    { subject: 'Physics', faculty: 'Dr. James Carter', avgScore: 76, passRate: 89 },
    { subject: 'Chemistry', faculty: 'Prof. Helen Clark', avgScore: 78, passRate: 91 },
    { subject: 'Biology', faculty: 'Dr. Lisa Vance', avgScore: 80, passRate: 93 },
    { subject: 'History', faculty: 'Ms. Elena Rodriguez', avgScore: 68, passRate: 85 },
    { subject: 'English Literature', faculty: 'Prof. Alice Murray', avgScore: 89, passRate: 97 }
  ]

  // Helper helper to return letter grades
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  // Load s and counts
  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, teachersRes, studentsRes] = await Promise.all([
          api.get('/admin/analytics', { params: { type: 'overall' } }),
          api.get('/teachers'),
          api.get('/students')
        ])
        
        if (analyticsRes.data) {
          setStats({
            totalStudents: analyticsRes.data.total_students || 1240,
            totalTeachers: analyticsRes.data.total_teachers || 86,
            attendanceRate: analyticsRes.data.attendance_rate || 94.2,
            overallAverage: analyticsRes.data.avg_results || 78.4
          })
        }
        setTeachers(teachersRes.data || [])
        setStudents(studentsRes.data || [])
      } catch (err) {
        console.error('Failed to load reports metadata:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Load student-specific metrics when student selection changes
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentResults([])
      setStudentStats(null)
      return
    }

    async function loadStudentDetail() {
      setLoadingStudent(true)
      try {
        const studentObj = students.find(s => s.id === selectedStudentId)
        if (!studentObj) return

        const [resultsRes, statsRes] = await Promise.all([
          api.get('/results', { params: { student_id: studentObj.user_id } }),
          api.get(`/students/${studentObj.id}/stats`)
        ])
        setStudentResults(resultsRes.data || [])
        setStudentStats(statsRes.data || null)
      } catch (err) {
        console.error('Failed to load student report card details:', err)
      } finally {
        setLoadingStudent(false)
      }
    }
    loadStudentDetail()
  }, [selectedStudentId])

  const handlePrint = () => {
    window.print()
  }

  // Find currently selected student object
  const currentStudentObj = students.find(s => s.id === selectedStudentId)

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 print:p-0 print:m-0">
        
        {/* Header Options - Hidden in Print */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-outline-variant/20 print:hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Institutional Reports
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                Configure, review, and print multi-perspective administrative summaries.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scoping Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Report Type:</span>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value)
                  setSelectedStudentId('')
                }}
                className="bg-transparent border-none p-0 text-xs font-bold text-primary focus:ring-0 outline-none cursor-pointer"
              >
                <option value="class">Class Wise</option>
                <option value="teacher">Teacher Wise</option>
                <option value="subject">Subject Wise</option>
                <option value="student">Student Wise</option>
              </select>
            </div>

            <button 
              onClick={handlePrint}
              disabled={reportType === 'student' && !selectedStudentId}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-xl text-xs font-bold hover:shadow-md cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print Page</span>
            </button>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-12 print:hidden">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Student Selector Row - Hidden in Print */}
            {reportType === 'student' && (
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-sm print:hidden flex flex-col gap-1.5 max-w-md mx-auto">
                <label className="font-bold text-[10px] text-on-surface-variant uppercase">Select Student Report Card</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary cursor-pointer text-xs font-semibold"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} (Class {s.grade}-{s.section})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Printable Report Wrapper */}
            {reportType === 'student' && !selectedStudentId ? (
              <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 print:hidden">
                <span className="material-symbols-outlined text-outline text-4xl mb-2">assignment_ind</span>
                <p className="text-xs font-bold text-on-surface-variant">Please choose a student from the dropdown above to render their report card.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
                
                {/* Document Official Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-5">
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">EduCore Institutional Reports</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                  </div>
                </div>

                {/* Core KPIs Panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                    <p className="text-[9px] uppercase font-bold text-outline">Total Students</p>
                    <p className="text-xl font-black text-primary mt-1">{stats.totalStudents}</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                    <p className="text-[9px] uppercase font-bold text-outline">Faculty Count</p>
                    <p className="text-xl font-black text-secondary mt-1">{stats.totalTeachers}</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                    <p className="text-[9px] uppercase font-bold text-outline">Overall GPA Avg</p>
                    <p className="text-xl font-black text-tertiary mt-1">{stats.overallAverage}%</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                    <p className="text-[9px] uppercase font-bold text-outline">Attendance Rate</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">{stats.attendanceRate}%</p>
                  </div>
                </div>

                {/* Scoped Report Layout 1: Class Wise */}
                {reportType === 'class' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-outline-variant/20 pb-1">Class-wise performance</h3>
                    <div className="border border-outline-variant/25 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-outline-variant/20 font-bold text-on-surface-variant">
                            <th className="p-3">Class/Section</th>
                            <th className="p-3">Academic Average</th>
                            <th className="p-3">Attendance Ratio</th>
                            <th className="p-3">Top Performer</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 font-semibold text-on-surface">
                          {classReports.map((cls, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low/30">
                              <td className="p-3">Class {cls.grade}</td>
                              <td className="p-3">{cls.average}%</td>
                              <td className="p-3 text-emerald-700">{cls.attendance}%</td>
                              <td className="p-3 text-primary">{cls.topStudent}</td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                  cls.status.includes('Improvement') 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {cls.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Scoped Report Layout 2: Teacher Wise */}
                {reportType === 'teacher' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-outline-variant/20 pb-1">Faculty Instruction ledger</h3>
                    <div className="border border-outline-variant/25 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-outline-variant/20 font-bold text-on-surface-variant">
                            <th className="p-3">Teacher</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Assigned Classes</th>
                            <th className="p-3">Subjects</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 font-semibold text-on-surface text-xs">
                          {teachers.map((t, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low/30">
                              <td className="p-3 font-bold text-gray-900">{t.full_name}</td>
                              <td className="p-3 uppercase text-[10px] text-outline font-bold">{t.department || 'N/A'}</td>
                              <td className="p-3">{t.assigned_classes?.join(', ') || 'None'}</td>
                              <td className="p-3 font-medium text-on-surface-variant">{t.subjects?.join(', ') || 'None'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Scoped Report Layout 3: Subject Wise */}
                {reportType === 'subject' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-outline-variant/20 pb-1">Curricular Average index</h3>
                    <div className="border border-outline-variant/25 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-outline-variant/20 font-bold text-on-surface-variant">
                            <th className="p-3">Subject</th>
                            <th className="p-3">Instructional Faculty</th>
                            <th className="p-3">School Avg Score</th>
                            <th className="p-3 text-right">Pass Rate (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 font-semibold text-on-surface">
                          {subjectReports.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low/30">
                              <td className="p-3 font-bold text-gray-900">{sub.subject}</td>
                              <td className="p-3 text-on-surface-variant text-[11px] font-medium">{sub.faculty}</td>
                              <td className="p-3 font-bold text-primary">{sub.avgScore}%</td>
                              <td className="p-3 text-right text-emerald-700 font-bold">{sub.passRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Scoped Report Layout 4: Student Wise Report Card */}
                {reportType === 'student' && selectedStudentId && currentStudentObj && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {loadingStudent ? (
                      <div className="text-center py-10">
                        <span className="material-symbols-outlined animate-spin text-primary text-xl">progress_activity</span>
                        <p className="text-[10px] text-on-surface-variant mt-2">Fetching student details...</p>
                      </div>
                    ) : (
                      <>
                        {/* Student Information Block */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-outline-variant/20 p-4 rounded-2xl bg-surface-container-low/50 text-xs">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-outline">Student Name</p>
                            <p className="font-bold text-gray-900 mt-0.5">{currentStudentObj.full_name}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-outline">Grade / Section</p>
                            <p className="font-bold text-on-surface mt-0.5">Class {currentStudentObj.grade}-{currentStudentObj.section}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-outline">Roll Number</p>
                            <p className="font-bold text-on-surface mt-0.5">{currentStudentObj.roll_number || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-outline">Contact Email</p>
                            <p className="font-bold text-on-surface mt-0.5 truncate">{currentStudentObj.email}</p>
                          </div>
                        </div>

                        {/* Subject Grading Ledger */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Subject Performance</h4>
                          <div className="border border-outline-variant/25 rounded-2xl overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant/20 font-bold text-on-surface-variant">
                                  <th className="p-3">Subject</th>
                                  <th className="p-3">Test Title</th>
                                  <th className="p-3">Marks Scored</th>
                                  <th className="p-3">Percentage</th>
                                  <th className="p-3 text-right">Letter Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant/15 font-semibold text-on-surface">
                                {studentResults.length > 0 ? (
                                  studentResults.map((res, idx) => (
                                    <tr key={idx}>
                                      <td className="p-3">{res.subject}</td>
                                      <td className="p-3 text-on-surface-variant font-medium">{res.test_title}</td>
                                      <td className="p-3">{res.marks_obtained} / {res.max_marks}</td>
                                      <td className="p-3 font-bold">{res.percentage}%</td>
                                      <td className="p-3 text-right text-primary font-bold">{getLetterGrade(res.percentage)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="5" className="p-4 text-center text-on-surface-variant font-semibold text-xs">
                                      No grading records found for this student.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Attendance Summary & Signatures */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/20">
                          <div className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-2xl text-xs space-y-2">
                            <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">Attendance Overview</h4>
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-emerald-700 text-2xl">how_to_reg</span>
                              <div>
                                <p className="font-black text-gray-900 text-sm">{studentStats?.attendance_percentage ?? 94.5}%</p>
                                <p className="text-[10px] text-gray-500 font-semibold">Total Conducted Tests: {studentStats?.total_tests ?? studentResults.length}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-end justify-between px-2 pt-6">
                            <div className="text-center border-t border-dashed border-gray-400 pt-2 w-28">
                              <p className="text-[8px] font-bold uppercase text-gray-500">Class Teacher</p>
                            </div>
                            <div className="text-center border-t border-dashed border-gray-400 pt-2 w-28">
                              <p className="text-[8px] font-bold uppercase text-gray-500">School Principal</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
