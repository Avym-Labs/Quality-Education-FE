import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function TeacherReports() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Selected Class & Student State
  const assignedClasses = user?.assigned_classes || []
  const [selectedClass, setSelectedClass] = useState('')
  useEffect(() => {
    if (!selectedClass && assignedClasses.length > 0) setSelectedClass(assignedClasses[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedClasses.length])

  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Report details
  const [studentResults, setStudentResults] = useState([])
  const [attendancePercent, setAttendancePercent] = useState(0)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)

  // Class analytics stats — real average % and pass rate from this class's
  // actual recorded results, not fabricated placeholders.
  const [classResults, setClassResults] = useState([])
  const classAverage = classResults.length > 0
    ? Math.round(classResults.reduce((acc, r) => acc + r.percentage, 0) / classResults.length)
    : 0
  const classPassRate = classResults.length > 0
    ? Math.round((classResults.filter(r => r.percentage >= 50).length / classResults.length) * 100)
    : 0

  // Load students for class
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass) return
      setLoadingStudents(true)
      setSelectedStudentId('')
      setSelectedStudent(null)
      setStudentResults([])
      try {
        const [grade, section] = selectedClass.split('-')
        const [studentsRes, resultsRes] = await Promise.all([
          api.get('/students', { params: { grade, section: section || '' } }),
          api.get('/results', { params: { grade, section: section || '' } }),
        ])
        setStudents(studentsRes.data || [])
        setClassResults(resultsRes.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingStudents(false)
      }
    }
    fetchStudents()
  }, [selectedClass])

  // Load student specific report card data
  const handleGenerateReport = async (studentId) => {
    setSelectedStudentId(studentId)
    const stud = students.find(s => s.user_id === studentId)
    setSelectedStudent(stud)
    
    if (!studentId) return
    setLoadingReport(true)
    try {
      // 1. Fetch student results
      const res = await api.get('/results', { params: { student_id: studentId } })
      setStudentResults(res.data || [])

      // 2. Fetch student stats for attendance
      const statsRes = await api.get(`/students/${stud.id}/stats`)
      if (statsRes.data) {
        setAttendancePercent(statsRes.data.attendance_percentage ?? 0)
      }
    } catch (err) {
      console.error(err)
      setAttendancePercent(0)
    } finally {
      setLoadingReport(false)
    }
  }

  // Calculate statistics for generated report
  const totalWeight = studentResults.length
  const studentAverage = totalWeight > 0 
    ? Math.round(studentResults.reduce((acc, r) => acc + r.percentage, 0) / totalWeight) 
    : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 print:p-0 print:m-0">
        
        {/* Header - Hidden in Print */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20 print:hidden">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              {t('teacherReports.title')}
            </h2>
          </div>
        </section>

        {/* Configurations - Hidden in Print */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden text-left">
          
          <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('teacherReports.selectClass')}</label>
            {assignedClasses.length === 0 ? (
              <p className="text-xs text-on-surface-variant font-semibold py-2">{t('teacherReports.noClassesAssignedYet')}</p>
            ) : (
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-outline-variant rounded-xl bg-surface-container-low text-xs outline-none focus:border-primary cursor-pointer font-semibold"
              >
                {assignedClasses.map(cls => <option key={cls} value={cls}>{t('teacherReports.classLabel', { cls })}</option>)}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase">{t('teacherReports.selectStudent')}</label>
            <select
              value={selectedStudentId}
              onChange={e => handleGenerateReport(e.target.value)}
              disabled={loadingStudents || students.length === 0}
              className="px-3 py-2 border border-outline-variant rounded-xl bg-surface-container-low text-xs outline-none focus:border-primary cursor-pointer font-semibold disabled:opacity-50"
            >
              <option value="">{t('teacherReports.chooseStudent')}</option>
              {students.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
            </select>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider text-left">{t('teacherReports.classAverage')}</p>
              <h4 className="text-xl font-black text-primary mt-0.5 text-left">{classAverage}%</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('teacherReports.passRatio')}</p>
              <h4 className="text-xl font-black text-primary mt-0.5">{classPassRate}%</h4>
            </div>
          </div>

        </section>

        {/* Loading Report Indicator - Hidden in Print */}
        {loadingReport && (
          <div className="flex flex-col items-center py-10 print:hidden">
            <Icon name="progress_activity" className="animate-spin text-primary text-4xl" />
            <p className="text-xs text-on-surface-variant font-semibold mt-2">{t('teacherReports.compilingReportCard')}</p>
          </div>
        )}

        {/* Printable Report Card Section */}
        {selectedStudent && !loadingReport && (
          <section className="bg-white text-gray-900 rounded-[28px] border-2 border-dashed border-gray-300 p-8 shadow-sm max-w-2xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-full text-left">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">{t('teacherReports.schoolName')}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t('teacherReports.officialReportCard')}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-1">{t('teacherReports.academicTerm')}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 text-[10px] font-black rounded uppercase">
                  {t('teacherReports.classLabel', { cls: selectedClass })}
                </span>
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200/60">
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.studentName')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{selectedStudent.full_name}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.rollStudentId')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{selectedStudent.roll_number || t('teacherReports.notAvailable')}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.attendance')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{t('teacherReports.percentPresent', { pct: attendancePercent })}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.termAverage')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{studentResults.length > 0 ? `${studentAverage}%` : t('teacherReports.notAvailable')}</p>
              </div>
            </div>

            {/* Grades Ledger */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('teacherReports.subjectPerformanceSummary')}</h3>

              {studentResults.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center bg-gray-50 rounded-xl">{t('teacherReports.noTestScoresRecorded')}</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-150 border-b border-gray-200">
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.subject')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.testTitle')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.score')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase text-center">{t('teacherReports.grade')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.remarks')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentResults.map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-900">{r.subject}</td>
                          <td className="p-3 text-gray-650">{r.test_title}</td>
                          <td className="p-3 text-gray-650">{r.marks_obtained} / {r.total_marks} ({r.percentage}%)</td>
                          <td className="p-3 text-center font-extrabold text-gray-900">{r.grade_letter}</td>
                          <td className="p-3 text-gray-500 italic">{r.remarks || t('teacherReports.noRemarks')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end pt-10">
              <div className="text-center w-36">
                <div className="h-0.5 bg-gray-800 w-full mb-1"></div>
                <p className="text-[9px] uppercase font-bold text-gray-500">{t('teacherReports.classTeacher')}</p>
              </div>

              <div className="text-center w-36">
                <div className="h-0.5 bg-gray-800 w-full mb-1"></div>
                <p className="text-[9px] uppercase font-bold text-gray-500">{t('teacherReports.principalSignature')}</p>
              </div>
            </div>

            {/* Print Button - Hidden in Print */}
            <div className="flex justify-end pt-4 border-t border-gray-100 print:hidden">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:shadow-md cursor-pointer active:scale-95 transition-all border-none"
              >
                <Icon name="print" className="text-sm" />
                <span>{t('teacherReports.printReportCard')}</span>
              </button>
            </div>

          </section>
        )}

      </div>
    </DashboardLayout>
  )
}
