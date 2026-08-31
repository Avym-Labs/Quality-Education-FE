import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import SchedulePage from './SchedulePage'
import StudentHomework from '../student/StudentHomework'
import HomeworkAssignment from '../teacher/HomeworkAssignment'
import Icon from '../../components/common/Icon'
import DateInput from '../../components/common/DateInput'
import { formatDateDMY, formatIsoDateDMY } from '../../utils/dateFormat'

export default function AcademicsHub() {
  const { t } = useTranslation()
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
  const [materialClass, setMaterialClass] = useState(user?.assigned_classes?.[0] || '')
  const [materialSubject, setMaterialSubject] = useState(user?.subjects?.[0] || '')
  const [materialFile, setMaterialFile] = useState(null)
  const [materialLinkUrl, setMaterialLinkUrl] = useState('')
  const [linkPreview, setLinkPreview] = useState(null) // { url, title, description, image }
  const [fetchingLinkPreview, setFetchingLinkPreview] = useState(false)
  const [uploadingMaterial, setUploadingMaterial] = useState(false)

  const [testTitle, setTestTitle] = useState('')
  const [testClass, setTestClass] = useState(user?.assigned_classes?.[0] || '')
  const [testSubject, setTestSubject] = useState(user?.subjects?.[0] || '')
  const [qPaperFile, setQPaperFile] = useState(null)
  const [ansKeyFile, setAnsKeyFile] = useState(null)
  const [uploadingTest, setUploadingTest] = useState(false)

  // ----------------------------------------------------
  // FILTER STATES (For Results & Reports tabs)
  // ----------------------------------------------------
  const [filterClass, setFilterClass] = useState(user?.assigned_classes?.[0] || (user?.grade ? `${user.grade}-${user.section}` : ''))
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterStudentId, setFilterStudentId] = useState('All')
  const [dateRange, setDateRange] = useState('all') // 'all' | '30days' | 'semester' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Class students  list (Only for Teacher/Admin)
  const [studentsList, setStudentsList] = useState([])
  // Filtered results list
  const [filteredResults, setFilteredResults] = useState([])
  const [loadingResults, setLoadingResults] = useState(false)

  // Results Marks Recorder Form (Only for Teacher/Admin)
  const [isRecordScoresOpen, setIsRecordScoresOpen] = useState(false)
  const [recordSubject, setRecordSubject] = useState(user?.subjects?.[0] || '')
  const [recordTestTitle, setRecordTestTitle] = useState('')
  const [recordTotalMarks, setRecordTotalMarks] = useState(100)
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0])
  const [marksData, setMarksData] = useState({}) // student_user_id -> { marks: number, remarks: string }
  const [submittingMarks, setSubmittingMarks] = useState(false)

  // =========================================================================
  // NEW REPORTS DASHBOARD STATES & HELPERS
  // =========================================================================
  // Real tenant classes (not a hardcoded default) — used for both the Class
  // Reports selector and the Individual Reports modal's Standard selector.
  const [reportsClasses, setReportsClasses] = useState([])
  useEffect(() => {
    async function loadReportsClasses() {
      if (!user || role === 'student') return
      try {
        const { data } = await api.get('/classes')
        setReportsClasses(data || [])
      } catch (err) {
        console.error('Failed to load classes for reports:', err)
      }
    }
    loadReportsClasses()
  }, [user, role])
  const availableStandards = reportsClasses.map(c => `Standard ${c.grade}-${c.section}`)

  // Real tenant-wide subject list, derived from what teachers actually
  // teach (not a guessed/hardcoded list) — used for the admin's Grades &
  // Results subject picker below. Only admins can call GET /teachers.
  const [allTeachers, setAllTeachers] = useState([])
  useEffect(() => {
    async function loadAllTeachers() {
      if (!user || role !== 'admin') return
      try {
        const { data } = await api.get('/teachers')
        setAllTeachers(data || [])
      } catch (err) {
        console.error('Failed to load teachers for subject list:', err)
      }
    }
    loadAllTeachers()
  }, [user, role])
  const tenantSubjects = [...new Set(allTeachers.flatMap(t => t.subjects || []))].sort()

  // Shared by every class/subject picker across this hub (Study Material,
  // Tests, Grades & Results — the Subject filter is visible to students
  // too, so this covers all three roles): a teacher or student only sees
  // classes/subjects that are actually theirs — an admin oversees the whole
  // school, so they get the real tenant-wide lists (real classes, real
  // subjects actually being taught) instead of a personal subset or a
  // guessed/hardcoded default.
  const relevantClassOptions = role === 'admin'
    ? reportsClasses.map(c => `${c.grade}-${c.section}`)
    : (user?.assigned_classes || [])
  const relevantSubjectOptions = role === 'admin'
    ? tenantSubjects
    : (user?.subjects || [])

  // For admin, relevantClassOptions/relevantSubjectOptions arrive
  // asynchronously after mount — once they do, snap any picker still on an
  // empty/stale default onto the first real option instead of leaving it
  // pointed at nothing (or a value that isn't actually a real class/subject).
  useEffect(() => {
    if (relevantClassOptions.length === 0) return
    if (!relevantClassOptions.includes(materialClass)) setMaterialClass(relevantClassOptions[0])
    if (!relevantClassOptions.includes(testClass)) setTestClass(relevantClassOptions[0])
    if (!relevantClassOptions.includes(filterClass)) setFilterClass(relevantClassOptions[0])
  }, [relevantClassOptions.join(',')])

  useEffect(() => {
    if (relevantSubjectOptions.length === 0) return
    if (!relevantSubjectOptions.includes(materialSubject)) setMaterialSubject(relevantSubjectOptions[0])
    if (!relevantSubjectOptions.includes(testSubject)) setTestSubject(relevantSubjectOptions[0])
    if (!relevantSubjectOptions.includes(recordSubject)) setRecordSubject(relevantSubjectOptions[0])
  }, [relevantSubjectOptions.join(',')])

  // Marks-entry roster for "Record New Class Test Scores": everyone in the
  // class, admin included, is further narrowed to students actually
  // enrolled in the subject being recorded — a class doesn't mean every
  // student in it takes every elective/subject.
  const recordEligibleStudents = studentsList.filter(s => (s.subjects || []).includes(recordSubject))

  const [reportsSelectedClass, setReportsSelectedClass] = useState('')
  const [reportsStartDate, setReportsStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [reportsEndDate, setReportsEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [reportsViewMode, setReportsViewMode] = useState('config')
  const [reportsExportMessage, setReportsExportMessage] = useState('')

  const handleGenerateReport = () => {
    setReportsViewMode('class_report')
  }

  // Individual Student Modal States
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false)
  const [reportsModalStandard, setReportsModalStandard] = useState('')
  const [reportsModalStudents, setReportsModalStudents] = useState([])
  const [reportsModalSelectedStudentId, setReportsModalSelectedStudentId] = useState('')
  const [reportsModalStartDate, setReportsModalStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [reportsModalEndDate, setReportsModalEndDate] = useState(() => new Date().toISOString().split('T')[0])

  // Default the class selectors to the first real class once classes load
  useEffect(() => {
    if (availableStandards.length === 0) return
    if (!reportsSelectedClass) setReportsSelectedClass(availableStandards[0])
    if (!reportsModalStandard) setReportsModalStandard(availableStandards[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableStandards.length])

  // Load students list dynamically for modalStandard when changed — every
  // standard (including 11) goes through the same real /students fetch.
  useEffect(() => {
    async function fetchModalStudents() {
      if (!user || !reportsModalStandard) { setReportsModalStudents([]); return }
      try {
        const classToLoad = reportsModalStandard.replace('Standard ', '')
        const [grade, section] = classToLoad.split('-')
        const { data } = await api.get('/students', {
          params: { grade, section: section || '' }
        })
        setReportsModalStudents(data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchModalStudents()
  }, [reportsModalStandard, user])

  // Real per-student, per-class attendance for the Class Reports view
  const [reportsClassStudents, setReportsClassStudents] = useState([])
  const [reportsClassAttendance, setReportsClassAttendance] = useState([])
  useEffect(() => {
    async function loadReportsClassData() {
      if (!reportsSelectedClass) { setReportsClassStudents([]); setReportsClassAttendance([]); return }
      try {
        const classKey = reportsSelectedClass.replace('Standard ', '')
        const [grade, section] = classKey.split('-')
        const [studentsRes, attendanceRes] = await Promise.all([
          api.get('/students', { params: { grade, section: section || '' } }),
          api.get('/attendance', { params: { grade, section: section || '' } }),
        ])
        setReportsClassStudents(studentsRes.data || [])
        setReportsClassAttendance(attendanceRes.data || [])
      } catch (err) {
        console.error('Failed to load class reports data:', err)
      }
    }
    loadReportsClassData()
  }, [reportsSelectedClass])

  // Real attendance for the specific student selected in the Individual
  // Reports modal
  const [modalStudentAttendance, setModalStudentAttendance] = useState([])
  useEffect(() => {
    async function loadModalStudentAttendance() {
      if (!reportsModalSelectedStudentId) { setModalStudentAttendance([]); return }
      try {
        const { data } = await api.get('/attendance', { params: { student_id: reportsModalSelectedStudentId } })
        setModalStudentAttendance(data || [])
      } catch (err) {
        console.error('Failed to load student attendance for report:', err)
      }
    }
    loadModalStudentAttendance()
  }, [reportsModalSelectedStudentId])

  // Real attendance for the logged-in student's own report
  const [myFullAttendance, setMyFullAttendance] = useState([])
  useEffect(() => {
    async function loadMyAttendance() {
      if (!user || role !== 'student') return
      try {
        const params = { student_id: user.id }
        if (filterSubject !== 'All') params.subject = filterSubject
        const { data } = await api.get('/attendance', { params })
        setMyFullAttendance(data || [])
      } catch (err) {
        console.error('Failed to load my attendance for reports:', err)
      }
    }
    loadMyAttendance()
  }, [user, role, filterSubject])

  // The student's real account-creation date — the report period can never
  // start earlier than this, and "Since Joining" uses it as the real start.
  const [myJoinDate, setMyJoinDate] = useState(null)
  useEffect(() => {
    async function loadMyJoinDate() {
      if (!user?.student_id || role !== 'student') return
      try {
        const { data } = await api.get(`/students/${user.student_id}`)
        if (data?.member_since) setMyJoinDate(data.member_since.split('T')[0])
      } catch (err) {
        console.error('Failed to load join date for reports:', err)
      }
    }
    loadMyJoinDate()
  }, [user, role])

  // The student's own test results, scoped to the reports tab's own period +
  // subject filter (not the separate Results tab's dateRange, so the two
  // tabs' period controls don't cross-couple).
  const [myReportsResults, setMyReportsResults] = useState([])
  useEffect(() => {
    async function loadMyReportsResults() {
      if (!user || role !== 'student') return
      try {
        const params = {
          student_id: user.id,
          start_date: reportsModalStartDate,
          end_date: reportsModalEndDate,
        }
        if (filterSubject !== 'All') params.subject = filterSubject
        const { data } = await api.get('/results', { params })
        setMyReportsResults(data || [])
      } catch (err) {
        console.error('Failed to load my results for reports:', err)
      }
    }
    loadMyReportsResults()
  }, [user, role, filterSubject, reportsModalStartDate, reportsModalEndDate])

  const myReportsTotalTests = myReportsResults.length
  const myReportsAverageScore = myReportsTotalTests > 0
    ? Math.round(myReportsResults.reduce((acc, r) => acc + r.percentage, 0) / myReportsTotalTests)
    : 0
  const myReportsHighestScore = myReportsTotalTests > 0
    ? Math.max(...myReportsResults.map(r => r.percentage))
    : 0
  const myReportsPassRate = myReportsTotalTests > 0
    ? Math.round((myReportsResults.filter(r => r.percentage >= 50).length / myReportsTotalTests) * 100)
    : 0

  // Preset date-range picker shared by the student's own report and the
  // teacher/admin individual report modal (both read/write
  // reportsModalStartDate / reportsModalEndDate).
  const DATE_PRESETS = [
    { value: 'week', label: t('academicsHub.lastWeek') },
    { value: 'month', label: t('academicsHub.lastMonth') },
    { value: '3months', label: t('academicsHub.last3Months') },
    { value: 'joining', label: t('academicsHub.sinceJoining') },
    { value: 'custom', label: t('academicsHub.customRange') },
  ]
  const computePresetRange = (preset) => {
    const end = new Date()
    const start = new Date()
    if (preset === 'week') start.setDate(start.getDate() - 7)
    else if (preset === 'month') start.setMonth(start.getMonth() - 1)
    else if (preset === '3months') start.setMonth(start.getMonth() - 3)
    else if (preset === 'joining') return { start: myJoinDate || end.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  const [myReportPreset, setMyReportPreset] = useState('joining')
  const applyMyReportPreset = (preset) => {
    setMyReportPreset(preset)
    if (preset === 'custom') return
    const { start, end } = computePresetRange(preset)
    setReportsModalStartDate(start)
    setReportsModalEndDate(end)
  }

  // Same preset picker, reused for the Class Reports date filters
  const [classReportPreset, setClassReportPreset] = useState('month')
  const applyClassReportPreset = (preset) => {
    setClassReportPreset(preset)
    if (preset === 'custom') return
    const { start, end } = computePresetRange(preset)
    setReportsStartDate(start)
    setReportsEndDate(end)
  }

  // Same preset picker, reused for the teacher/admin Individual Report modal
  // ("Since Joining" doesn't apply here — we don't track another student's
  // join date in this view — so that option is left out).
  const MODAL_DATE_PRESETS = DATE_PRESETS.filter(p => p.value !== 'joining')
  const [modalReportPreset, setModalReportPreset] = useState('3months')
  const applyModalReportPreset = (preset) => {
    setModalReportPreset(preset)
    if (preset === 'custom') return
    const { start, end } = computePresetRange(preset)
    setReportsModalStartDate(start)
    setReportsModalEndDate(end)
  }
  // Once the real join date loads, apply the default "Since Joining" range
  useEffect(() => {
    if (myJoinDate && myReportPreset === 'joining') {
      setReportsModalStartDate(myJoinDate)
      setReportsModalEndDate(new Date().toISOString().split('T')[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myJoinDate])

  // Helper to round to one decimal place
  const roundToOneDecimal = (num) => Math.round(num * 10) / 10

  // Collapses possibly-multiple same-day attendance records (e.g. one per
  // subject/period) into a single real present/absent status per date —
  // no fabricated patterns.
  const buildDayStatusMap = (records) => {
    const byDate = {}
    records.forEach(r => {
      byDate[r.date] = byDate[r.date] || []
      byDate[r.date].push(r.status)
    })
    const statusByDate = {}
    Object.entries(byDate).forEach(([date, statuses]) => {
      statusByDate[date] = statuses.some(s => s === 'present' || s === 'late') ? 'present' : 'absent'
    })
    return statusByDate
  }

  // Calculate class reports data from real fetched students + attendance
  const getAcademicsReportData = () => {
    const start = new Date(reportsStartDate)
    const end = new Date(reportsEndDate)
    const schoolDaysCount = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1)

    const inRange = reportsClassAttendance.filter(r => {
      const d = new Date(r.date)
      return d >= start && d <= end
    })

    const calculatedStudents = reportsClassStudents.map((s) => {
      const studentRecords = inRange.filter(r => r.student_id === s.user_id)
      const statusByDate = buildDayStatusMap(studentRecords)
      const studentPresent = Object.values(statusByDate).filter(st => st === 'present').length
      const studentAbsent = Object.values(statusByDate).filter(st => st === 'absent').length
      const studentNoRecord = schoolDaysCount - (studentPresent + studentAbsent)
      // A day nobody marked attendance for is treated as a holiday, not a
      // school day the student missed — it's excluded from the rate rather
      // than counted against them. This also means the rate can never
      // reflect any day before the student had attendance records at all
      // (e.g. before they joined), since no record can exist for a date
      // that predates enrollment.
      const markedRate = (studentPresent + studentAbsent) > 0
        ? roundToOneDecimal((studentPresent / (studentPresent + studentAbsent)) * 100)
        : 0
      const overallRate = markedRate

      const pattern = []
      const cur = new Date(start)
      while (cur <= end) {
        const key = cur.toISOString().split('T')[0]
        pattern.push(statusByDate[key] || 'norecord')
        cur.setDate(cur.getDate() + 1)
      }

      return {
        id: s.id,
        name: s.full_name,
        role: `Class ${s.grade}-${s.section}`,
        markedRate,
        overallRate,
        present: studentPresent,
        absent: studentAbsent,
        noRecord: studentNoRecord,
        phone: s.phone || 'Not provided',
        pattern
      }
    })

    const totalPresentSum = calculatedStudents.reduce((sum, s) => sum + s.present, 0)
    const overallRateAvg = calculatedStudents.length > 0
      ? roundToOneDecimal(calculatedStudents.reduce((sum, s) => sum + s.overallRate, 0) / calculatedStudents.length)
      : 0.0

    const distribution = {
      excellent: calculatedStudents.filter(s => s.markedRate >= 90).length,
      good: calculatedStudents.filter(s => s.markedRate >= 75 && s.markedRate < 90).length,
      attention: calculatedStudents.filter(s => s.markedRate < 75).length
    }

    return {
      standardName: reportsSelectedClass,
      totalStudents: reportsClassStudents.length,
      schoolDays: schoolDaysCount,
      totalPresent: totalPresentSum,
      overallRate: overallRateAvg,
      distribution,
      students: calculatedStudents
    }
  }

  const downloadCSV = (filename, text) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const element = document.createElement('a')
    element.setAttribute('href', url)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const triggerReportsExport = (format) => {
    const className = reportsSelectedClass.split(' (')[0]
    if (format === 'csv') {
      const cReport = getAcademicsReportData()
      let csvContent = `Attendance Report for ${className}\n`
      csvContent += `Period: ${reportsStartDate} to ${reportsEndDate}\n`
      csvContent += `Total Students: ${cReport.totalStudents}\n`
      csvContent += `School Days: ${cReport.schoolDays}\n`
      csvContent += `Overall Class Attendance Rate: ${cReport.overallRate}%\n\n`
      csvContent += `Student Name,Role,Present Days,Absent Days,Attendance Rate\n`
      
      cReport.students.forEach(s => {
        csvContent += `"${s.name}","${s.role}",${s.present},${s.absent},${s.markedRate}%\n`
      })
      
      const filename = `${className.replace(/\s+/g, '_')}_attendance_report_${reportsStartDate}_to_${reportsEndDate}.csv`
      downloadCSV(filename, csvContent)
    } else {
      window.print()
    }
  }

  const triggerModalStudentExport = (format, name) => {
    const report = activeModalStudentReport
    if (!report) return
    
    if (format === 'csv') {
      let csvContent = `Individual Attendance Report for ${report.name}\n`
      csvContent += `Father Contact: ${report.phone}\n`
      csvContent += `Period: ${reportsModalStartDate} to ${reportsModalEndDate}\n`
      csvContent += `Total Days: ${report.schoolDays}\n`
      csvContent += `Present Days: ${report.present}\n`
      csvContent += `Absent Days: ${report.absent}\n`
      csvContent += `Attendance Rate: ${report.rate}%\n\n`
      
      // Monthly Breakdown
      csvContent += `Monthly Breakdown\n`
      csvContent += `Month,Total Days,Present,Absent,Rate\n`
      const breakdown = getMonthlyBreakdown(report)
      breakdown.forEach(m => {
        csvContent += `"${m.monthName}",${m.totalDays},${m.present},${m.absent},${m.rate}%\n`
      })
      
      csvContent += `\nDaily Attendance Records\n`
      csvContent += `Date,Status\n`
      
      const start = new Date(reportsModalStartDate)
      const end = new Date(reportsModalEndDate)
      let cur = new Date(start)
      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0]
        const status = report.dateStatusMap?.[dateStr] || 'norecord'
        csvContent += `"${dateStr}","${status}"\n`
        cur.setDate(cur.getDate() + 1)
      }
      
      const filename = `${report.name}_attendance_report_${reportsModalStartDate}_to_${reportsModalEndDate}.csv`
      downloadCSV(filename, csvContent)
    } else {
      document.body.classList.add('print-modal-active')
      window.print()
      setTimeout(() => {
        document.body.classList.remove('print-modal-active')
      }, 1000)
    }
  }

  // Modal Student Calculations — from real fetched attendance for the
  // selected student, no per-name special-casing or fabricated patterns.
  const getModalStudentReport = () => {
    const stud = reportsModalStudents.find(s => s.user_id === reportsModalSelectedStudentId)
    if (!stud) return null

    let start = new Date(reportsModalStartDate)
    const end = new Date(reportsModalEndDate)
    if (stud.member_since) {
      const joinDate = new Date(stud.member_since)
      if (start < joinDate) start = joinDate
    }
    const totalDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1)

    const inRange = modalStudentAttendance.filter(r => {
      const d = new Date(r.date)
      return d >= start && d <= end
    })
    const dateStatusMap = buildDayStatusMap(inRange)
    const present = Object.values(dateStatusMap).filter(s => s === 'present').length
    const absent = Object.values(dateStatusMap).filter(s => s === 'absent').length
    const noRecord = totalDays - (present + absent)
    // A day nobody marked attendance for is a holiday, not a day the
    // student missed — excluded from the rate rather than counted against
    // them.
    const markedDays = present + absent

    return {
      name: stud.full_name,
      phone: stud.phone || 'Not provided',
      schoolDays: totalDays,
      present,
      absent,
      noRecord,
      rate: markedDays > 0 ? roundToOneDecimal((present / markedDays) * 100) : 0,
      dateStatusMap
    }
  }

  // The logged-in student's own report — from their real fetched attendance.
  // The period is clamped to never start before the student's real account
  // creation date, so "Total Days" can't count days before they existed.
  const getStudentRoleReport = () => {
    const name = user?.full_name || 'Student'
    const phone = user?.phone || 'Not provided'

    let start = new Date(reportsModalStartDate)
    const end = new Date(reportsModalEndDate)
    if (myJoinDate) {
      const joinDate = new Date(myJoinDate)
      if (start < joinDate) start = joinDate
    }
    const totalDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1)

    const inRange = myFullAttendance.filter(r => {
      const d = new Date(r.date)
      return d >= start && d <= end
    })
    const dateStatusMap = buildDayStatusMap(inRange)
    const present = Object.values(dateStatusMap).filter(s => s === 'present').length
    const absent = Object.values(dateStatusMap).filter(s => s === 'absent').length
    const noRecord = totalDays - (present + absent)
    // A day nobody marked attendance for is a holiday, not a day the
    // student missed — excluded from the rate rather than counted against
    // them. Combined with the join-date clamp above, the rate can never be
    // dragged down by a day before the student existed or a day no one
    // took attendance on.
    const markedDays = present + absent

    return {
      name,
      phone,
      schoolDays: totalDays,
      present,
      absent,
      noRecord,
      rate: markedDays > 0 ? roundToOneDecimal((present / markedDays) * 100) : 0,
      dateStatusMap
    }
  }

  const activeModalStudentReport = getModalStudentReport()

  // Switches the active tab and keeps the URL's ?tab= param in sync with the sidebar submenu
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    navigate(`${location.pathname}?tab=${tab}`, { replace: true })
  }

  const getMonthlyBreakdown = (report) => {
    const start = new Date(reportsModalStartDate);
    const end = new Date(reportsModalEndDate);
    const months = [];
    
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      months.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    
    return months.map(m => {
      const monthName = m.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      const monthYear = m.getFullYear();
      const monthIndex = m.getMonth();
      const firstDayOfMonth = new Date(monthYear, monthIndex, 1);
      const lastDayOfMonth = new Date(monthYear, monthIndex + 1, 0);
      
      const rangeStart = start > firstDayOfMonth ? start : firstDayOfMonth;
      const rangeEnd = end < lastDayOfMonth ? end : lastDayOfMonth;
      
      const daysCount = Math.max(0, Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) + 1);
      
      let present = 0;
      let absent = 0;

      let temp = new Date(rangeStart);
      while (temp <= rangeEnd) {
        const key = temp.toISOString().split('T')[0];
        const status = report.dateStatusMap?.[key];
        if (status === 'present') present++;
        else if (status === 'absent') absent++;

        temp.setDate(temp.getDate() + 1);
      }
      
      // A day nobody marked attendance for is a holiday, not a day the
      // student missed — excluded from the rate rather than counted against
      // them, matching every other rate calculation in this file.
      const rate = (present + absent) > 0 ? roundToOneDecimal((present / (present + absent)) * 100) : 0.0;

      return {
        monthName,
        totalDays: daysCount,
        present,
        absent,
        rate
      };
    });
  }

  const renderReportsCalendarGrid = (report) => {
    const start = new Date(reportsModalStartDate);
    const end = new Date(reportsModalEndDate);
    
    const dates = [];
    let cur = new Date(start);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    
    const firstWeekdayIndex = start.getDay();
    const cells = [];
    
    for (let i = 0; i < firstWeekdayIndex; i++) {
      cells.push({ isPadding: true });
    }
    
    dates.forEach(d => {
      const key = d.toISOString().split('T')[0];
      const status = report.dateStatusMap?.[key] || 'norecord';

      cells.push({
        isPadding: false,
        dayNum: d.getDate(),
        monthLabel: d.getDate() === 1 ? d.toLocaleString('en-US', { month: 'short' }) : '',
        status,
        dateStr: formatDateDMY(d)
      });
    });
    
    return (
      <div className="grid grid-cols-7 gap-2 justify-center">
        {cells.map((cell, index) => {
          if (cell.isPadding) {
            return <div key={`pad-${index}`} className="w-7 h-7 sm:w-8 sm:h-8 bg-transparent" />;
          }
          
          let colorClass = 'bg-slate-200 text-on-surface-variant/80 border border-outline-variant/15'
          if (cell.status === 'present') colorClass = 'bg-emerald-500 text-white font-bold'
          else if (cell.status === 'absent') colorClass = 'bg-red-500 text-white font-bold'
          
          return (
            <div 
              key={`cell-${index}`}
              title={cell.dateStr}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold relative transition-all hover:scale-110 cursor-default mx-auto ${colorClass}`}
            >
              <span>{cell.dayNum}</span>
              {cell.monthLabel && (
                <span className="absolute -top-1 bg-primary text-white text-[6px] px-1 rounded-sm uppercase tracking-wide">
                  {cell.monthLabel}
                </span>
              )}
            </div>
          )
        })}
      </div>
    );
  }


  // Auto-route tabs based on the ?tab= query param (used by the sidebar submenu),
  // falling back to legacy dedicated paths like /results and /reports
  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab')
    const validTabs = ['material', 'tests', 'results', 'reports', 'schedules', 'homework']
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (location.pathname.includes('/results')) {
      setActiveTab('results')
    } else if (location.pathname.includes('/reports')) {
      setActiveTab('reports')
    }
  }, [location.pathname, location.search])

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
      setError(t('academicsHub.failedToFetchAssets'))
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

  // Shared date-range-preset -> {start_date, end_date} params, used by every /results fetch
  const getDateRangeParams = () => {
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
    const params = {}
    if (startStr) params.start_date = startStr
    if (endStr) params.end_date = endStr
    return params
  }

  // Fetch results based on active filters
  const fetchFilteredResults = async () => {
    if (!user) return
    setLoadingResults(true)
    try {
      const params = { ...getDateRangeParams() }

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

      const { data } = await api.get('/results', { params })
      setFilteredResults(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingResults(false)
    }
  }

  // For students: also pull the whole class's results (same grade/section) so
  // the Results tab can chart "you" vs "class average" vs "top student".
  const [classResults, setClassResults] = useState([])
  const [loadingClassResults, setLoadingClassResults] = useState(false)

  const fetchClassResults = async () => {
    if (!user || role !== 'student' || !user.grade) return
    setLoadingClassResults(true)
    try {
      const params = { ...getDateRangeParams(), grade: user.grade, section: user.section || '' }
      if (filterSubject !== 'All') params.subject = filterSubject
      const { data } = await api.get('/results', { params })
      setClassResults(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingClassResults(false)
    }
  }

  useEffect(() => {
    fetchClassResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterSubject, dateRange, customStartDate, customEndDate])

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

  // Student view: per-test "you" vs class average vs class top scorer, oldest -> newest.
  // Sorted by test_date (not created_at/insertion order) since bulk score uploads can
  // share the same created_at timestamp, making that ordering unreliable.
  const comparisonChartData = role === 'student'
    ? [...filteredResults]
        .sort((a, b) => new Date(a.test_date || a.created_at) - new Date(b.test_date || b.created_at))
        .map(r => {
        const classForTest = classResults.filter(cr => cr.test_title === r.test_title && cr.subject === r.subject)
        const classAvg = classForTest.length > 0
          ? Math.round(classForTest.reduce((acc, cr) => acc + cr.percentage, 0) / classForTest.length)
          : r.percentage
        const classTop = classForTest.length > 0
          ? Math.max(...classForTest.map(cr => cr.percentage))
          : r.percentage
        return { label: r.test_title, you: r.percentage, classAvg, classTop }
      })
    : []

  // Geometry for the student comparison line chart (plain SVG, no charting lib)
  const chartWidth = Math.max(560, comparisonChartData.length * 90)
  const chartHeight = 200
  const chartPadTop = 16
  const chartPadBottom = 28
  const chartPadLeft = 32
  const chartPadRight = 12
  const chartPlotHeight = chartHeight - chartPadTop - chartPadBottom
  const chartXStep = comparisonChartData.length > 1
    ? (chartWidth - chartPadLeft - chartPadRight) / (comparisonChartData.length - 1)
    : 0
  const chartXFor = (i) => chartPadLeft + i * chartXStep
  const chartYFor = (v) => chartPadTop + ((100 - v) / 100) * chartPlotHeight
  const chartPointsFor = (key) => comparisonChartData.map((d, i) => `${chartXFor(i)},${chartYFor(d[key])}`).join(' ')

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

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  const fetchLinkPreview = async () => {
    const url = materialLinkUrl.trim()
    if (!url) {
      setLinkPreview(null)
      return
    }
    setFetchingLinkPreview(true)
    try {
      const res = await api.get('/academics/link-preview', { params: { url } })
      setLinkPreview(res.data)
    } catch (err) {
      console.error(err)
      setLinkPreview(null)
    } finally {
      setFetchingLinkPreview(false)
    }
  }

  const getDomainFromUrl = (url) => {
    if (!url) return ''
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return url
    }
  }

  const handleUploadMaterial = async (e) => {
    e.preventDefault()
    const trimmedLink = materialLinkUrl.trim()
    if (!materialTitle.trim() || (!materialFile && !trimmedLink)) return
    setUploadingMaterial(true)
    setError('')
    setSuccess('')
    try {
      let fileUrl = ''
      let fileName = ''
      if (materialFile) {
        const formData = new FormData()
        formData.append('file', materialFile)
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (!uploadRes.data.url) throw new Error('File upload failed')
        fileUrl = uploadRes.data.url
        fileName = uploadRes.data.filename || materialFile.name
      }
      await api.post('/academics/study-materials', {
        title: materialTitle,
        grade: materialClass,
        subject: materialSubject,
        file_url: fileUrl,
        filename: fileName,
        link_url: trimmedLink,
        link_title: linkPreview?.title || '',
        link_description: linkPreview?.description || '',
        link_image: linkPreview?.image || ''
      })
      setSuccess(t('academicsHub.materialUploadedSuccess'))
      setMaterialTitle('')
      setMaterialFile(null)
      setMaterialLinkUrl('')
      setLinkPreview(null)
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError(t('academicsHub.failedToUploadMaterial'))
    } finally {
      setUploadingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm(t('academicsHub.confirmDeleteMaterial'))) return
    try {
      await api.delete(`/academics/study-materials/${id}`)
      setSuccess(t('academicsHub.materialDeletedSuccess'))
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError(t('academicsHub.failedToDeleteMaterial'))
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
      setSuccess(t('academicsHub.testUploadedSuccess'))
      setTestTitle('')
      setQPaperFile(null)
      setAnsKeyFile(null)
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError(t('academicsHub.failedToUploadTest'))
    } finally {
      setUploadingTest(false)
    }
  }

  const handleDeleteTest = async (id) => {
    if (!window.confirm(t('academicsHub.confirmDeleteTest'))) return
    try {
      await api.delete(`/academics/tests/${id}`)
      setSuccess(t('academicsHub.testDeletedSuccess'))
      loadAcademicAssets()
    } catch (err) {
      console.error(err)
      setError(t('academicsHub.failedToDeleteTest'))
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
        throw new Error(t('academicsHub.pleaseInputMarks'))
      }

      await api.post('/results/bulk', payload)
      setSuccess(t('academicsHub.scoresRecordedSuccess', { count: payload.length }))
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
      setError(err.message || t('academicsHub.failedToSubmitMarks'))
    } finally {
      setSubmittingMarks(false)
    }
  }

  const handleDownloadCSVTemplate = () => {
    if (studentsList.length === 0) {
      alert(t('academicsHub.noStudentsInList'));
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
    link.setAttribute('download', `_Template_Class_${filterClass}_${recordSubject}.csv`);
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
        alert(t('academicsHub.successfullyImportedCsv', { count: matchCount }));
      } catch (err) {
        console.error('Failed to parse CSV:', err);
        alert(t('academicsHub.failedToParseCsv'));
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
      formatDateDMY(r.test_date || r.created_at),
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

  const formatDate = (dateStr) => formatDateDMY(dateStr)

  // A fixed palette of badge colors, picked deterministically from a hash of
  // the subject name — this way ANY real subject a school actually offers
  // (not just a hardcoded handful) gets a consistent, distinct-looking
  // badge instead of always falling back to the same default tint.
  const SUBJECT_BADGE_PALETTE = [
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-green-50 text-green-700 border-green-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-purple-50 text-purple-700 border-purple-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
  ]

  const getSubjectBadge = (subject) => {
    const sub = subject || 'General'
    let hash = 0
    for (let i = 0; i < sub.length; i++) {
      hash = (hash * 31 + sub.charCodeAt(i)) >>> 0
    }
    const bgClass = SUBJECT_BADGE_PALETTE[hash % SUBJECT_BADGE_PALETTE.length]

    return (
      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold uppercase tracking-wide shadow-2xs select-none ${bgClass}`}>
        {sub}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24 print:p-0 print:m-0">
        
        {/* Header - Hidden in print */}
        <section className="flex flex-col gap-3 pb-2 border-b border-outline-variant/20 print:hidden text-left">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/${role}/dashboard`)}
              className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                {t('academicsHub.academicHub')}
              </h2>
            </div>
          </div>

          {/* Segmented Grid Controls (Mobile only - desktop navigation now lives in the sidebar's Academics submenu) */}
          <div className="grid grid-cols-2 gap-2 pb-1 mt-2 border-t border-outline-variant/10 pt-3 md:hidden">
            <button
              onClick={() => handleTabChange('material')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'material' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <Icon name="library_books" className="text-sm" />
              <span>{t('academicsHub.studyMaterial')}</span>
            </button>
            <button
              onClick={() => handleTabChange('tests')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'tests' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <Icon name="quiz" className="text-sm" />
              <span>{t('academicsHub.testsAnswerKeys')}</span>
            </button>
            <button
              onClick={() => handleTabChange('results')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'results' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <Icon name="grade" className="text-sm" />
              <span>{t('academicsHub.gradesResults')}</span>
            </button>
            <button
              onClick={() => handleTabChange('reports')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'reports' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <Icon name="bar_chart" className="text-sm" />
              <span>{t('academicsHub.performanceReports')}</span>
            </button>
            <button
              onClick={() => handleTabChange('schedules')}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                activeTab === 'schedules' 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <Icon name="calendar_today" className="text-sm" />
              <span>{t('academicsHub.lectureCalendar')}</span>
            </button>
            {role !== 'admin' && (
              <button
                onClick={() => handleTabChange('homework')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs select-none cursor-pointer border transition-all duration-150 active:scale-95 ${
                  activeTab === 'homework'
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high'
                }`}
              >
                <Icon name="assignment" className="text-sm" />
                <span>{t('academicsHub.homework')}</span>
              </button>
            )}
          </div>
        </section>

        {/* Global Notifications Panel */}
        {(error || success) && activeTab !== 'results' && activeTab !== 'reports' && activeTab !== 'schedules' && activeTab !== 'homework' && (
          <div className="print:hidden">
            {error && (
              <div className="p-3 bg-error-container rounded-xl text-error text-xs font-bold flex items-center gap-2 mb-2">
                <Icon name="error" className="text-xs" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 rounded-xl text-green-700 text-xs font-bold flex items-center gap-2 mb-2">
                <Icon name="check_circle" className="text-xs" />
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
                  {t('academicsHub.uploadNewResource')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.resourceTitle')} <span className="text-error">*</span></label>
                    <input
                      type="text"
                      placeholder={t('academicsHub.resourceTitlePlaceholder')}
                      value={materialTitle}
                      onChange={e => setMaterialTitle(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.targetClass')}</label>
                    <select
                      value={materialClass}
                      onChange={e => setMaterialClass(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {relevantClassOptions.length === 0 && <option value="">{t('academicsHub.noClassesYet')}</option>}
                      {relevantClassOptions.map(c => (
                        <option key={c} value={c}>{t('academicsHub.classLabel', { cls: c })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.subjectCategory')}</label>
                    <select
                      value={materialSubject}
                      onChange={e => setMaterialSubject(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {relevantSubjectOptions.length === 0 && <option value="">{t('academicsHub.noSubjectsYet')}</option>}
                      {relevantSubjectOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/10 pt-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.resourceFile')}</label>
                    <input
                      type="file"
                      onChange={e => setMaterialFile(e.target.files[0])}
                      className="text-xs font-semibold text-outline file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-fixed file:text-primary file:cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.orPasteLink')}</label>
                    <input
                      type="url"
                      placeholder={t('academicsHub.linkPlaceholder')}
                      value={materialLinkUrl}
                      onChange={e => setMaterialLinkUrl(e.target.value)}
                      onBlur={fetchLinkPreview}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    />
                  </div>
                </div>

                <p className="text-[9px] text-outline font-semibold -mt-2">
                  {t('academicsHub.provideFileOrLink')}
                </p>

                {fetchingLinkPreview && (
                  <div className="text-[10px] text-outline font-semibold flex items-center gap-1.5">
                    <Icon name="refresh" className="text-xs animate-spin" />
                    {t('academicsHub.fetchingLinkPreview')}
                  </div>
                )}

                {!fetchingLinkPreview && linkPreview && materialLinkUrl.trim() && (
                  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/30 overflow-hidden flex flex-col sm:flex-row">
                    {linkPreview.image ? (
                      <img
                        src={linkPreview.image}
                        alt=""
                        className="w-full sm:w-36 h-32 sm:h-auto object-cover"
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full sm:w-36 h-20 sm:h-auto flex items-center justify-center bg-surface-container-high text-outline">
                        <Icon name="link" className="text-2xl" />
                      </div>
                    )}
                    <div className="p-3 flex flex-col gap-0.5 text-left">
                      <h5 className="text-xs font-bold text-on-surface line-clamp-1">{linkPreview.title || materialLinkUrl}</h5>
                      {linkPreview.description && (
                        <p className="text-[10px] text-outline font-medium line-clamp-2">{linkPreview.description}</p>
                      )}
                      <span className="text-[9px] text-outline font-bold uppercase mt-1">{getDomainFromUrl(materialLinkUrl)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={uploadingMaterial}
                    className="py-3 px-6 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                  >
                    {uploadingMaterial ? t('academicsHub.uploading') : t('academicsHub.publishStudyMaterial')}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-on-surface tracking-wider border-b border-outline-variant/15 pb-2 text-left">
                {t('academicsHub.availableResources')}
              </h3>

              {loading ? (
                <div className="py-12 text-center text-outline font-semibold">{t('academicsHub.loadingResources')}</div>
              ) : materials.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">{t('academicsHub.noStudyMaterialFound')}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map(mat => (
                    <div key={mat.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/20 flex flex-col justify-between text-left group overflow-hidden">
                      {mat.link_url ? (
                        <>
                          {/* WhatsApp-style link preview card */}
                          <a
                            href={mat.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col no-underline text-inherit"
                            title={mat.link_url}
                          >
                            {mat.link_image ? (
                              <img
                                src={mat.link_image}
                                alt=""
                                className="w-full h-32 object-cover bg-surface-container-high"
                                onError={e => {
                                  e.target.onerror = null
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-20 items-center justify-center bg-surface-container-high text-outline"
                              style={{ display: mat.link_image ? 'none' : 'flex' }}
                            >
                              <Icon name="link" className="text-2xl" />
                            </div>
                            <div className="p-4">
                              <div className="flex items-center justify-between gap-2">
                                {getSubjectBadge(mat.subject)}
                                <span className="text-[9px] text-outline font-bold">{t('academicsHub.classLabel', { cls: mat.grade })}</span>
                              </div>
                              <h4 className="text-xs font-bold text-on-surface mt-2 group-hover:text-primary transition-colors truncate">
                                {mat.title}
                              </h4>
                              {mat.link_title && (
                                <p className="text-[10px] text-on-surface font-semibold mt-1 truncate">{mat.link_title}</p>
                              )}
                              {mat.link_description && (
                                <p className="text-[9px] text-outline font-medium mt-0.5 line-clamp-2">{mat.link_description}</p>
                              )}
                              <span className="text-[8px] text-outline font-bold uppercase mt-1.5 flex items-center gap-1">
                                <Icon name="link" className="text-[10px]" />
                                {getDomainFromUrl(mat.link_url)}
                              </span>
                            </div>
                          </a>
                          <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 pb-4 px-4">
                            <div className="text-[8px] text-outline font-medium">
                              {t('academicsHub.uploadedLabel', { date: formatDate(mat.created_at) })}
                            </div>
                            {(role === 'teacher' || role === 'admin') && (
                              <button
                                onClick={() => handleDeleteMaterial(mat.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors border-none cursor-pointer"
                                title={t('academicsHub.deleteMaterial')}
                              >
                                <Icon name="delete" className="text-sm" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              {getSubjectBadge(mat.subject)}
                              <span className="text-[9px] text-outline font-bold">{t('academicsHub.classLabel', { cls: mat.grade })}</span>
                            </div>
                            <h4 className="text-xs font-bold text-on-surface mt-2 group-hover:text-primary transition-colors truncate">
                              {mat.title}
                            </h4>
                            <p className="text-[9px] text-outline font-semibold mt-0.5 truncate">{t('academicsHub.fileLabel', { name: mat.filename })}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-4">
                            <div className="text-[8px] text-outline font-medium">
                              {t('academicsHub.uploadedLabel', { date: formatDate(mat.created_at) })}
                            </div>
                            <div className="flex gap-2">
                              {role === 'student' ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingMaterial(mat)}
                                  className="px-3.5 py-2 rounded-2xl bg-primary-fixed hover:bg-primary hover:text-on-primary text-primary font-bold text-[10px] shadow-xs active:scale-95 duration-100 flex items-center gap-1 border-none cursor-pointer animate-fadeIn"
                                  title={t('academicsHub.viewResource')}
                                >
                                  <Icon name="visibility" className="text-xs" />
                                  <span>{t('academicsHub.viewResource')}</span>
                                </button>
                              ) : (
                                <>
                                  <a
                                    href={getAttachmentUrl(mat.file_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center hover:bg-primary-fixed hover:text-primary transition-colors text-on-surface"
                                    title={t('academicsHub.downloadMaterial')}
                                  >
                                    <Icon name="download" className="text-sm" />
                                  </a>
                                  {(role === 'teacher' || role === 'admin') && (
                                    <button
                                      onClick={() => handleDeleteMaterial(mat.id)}
                                      className="w-8 h-8 rounded-lg bg-red-50 text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors border-none cursor-pointer"
                                      title={t('academicsHub.deleteMaterial')}
                                    >
                                      <Icon name="delete" className="text-sm" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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
                  {t('academicsHub.publishQuestionPapers')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.testTitle')} <span className="text-error">*</span></label>
                    <input
                      type="text"
                      placeholder={t('academicsHub.testTitlePlaceholder')}
                      value={testTitle}
                      onChange={e => setTestTitle(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.targetClass')}</label>
                    <select
                      value={testClass}
                      onChange={e => setTestClass(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {relevantClassOptions.length === 0 && <option value="">{t('academicsHub.noClassesYet')}</option>}
                      {relevantClassOptions.map(c => (
                        <option key={c} value={c}>{t('academicsHub.classLabel', { cls: c })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.subjectCategory')}</label>
                    <select
                      value={testSubject}
                      onChange={e => setTestSubject(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                    >
                      {relevantSubjectOptions.length === 0 && <option value="">{t('academicsHub.noSubjectsYet')}</option>}
                      {relevantSubjectOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/10 pt-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.questionPaperFile')}</label>
                    <input 
                      type="file" 
                      onChange={e => setQPaperFile(e.target.files[0])}
                      className="text-xs font-semibold text-outline file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-fixed file:text-primary file:cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.answerKeyFile')}</label>
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
                    {uploadingTest ? t('academicsHub.publishing') : t('academicsHub.uploadTestKeys')}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-on-surface tracking-wider border-b border-outline-variant/15 pb-2 text-left">
                {t('academicsHub.testPapersAnswerKeys')}
              </h3>

              {loading ? (
                <div className="py-12 text-center text-outline font-semibold">{t('academicsHub.loadingTests')}</div>
              ) : tests.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">{t('academicsHub.noTestKeysFound')}</div>
              ) : (
                <div className="space-y-3">
                  {tests.map(test => (
                    <div key={test.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition-all text-left bg-surface-container-low/10">
                      <div>
                        <div className="flex items-center gap-2">
                          {getSubjectBadge(test.subject)}
                          <span className="text-[9px] text-outline font-bold">{t('academicsHub.classLabel', { cls: test.grade })}</span>
                        </div>
                        <h4 className="text-xs font-bold text-on-surface mt-1.5">{test.title}</h4>
                        <p className="text-[8px] text-outline font-semibold mt-0.5">{t('academicsHub.uploadedOn', { date: formatDate(test.created_at) })}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {test.question_paper_url && (
                          <a 
                            href={getAttachmentUrl(test.question_paper_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-surface-container hover:bg-primary-fixed hover:text-primary rounded-xl text-[10px] font-bold text-on-surface transition-colors"
                          >
                            <Icon name="description" className="text-[14px]" />
                            <span>{t('academicsHub.questionPaper')}</span>
                          </a>
                        )}
                        {test.answer_key_url && (
                          <a 
                            href={getAttachmentUrl(test.answer_key_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-primary-fixed text-primary hover:bg-primary/10 rounded-xl text-[10px] font-bold transition-colors"
                          >
                            <Icon name="key" className="text-[14px]" />
                            <span>{t('academicsHub.answerKey')}</span>
                          </a>
                        )}
                        {(role === 'teacher' || role === 'admin') && (
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors border-none cursor-pointer"
                            title={t('academicsHub.deleteTestPackage')}
                          >
                            <Icon name="delete" className="text-sm" />
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
                <Icon name="filter_alt" className="text-primary text-base" />
                <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                  {t('academicsHub.searchFilterResults')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {role !== 'student' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.class')}</label>
                      <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      >
                        {relevantClassOptions.length === 0 && <option value="">{t('academicsHub.noClassesYet')}</option>}
                        {relevantClassOptions.map(c => (
                          <option key={c} value={c}>{t('academicsHub.classLabel', { cls: c })}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.specificStudent')}</label>
                      <select
                        value={filterStudentId}
                        onChange={e => setFilterStudentId(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                      >
                        <option value="All">{t('academicsHub.allStudentsCount', { count: studentsList.length })}</option>
                        {studentsList.map(s => (
                          <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.subject')}</label>
                  <select
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    <option value="All">{t('academicsHub.allSubjects')}</option>
                    {relevantSubjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.timeframePreset')}</label>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                  >
                    <option value="all">{t('academicsHub.allTime')}</option>
                    <option value="30days">{t('academicsHub.last30Days')}</option>
                    <option value="semester">{t('academicsHub.currentTermSemester')}</option>
                    <option value="custom">{t('academicsHub.customDateRange')}</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Pickers */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/10 animate-fadeIn">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.startDate')}</label>
                    <DateInput
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.endDate')}</label>
                    <DateInput
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
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.tallyTests')}</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{totalTests}</h4>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.averageScore')}</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{averageScore}%</h4>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.highestMarks')}</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{highestScore}%</h4>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
                <span className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.passRate')}</span>
                <h4 className="text-xl font-black text-primary mt-0.5">{passRate}%</h4>
              </div>
            </div>

            {/* Student view: You vs Class Average vs Top Scorer trend chart */}
            {role === 'student' && (
              <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 p-5 shadow-sm space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2 flex-wrap gap-3">
                  <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                    {t('academicsHub.youVsClassAvgVsTop')}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6351E0]"></span>{t('academicsHub.you')}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]"></span>{t('academicsHub.classAverage')}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>{t('academicsHub.topScorer')}</span>
                  </div>
                </div>

                {loadingResults || loadingClassResults ? (
                  <div className="py-12 text-center text-outline font-semibold text-xs">{t('academicsHub.loadingComparison')}</div>
                ) : comparisonChartData.length === 0 ? (
                  <div className="py-12 text-center text-outline font-semibold text-xs">{t('academicsHub.noScoresMatchFilters')}</div>
                ) : (
                  <div className="overflow-x-auto pr-1">
                    <svg width={chartWidth} height={chartHeight} style={{ minWidth: chartWidth }}>
                      {/* Gridlines + y-axis labels */}
                      {[0, 25, 50, 75, 100].map(v => (
                        <g key={v}>
                          <line
                            x1={chartPadLeft} x2={chartWidth - chartPadRight}
                            y1={chartYFor(v)} y2={chartYFor(v)}
                            stroke="currentColor" className="text-outline-variant/25" strokeWidth="1"
                          />
                          <text x={chartPadLeft - 6} y={chartYFor(v) + 3} textAnchor="end" fontSize="9" className="fill-outline font-semibold">
                            {v}
                          </text>
                        </g>
                      ))}

                      {/* Class Average (dashed) */}
                      <polyline points={chartPointsFor('classAvg')} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,4" strokeLinecap="round" />
                      {/* Top Scorer (dotted) */}
                      <polyline points={chartPointsFor('classTop')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="1,4" strokeLinecap="round" />
                      {/* You (solid, drawn last so it stays on top) */}
                      <polyline points={chartPointsFor('you')} fill="none" stroke="#6351E0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {comparisonChartData.map((d, i) => (
                        <g key={i}>
                          <circle cx={chartXFor(i)} cy={chartYFor(d.classAvg)} r="3" fill="#94a3b8">
                            <title>{d.label}: {t('academicsHub.classAverage')} {d.classAvg}%</title>
                          </circle>
                          <circle cx={chartXFor(i)} cy={chartYFor(d.classTop)} r="3" fill="#f59e0b">
                            <title>{d.label}: {t('academicsHub.topScorer')} {d.classTop}%</title>
                          </circle>
                          <circle cx={chartXFor(i)} cy={chartYFor(d.you)} r="3.5" fill="#6351E0">
                            <title>{d.label}: {t('academicsHub.you')} {d.you}%</title>
                          </circle>
                          <text
                            x={chartXFor(i)} y={chartHeight - 8} textAnchor="middle" fontSize="9"
                            className="fill-outline font-semibold"
                          >
                            {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Record New Scores Collapsible Panel (Teacher & Admin views) */}
            {(role === 'teacher' || role === 'admin') && (
              <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 shadow-sm text-xs overflow-hidden">
                <div 
                  onClick={() => setIsRecordScoresOpen(!isRecordScoresOpen)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-container-low/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="add_circle" className="text-primary" />
                    <h3 className="text-xs font-black uppercase text-on-surface tracking-wider">
                      {t('academicsHub.recordNewScores', { cls: filterClass })}
                    </h3>
                  </div>
                  <Icon name={isRecordScoresOpen ? 'expand_less' : 'expand_more'} className="text-outline" />
                </div>

                {isRecordScoresOpen && (
                  <form onSubmit={handleRecordScoresSubmit} className="p-5 border-t border-outline-variant/20 space-y-4 text-left animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.testTitle')} <span className="text-error">*</span></label>
                        <input
                          type="text"
                          placeholder={t('academicsHub.recordTestTitlePlaceholder')}
                          value={recordTestTitle}
                          onChange={e => setRecordTestTitle(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.subject')}</label>
                        <select
                          value={recordSubject}
                          onChange={e => setRecordSubject(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                        >
                          {relevantSubjectOptions.length === 0 && <option value="">{t('academicsHub.noSubjectsYet')}</option>}
                          {relevantSubjectOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.totalMarks')} <span className="text-error">*</span></label>
                        <input
                          type="number"
                          value={recordTotalMarks}
                          onChange={e => setRecordTotalMarks(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary font-semibold"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-[10px] uppercase text-outline">{t('academicsHub.testDate')} <span className="text-error">*</span></label>
                        <DateInput
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
                          <span className="font-bold text-on-surface uppercase block">{t('academicsHub.csvBatchOps')}</span>
                          <span className="text-outline font-medium">{t('academicsHub.csvBatchOpsDesc')}</span>
                        </div>

                      <div className="flex gap-2">
                        {/* Download Template button */}
                        <button
                          type="button"
                          onClick={handleDownloadCSVTemplate}
                          className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          <Icon name="download" className="text-xs" />
                          <span>{t('academicsHub.downloadTemplate')}</span>
                        </button>

                        {/* Upload CSV button */}
                        <label className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold cursor-pointer hover:bg-opacity-95 transition-all active:scale-95 duration-100 shadow-xs">
                          <Icon name="upload" className="text-xs" />
                          <span>{t('academicsHub.uploadScoresCsv')}</span>
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
                        <label className="font-bold text-[10px] uppercase text-outline mb-1 block">{t('academicsHub.studentScoreboardSheet')}</label>
                      {recordEligibleStudents.length === 0 ? (
                        <p className="text-center py-4 text-outline font-semibold">{t('academicsHub.noStudentsEnrolledInSubject', { cls: filterClass, subject: recordSubject })}</p>
                      ) : (
                        recordEligibleStudents.map(s => (
                          <div key={s.user_id} className="flex items-center gap-3 p-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/10">
                            <span className="text-[10px] font-bold text-outline w-12 shrink-0">{t('academicsHub.rollNo', { roll: s.roll_number })}</span>
                            <span className="text-xs font-bold text-on-surface flex-1 truncate">{s.full_name}</span>

                            <input
                              type="number"
                              placeholder={t('academicsHub.marksPlaceholder')}
                              value={marksData[s.user_id]?.marks || ''}
                              onChange={e => handleMarksDataChange(s.user_id, 'marks', e.target.value)}
                              className="w-20 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs text-center"
                              min="0"
                              max={recordTotalMarks}
                              step="0.5"
                            />

                            <input
                              type="text"
                              placeholder={t('academicsHub.remarksOptionalPlaceholder')}
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
                          {submittingMarks ? t('academicsHub.recording') : t('academicsHub.publishStudentScores')}
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
                  {t('academicsHub.testScoreHistory')}
                </h3>

                {filteredResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportHistoryCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high border border-outline-variant/50 text-[10px] font-bold rounded-xl cursor-pointer hover:bg-surface-container-highest transition-colors active:scale-95 duration-100"
                  >
                    <Icon name="download_for_offline" className="text-xs" />
                    <span>{t('academicsHub.exportHistoryCsv')}</span>
                  </button>
                )}
              </div>

              {loadingResults ? (
                <div className="py-12 text-center text-outline font-semibold">{t('academicsHub.queryingScores')}</div>
              ) : filteredResults.length === 0 ? (
                <div className="py-12 text-center text-outline font-semibold">{t('academicsHub.noScoresMatchFilters')}</div>
              ) : (
                <div className="overflow-x-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-outline uppercase font-bold text-[9px] tracking-wider">
                        {role !== 'student' && <th className="pb-3.5 font-bold">{t('academicsHub.student')}</th>}
                        <th className="pb-3.5 font-bold">{t('academicsHub.testTitleCol')}</th>
                        <th className="pb-3.5 font-bold">{t('academicsHub.subjectCol')}</th>
                        <th className="pb-3.5 font-bold">{t('academicsHub.dateCol')}</th>
                        <th className="pb-3.5 font-bold text-center">{t('academicsHub.scoreCol')}</th>
                        <th className="pb-3.5 font-bold text-center">{t('academicsHub.percentageCol')}</th>
                        <th className="pb-3.5 font-bold text-center">{t('academicsHub.gradeCol')}</th>
                        <th className="pb-3.5 font-bold pl-4">{t('academicsHub.remarksCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filteredResults.map(r => (
                        <tr key={r.id} className="hover:bg-surface-container-low/10 transition-colors">
                          {role !== 'student' && (
                            <td className="py-3.5 font-bold text-on-surface">
                              {r.student_name || studentsList.find(s => s.user_id === r.student_id)?.full_name || t('academicsHub.student')}
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
                            {r.remarks || t('academicsHub.noRemarksDash')}
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
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                /* Class report print */
                body:not(.print-modal-active) #printable-report-area, 
                body:not(.print-modal-active) #printable-report-area * {
                  visibility: visible !important;
                }
                body:not(.print-modal-active) #printable-report-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                }
                /* Student / Modal report print */
                body.print-modal-active .print-modal-content, 
                body.print-modal-active .print-modal-content * {
                  visibility: visible !important;
                }
                body.print-modal-active .print-modal-content {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                }
                .print\\:hidden, button, select, input, svg, header, nav, aside {
                  display: none !important;
                }
              }
            `}} />
            
            {/* =========================================================================
                ROLE 1: STUDENT VIEW
                ========================================================================= */}
            {role === 'student' ? (
              <div className="space-y-6 animate-fadeIn text-left print-modal-content">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <div>
                    <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-black flex items-center gap-2">
                      <Icon name="description" className="text-primary text-2xl md:text-3xl" />
                      <span>{t('academicsHub.detailedAttendanceReport')}</span>
                    </h2>
                    <p className="text-xs text-outline font-semibold uppercase tracking-wider mt-0.5">
                      {t('academicsHub.myPersonalAttendanceAnalytics')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        document.body.classList.add('print-modal-active')
                        window.print()
                        setTimeout(() => {
                          document.body.classList.remove('print-modal-active')
                        }, 1000)
                      }}
                      className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:opacity-95 border-none cursor-pointer print:hidden"
                    >
                      <Icon name="download" className="text-sm" />
                      <span>{t('academicsHub.exportPdf')}</span>
                    </button>
                  </div>
                </div>

                {/* Student Profile Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm shrink-0">
                      {user?.full_name?.[0] || 'S'}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-on-surface capitalize">{user?.full_name}</h4>
                      <p className="text-xs text-on-surface-variant font-semibold">
                        {t('academicsHub.gradeSectionRoll', { grade: user?.grade, section: user?.section, roll: user?.roll_number })}
                      </p>
                      <p className="text-[10px] text-outline font-semibold mt-1">
                        {t('academicsHub.reportPeriod', { start: formatIsoDateDMY(reportsModalStartDate), end: formatIsoDateDMY(reportsModalEndDate) })}
                      </p>
                    </div>
                  </div>

                  {/* Subject + date range filters */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.subject')}</label>
                      <select
                        value={filterSubject}
                        onChange={e => setFilterSubject(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="All">{t('academicsHub.allSubjects')}</option>
                        {relevantSubjectOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.period')}</label>
                      <select
                        value={myReportPreset}
                        onChange={e => applyMyReportPreset(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                      >
                        {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    {myReportPreset === 'custom' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.from')}</label>
                          <DateInput
                            value={reportsModalStartDate}
                            min={myJoinDate || undefined}
                            onChange={e => setReportsModalStartDate(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.to')}</label>
                          <DateInput
                            value={reportsModalEndDate}
                            onChange={e => setReportsModalEndDate(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4 Stat Cards */}
                {(() => {
                  const rData = getStudentRoleReport()
                  return (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                          <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.totalDaysLabel')}</span>
                          <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{rData.schoolDays}</h4>
                          <p className="text-[9px] text-on-surface-variant font-semibold mt-1.5 flex items-center gap-1">
                            <Icon name="calendar_today" className="text-xs text-primary" />
                            <span>{t('academicsHub.totalPeriodDays')}</span>
                          </p>
                        </div>
                        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                          <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.presentDaysLabel')}</span>
                          <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{rData.present}</h4>
                          <p className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                            <Icon name="check_circle" className="text-xs" />
                            <span>{t('academicsHub.presentDaysLabel')}</span>
                          </p>
                        </div>
                        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                          <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.absentDaysLabel')}</span>
                          <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{rData.absent}</h4>
                          <p className="text-[9px] text-error font-bold mt-1.5 flex items-center gap-1">
                            <Icon name="cancel" className="text-xs" />
                            <span>{t('academicsHub.absentDaysLabel')}</span>
                          </p>
                        </div>
                        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                          <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.attendanceRateLabel')}</span>
                          <h4 className={`attendance-pct-card leading-none mt-1 ${rData.rate < 75 ? 'text-error' : 'text-primary'}`}>{rData.rate}%</h4>
                          <p className={`text-[9px] font-bold mt-1.5 flex items-center gap-1 ${rData.rate < 75 ? 'text-error' : 'text-primary'}`}>
                            <Icon name="trending_up" className="text-xs" />
                            <span>{t('academicsHub.overallRate')}</span>
                          </p>
                        </div>
                      </div>

                      {/* Warning Banner */}
                      {rData.rate < 75 && (
                        <div className="bg-red-50 border border-red-200 text-error rounded-2xl p-4 flex items-start gap-3 text-xs font-bold">
                          <Icon name="error_outline" className="text-[20px] mt-0.5" />
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black">{t('academicsHub.attentionRequired')}</h5>
                            <p className="text-[10px] font-semibold text-red-700 leading-normal">
                              {t('academicsHub.attendanceBelow75Student')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Monthly Breakdown */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.monthlyBreakdown')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {getMonthlyBreakdown(rData).map((m, idx) => (
                            <div key={idx} className="border border-outline-variant/35 rounded-2xl p-4 space-y-2 bg-surface-container-lowest">
                              <h4 className="text-xs font-black text-on-surface">{m.monthName}</h4>
                              <div className="space-y-1.5 text-[11px] font-medium text-on-surface-variant">
                                <div className="flex justify-between"><span>{t('academicsHub.totalDaysColon')}</span> <span className="font-bold text-on-surface">{m.totalDays}</span></div>
                                <div className="flex justify-between"><span>{t('academicsHub.presentColon')}</span> <span className="font-bold text-emerald-600">{m.present}</span></div>
                                <div className="flex justify-between"><span>{t('academicsHub.absentColon')}</span> <span className="font-bold text-error">{m.absent}</span></div>
                              </div>
                              <div className="border-t border-outline-variant/10 pt-2 flex justify-between items-baseline text-xs">
                                <span className="font-bold text-outline uppercase tracking-wider text-[9px]">{t('academicsHub.rateColon')}</span>
                                <span className={`font-black ${m.rate < 75 ? 'text-error' : 'text-primary'}`}>{m.rate}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Calendar pattern */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.attendancePattern')}</h3>
                          <div className="flex gap-3 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span> {t('academicsHub.present')}</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-xs"></span> {t('academicsHub.absent')}</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 rounded-xs"></span> {t('academicsHub.noRecord')}</span>
                          </div>
                        </div>
                        <div className="border border-outline-variant/35 rounded-2xl p-4 bg-surface-container-lowest space-y-3">
                          <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                            <span>{t('academicsHub.sun')}</span>
                            <span>{t('academicsHub.mon')}</span>
                            <span>{t('academicsHub.tue')}</span>
                            <span>{t('academicsHub.wed')}</span>
                            <span>{t('academicsHub.thu')}</span>
                            <span>{t('academicsHub.fri')}</span>
                            <span>{t('academicsHub.sat')}</span>
                          </div>
                          {renderReportsCalendarGrid(rData)}
                        </div>
                      </div>

                      {/* Test Results */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.testResults')}</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                            <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.totalTests')}</span>
                            <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{myReportsTotalTests}</h4>
                            <p className="text-[9px] text-primary font-bold mt-1.5 flex items-center gap-1">
                              <Icon name="quiz" className="text-xs" />
                              <span>{t('academicsHub.testsRecorded')}</span>
                            </p>
                          </div>
                          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                            <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.averageScore')}</span>
                            <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{myReportsAverageScore}%</h4>
                            <p className="text-[9px] text-primary font-bold mt-1.5 flex items-center gap-1">
                              <Icon name="analytics" className="text-xs" />
                              <span>{t('academicsHub.average')}</span>
                            </p>
                          </div>
                          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                            <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.highestScore')}</span>
                            <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{myReportsHighestScore}%</h4>
                            <p className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                              <Icon name="military_tech" className="text-xs" />
                              <span>{t('academicsHub.best')}</span>
                            </p>
                          </div>
                          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                            <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.passRate')}</span>
                            <h4 className="attendance-pct-card text-on-surface leading-none mt-1">{myReportsPassRate}%</h4>
                            <p className="text-[9px] text-primary font-bold mt-1.5 flex items-center gap-1">
                              <Icon name="check_circle" className="text-xs" />
                              <span>{t('academicsHub.ge50pct')}</span>
                            </p>
                          </div>
                        </div>

                        {myReportsResults.length === 0 ? (
                          <div className="border border-outline-variant/35 rounded-2xl p-6 bg-surface-container-lowest text-center text-xs text-on-surface-variant font-semibold">
                            {t('academicsHub.noTestResultsForPeriod', { subjectSuffix: filterSubject !== 'All' ? t('academicsHub.inSubject', { subject: filterSubject }) : '' })}
                          </div>
                        ) : (
                          <div className="border border-outline-variant/35 rounded-2xl overflow-hidden bg-surface-container-lowest">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-surface-container-low">
                                <tr>
                                  <th className="px-3 py-2 font-bold text-[10px] uppercase text-outline">{t('academicsHub.testCol')}</th>
                                  <th className="px-3 py-2 font-bold text-[10px] uppercase text-outline">{t('academicsHub.subjectCol')}</th>
                                  <th className="px-3 py-2 font-bold text-[10px] uppercase text-outline">{t('academicsHub.dateCol')}</th>
                                  <th className="px-3 py-2 font-bold text-[10px] uppercase text-outline">{t('academicsHub.scoreCol')}</th>
                                  <th className="px-3 py-2 font-bold text-[10px] uppercase text-outline">{t('academicsHub.gradeCol')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...myReportsResults]
                                  .sort((a, b) => new Date(b.test_date || b.created_at) - new Date(a.test_date || a.created_at))
                                  .map(r => (
                                    <tr key={r.id} className="border-t border-outline-variant/15">
                                      <td className="px-3 py-2 font-semibold text-on-surface">{r.test_title}</td>
                                      <td className="px-3 py-2 text-on-surface-variant">{r.subject}</td>
                                      <td className="px-3 py-2 text-on-surface-variant">{r.test_date ? formatIsoDateDMY(r.test_date) : '-'}</td>
                                      <td className="px-3 py-2 font-bold text-on-surface">{r.marks_obtained}/{r.total_marks} ({r.percentage}%)</td>
                                      <td className="px-3 py-2 font-bold text-primary">{r.grade_letter || '-'}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              
              /* =========================================================================
                  ROLE 2: TEACHER/ADMIN VIEW
                  ========================================================================= */
              <div className="space-y-6">
                
                {/* ----------------------------------------------------
                    SUB-VIEW 2A: CONFIGURATION DASHBOARD
                    ---------------------------------------------------- */}
                {reportsViewMode === 'config' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Top Choice Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      
                      {/* Class Reports Card */}
                      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="flex gap-4 items-start">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon name="groups" className="text-2xl" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-on-surface">{t('academicsHub.classReports')}</h3>
                            <p className="text-xs text-on-surface-variant font-medium">{t('academicsHub.generateReportsForClass')}</p>
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-2">
                          <button
                            onClick={handleGenerateReport}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-2xl font-bold text-xs shadow-sm hover:opacity-95 border-none cursor-pointer"
                          >
                            <Icon name="trending_up" className="text-sm" />
                            <span>{t('academicsHub.detailedClassReport')}</span>
                          </button>
                          <button
                            onClick={() => triggerReportsExport('pdf')}
                            className="w-full flex items-center justify-center gap-2 bg-primary-fixed/40 text-primary py-2.5 rounded-2xl font-bold text-xs hover:bg-primary-fixed/60 border-none cursor-pointer"
                          >
                            <Icon name="download" className="text-sm" />
                            <span>{t('academicsHub.quickPdfExport')}</span>
                          </button>
                          <button
                            onClick={() => triggerReportsExport('csv')}
                            className="w-full flex items-center justify-center gap-2 bg-primary-fixed/20 text-primary py-2.5 rounded-2xl font-bold text-xs hover:bg-primary-fixed/30 border-none cursor-pointer"
                          >
                            <Icon name="download" className="text-sm" />
                            <span>{t('academicsHub.exportAsCsv')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Individual Reports Card */}
                      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="flex gap-4 items-start">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                            <Icon name="person" className="text-2xl" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-on-surface">{t('academicsHub.individualReports')}</h3>
                            <p className="text-xs text-on-surface-variant font-medium">{t('academicsHub.generateDetailedReportsForStudents')}</p>
                          </div>
                        </div>

                        <div className="flex-1 bg-surface-container-low/30 rounded-2xl p-4 text-xs space-y-2 mt-2 border border-outline-variant/20">
                          <span className="font-bold text-outline uppercase tracking-wider text-[10px]">{t('academicsHub.featuresLabel')}</span>
                          <ul className="space-y-1.5 font-medium text-on-surface-variant pl-4 list-disc">
                            <li>{t('academicsHub.monthlyAttendanceBreakdown')}</li>
                            <li>{t('academicsHub.visualAttendancePattern')}</li>
                            <li>{t('academicsHub.parentContactInformation')}</li>
                            <li>{t('academicsHub.attendanceAlertsRecommendations')}</li>
                          </ul>
                        </div>

                        <button
                          onClick={() => setIsReportsModalOpen(true)}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-2xl font-bold text-xs shadow-sm hover:opacity-95 border-none cursor-pointer mt-2"
                        >
                          <Icon name="person" className="text-sm" />
                          <span>{t('academicsHub.studentReport')}</span>
                        </button>
                      </div>

                    </div>

                    {/* Report Filters */}
                    <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4 text-left">
                      <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/20">
                        <Icon name="filter_list" className="text-on-surface text-[20px]" />
                        <h4 className="text-sm font-bold text-on-surface">{t('academicsHub.reportFiltersForClassReports')}</h4>
                      </div>

                      {reportsExportMessage && (
                        <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-center text-xs font-bold animate-pulse">
                          {reportsExportMessage}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="sm:col-span-3 flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.period')}</label>
                          <select
                            value={classReportPreset}
                            onChange={e => applyClassReportPreset(e.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-3 focus:outline-none focus:border-primary text-xs font-semibold cursor-pointer"
                          >
                            {MODAL_DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        </div>

                        {classReportPreset === 'custom' && (
                          <>
                            <div className="sm:col-span-3 flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.startDate')}</label>
                              <DateInput
                                value={reportsStartDate}
                                onChange={e => setReportsStartDate(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-xs font-semibold"
                              />
                            </div>

                            <div className="sm:col-span-3 flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.endDate')}</label>
                              <DateInput
                                value={reportsEndDate}
                                onChange={e => setReportsEndDate(e.target.value)}
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 px-3 focus:outline-none focus:border-primary text-xs font-semibold"
                              />
                            </div>
                          </>
                        )}

                        <div className="sm:col-span-4 flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.standard')}</label>
                          <select
                            value={reportsSelectedClass}
                            onChange={e => setReportsSelectedClass(e.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-3 focus:outline-none focus:border-primary text-xs font-semibold cursor-pointer"
                          >
                            {availableStandards.map(std => (
                              <option key={std} value={std}>{std}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            onClick={handleGenerateReport}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 border-none cursor-pointer"
                          >
                            <Icon name="trending_up" className="text-sm" />
                            <span>{t('academicsHub.generate')}</span>
                          </button>
                        </div>
                      </div>
                    </section>

                  </div>
                )}

                {/* ----------------------------------------------------
                    SUB-VIEW 2B: DETAILED CLASS REPORT
                    ---------------------------------------------------- */}
                {reportsViewMode === 'class_report' && (
                  <div id="printable-report-area" className="space-y-6 animate-fadeIn text-left">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setReportsViewMode('config')}
                          className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Icon name="arrow_back" />
                        </button>
                        <div>
                          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-black flex items-center gap-2 flex-wrap">
                            <Icon name="description" className="text-primary text-2xl md:text-3xl" />
                            <span>{t('academicsHub.detailedAttendanceReport')}</span>
                          </h2>
                          <p className="text-xs text-outline font-semibold uppercase tracking-wider mt-0.5">
                            {reportsSelectedClass.split(' (')[0]} &bull; {formatIsoDateDMY(reportsStartDate)} to {formatIsoDateDMY(reportsEndDate)}
                          </p>
                        </div>
                      </div>

                      {/* Exports */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerReportsExport('pdf')}
                          className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:opacity-95 border-none cursor-pointer"
                        >
                          <Icon name="download" className="text-[16px]" />
                          <span>{t('academicsHub.exportPdf')}</span>
                        </button>
                        <button
                          onClick={() => triggerReportsExport('csv')}
                          className="flex items-center gap-1.5 bg-primary-fixed text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-fixed-dim border-none cursor-pointer"
                        >
                          <Icon name="download" className="text-[16px]" />
                          <span>{t('academicsHub.exportCsv')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats summary row */}
                    {(() => {
                      const cReport = getAcademicsReportData()
                      return (
                        <>
                          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-28">
                              <span className="text-outline text-[10px] uppercase font-bold tracking-wider">{t('academicsHub.totalStudents')}</span>
                              <h4 className="text-2xl font-numeric-bold font-black text-on-surface leading-none mt-1">{cReport.totalStudents}</h4>
                              <p className="text-[10px] text-on-surface-variant font-semibold mt-2">{t('academicsHub.studentsLabel', { cls: reportsSelectedClass.split(' (')[0] })}</p>
                            </div>
                            <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-28">
                              <span className="text-outline text-[10px] uppercase font-bold tracking-wider">{t('academicsHub.schoolDays')}</span>
                              <h4 className="text-2xl font-numeric-bold font-black text-on-surface leading-none mt-1">{cReport.schoolDays}</h4>
                              <p className="text-[10px] text-on-surface-variant font-semibold mt-2">{t('academicsHub.totalRecords')}</p>
                            </div>
                            <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-28">
                              <span className="text-outline text-[10px] uppercase font-bold tracking-wider">{t('academicsHub.attendanceRate')}</span>
                              <h4 className="text-2xl font-numeric-bold font-black text-primary leading-none mt-1">{cReport.overallRate}%</h4>
                              <p className="text-[10px] text-emerald-600 font-bold mt-2">{t('academicsHub.overallRate')}</p>
                            </div>
                            <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-28">
                              <span className="text-outline text-[10px] uppercase font-bold tracking-wider">{t('academicsHub.presentDays')}</span>
                              <h4 className="text-2xl font-numeric-bold font-black text-on-surface leading-none mt-1">{cReport.totalPresent}</h4>
                              <p className="text-[10px] text-on-surface-variant font-semibold mt-2">{t('academicsHub.presentDays')}</p>
                            </div>
                          </section>

                          {/* Distribution row */}
                          <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.attendanceDistribution')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-numeric-bold font-black text-emerald-700">{cReport.distribution.excellent}</span>
                                <span className="text-xs font-bold text-emerald-800 mt-1">{t('academicsHub.excellent90')}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                                  {t('academicsHub.pctOfStudents', { pct: cReport.totalStudents > 0 ? roundToOneDecimal((cReport.distribution.excellent / cReport.totalStudents) * 100) : 0 })}
                                </span>
                              </div>
                              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-numeric-bold font-black text-amber-700">{cReport.distribution.good}</span>
                                <span className="text-xs font-bold text-amber-800 mt-1">{t('academicsHub.good7589')}</span>
                                <span className="text-[10px] text-amber-600 font-semibold mt-1">
                                  {t('academicsHub.pctOfStudents', { pct: cReport.totalStudents > 0 ? roundToOneDecimal((cReport.distribution.good / cReport.totalStudents) * 100) : 0 })}
                                </span>
                              </div>
                              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-numeric-bold font-black text-error">{cReport.distribution.attention}</span>
                                <span className="text-xs font-bold text-error mt-1">{t('academicsHub.needsAttentionBelow75')}</span>
                                <span className="text-[10px] text-red-500 font-semibold mt-1">
                                  {t('academicsHub.pctOfStudents', { pct: cReport.totalStudents > 0 ? roundToOneDecimal((cReport.distribution.attention / cReport.totalStudents) * 100) : 0 })}
                                </span>
                              </div>
                            </div>
                          </section>

                          {/* Progress bar performance table */}
                          <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/20">
                              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">11</span>
                              <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.classPerformance', { cls: reportsSelectedClass.split(' (')[0] })}</h3>
                            </div>
                            <div className="space-y-4">
                              {cReport.students.map((student) => {
                                let progressColor = 'bg-emerald-500'
                                let textColor = 'text-emerald-600'
                                if (student.markedRate < 75) {
                                  progressColor = 'bg-red-500'
                                  textColor = 'text-error'
                                } else if (student.markedRate < 90) {
                                  progressColor = 'bg-amber-500'
                                  textColor = 'text-amber-600'
                                }

                                return (
                                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 hover:bg-surface-container-low rounded-2xl transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                                        {student.name[0]}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-on-surface">{student.name}</p>
                                        <p className="text-[10px] text-on-surface-variant font-medium">
                                          {t('academicsHub.daysPresentBullet', { present: student.present, total: student.present + student.absent, role: student.role })}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
                                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${progressColor}`} style={{ width: `${student.markedRate}%` }}></div>
                                      </div>
                                      <span className={`text-xs font-bold ${textColor} w-12 text-right`}>{student.markedRate}%</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </section>

                          {/* Individual Student analysis block pattern grid list */}
                          <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-2">{t('academicsHub.individualStudentAnalysis')}</h3>

                            <div className="space-y-6">
                              {cReport.students.map((student) => {
                                const isAttentionRequired = student.markedRate < 75

                                return (
                                  <div key={student.id} className="border border-outline-variant/35 rounded-2xl p-4 space-y-4 bg-surface-container-lowest">
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/10 pb-2">
                                      <div>
                                        <h4 className="text-sm font-black text-on-surface capitalize">{student.name}</h4>
                                        <p className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1">
                                          <Icon name="phone" className="text-xs" />
                                          <span>{t('academicsHub.fatherLabel', { phone: student.phone })}</span>
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <span className={`text-sm font-numeric-bold font-black ${isAttentionRequired ? 'text-error' : 'text-primary'}`}>
                                          {student.overallRate}%
                                        </span>
                                        <p className="text-[9px] uppercase font-bold text-outline">{t('academicsHub.daysOf', { present: student.present, total: cReport.schoolDays })}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                                        <span>{t('academicsHub.attendancePattern')}</span>
                                        <div className="flex gap-2">
                                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-xs"></span> {t('academicsHub.present')}</span>
                                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-xs"></span> {t('academicsHub.absent')}</span>
                                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-200 rounded-xs"></span> {t('academicsHub.noRecord')}</span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-1 py-1">
                                        {student.pattern.map((dayStatus, dIdx) => {
                                          let blockColor = 'bg-slate-200'
                                          if (dayStatus === 'present') blockColor = 'bg-emerald-500'
                                          else if (dayStatus === 'absent') blockColor = 'bg-red-500'
                                          
                                          return (
                                            <div 
                                              key={dIdx}
                                              className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-115 ${blockColor}`}
                                            />
                                          )
                                        })}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2 text-center">
                                        <span className="text-xs font-bold text-emerald-800">{student.present}</span>
                                        <p className="text-[9px] uppercase font-bold text-emerald-600 mt-0.5">{t('academicsHub.present')}</p>
                                      </div>
                                      <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-2 text-center">
                                        <span className="text-xs font-bold text-error">{student.absent}</span>
                                        <p className="text-[9px] uppercase font-bold text-red-500 mt-0.5">{t('academicsHub.absent')}</p>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-250 rounded-xl p-2 text-center">
                                        <span className="text-xs font-bold text-on-surface-variant">{student.noRecord}</span>
                                        <p className="text-[9px] uppercase font-bold text-outline mt-0.5">{t('academicsHub.noRecord')}</p>
                                      </div>
                                    </div>

                                    {isAttentionRequired && (
                                      <div className="bg-red-50 border border-red-200 text-error rounded-xl p-3 flex items-start gap-2 text-xs font-bold">
                                        <Icon name="warning" className="text-[16px] mt-0.5" />
                                        <span>{t('academicsHub.attentionRequiredParentMeeting')}</span>
                                      </div>
                                    )}

                                  </div>
                                )
                              })}
                            </div>
                          </section>

                          {/* Quick export cards */}
                          <section className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/35 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-2 flex items-center gap-1.5">
                              <Icon name="download" className="text-primary text-[18px]" />
                              <span>{t('academicsHub.quickExportOptions')}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div
                                onClick={() => triggerReportsExport('pdf')}
                                className="border border-dashed border-outline-variant hover:border-primary/55 rounded-2xl p-4 flex gap-3 cursor-pointer hover:bg-surface-container-low transition-all"
                              >
                                <Icon name="picture_as_pdf" className="text-primary text-2xl mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-bold text-on-surface">{t('academicsHub.exportAsPdf')}</h4>
                                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('academicsHub.classAttendanceReport', { cls: reportsSelectedClass.split(' (')[0] })}</p>
                                </div>
                              </div>
                              <div
                                onClick={() => triggerReportsExport('csv')}
                                className="border border-dashed border-outline-variant hover:border-primary/55 rounded-2xl p-4 flex gap-3 cursor-pointer hover:bg-surface-container-low transition-all"
                              >
                                <Icon name="table_view" className="text-primary text-2xl mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-bold text-on-surface">{t('academicsHub.exportAsCsv')}</h4>
                                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{t('academicsHub.classSpreadsheetFormat', { cls: reportsSelectedClass.split(' (')[0] })}</p>
                                </div>
                              </div>
                            </div>
                          </section>
                        </>
                      )
                    })()}

                  </div>
                )}

              </div>
            )}

          </section>
        )}
      {activeTab === 'schedules' && (
        <SchedulePage embed={true} />
      )}

      {activeTab === 'homework' && role !== 'admin' && (
        role === 'student' ? <StudentHomework embed /> : <HomeworkAssignment embed />
      )}

        {/* Secure In-App Viewer Modal (Student view restriction) */}
        {viewingMaterial && (
          <div className="fixed inset-0 bg-surface-container-lowest z-[100] flex flex-col animate-fadeIn">
            <div className="w-full h-full flex flex-col relative">
              
              {/* Header */}
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low text-left">
                <div>
                  {getSubjectBadge(viewingMaterial.subject)}
                  <h3 className="font-bold text-xs text-on-surface mt-1 truncate max-w-[250px] sm:max-w-md">
                    {viewingMaterial.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors border-none cursor-pointer"
                >
                  <Icon name="close" className="text-sm" />
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
                      {t('academicsHub.educoreSecurePreviewOnly')}
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
                      <Icon name="menu_book" className="text-4xl text-primary" />
                      <h4 className="font-bold text-xs mt-2 text-on-surface">{t('academicsHub.secureDocumentStream')}</h4>
                      <p className="text-[10px] text-outline font-semibold mt-1">
                        {t('academicsHub.secureStreamDesc', { ext })}
                      </p>
                      <a
                        href={getAttachmentUrl(viewingMaterial.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-bold shadow-xs hover:bg-opacity-95 text-decoration-none"
                      >
                        <Icon name="open_in_new" className="text-xs" />
                        <span>{t('academicsHub.streamLiveView')}</span>
                      </a>
                    </div>
                  )
                })()}

              </div>

              {/* Secure Footnote */}
              <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 text-center text-[9px] font-bold text-outline uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Icon name="lock" className="text-[13px] text-primary" />
                <span>{t('academicsHub.protectedByEducoreSecurityShield')}</span>
              </div>

            </div>
          </div>
        )}


        {/* =========================================================================
            INDIVIDUAL STUDENT REPORT MODAL OVERLAY (Academics Hub Reports Tab)
            ========================================================================= */}
        {isReportsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[85vh] animate-scaleUp text-left">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                    <Icon name="person" className="text-primary" />
                    <span>{t('academicsHub.individualStudentReport')}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">{t('academicsHub.generateDetailedAttendanceReportForStudent')}</p>
                </div>
                <button
                  onClick={() => setIsReportsModalOpen(false)}
                  className="hover:bg-surface-container-high p-1.5 rounded-full border-none bg-transparent cursor-pointer text-on-surface"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Modal Filters Row */}
              <div className="p-6 bg-surface-container-low/20 border-b border-outline-variant/10 grid grid-cols-1 sm:grid-cols-4 gap-3">

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.filterByStandard')}</label>
                  <select
                    value={reportsModalStandard}
                    onChange={e => {
                      setReportsModalStandard(e.target.value)
                      setReportsModalSelectedStudentId('')
                    }}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-1.5 px-2.5 focus:outline-none focus:border-primary text-xs font-semibold cursor-pointer"
                  >
                    {availableStandards.map(std => (
                      <option key={std} value={std}>{std.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.selectStudent')}</label>
                  <select
                    value={reportsModalSelectedStudentId}
                    onChange={e => setReportsModalSelectedStudentId(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-1.5 px-2.5 focus:outline-none focus:border-primary text-xs font-semibold cursor-pointer"
                  >
                    <option value="">{t('academicsHub.chooseStudentEllipsis')}</option>
                    {reportsModalStudents.map(st => (
                      <option key={st.user_id} value={st.user_id}>{st.full_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.period')}</label>
                  <select
                    value={modalReportPreset}
                    onChange={e => applyModalReportPreset(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-1.5 px-2.5 focus:outline-none focus:border-primary text-xs font-semibold cursor-pointer"
                  >
                    {MODAL_DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>

                {modalReportPreset === 'custom' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.startDate')}</label>
                      <DateInput
                        value={reportsModalStartDate}
                        onChange={e => setReportsModalStartDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-1.5 px-2 focus:outline-none focus:border-primary text-xs font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-outline uppercase tracking-wider">{t('academicsHub.endDate')}</label>
                      <DateInput
                        value={reportsModalEndDate}
                        onChange={e => setReportsModalEndDate(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-1.5 px-2 focus:outline-none focus:border-primary text-xs font-semibold"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Modal Body / Report Presentation */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left print-modal-content">
                {activeModalStudentReport ? (
                  <div className="space-y-6">
                    
                    {/* Standard Selected Banner */}
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs">
                        {reportsModalStandard.includes('11') ? '11' : reportsModalStandard.replace('Standard ', '').split('-')[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface">{t('academicsHub.standardSelected', { std: reportsModalStandard.split(' (')[0] })}</h4>
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          {t('academicsHub.studentsAvailableForSelection', { count: reportsModalStudents.length })}
                        </p>
                      </div>
                    </div>

                    {/* Student Profile Card */}
                    <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                          {activeModalStudentReport.name[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-on-surface capitalize">{activeModalStudentReport.name}</h4>
                          <div className="flex flex-wrap gap-2 items-center mt-0.5">
                            <span className="bg-primary-container text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {reportsModalStandard.split(' (')[0]}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-0.5">
                              <Icon name="phone" className="text-xs" />
                              <span>{t('academicsHub.fatherLabel', { phone: activeModalStudentReport.phone })}</span>
                            </span>
                          </div>
                          <p className="text-[9px] text-outline font-semibold mt-1">
                            {t('academicsHub.reportPeriod', { start: formatIsoDateDMY(reportsModalStartDate), end: formatIsoDateDMY(reportsModalEndDate) })}
                          </p>
                          <p className="text-[9px] text-outline font-semibold">
                            {t('academicsHub.generatedAt', { date: formatDateDMY(new Date()), time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => triggerModalStudentExport('pdf', activeModalStudentReport.name)}
                          className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:opacity-95 border-none cursor-pointer"
                        >
                          <Icon name="download" className="text-sm" />
                          <span>{t('academicsHub.exportPdf')}</span>
                        </button>
                        <button
                          onClick={() => triggerModalStudentExport('csv', activeModalStudentReport.name)}
                          className="flex items-center gap-1 bg-primary-fixed text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-fixed-dim border-none cursor-pointer"
                        >
                          <Icon name="download" className="text-sm" />
                          <span>{t('academicsHub.exportCsv')}</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Stat Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
                      {/* Total Days */}
                      <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                        <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.totalDaysLabel')}</span>
                        <h4 className="text-xl font-numeric-bold font-black text-on-surface leading-none mt-1">{activeModalStudentReport.schoolDays}</h4>
                        <p className="text-[9px] text-on-surface-variant font-semibold mt-1.5 flex items-center gap-1">
                          <Icon name="calendar_today" className="text-xs text-primary" />
                          <span>{t('academicsHub.totalDaysLabel')}</span>
                        </p>
                      </div>

                      {/* Present Days */}
                      <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                        <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.presentDaysLabel')}</span>
                        <h4 className="text-xl font-numeric-bold font-black text-on-surface leading-none mt-1">{activeModalStudentReport.present}</h4>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                          <Icon name="check_circle" className="text-xs" />
                          <span>{t('academicsHub.presentDaysLabel')}</span>
                        </p>
                      </div>

                      {/* Absent Days */}
                      <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                        <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.absentDaysLabel')}</span>
                        <h4 className="text-xl font-numeric-bold font-black text-on-surface leading-none mt-1">{activeModalStudentReport.absent}</h4>
                        <p className="text-[9px] text-error font-bold mt-1.5 flex items-center gap-1">
                          <Icon name="cancel" className="text-xs" />
                          <span>{t('academicsHub.absentDaysLabel')}</span>
                        </p>
                      </div>

                      {/* Attendance Rate */}
                      <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/35 shadow-xs flex flex-col justify-between h-24">
                        <span className="text-outline text-[9px] uppercase font-bold tracking-wider">{t('academicsHub.attendanceRateLabel')}</span>
                        <h4 className="text-xl font-numeric-bold font-black text-error leading-none mt-1">{activeModalStudentReport.rate}%</h4>
                        <p className="text-[9px] text-error font-bold mt-1.5 flex items-center gap-1">
                          <Icon name="trending_up" className="text-xs" />
                          <span>{t('academicsHub.attendanceRateLabel')}</span>
                        </p>
                      </div>
                    </div>

                    {/* Attention Alert Banner */}
                    {activeModalStudentReport.rate < 75 && (
                      <div className="bg-red-50 border border-red-200 text-error rounded-2xl p-4 flex items-start gap-3 text-xs font-bold animate-fadeIn">
                        <Icon name="error_outline" className="text-[20px] mt-0.5" />
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-black">{t('academicsHub.attentionRequired')}</h5>
                          <p className="text-[10px] font-semibold text-red-700 leading-normal">
                            {t('academicsHub.attentionRequiredThisStudent')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Monthly Breakdown Section */}
                    <div className="space-y-3 animate-fadeIn">
                      <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.monthlyBreakdown')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {getMonthlyBreakdown(activeModalStudentReport).map((m, idx) => (
                          <div key={idx} className="border border-outline-variant/35 rounded-2xl p-4 space-y-2 bg-surface-container-lowest">
                            <h4 className="text-xs font-black text-on-surface">{m.monthName}</h4>
                            <div className="space-y-1.5 text-[11px] font-medium text-on-surface-variant">
                              <div className="flex justify-between"><span>{t('academicsHub.totalDaysColon')}</span> <span className="font-bold text-on-surface">{m.totalDays}</span></div>
                              <div className="flex justify-between"><span>{t('academicsHub.presentColon')}</span> <span className="font-bold text-emerald-600">{m.present}</span></div>
                              <div className="flex justify-between"><span>{t('academicsHub.absentColon')}</span> <span className="font-bold text-error">{m.absent}</span></div>
                            </div>
                            <div className="border-t border-outline-variant/10 pt-2 flex justify-between items-baseline text-xs">
                              <span className="font-bold text-outline uppercase tracking-wider text-[9px]">{t('academicsHub.rateColon')}</span>
                              <span className={`font-black ${m.rate < 75 ? 'text-error' : 'text-primary'}`}>{m.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Attendance Pattern Calendar Section */}
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <h3 className="text-sm font-bold text-on-surface">{t('academicsHub.attendancePattern')}</h3>
                        <div className="flex gap-3 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span> {t('academicsHub.present')}</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-xs"></span> {t('academicsHub.absent')}</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 rounded-xs"></span> {t('academicsHub.noRecord')}</span>
                        </div>
                      </div>
                      
                      <div className="border border-outline-variant/35 rounded-2xl p-4 bg-surface-container-lowest space-y-3">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                          <span>{t('academicsHub.sun')}</span>
                          <span>{t('academicsHub.mon')}</span>
                          <span>{t('academicsHub.tue')}</span>
                          <span>{t('academicsHub.wed')}</span>
                          <span>{t('academicsHub.thu')}</span>
                          <span>{t('academicsHub.fri')}</span>
                          <span>{t('academicsHub.sat')}</span>
                        </div>
                        {/* Day cells */}
                        {renderReportsCalendarGrid(activeModalStudentReport)}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
                    <Icon name="person" className="text-6xl text-outline mb-3" />
                    <p className="text-sm font-bold">{t('academicsHub.selectStudentToGenerate')}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
