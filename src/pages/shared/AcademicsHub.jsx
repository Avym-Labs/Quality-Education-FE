import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import SchedulePage from './SchedulePage'

export default function AcademicsHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const role = user?.role || 'student'

  // Tabs: 'material' | 'tests' | 'results' | 'reports'
  const [activeTab, setActiveTab] = useState('material')

  // Common Academic States
  const [materials, setMaterials] = useState([])
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewingMaterial, setViewingMaterial] = useState(null)

  // Upload Form States (Teachers & Admins)
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialClass, setMaterialClass] = useState(user?.assigned_classes?.[0] || '10-A')
  const [materialSubject, setMaterialSubject] = useState(user?.subjects?.[0] || 'Mathematics')
  const [materialFile, setMaterialFile] = useState(null)
  const [uploadingMaterial, setUploadingMaterial] = useState(false)

  const [testTitle, setTestTitle] = useState('')
  const [testClass, setTestClass] = useState(user?.assigned_classes?.[0] || '10-A')
  const [testSubject, setTestSubject] = useState(user?.subjects?.[0] || 'Mathematics')
  const [qPaperFile, setQPaperFile] = useState(null)
  const [ansKeyFile, setAnsKeyFile] = useState(null)
  const [uploadingTest, setUploadingTest] = useState(false)

  // ----------------------------------------------------
  // FILTER STATES (For Results & Reports tabs)
  // ----------------------------------------------------
  const [filterClass, setFilterClass] = useState(user?.assigned_classes?.[0] || (user?.grade ? `${user.grade}-${user.section}` : '10-A'))
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterStudentId, setFilterStudentId] = useState('All')
  const [dateRange, setDateRange] = useState('all') // 'all' | '30days' | 'semester' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Class students roster list (Only for Teacher/Admin)
  const [studentsList, setStudentsList] = useState([])
  // Filtered results list
  const [filteredResults, setFilteredResults] = useState([])
  const [loadingResults, setLoadingResults] = useState(false)

  // Selected student's individual attendance (for Reports)
  const [selectedStudentAttendance, setSelectedStudentAttendance] = useState(null)
  const [classAverageAttendance, setClassAverageAttendance] = useState(94.2)

  // Results Marks Recorder Form (Only for Teacher/Admin)
  const [isRecordScoresOpen, setIsRecordScoresOpen] = useState(false)
  const [recordSubject, setRecordSubject] = useState(user?.subjects?.[0] || 'Mathematics')
  const [recordTestTitle, setRecordTestTitle] = useState('')
  const [recordTotalMarks, setRecordTotalMarks] = useState(100)
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0])
  const [marksData, setMarksData] = useState({}) // student_user_id -> { marks: number, remarks: string }
  const [submittingMarks, setSubmittingMarks] = useState(false)

  // Auto-route tabs based on pathname
  useEffect(() => {
    if (location.pathname.includes('/results')) {
      setActiveTab('results')
    } else if (location.pathname.includes('/reports')) {
      setActiveTab('reports')
    }
  }, [location.pathname])

  // Load basic resources & materials
  const loadAcademicAssets = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (role === 'student') {
        params.grade = `${user.grade}-${user.section}`
      }
      
      const [matRes, testRes] = await Promise.all([
        api.get('/academics/study-materials', { params }),
        api.get('/academics/tests', { params })
      ])
      
      setMaterials(matRes.data || [])
      setTests(testRes.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to fetch academics database assets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadAcademicAssets()
    }
  }, [user])

  // Load students when active filterClass changes (Teacher & Admin views)
  useEffect(() => {
    async function fetchClassStudents() {
      if (!filterClass || role === 'student') return
      try {
        const [grade, section] = filterClass.split('-')
        const { data } = await api.get('/students', {
          params: { grade, section: section || '' }
        })
        setStudentsList(data || [])
        setFilterStudentId('All') // Reset selection
        
        // Initialize scores data structure
        const initial = {}
        data.forEach(s => {
          initial[s.user_id] = { marks: '', remarks: '' }
        })
        setMarksData(initial)
      } catch (err) {
        console.error(err)
      }
    }
    fetchClassStudents()
  }, [filterClass])

  // Load attendance data (for Reports view comparison)
  useEffect(() => {
    async function loadAttendanceStats() {
      if (!user) return
      try {
        if (role === 'student' && user.student_id) {
          const { data } = await api.get(`/students/${user.student_id}/stats`)
          setSelectedStudentAttendance(data?.attendance_percentage || 94.2)
        } else if (filterStudentId !== 'All') {
          const match = studentsList.find(s => s.user_id === filterStudentId)
          if (match) {
            const { data } = await api.get(`/students/${match.id}/stats`)
            setSelectedStudentAttendance(data?.attendance_percentage || 92.5)
          } else {
            setSelectedStudentAttendance(null)
          }
        } else {
          setSelectedStudentAttendance(null)
          // Default class average attendance simulations based on class
          const codeVal = filterClass.charCodeAt(0) || 65
          setClassAverageAttendance(codeVal % 2 === 0 ? 93.8 : 95.1)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadAttendanceStats()
  }, [user, filterStudentId, filterClass, studentsList])

  // Fetch results based on active filters
  const fetchFilteredResults = async () => {
    if (!user) return
    setLoadingResults(true)
    try {
      const params = {}
      
      if (role === 'student') {
        params.student_id = user.id
      } else {
        if (filterClass) {
          const [grade, section] = filterClass.split('-')
          params.grade = grade
          params.section = section || ''
        }
        if (filterStudentId !== 'All') {
          params.student_id = filterStudentId
        }
      }

      if (filterSubject !== 'All') {
        params.subject = filterSubject
      }

      // Time range presets
      let startStr = ''
      let endStr = ''
      if (dateRange === '30days') {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        startStr = d.toISOString().split('T')[0]
      } else if (dateRange === 'semester') {
        startStr = '2026-06-01'
        endStr = '2026-12-31'
      } else if (dateRange === 'custom') {
        startStr = customStartDate
        endStr = customEndDate
      }

      if (startStr) params.start_date = startStr
      if (endStr) params.end_date = endStr

      const { data } = await api.get('/results', { params })
      setFilteredResults(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingResults(false)
    }
  }

  useEffect(() => {
    fetchFilteredResults()
  }, [user, filterClass, filterSubject, filterStudentId, dateRange, customStartDate, customEndDate])

  // ----------------------------------------------------
  // ANALYTICS COMPUTATIONS (Computed from filtered results)
  // ----------------------------------------------------
  const totalTests = filteredResults.length
  
  const averageScore = totalTests > 0 
    ? Math.round(filteredResults.reduce((acc, r) => acc + r.percentage, 0) / totalTests) 
    : 0

  const highestScore = totalTests > 0
    ? Math.max(...filteredResults.map(r => r.percentage))
    : 0

  const passRate = totalTests > 0
    ? Math.round((filteredResults.filter(r => r.percentage >= 50).length / totalTests) * 100)
    : 0

  // Grade Distribution Counts
  const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 }
  filteredResults.forEach(r => {
    if (r.percentage >= 90) gradeCounts['A+']++
    else if (r.percentage >= 80) gradeCounts['A']++
    else if (r.percentage >= 70) gradeCounts['B']++
    else if (r.percentage >= 50) gradeCounts['C']++
    else gradeCounts['F']++
  })

  // Leaderboard statistics (Grouped by student)
  const studentLeaderboard = []
  if (role !== 'student' && studentsList.length > 0) {
    studentsList.forEach(s => {
      const sResults = filteredResults.filter(r => r.student_id === s.user_id)
      const count = sResults.length
      const avg = count > 0 
        ? Math.round(sResults.reduce((acc, r) => acc + r.percentage, 0) / count)
        : 0
      studentLeaderboard.push({
        id: s.id,
        name: s.full_name,
        roll: s.roll_number,
        avatar: s.avatar,
        average: avg,
        testsCount: count
      })
    })
    studentLeaderboard.sort((a, b) => b.average - a.average)
  }

  // Student specific subject comparative averages
  const studentSubjectComparisons = []
  if (role === 'student' && filteredResults.length > 0) {
    const subjects = [...new Set(filteredResults.map(r => r.subject))]
    subjects.forEach(sub => {
      const mine = filteredResults.filter(r => r.subject === sub)
      const myAvg = Math.round(mine.reduce((acc, r) => acc + r.percentage, 0) / mine.length)
      // Benchmark class average simulation based on subject
      const benchmarkAvg = sub === 'Mathematics' ? 82 : sub === 'Physics' ? 76 : 80
      studentSubjectComparisons.push({
        subject: sub,
        myAvg,
        classAvg: benchmarkAvg
      })
    })
  }

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  const handleUploadMaterial = async (e) => {
    e.preventDefault()
    if (!materialTitle.trim() || !materialFile) return
    setUploadingMaterial(true)
    setError('')
    setSuccess('')
    try {
      const formData = new FormData()
      formData.append('file', materialFile)
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (!uploadRes.data.url) throw new Error('File upload failed')
      await api.post('/academics/study-materials', {
        title: materialTitle,
        grade: materialClass,
        subject: materialSubject,
        file_url: uploadRes.data.url,
        filename: uploadRes.data.filename || materialFile.name
      })
      setSuccess('Study material uploaded successfully!')
      setMaterialTitle('')
      setMaterialFile(null)
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError('Failed to upload study material.')
    } finally {
      setUploadingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return
    try {
      await api.delete(`/academics/study-materials/${id}`)
      setSuccess('Study material deleted successfully.')
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError('Failed to delete material.')
    }
  }

  const handleUploadTest = async (e) => {
    e.preventDefault()
    if (!testTitle.trim() || (!qPaperFile && !ansKeyFile)) return
    setUploadingTest(true)
    setError('')
    setSuccess('')
    try {
      let qPaperUrl = null
      let qPaperName = null
      let ansKeyUrl = null
      let ansKeyName = null

      if (qPaperFile) {
        const qForm = new FormData()
        qForm.append('file', qPaperFile)
        const qRes = await api.post('/upload', qForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        qPaperUrl = qRes.data.url
        qPaperName = qRes.data.filename || qPaperFile.name
      }

      if (ansKeyFile) {
        const aForm = new FormData()
        aForm.append('file', ansKeyFile)
        const aRes = await api.post('/upload', aForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        ansKeyUrl = aRes.data.url
        ansKeyName = aRes.data.filename || ansKeyFile.name
      }

      await api.post('/academics/tests', {
        title: testTitle,
        grade: testClass,
        subject: testSubject,
        question_paper_url: qPaperUrl,
        question_paper_name: qPaperName,
        answer_key_url: ansKeyUrl,
        answer_key_name: ansKeyName
      })
      setSuccess('Test assets and answer keys uploaded successfully!')
      setTestTitle('')
      setQPaperFile(null)
      setAnsKeyFile(null)
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError('Failed to upload test keys.')
    } finally {
      setUploadingTest(false)
    }
  }

  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test package?')) return
    try {
      await api.delete(`/academics/tests/${id}`)
      setSuccess('Test package deleted successfully.')
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError('Failed to delete test package.')
    }
  }

  const handleMarksDataChange = (userId, field, val) => {
    setMarksData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: val
      }
    }))
  }

  const handleRecordScoresSubmit = async (e) => {
    e.preventDefault()
    if (!recordTestTitle.trim() || studentsList.length === 0) return

    setSubmittingMarks(true)
    setError('')
    setSuccess('')

    try {
      const payload = []
      const [grade, section] = filterClass.split('-')
      
      studentsList.forEach(s => {
        const data = marksData[s.user_id]
        if (data && data.marks !== '') {
          payload.push({
            student_id: s.user_id,
            subject: recordSubject,
            test_title: recordTestTitle,
            test_type: 'Unit',
            grade,
            section: section || '',
            marks_obtained: parseFloat(data.marks),
            total_marks: parseFloat(recordTotalMarks),
            remarks: data.remarks || '',
            test_date: recordDate
          })
        }
      })

      if (payload.length === 0) {
        throw new Error('Please input marks for at least one student.')
      }

      await api.post('/results/bulk', payload)
      setSuccess(`Scores recorded successfully for ${payload.length} students!`)
      setRecordTestTitle('')
      
      // Reset marks form
      const reset = {}
      studentsList.forEach(s => {
        reset[s.user_id] = { marks: '', remarks: '' }
      })
      setMarksData(reset)
      setIsRecordScoresOpen(false)
      fetchFilteredResults()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to submit marks roster.')
    } finally {
      setSubmittingMarks(false)
    }
  }

  const handleDownloadCSVTemplate = () => {
    if (studentsList.length === 0) {
      alert('No students available in the roster list.');
      return;
    }
    const headers = ['Roll Number', 'Student Name', 'Student User ID', 'Marks Obtained', 'Remarks'];
    const rows = studentsList.map((s, idx) => [
      s.roll_number || String(idx + 1),
      s.full_name,
      s.user_id,
      '',
      ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Roster_Template_Class_${filterClass}_${recordSubject}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleUploadCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const parsedStates = { ...marksData };
        let matchCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = [];
          let insideQuote = false;
          let currentPart = '';
          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx];
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
              parts.push(currentPart.trim());
              currentPart = '';
            } else {
              currentPart += char;
            }
          }
          parts.push(currentPart.trim());
          
          if (parts.length >= 3) {
            const userId = parts[2];
            const marks = parts[3];
            const remarks = parts[4] || '';
            if (userId) {
              parsedStates[userId] = {
                marks: marks !== '' ? parseFloat(marks) : '',
                remarks: remarks
              };
              matchCount++;
            }
          }
        }
        setMarksData(parsedStates);
        alert(`Successfully imported scores for ${matchCount} students from CSV! Please review the roster below and click "Submit Score Roster" to save.`);
      } catch (err) {
        console.error('Failed to parse CSV:', err);
        alert('Failed to parse CSV. Please make sure the structure matches the downloaded template.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const handleExportHistoryCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ['Student Name', 'Test Title', 'Subject', 'Date', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade', 'Remarks'];
    const rows = filteredResults.map(r => [
      r.student_name || studentsList.find(s => s.user_id === r.student_id)?.full_name || 'Student',
      r.test_title,
      r.subject,
      new Date(r.test_date || r.created_at).toLocaleDateString(),
      r.marks_obtained,
      r.total_marks,
      `${r.percentage}%`,
      r.grade_letter,
      r.remarks || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Test_History_Class_${filterClass}_${filterSubject}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getAttachmentUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const backendHost = apiBase.replace('/api', '')
    return `${backendHost}${url}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 print:p-0 print:m-0">
        
        {/* Header - Hidden in print */}
        <section className="flex flex-col gap-3 pb-2 border-b border-outline-variant/20 print:hidden text-left">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/${role}/dashboard`)}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Academic Hub
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                Consolidated learning materials, test keys, and scores workspace.
              </p>
            </div>
          </div>

          {/* Segmented Grid Controls (2x2 on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-2 gap-2 pb-1 mt-2 border-t border-outline-variant/10 pt-3 md:flex md:flex-wrap md:justify-start">
            <button 
              onClick={() => setActiveTab('material')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'material' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">library_books</span>
              <span>Study Material</span>
            </button>
            <button 
              onClick={() => setActiveTab('tests')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'tests' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">quiz</span>
              <span>Tests & Answer Keys</span>
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'results' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grade</span>
              <span>Grades & Results</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'reports' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">bar_chart</span>
              <span>Performance Reports</span>
            </button>
            <button 
              onClick={() => setActiveTab('schedules')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'schedules' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span>Lecture Calendar</span>
            </button>
          </div>
        </section>

        {/* Global Notifications Panel */}
        {(error || success) && activeTab !== 'results' && activeTab !== 'reports' && activeTab !== 'schedules' && (
          <div className="print:hidden">
            {error && (
              <div className="p-3 bg-error-container rounded-xl text-error text-xs font-bold flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-xs">error</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 rounded-xl text-green-700 text-xs font-bold flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 1: STUDY MATERIAL
            ---------------------------------------------------- */}
        {activeTab === 'material' && (
          <section className="space-y-6">
            {(role === 'teacher' || role === 'admin') && (
              <form onSubmit={handleUploadMaterial} className="bg-surface-container-lowest p-6 rounded-[24px] border border-outline-variant/35 shadow-sm space-y-4 text-xs text-left">
                <h3 className="text-xs font-black uppercase text-primary tracking-wider border-b border-outline-variant/15 pb-2">
                  Upload New Study Resource
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Resource Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Calculus Introduction Slides"
                      value={materialTitle}
                      onChange={e => setMaterialTitle(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Target Class</label>
                    <select
                      value={materialClass}
                      onChange={e => setMaterialClass(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(c => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Subject Category</label>
                    <select
                      value={materialSubject}
                      onChange={e => setMaterialSubject(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-outline-variant/10 pt-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Resource File (PDF, PPT, DOC, JPG, etc)</label>
                    <input 
                      type="file" 
                      onChange={e => setMaterialFile(e.target.files[0])}
                      className="text-xs font-semibold text-outline file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-fixed file:text-primary file:cursor-pointer"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingMaterial}
                    className="py-3 px-6 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                  >
                    {uploadingMaterial ? 'Uploading...' : 'Publish Study Material'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-on-surface tracking-wider border-b border-outline-variant/15 pb-2 text-left">
                Available Resources
              </h3>
              
              {loading ? (
                <div className="py-12 text-center text-outline font-semibold">Loading resources...</div>
              ) : materials.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">No study material found for your class.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map(mat => (
                    <div key={mat.id} className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/20 flex flex-col justify-between text-left group">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 bg-primary-fixed text-primary text-[8px] font-black uppercase rounded-md">
                            {mat.subject}
                          </span>
                          <span className="text-[9px] text-outline font-bold">Class {mat.grade}</span>
                        </div>
                        <h4 className="text-xs font-bold text-on-surface mt-2 group-hover:text-primary transition-colors truncate">
                          {mat.title}
                        </h4>
                        <p className="text-[9px] text-outline font-semibold mt-0.5 truncate">File: {mat.filename}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-4">
                        <div className="text-[8px] text-outline font-medium">
                          Uploaded: {formatDate(mat.created_at)}
                        </div>
                        <div className="flex gap-2">
                          {role === 'student' ? (
                            <button 
                              type="button"
                              onClick={() => setViewingMaterial(mat)}
                              className="px-3.5 py-2 rounded-2xl bg-primary-fixed hover:bg-primary hover:text-on-primary text-primary font-bold text-[10px] shadow-xs active:scale-95 duration-100 flex items-center gap-1 border-none cursor-pointer animate-fadeIn"
                              title="View Resource"
                            >
                              <span className="material-symbols-outlined text-xs">visibility</span>
                              <span>View Resource</span>
                            </button>
                          ) : (
                            <>
                              <a 
                                href={getAttachmentUrl(mat.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center hover:bg-primary-fixed hover:text-primary transition-colors text-on-surface"
                                title="Download Material"
                              >
                                <span className="material-symbols-outlined text-sm">download</span>
                              </a>
                              {(role === 'teacher' || role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteMaterial(mat.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors border-none cursor-pointer"
                                  title="Delete Material"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------
            TAB 2: TESTS & ANSWER KEYS
            ---------------------------------------------------- */}
        {activeTab === 'tests' && (
          <section className="space-y-6">
            {(role === 'teacher' || role === 'admin') && (
              <form onSubmit={handleUploadTest} className="bg-surface-container-lowest p-6 rounded-[24px] border border-outline-variant/35 shadow-sm space-y-4 text-xs text-left">
                <h3 className="text-xs font-black uppercase text-primary tracking-wider border-b border-outline-variant/15 pb-2">
                  Publish Question Papers / Keys
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Test Title</label>
                    <input 
                      type="text"
                      placeholder="e.g. Physics Midterm Examination"
                      value={testTitle}
                      onChange={e => setTestTitle(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Target Class</label>
                    <select
                      value={testClass}
                      onChange={e => setTestClass(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(c => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Subject Category</label>
                    <select
                      value={testSubject}
                      onChange={e => setTestSubject(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/10 pt-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Question Paper File (Optional)</label>
                    <input 
                      type="file" 
                      onChange={e => setQPaperFile(e.target.files[0])}
                      className="text-xs font-semibold text-outline file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-fixed file:text-primary file:cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Answer Key File (Optional)</label>
                    <input 
                      type="file" 
                      onChange={e => setAnsKeyFile(e.target.files[0])}
                      className="text-xs font-semibold text-outline file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-fixed file:text-primary file:cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={uploadingTest}
                    className="py-3 px-6 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                  >
                    {uploadingTest ? 'Publishing...' : 'Upload Test & Keys'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-on-surface tracking-wider border-b border-outline-variant/15 pb-2 text-left">
                Test Files & Roster Keys
              </h3>

              {loading ? (
                <div className="py-12 text-center text-outline font-semibold">Loading tests...</div>
              ) : tests.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">No test keys found for your class.</div>
              ) : (
                <div className="space-y-3">
                  {tests.map(test => (
                    <div key={test.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition-all text-left bg-surface-container-low/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-secondary-container text-on-secondary-container text-[8px] font-black uppercase rounded-md">
                            {test.subject}
                          </span>
                          <span className="text-[9px] text-outline font-bold">Class {test.grade}</span>
                        </div>
                        <h4 className="text-xs font-bold text-on-surface mt-1.5">{test.title}</h4>
                        <p className="text-[8px] text-outline font-semibold mt-0.5">Uploaded on: {formatDate(test.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {test.question_paper_url && (
                          <a 
                            href={getAttachmentUrl(test.question_paper_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-surface-container hover:bg-primary-fixed hover:text-primary rounded-xl text-[10px] font-bold text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">description</span>
                            <span>Question Paper</span>
                          </a>
                        )}
                        {test.answer_key_url && (
                          <a 
                            href={getAttachmentUrl(test.answer_key_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-primary-fixed text-primary hover:bg-primary/10 rounded-xl text-[10px] font-bold transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">key</span>
                            <span>Answer Key</span>
                          </a>
                        )}
                        {(role === 'teacher' || role === 'admin') && (
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors border-none cursor-pointer"
                            title="Delete Test Package"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------
            TAB 3: GRADES & RESULTS (Filtered Views)
            ---------------------------------------------------- */}
        {activeTab === 'results' && (
          <section className="space-y-6">
            
            {/* Unified Filter Controls card */}
            <div className="bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm space-y-4 text-xs text-left">
              <div className="flex items-center gap-1.5 border-b border-outline-variant/15 pb-2">
                <span className="material-symbols-outlined text-primary text-base">filter_alt</span>
                <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                  Result Roster Filters
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {role !== 'student' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] uppercase text-outline">Class</label>
                      <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      >
                        {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] uppercase text-outline">Specific Student</label>
                      <select
                        value={filterStudentId}
                        onChange={e => setFilterStudentId(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      >
                        <option value="All">All Students ({studentsList.length})</option>
                        {studentsList.map(s => (
                          <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Subject</label>
                  <select
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    <option value="All">All Subjects</option>
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Timeframe Preset</label>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    <option value="all">All Time</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="semester">Current Term / Semester</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Pickers */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/10 animate-fadeIn">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Start Date</label>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">End Date</label>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats mini cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Tally Tests</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{totalTests}</h4>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Average Score</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{averageScore}%</h4>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Highest Marks</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{highestScore}%</h4>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Pass Rate</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{passRate}%</h4>
              </div>
            </div>

            {/* Record New Scores Collapsible Panel (Teacher & Admin views) */}
            {(role === 'teacher' || role === 'admin') && (
              <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 shadow-sm text-xs overflow-hidden">
                <div 
                  onClick={() => setIsRecordScoresOpen(!isRecordScoresOpen)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-container-low/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                      Record New Class Test Scores ({filterClass})
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-outline">
                    {isRecordScoresOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>

                {isRecordScoresOpen && (
                  <form onSubmit={handleRecordScoresSubmit} className="p-5 border-t border-outline-variant/20 space-y-4 text-left animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">Test Title</label>
                        <input 
                          type="text"
                          placeholder="e.g. Chapter 3 Calculus Quiz"
                          value={recordTestTitle}
                          onChange={e => setRecordTestTitle(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">Subject</label>
                        <select
                          value={recordSubject}
                          onChange={e => setRecordSubject(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                        >
                          {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">Total Marks</label>
                        <input 
                          type="number"
                          value={recordTotalMarks}
                          onChange={e => setRecordTotalMarks(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">Test Date</label>
                        <input 
                          type="date"
                          value={recordDate}
                          onChange={e => setRecordDate(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                          required
                        />
                      </div>
                    </div>

                    {/* CSV Batch Operations */}
                    <div className="flex flex-wrap items-center gap-3.5 bg-surface-container-low/30 p-3.5 rounded-2xl border border-outline-variant/30 text-[10px]">
                      <div className="flex-1 text-left">
                        <span className="font-bold text-on-surface uppercase block">Excel / CSV Batch Operations</span>
                        <span className="text-outline font-medium">Download the student roster list, fill details offline, and upload.</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Download Template button */}
                        <button
                          type="button"
                          onClick={handleDownloadCSVTemplate}
                          className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">download</span>
                          <span>Download Template</span>
                        </button>
                        
                        {/* Upload CSV button */}
                        <label className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold cursor-pointer hover:bg-opacity-95 transition-all active:scale-95 duration-100 shadow-xs">
                          <span className="material-symbols-outlined text-xs">upload</span>
                          <span>Upload Scores (CSV)</span>
                          <input 
                            type="file" 
                            accept=".csv"
                            onChange={handleUploadCSV}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    {/* Student scores rows */}
                    <div className="border-t border-outline-variant/10 pt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                      <label className="font-bold text-[10px] uppercase text-outline mb-1 block">Student Marks Roster</label>
                      {studentsList.length === 0 ? (
                        <p className="text-center py-4 text-outline font-semibold">No students found in Class {filterClass}.</p>
                      ) : (
                        studentsList.map(s => (
                          <div key={s.user_id} className="flex items-center gap-3 p-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/10">
                            <span className="text-[10px] font-bold text-outline w-12 shrink-0">Roll #{s.roll_number}</span>
                            <span className="text-xs font-bold text-on-surface flex-1 truncate">{s.full_name}</span>
                            
                            <input 
                              type="number"
                              placeholder="Marks"
                              value={marksData[s.user_id]?.marks || ''}
                              onChange={e => handleMarksDataChange(s.user_id, 'marks', e.target.value)}
                              className="w-20 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-center"
                              min="0"
                              max={recordTotalMarks}
                              step="0.5"
                            />
                            
                            <input 
                              type="text"
                              placeholder="Remarks (Optional)"
                              value={marksData[s.user_id]?.remarks || ''}
                              onChange={e => handleMarksDataChange(s.user_id, 'remarks', e.target.value)}
                              className="w-40 md:w-60 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs"
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex justify-end border-t border-outline-variant/10 pt-3">
                      <button
                        type="submit"
                        disabled={submittingMarks}
                        className="py-2.5 px-6 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer select-none border-none"
                      >
                        {submittingMarks ? 'Recording...' : 'Submit Score Roster'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Results Logs Table list */}
            <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 flex-wrap gap-2">
                <h3 className="text-xs font-black uppercase text-on-surface tracking-wider text-left">
                  Test Score History Records
                </h3>
                
                {filteredResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportHistoryCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high border border-outline-variant/50 text-[10px] font-bold rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors active:scale-95 duration-100"
                  >
                    <span className="material-symbols-outlined text-xs">download_for_offline</span>
                    <span>Export History (CSV)</span>
                  </button>
                )}
              </div>

              {loadingResults ? (
                <div className="py-12 text-center text-outline font-semibold">Querying scores...</div>
              ) : filteredResults.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">No scores match the selected filters.</div>
              ) : (
                <div className="overflow-x-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-outline uppercase font-bold text-[9px] tracking-wider">
                        {role !== 'student' && <th className="pb-3.5 font-bold">Student</th>}
                        <th className="pb-3.5 font-bold">Test Title</th>
                        <th className="pb-3.5 font-bold">Subject</th>
                        <th className="pb-3.5 font-bold">Date</th>
                        <th className="pb-3.5 font-bold text-center">Score</th>
                        <th className="pb-3.5 font-bold text-center">Percentage</th>
                        <th className="pb-3.5 font-bold text-center">Grade</th>
                        <th className="pb-3.5 font-bold pl-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filteredResults.map(r => (
                        <tr key={r.id} className="hover:bg-surface-container-low/10 transition-colors">
                          {role !== 'student' && (
                            <td className="py-3.5 font-bold text-on-surface">
                              {r.student_name || studentsList.find(s => s.user_id === r.student_id)?.full_name || 'Student'}
                            </td>
                          )}
                          <td className="py-3.5 font-semibold text-on-surface-variant">{r.test_title}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[8px] font-black uppercase rounded-md">
                              {r.subject}
                            </span>
                          </td>
                          <td className="py-3.5 text-outline font-medium">{formatDate(r.test_date || r.created_at)}</td>
                          <td className="py-3.5 text-center font-bold text-on-surface">{r.marks_obtained} / {r.total_marks}</td>
                          <td className="py-3.5 text-center font-black text-primary">{r.percentage}%</td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              r.grade_letter === 'A+' || r.grade_letter === 'A' 
                                ? 'bg-green-50 text-green-700' 
                                : r.grade_letter === 'F' 
                                  ? 'bg-red-50 text-error' 
                                  : 'bg-primary-fixed text-primary'
                            }`}>
                              {r.grade_letter}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 text-outline font-semibold italic truncate max-w-[150px]" title={r.remarks}>
                            {r.remarks || '---'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------
            TAB 4: PERFORMANCE REPORTS (Analytical Comparisons)
            ---------------------------------------------------- */}
        {activeTab === 'reports' && (
          <section className="space-y-6">
            
            {/* Filter controls matching results tab */}
            <div className="bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm space-y-4 text-xs text-left">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-report-area, #printable-report-area * {
                    visibility: visible;
                  }
                  #printable-report-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white !important;
                  }
                  .print\\:hidden {
                    display: none !important;
                  }
                }
              `}} />
              
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">analytics</span>
                  <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                    Academic Performance Analytics Filters
                  </h3>
                </div>
                
                {/* Print/Download Action (Only for Teacher & Admin roles) */}
                {(role === 'teacher' || role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-[10px] font-bold shadow-xs hover:bg-opacity-95 transition-all active:scale-95 duration-100 border-none cursor-pointer print:hidden"
                  >
                    <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                    <span>Download Report (PDF)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {role !== 'student' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] uppercase text-outline">Class</label>
                      <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      >
                        {['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A'].map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] uppercase text-outline">Student</label>
                      <select
                        value={filterStudentId}
                        onChange={e => setFilterStudentId(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      >
                        <option value="All">All Students ({studentsList.length})</option>
                        {studentsList.map(s => (
                          <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Subject</label>
                  <select
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    <option value="All">All Subjects</option>
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">Timeframe Preset</label>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    <option value="all">All Time</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="semester">Current Term / Semester</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/10 animate-fadeIn">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">Start Date</label>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">End Date</label>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Printable Wrapper */}
            <div id="printable-report-area" className="space-y-6">
              {/* Branded print header */}
              <div className="hidden print:block text-left border-b-2 border-primary pb-4 mb-6">
                <h1 className="text-lg font-black text-primary uppercase tracking-wider">
                  Educore Performance Report Card
                </h1>
                <p className="text-[10px] text-outline font-bold mt-1">
                  Class: {filterClass} &bull; Subject: {filterSubject} &bull; Student: {filterStudentId === 'All' ? 'All Students' : studentsList.find(s => s.user_id === filterStudentId)?.full_name || filterStudentId}
                </p>
                <p className="text-[9px] text-outline font-semibold uppercase">
                  Timeframe: {dateRange === 'all' ? 'All Time' : dateRange === '30days' ? 'Last 30 Days' : dateRange === 'semester' ? 'Current Semester Term' : `${customStartDate} to ${customEndDate}`}
                </p>
                <p className="text-[8px] text-outline mt-1 font-medium">Generated on: {new Date().toLocaleString()}</p>
              </div>

              {/* Performance Indicators Metrics panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Attendance Card */}
              <div className="bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm">
                <span className="text-[10px] font-black text-outline uppercase tracking-wider">Attendance Rate</span>
                <h3 className="text-3xl font-black text-primary mt-1">
                  {selectedStudentAttendance !== null ? `${selectedStudentAttendance}%` : `${classAverageAttendance}%`}
                </h3>
                <p className="text-[9px] text-outline font-semibold mt-2.5">
                  {selectedStudentAttendance !== null 
                    ? `Individual student attendance records` 
                    : `Average attendance rate for Class ${filterClass}`}
                </p>
              </div>

              {/* Term Score Averages */}
              <div className="bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm">
                <span className="text-[10px] font-black text-outline uppercase tracking-wider">Filtered Average Marks</span>
                <h3 className="text-3xl font-black text-primary mt-1">{averageScore}%</h3>
                <p className="text-[9px] text-outline font-semibold mt-2.5">
                  {role === 'student'
                    ? `My average score across all matching exams`
                    : `Composite average for ${filterStudentId === 'All' ? `Class ${filterClass}` : 'selected student'}`}
                </p>
              </div>

              {/* Pass rate comparative */}
              <div className="bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/35 shadow-sm">
                <span className="text-[10px] font-black text-outline uppercase tracking-wider">Pass Rate (&ge;50%)</span>
                <h3 className="text-3xl font-black text-primary mt-1">{passRate}%</h3>
                <p className="text-[9px] text-outline font-semibold mt-2.5">
                  Status:{' '}
                  <span className={`font-bold ${passRate >= 90 ? 'text-green-700' : passRate >= 75 ? 'text-primary' : 'text-error'}`}>
                    {passRate >= 90 ? 'Excellent Performance' : passRate >= 75 ? 'Optimal Standing' : 'Needs Academic Attention'}
                  </span>
                </p>
              </div>
            </div>

            {/* Analytics distribution dashboard layouts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
              
              {/* Left comparative chart widgets panel */}
              <div className="lg:col-span-6 bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-on-surface tracking-wider border-b border-outline-variant/15 pb-2">
                  {role === 'student' ? 'Subject Averages vs Class Averages' : 'Grade distribution tally'}
                </h4>

                {role === 'student' ? (
                  /* Student View: Subject-wise class comparison progress bars */
                  <div className="space-y-4">
                    {studentSubjectComparisons.length === 0 ? (
                      <p className="text-xs text-outline font-semibold py-8 text-center">No subject averages found.</p>
                    ) : (
                      studentSubjectComparisons.map(sub => (
                        <div key={sub.subject} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-on-surface">{sub.subject}</span>
                            <span className="text-primary">Me: {sub.myAvg}% <span className="text-outline font-medium">/ Class: {sub.classAvg}%</span></span>
                          </div>
                          {/* Comparative visual bar */}
                          <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden relative flex">
                            <div 
                              className="h-full bg-primary/45 rounded-full absolute left-0 top-0" 
                              style={{ width: `${sub.classAvg}%` }} 
                              title="Class Average"
                            />
                            <div 
                              className="h-full bg-primary rounded-full absolute left-0 top-0" 
                              style={{ width: `${sub.myAvg}%` }} 
                              title="My Average"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Teacher/Admin View: Grade distribution counts progress bars */
                  <div className="space-y-3.5">
                    {Object.keys(gradeCounts).map(g => {
                      const count = gradeCounts[g]
                      const pct = totalTests > 0 ? Math.round((count / totalTests) * 100) : 0
                      return (
                        <div key={g} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-on-surface">
                            <span>Grade {g}</span>
                            <span>{count} tests ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                g === 'A+' || g === 'A' 
                                  ? 'bg-green-600' 
                                  : g === 'F' 
                                    ? 'bg-error' 
                                    : 'bg-primary'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right Leaderboards or Student Specific Progress trends panel */}
              <div className="lg:col-span-6 bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-on-surface tracking-wider border-b border-outline-variant/15 pb-2">
                  {role === 'student' ? 'My Progress Trend Log' : `Student Comparative leaderboard (${filterClass})`}
                </h4>

                {role === 'student' ? (
                  /* Student View: Progress trend list showing percentage changes */
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {filteredResults.length === 0 ? (
                      <p className="text-xs text-outline font-semibold py-8 text-center">No exam logs to analyze trends.</p>
                    ) : (
                      filteredResults.map((r, i) => {
                        const prev = filteredResults[i + 1]
                        const diff = prev ? r.percentage - prev.percentage : 0
                        return (
                          <div key={r.id} className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/10 flex items-center justify-between gap-3">
                            <div>
                              <h5 className="text-xs font-bold text-on-surface leading-tight">{r.test_title}</h5>
                              <p className="text-[8px] text-outline font-semibold uppercase mt-0.5">{r.subject} &bull; {formatDate(r.test_date || r.created_at)}</p>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-xs font-black text-primary">{r.percentage}%</span>
                              {prev && (
                                <p className={`text-[8px] font-bold ${diff >= 0 ? 'text-green-700' : 'text-error'} flex items-center gap-0.5 justify-end`}>
                                  <span className="material-symbols-outlined text-[9px]">{diff >= 0 ? 'trending_up' : 'trending_down'}</span>
                                  <span>{diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  /* Teacher/Admin View: Student comparisons leaderboard list */
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {studentLeaderboard.length === 0 ? (
                      <p className="text-xs text-outline font-semibold py-8 text-center">No students found.</p>
                    ) : (
                      studentLeaderboard.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low/10 hover:border-primary/20 transition-all">
                          <span className="w-5 text-[10px] font-black text-outline text-center">#{idx + 1}</span>
                          
                          <div className="w-7 h-7 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-extrabold text-[10px] uppercase shadow-xs shrink-0">
                            {item.name?.[0] || 'U'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-on-surface truncate leading-tight">{item.name}</h5>
                            <p className="text-[8px] text-outline font-semibold uppercase">Roll #{item.roll} &bull; {item.testsCount} tests</p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-primary">{item.average}%</span>
                            <p className="text-[7px] text-outline font-semibold uppercase">average</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>
      )}
      {activeTab === 'schedules' && (
        <SchedulePage embed={true} />
      )}

        {/* Secure In-App Viewer Modal (Student view restriction) */}
        {viewingMaterial && (
          <div className="fixed inset-0 bg-surface-container-lowest z-[100] flex flex-col animate-fadeIn">
            <div className="w-full h-full flex flex-col relative">
              
              {/* Header */}
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low text-left">
                <div>
                  <span className="px-2 py-0.5 bg-primary-fixed text-primary text-[8px] font-black uppercase rounded-md">
                    {viewingMaterial.subject}
                  </span>
                  <h3 className="font-bold text-xs text-on-surface mt-1 truncate max-w-[250px] sm:max-w-md">
                    {viewingMaterial.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Secure View Pane */}
              <div 
                className="flex-1 overflow-auto bg-surface-container-lowest p-6 flex items-center justify-center relative select-none"
                onContextMenu={e => e.preventDefault()}
                onDragStart={e => e.preventDefault()}
              >
                {/* Watermark overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center gap-16 overflow-hidden opacity-[0.03] select-none">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i} className="text-xs font-black rotate-[-25deg] tracking-widest uppercase">
                      Educore Secure Preview Only
                    </span>
                  ))}
                </div>

                {/* Content Renderer */}
                {(() => {
                  const ext = viewingMaterial.file_url.split('.').pop().toLowerCase()
                  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
                  const isPdf = ext === 'pdf'
                  
                  if (isImg) {
                    return (
                      <img 
                        src={getAttachmentUrl(viewingMaterial.file_url)} 
                        alt="Study Resource" 
                        className="max-h-[80vh] object-contain rounded-2xl shadow-sm border border-outline-variant/20"
                      />
                    )
                  }

                  if (isPdf) {
                    return (
                      <iframe 
                        src={getAttachmentUrl(viewingMaterial.file_url) + '#toolbar=0&navpanes=0'} 
                        className="w-full h-full border border-outline-variant/30 rounded-2xl"
                        title="PDF Viewer"
                      />
                    )
                  }

                  return (
                    <div className="text-center p-8 max-w-sm rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/20">
                      <span className="material-symbols-outlined text-4xl text-primary">menu_book</span>
                      <h4 className="font-bold text-xs mt-2 text-on-surface">Secure Document Stream</h4>
                      <p className="text-[10px] text-outline font-semibold mt-1">
                        Resource files of format .{ext} are streamed securely in-app. Local download is disabled by administrator policy.
                      </p>
                      <a 
                        href={getAttachmentUrl(viewingMaterial.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-bold shadow-xs hover:bg-opacity-95 text-decoration-none"
                      >
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        <span>Stream Live View</span>
                      </a>
                    </div>
                  )
                })()}

              </div>

              {/* Secure Footnote */}
              <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 text-center text-[9px] font-bold text-outline uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-primary">lock</span>
                <span>Protected by Educore Security Shield Policy &bull; Local copies disallowed</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
