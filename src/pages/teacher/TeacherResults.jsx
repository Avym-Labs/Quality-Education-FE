import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TeacherResults() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Tab: 'upload' | 'history'
  const [activeTab, setActiveTab] = useState('upload')
  const [message, setMessage] = useState('')

  // History State
  const [resultsHistory, setResultsHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')

  // Upload Form State
  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '10-A')
  
  const subjects = user?.subjects || ['Mathematics', 'Science']
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Mathematics')

  const [testTitle, setTestTitle] = useState('')
  const [testType, setTestType] = useState('Unit') // MCQ | Unit | Chapter | Exam
  const [totalMarks, setTotalMarks] = useState(100)
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split('T')[0])

  const [students, setStudents] = useState([])
  const [marksData, setMarksData] = useState({}) // student_user_id -> { marks: number, remarks: string }
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submittingMarks, setSubmittingMarks] = useState(false)

  // Load students when class changes
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClass) return
      setLoadingStudents(true)
      try {
        const [grade, section] = selectedClass.split('-')
        const { data } = await api.get('/students', {
          params: { grade, section: section || '' }
        })
        setStudents(data || [])
        
        // Initialize marks data
        const initial = {}
        data.forEach(s => {
          initial[s.user_id] = { marks: '', remarks: '' }
        })
        setMarksData(initial)
      } catch (err) {
        console.error('Failed to load students:', err)
      } finally {
        setLoadingStudents(false)
      }
    }
    if (activeTab === 'upload') {
      loadStudents()
    }
  }, [selectedClass, activeTab])

  // Load results history
  const loadResultsHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data } = await api.get('/results')
      setResultsHistory(data || [])
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadResultsHistory()
    }
  }, [activeTab])

  const handleMarksChange = (userId, field, val) => {
    setMarksData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: val
      }
    }))
  }

  const calculateGradeLetter = (marks) => {
    if (marks === '' || marks === undefined || marks === null) return 'F'
    const pct = (parseFloat(marks) / parseFloat(totalMarks)) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 50) return 'D'
    return 'F'
  }

  const handleSaveGrades = async (e) => {
    e.preventDefault()
    if (!testTitle) {
      setMessage('Please enter a test/exam title.')
      return
    }

    setSubmittingMarks(true)
    setMessage('')
    try {
      const [grade, section] = selectedClass.split('-')
      const payload = []

      for (const student of students) {
        const studentMarks = marksData[student.user_id]?.marks
        if (studentMarks === '' || studentMarks === undefined) continue

        const marksObtained = parseFloat(studentMarks)
        const pct = (marksObtained / parseFloat(totalMarks)) * 100

        payload.push({
          student_id: student.user_id,
          subject: selectedSubject,
          test_title: testTitle,
          test_type: testType,
          grade,
          section: section || '',
          marks_obtained: marksObtained,
          total_marks: parseFloat(totalMarks),
          percentage: Math.round(pct * 10) / 10,
          grade_letter: calculateGradeLetter(studentMarks),
          remarks: marksData[student.user_id]?.remarks || '',
          test_date: testDate
        })
      }

      if (payload.length === 0) {
        setMessage('Please enter marks for at least one student.')
        setSubmittingMarks(false)
        return
      }

      await api.post('/results/bulk', payload)
      setMessage('Grades uploaded successfully!')
      
      // Clear marks
      const cleared = {}
      students.forEach(s => {
        cleared[s.user_id] = { marks: '', remarks: '' }
      })
      setMarksData(cleared)
      setTestTitle('')
      
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error(err)
      setMessage('Failed to save grades. Try again.')
    } finally {
      setSubmittingMarks(false)
    }
  }

  const handleDeleteHistoryItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result record?')) return
    try {
      await api.delete(`/results/${id}`)
      setResultsHistory(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      alert('Failed to delete grade record.')
    }
  }

  // Filter history
  const filteredHistory = resultsHistory.filter(r => 
    (r.student_name || '').toLowerCase().includes(historySearch.toLowerCase()) ||
    (r.test_title || '').toLowerCase().includes(historySearch.toLowerCase()) ||
    (r.subject || '').toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
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
              Grades & Results
            </h2>
          </div>
        </section>

        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold ${
            message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-primary-container/20 text-primary border border-primary/20'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs Toggle */}
        <div className="flex border-b border-outline-variant/30">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'upload' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Upload Grades
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'history' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Gradebook Ledger
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
            
            {/* Left: Test Details */}
            <div className="lg:col-span-4">
              <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/15 pb-2">Test Parameters</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Assigned Class</label>
                    <select 
                      value={selectedClass} 
                      onChange={e => setSelectedClass(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary cursor-pointer font-semibold"
                    >
                      {assignedClasses.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Subject</label>
                    <select 
                      value={selectedSubject} 
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary cursor-pointer font-semibold"
                    >
                      {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Test / Exam Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Unit 3 Trigonometry"
                      value={testTitle}
                      onChange={e => setTestTitle(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Test Type</label>
                    <select 
                      value={testType} 
                      onChange={e => setTestType(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary cursor-pointer font-semibold"
                    >
                      <option value="MCQ">MCQ Test</option>
                      <option value="Unit">Unit Test</option>
                      <option value="Chapter">Chapter Test</option>
                      <option value="Exam">Final Exam</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Total Marks</label>
                      <input 
                        type="number" 
                        value={totalMarks}
                        onChange={e => setTotalMarks(parseInt(e.target.value) || 0)}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Test Date</label>
                      <input 
                        type="date" 
                        value={testDate}
                        onChange={e => setTestDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold text-center"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Students Marks Input */}
            <div className="lg:col-span-8">
              <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/15 pb-2">Student Ledger</h3>
                
                {loadingStudents ? (
                  <div className="flex justify-center py-10">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic py-6 text-center">No students registered in this class.</p>
                ) : (
                  <form onSubmit={handleSaveGrades} className="space-y-4">
                    <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                      {students.map(student => (
                        <div key={student.user_id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/60 transition-colors">
                          <span className="col-span-5 text-xs font-bold text-on-surface truncate">{student.full_name}</span>
                          
                          <div className="col-span-3 flex items-center gap-1.5 justify-end">
                            <input 
                              type="number" 
                              step="0.5"
                              placeholder="Marks"
                              value={marksData[student.user_id]?.marks ?? ''}
                              onChange={e => handleMarksChange(student.user_id, 'marks', e.target.value)}
                              className="w-16 px-2 py-1 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs outline-none text-center focus:border-primary font-bold"
                            />
                            <span className="text-[10px] text-outline">/ {totalMarks}</span>
                          </div>

                          <div className="col-span-3">
                            <input 
                              type="text" 
                              placeholder="Remarks"
                              value={marksData[student.user_id]?.remarks ?? ''}
                              onChange={e => handleMarksChange(student.user_id, 'remarks', e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs outline-none focus:border-primary"
                            />
                          </div>

                          <div className="col-span-1 text-center font-extrabold text-primary text-xs">
                            {calculateGradeLetter(marksData[student.user_id]?.marks)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      type="submit" 
                      disabled={submittingMarks}
                      className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:bg-opacity-95 cursor-pointer disabled:opacity-50"
                    >
                      {submittingMarks ? 'Uploading grades...' : 'Save All Grades'}
                    </button>
                  </form>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Tab 2: History Ledger */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input 
                type="text" 
                placeholder="Search by student, test name, or subject..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl bg-surface-container-lowest text-xs outline-none focus:border-primary"
              />
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-10">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                <span className="material-symbols-outlined text-outline text-5xl">book</span>
                <p className="text-sm text-on-surface-variant font-semibold mt-2">No grade history items found.</p>
              </div>
            ) : (
              <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant/25">
                        <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Student</th>
                        <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Subject</th>
                        <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Exam / Test</th>
                        <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Score</th>
                        <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase">Grade</th>
                        <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 text-xs">
                      {filteredHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 text-xs font-bold text-on-surface">{record.student_name}</td>
                          <td className="p-4 text-xs font-semibold text-on-surface-variant">{record.subject}</td>
                          <td className="p-4 text-xs font-semibold text-on-surface-variant">{record.test_title} ({record.test_type})</td>
                          <td className="p-4 text-xs font-bold text-on-surface">
                            {record.marks_obtained} / {record.total_marks} ({record.percentage}%)
                          </td>
                          <td className="p-4 text-xs font-extrabold text-primary">{record.grade_letter}</td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDeleteHistoryItem(record.id)}
                              className="text-error hover:bg-red-50 p-1.5 rounded-lg cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
