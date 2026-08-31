import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function StudentReports() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    attendance_percentage: 0,
    average_score: 0,
    total_tests: 0
  })

  useEffect(() => {
    async function loadReportData() {
      if (!user?.id) return
      try {
        setLoading(true)
        const [resultsRes, statsRes] = await Promise.all([
          api.get('/results', { params: { student_id: user.id } }),
          user.student_id ? api.get(`/students/${user.student_id}/stats`) : Promise.resolve({ data: null })
        ])

        if (resultsRes.data) {
          setResults(resultsRes.data)
        }
        if (statsRes.data) {
          setStats(statsRes.data)
        }
      } catch (err) {
        console.error(err)
        setError(t('studentReports.failedToCompile'))
      } finally {
        setLoading(false)
      }
    }
    loadReportData()
  }, [user])

  const totalTests = results.length
  const avgMarks = totalTests > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalTests) 
    : stats.average_score

  const attendance = stats.attendance_percentage ?? 0

  const calculateGradeLetter = (pct) => {
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 50) return 'D'
    return 'F'
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 print:p-0 print:m-0">
        
        {/* Header - Hidden in Print */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20 print:hidden">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              {t('studentReports.title')}
            </h2>
          </div>
        </section>

        {error && (
          <div className="p-3 bg-error-container rounded-xl text-error text-xs font-semibold flex items-center gap-2">
            <Icon name="error" className="text-xs" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Analytics Cards - Hidden in Print */}
        {!loading && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('studentReports.attendanceRate')}</p>
              <h3 className="text-2xl font-black text-primary mt-1">{attendance}%</h3>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${attendance}%` }}></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('studentReports.cumulativeAverage')}</p>
              <h3 className="text-2xl font-black text-secondary mt-1">{avgMarks}%</h3>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${avgMarks}%` }}></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/35 shadow-sm">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t('studentReports.letterGrade')}</p>
              <h3 className="text-2xl font-black text-tertiary mt-1">{calculateGradeLetter(avgMarks)}</h3>
              <p className="text-[10px] text-outline font-semibold mt-2.5">{t('studentReports.basedOnNTests', { count: totalTests })}</p>
            </div>
          </section>
        )}

        {/* Printable Report Card Section */}
        {loading ? (
          <div className="flex justify-center py-10 print:hidden">
            <Icon name="progress_activity" className="animate-spin text-primary text-3xl" />
          </div>
        ) : (
          <section className="bg-white text-gray-900 rounded-[28px] border-2 border-dashed border-gray-300 p-8 shadow-sm max-w-2xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-full">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">{t('teacherReports.schoolName')}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t('studentReports.officialStudentReportCard')}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-1">{t('teacherReports.academicTerm')}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 text-[10px] font-black rounded uppercase">
                  {t('studentReports.classSection', { grade: user?.grade || '10', section: user?.section || 'A' })}
                </span>
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200/60">
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.studentName')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.rollStudentId')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{user?.student_id?.slice(-8) || t('teacherReports.notAvailable')}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.attendance')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{t('teacherReports.percentPresent', { pct: attendance })}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-gray-400">{t('teacherReports.termAverage')}</p>
                <p className="font-extrabold text-gray-850 mt-0.5">{avgMarks}%</p>
              </div>
            </div>

            {/* Grades Ledger */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('studentReports.academicSubjectBreakdown')}</h3>

              {results.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-4 text-center bg-gray-50 rounded-xl">{t('studentReports.noTestScoresYet')}</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-150 border-b border-gray-200">
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.subject')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.testTitle')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('teacherReports.score')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase text-center">{t('teacherReports.grade')}</th>
                        <th className="p-3 font-bold text-gray-700 uppercase">{t('studentReports.teacherRemarks')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((r, idx) => (
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
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:shadow-md cursor-pointer active:scale-95 transition-all"
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
