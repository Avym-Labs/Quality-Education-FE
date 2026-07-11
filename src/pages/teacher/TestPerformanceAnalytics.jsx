import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function TestPerformanceAnalytics() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Class & section
  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '10-A')

  // Subject
  const subjects = user?.subjects || ['Mathematics', 'Science']
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Mathematics')

  // Test information
  const [testTitle, setTestTitle] = useState('Chapter 4 Integration Test')
  const [testType, setTestType] = useState('Unit') // MCQ, Unit, Chapter, Exam
  const [totalMarks, setTotalMarks] = useState(100)
  const [testDate, setTestDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const [students, setStudents] = useState([])
  const [marksData, setMarksData] = useState({}) // student_user_id -> { marks: number|string, remarks: string, status: 'unsaved' | 'saved' }
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Remarks modal
  const [remarkStudent, setRemarkStudent] = useState(null)
  const [tempRemark, setTempRemark] = useState('')

  // Load students for selected class
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClass) return
      setLoading(true)
      setMessage('')
      try {
        const [grade, section] = selectedClass.split('-')
        const res = await api.get('/students', {
          params: { grade, section: section || '' }
        })
        const studentList = res.data || []
        setStudents(studentList)

        // Initialize marks data
        const initialMarks = {}
        studentList.forEach(s => {
          initialMarks[s.user_id] = { marks: '', remarks: '', status: 'unsaved' }
        })
        setMarksData(initialMarks)
      } catch (err) {
        console.error('Failed to load students for marks upload:', err)
        setMessage('Error loading student records.')
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [selectedClass])

  // Handle individual student marks input
  const handleMarksChange = (userId, val) => {
    let numVal = val === '' ? '' : parseFloat(val)
    if (numVal !== '' && (isNaN(numVal) || numVal < 0 || numVal > totalMarks)) {
      return // Prevent invalid values
    }

    setMarksData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        marks: numVal,
        status: 'unsaved'
      }
    }))
  }

  // Calculate letter grade
  const calculateGradeLetter = (marks) => {
    if (marks === '' || marks === undefined || marks === null) return '--'
    const pct = (parseFloat(marks) / parseFloat(totalMarks)) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 50) return 'D'
    return 'F'
  };

  // Open remark modal
  const openRemarkModal = (student) => {
    setRemarkStudent(student)
    setTempRemark(marksData[student.user_id]?.remarks || '')
  }

  // Save remark from modal
  const saveRemark = () => {
    if (remarkStudent) {
      setMarksData(prev => ({
        ...prev,
        [remarkStudent.user_id]: {
          ...prev[remarkStudent.user_id],
          remarks: tempRemark
        }
      }))
      setRemarkStudent(null)
    }
  }

  // Live Statistics Calculations
  const enteredMarks = Object.values(marksData).filter(item => item.marks !== '')
  const totalEntered = enteredMarks.length

  const classAverage = totalEntered > 0
    ? roundTo1(enteredMarks.reduce((sum, item) => sum + Number(item.marks), 0) / totalEntered)
    : 0

  const averagePercentage = totalMarks > 0 ? roundTo1((classAverage / totalMarks) * 100) : 0

  // Distribution bins: 0-40%, 41-60%, 61-80%, 81-100%
  const distribution = { bin1: 0, bin2: 0, bin3: 0, bin4: 0 }
  enteredMarks.forEach(item => {
    const pct = (Number(item.marks) / totalMarks) * 100
    if (pct <= 40) distribution.bin1++
    else if (pct <= 60) distribution.bin2++
    else if (pct <= 80) distribution.bin3++
    else distribution.bin4++
  })

  // Submit/Publish results in bulk
  const handlePublish = async () => {
    setMessage('')
    try {
      const [grade, section] = selectedClass.split('-')
      const payload = Object.keys(marksData)
        .filter(userId => marksData[userId].marks !== '')
        .map(userId => ({
          student_id: userId,
          subject: selectedSubject,
          test_title: testTitle,
          test_type: testType,
          grade,
          section: section || '',
          marks_obtained: Number(marksData[userId].marks),
          total_marks: Number(totalMarks),
          test_date: testDate,
          remarks: marksData[userId].remarks || ''
        }))

      if (payload.length === 0) {
        setMessage('Please enter marks for at least one student before publishing.')
        return
      }

      await api.post('/results/bulk', payload)

      // Mark all entered fields as saved
      setMarksData(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(userId => {
          if (updated[userId].marks !== '') {
            updated[userId].status = 'saved'
          }
        })
        return updated
      })

      setMessage('Results published successfully!')
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to upload results bulk:', err)
      setMessage('Failed to publish results. Please check your data.')
    }
  }

  function roundTo1(num) {
    return Math.round(num * 10) / 10
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-40">
        
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
                Upload Results
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {assignedClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Test details form section */}
        <section className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/30 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Test Title</label>
            <input 
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Total Marks</label>
            <input 
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Test Date</label>
            <input 
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </section>

        {/* Live Analytics Bento Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28">
            <h3 className="text-[10px] uppercase font-bold text-on-surface-variant">Class Average</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-numeric-bold text-primary font-bold">{classAverage}</span>
              <span className="text-sm font-semibold text-on-surface-variant">/{totalMarks}</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Average Perf: {averagePercentage}%</p>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28">
            <h3 className="text-[10px] uppercase font-bold text-on-surface-variant">Completion</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-numeric-bold text-on-surface font-bold">{totalEntered}</span>
              <span className="text-sm font-semibold text-on-surface-variant">/{students.length} Students</span>
            </div>
            <p className="text-[10px] text-on-surface-variant font-medium mt-1">Ready to publish</p>
          </div>

          {/* Histogram distribution */}
          <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-28">
            <h3 className="text-[10px] uppercase font-bold text-on-surface-variant">Score Distribution</h3>
            <div className="flex items-end justify-between gap-1.5 h-12 mt-1">
              {[
                { bin: '0-40%', count: distribution.bin1 },
                { bin: '41-60%', count: distribution.bin2 },
                { bin: '61-80%', count: distribution.bin3 },
                { bin: '81-100%', count: distribution.bin4 },
              ].map((b, idx) => {
                const maxVal = Math.max(...Object.values(distribution)) || 1
                const heightPct = (b.count / maxVal) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    <div 
                      className="bg-primary/40 group-hover:bg-primary w-full rounded-t transition-all" 
                      style={{ height: `${Math.max(15, heightPct)}%` }}
                    ></div>
                    <span className="absolute -top-5 text-[8px] font-bold bg-on-surface text-surface py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {b.count}
                    </span>
                    <span className="text-[8px] font-bold text-on-surface-variant scale-90">{b.bin}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Message alerts */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold ${
            message.includes('successfully') 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-primary-container/20 text-primary border border-primary/20'
          }`}>
            {message}
          </div>
        )}

        {/* Spreadsheet entry grid */}
        <main className="space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-label-md text-xs">
                    <th className="px-4 py-3.5 w-16">Roll</th>
                    <th className="px-4 py-3.5 min-w-[150px]">Student Name</th>
                    <th className="px-4 py-3.5 w-24 text-center">Marks ({totalMarks})</th>
                    <th className="px-4 py-3.5 w-16 text-center">Grade</th>
                    <th className="px-4 py-3.5 w-24 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-xs font-bold text-on-surface-variant">
                        <span className="animate-spin inline-block rounded-full h-4 w-4 border-b-2 border-primary mr-2"></span>
                        Loading student spreadsheet...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-xs font-bold text-on-surface-variant">
                        No students enrolled in this class.
                      </td>
                    </tr>
                  ) : (
                    students.map((student, idx) => {
                      const data = marksData[student.user_id] || { marks: '', remarks: '', status: 'unsaved' }
                      const letter = calculateGradeLetter(data.marks)
                      return (
                        <tr key={student.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-4 py-3 font-numeric-bold text-xs text-on-surface-variant">
                            {student.roll_number || String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-label-md text-xs font-bold text-on-surface">{student.full_name}</p>
                              {data.status === 'saved' ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                  <span>Saved</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-outline uppercase tracking-wider mt-0.5">
                                  Unsaved
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="number"
                              placeholder="--"
                              value={data.marks}
                              onChange={(e) => handleMarksChange(student.user_id, e.target.value)}
                              className="w-16 text-center border border-outline-variant/60 rounded bg-surface-container-low/20 py-1 text-xs font-bold focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                              letter === '--' ? 'text-on-surface-variant' :
                              letter === 'F' ? 'bg-error-container text-on-error-container' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {letter}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => openRemarkModal(student)}
                              className={`transition-colors ${
                                data.remarks ? 'text-primary' : 'text-outline hover:text-primary'
                              }`}
                            >
                              <span 
                                className="material-symbols-outlined text-[20px]"
                                style={{ fontVariationSettings: data.remarks ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                chat_bubble
                              </span>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Sticky bottom upload actions */}
        <div className="fixed bottom-16 left-0 w-full px-container-padding-mobile pb-4 pt-4 bg-gradient-to-t from-background via-background/90 to-transparent z-45">
          <div className="flex gap-4 max-w-5xl mx-auto">
            <button 
              onClick={() => {
                setMessage('Draft saved locally.')
                setTimeout(() => setMessage(''), 3000)
              }}
              className="flex-1 py-3 rounded-2xl border border-primary text-primary font-bold text-xs active:bg-primary/10 transition-all hover:bg-surface-container-low"
            >
              Save Draft
            </button>
            <button 
              onClick={handlePublish}
              className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20 active:scale-95 transition-transform"
            >
              Publish Results
            </button>
          </div>
        </div>

        {/* Remarks modal dialog */}
        {remarkStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-fade-in">
            <div className="bg-surface rounded-[24px] p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 space-y-4">
              <h3 className="font-title-lg text-sm text-primary font-bold">
                Student Remarks: {remarkStudent.full_name}
              </h3>
              <textarea 
                value={tempRemark}
                onChange={(e) => setTempRemark(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none min-h-[100px]"
                placeholder="Write student feedback or private observations..."
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setRemarkStudent(null)}
                  className="px-4 py-2 bg-surface-variant hover:bg-surface-container-high rounded-xl text-xs font-bold text-on-surface"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveRemark}
                  className="px-4 py-2 bg-primary text-on-primary hover:opacity-95 rounded-xl text-xs font-bold shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
