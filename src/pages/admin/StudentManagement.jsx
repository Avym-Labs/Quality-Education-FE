import { useEffect, useState } from 'react'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

const DEFAULT_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'Biology', 'History']

export default function StudentManagement() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search and Filter States
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false)

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit' | 'view'
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    grade: '10',
    section: 'A',
    roll_number: '',
    father_name: '',
    mother_name: '',
    subjects: []
  })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = {}
      if (gradeFilter) params.grade = gradeFilter
      if (sectionFilter) params.section = sectionFilter
      if (search) params.search = search

      const res = await api.get('/students', { params })
      setStudents(res.data || [])
    } catch (err) {
      console.error('Failed to load students:', err)
      setError('Could not fetch student records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [gradeFilter, sectionFilter])

  // Triggers search fetch after delay or manual enter
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchStudents()
    }
  }

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      grade: '10',
      section: 'A',
      roll_number: '',
      father_name: '',
      mother_name: '',
      subjects: []
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (student) => {
    setModalMode('edit')
    setSelectedStudent(student)
    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '', // blank by default
      grade: student.grade || '10',
      section: student.section || 'A',
      roll_number: student.roll_number || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      subjects: student.subjects || []
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenViewModal = (student) => {
    setModalMode('view')
    setSelectedStudent(student)
    setModalOpen(true)
  }

  const handleToggleSubject = (subject) => {
    setFormData(prev => {
      const active = prev.subjects.includes(subject)
      return {
        ...prev,
        subjects: active 
          ? prev.subjects.filter(s => s !== subject) 
          : [...prev.subjects, subject]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    // Validations
    if (!formData.first_name || !formData.last_name || !formData.grade || !formData.section || !formData.roll_number) {
      setFormError('Please fill in all required fields.')
      setIsSubmitting(false)
      return
    }

    if (modalMode === 'create' && !formData.password) {
      setFormError('Password is required for onboarding.')
      setIsSubmitting(false)
      return
    }

    try {
      if (modalMode === 'create') {
        await api.post('/students', formData)
      } else {
        // Remove password if empty
        const payload = { ...formData }
        if (!payload.password) delete payload.password
        await api.put(`/students/${selectedStudent.id}`, payload)
      }
      setModalOpen(false)
      fetchStudents()
    } catch (err) {
      console.error('Failed to submit student form:', err)
      setFormError(err.response?.data?.detail || 'An error occurred during submission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return
    try {
      await api.delete(`/students/${studentId}`)
      fetchStudents()
    } catch (err) {
      console.error('Failed to delete student:', err)
      alert('Failed to delete student record.')
    }
  }

  // Fallback mock students if DB is fresh
  const fallbackStudents = [
    {
      id: 'mock1',
      full_name: 'Arjun Sharma',
      first_name: 'Arjun',
      last_name: 'Sharma',
      roll_number: '2024-0412',
      grade: '10',
      section: 'B',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPo0uwMoA66YQ8e_aNG8I1LJDn_SGRMfOn6R9V7ToSo8wgVMBTwsX0SJahTEVerQZHNDdc6Tr3zXG8A8qs0XYLRQiFmudyH2wyzl3rExZYJh6tNTX4PLcI7uQ0ueTAKlXlB-1jCzGj3kkREtkVi10hj4BHSBa0v1zDckMugSxdlbUxKX9_iT3N-9v3mQIbZIkCfCBa4LdqZSvhTOxmaC5cBf-L8i6XZDVgB3e-vJ3PjXOwowCMhG7VQ54lyUpHYRbuVREkvJxKG7A',
      attendance: 98,
      email: 'arjun@educore.com',
      phone: '9876543210',
      father_name: 'Mark Sharma',
      mother_name: 'Sarah Sharma',
      subjects: ['Mathematics', 'Physics', 'Chemistry']
    },
    {
      id: 'mock2',
      full_name: 'Maya Patel',
      first_name: 'Maya',
      last_name: 'Patel',
      roll_number: '2024-0589',
      grade: '12',
      section: 'A',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGXJD5-EZsW0HCfOedzhblg1BqOHNTm-ksssXlMpZJP0TriQXUWfbq6ZsG7wCKZrcfDkFUofFZRB6jIDU3k33p88JBdHvVmzv49WI5lgOiO1HGlFBtCEXcHavX7TkvDY5Twt4wxbBG5j9SUbgulmhPHoZ5Bq-56XZimR_LzZJQOyM5BTsxqkJBTAcgTQQ8en7fZ6pzYcYWoCl5k6AHI0F5AdSV6nK8ujl99q9U1aHmZhF629rADC0dzY-YlysLZQZMkqxc-mh8PT0',
      attendance: 74,
      email: 'maya@educore.com',
      phone: '9876543211',
      father_name: 'Mark Patel',
      mother_name: 'Sarah Patel',
      subjects: ['Biology', 'History']
    },
    {
      id: 'mock3',
      full_name: 'Liam O\'Neill',
      first_name: 'Liam',
      last_name: 'O\'Neill',
      roll_number: '2024-0922',
      grade: '9',
      section: 'C',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh1Q4tKRzzVLuNnj7keGJkXMW71pfMCyf-9piw6WrubOSpie-kozTl4BjOYAIEh-V97zTKuMhHsVmD3-aDfI2iVPMmvapve3oOKoX0CerbFmFSdQSgEcZBHvVAUjiao783MDal_oM_-RAgtUJaQsgxQiRO18bRL05zYNTvTJHHqTBEUbqpo9ifnE4UJm_uhsksEGnXRTJaRy4atoSMxlAGiU8Fiqz3BaOLWG9SubO34jR6aS9OqaJNv_xHL3Ii0Z9bNwqEnm0Az18',
      attendance: 92,
      email: 'liam@educore.com',
      phone: '9876543212',
      father_name: 'Mark O\'Neill',
      mother_name: 'Sarah O\'Neill',
      subjects: ['English Literature', 'History']
    },
    {
      id: 'mock4',
      full_name: 'Zoe Fisher',
      first_name: 'Zoe',
      last_name: 'Fisher',
      roll_number: '2024-0115',
      grade: '11',
      section: 'B',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ3R86Te3t4rCP7pwqqeeaKkZxZTx8qEWdMtyTTtj_nmXGNB_mknEZ8vwvMFUNkENdDrNTOOFnzrxQIgwdTPGh6Zdgkkfm5FMqdu_Y5ruilg5-nrIpryyx2wv5TisLb3Ee4d8L4fmQSlpM2Vr2sa2LzGG01_G2uypODNcJ8wumF6mNs9h9py_6-fbruwboVilHjSWHGzIVcZjpduOyW_fEeUCOPU2BK1KNt52fvle8idDGeM6VuTQcByLVi-gLQTcFh5NdH63OauM',
      attendance: 62,
      email: 'zoe@educore.com',
      phone: '9876543213',
      father_name: 'Mark Fisher',
      mother_name: 'Sarah Fisher',
      subjects: ['Biology', 'Chemistry']
    }
  ]

  // Render combined students (real database + mocks for completeness)
  const displayStudents = [...students, ...fallbackStudents.filter(f => !students.some(s => s.roll_number === f.roll_number))]

  // Stats calculation
  const totalStudents = students.length || 1284
  const avgAttendance = '94.2%'
  const lowAttendanceCount = displayStudents.filter(s => (s.attendance || 90) < 75).length

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
        {/* Search & Filter Header */}
        <section className="flex flex-col md:flex-row gap-gutter">
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
              search
            </span>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-body-md" 
              placeholder="Search students by name or roll number... (Press Enter)" 
              type="text"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => fetchStudents()}
              className="px-6 py-3 bg-primary text-on-primary rounded-2xl hover:bg-opacity-90 active:scale-95 transition-all font-label-md text-label-md"
            >
              Search
            </button>
            <button 
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-colors active:scale-95 duration-150 font-label-md text-label-md ${
                showFiltersDrawer || gradeFilter || sectionFilter
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined">filter_list</span>
              <span>Filters</span>
            </button>
          </div>
        </section>

        {/* Filters Drawer Overlay */}
        {showFiltersDrawer && (
          <section className="bg-surface-container-low p-stack-md rounded-[24px] border border-outline-variant/30 grid grid-cols-1 sm:grid-cols-3 gap-stack-md animate-fadeIn">
            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-xs text-on-surface-variant font-semibold">Grade</label>
              <select 
                value={gradeFilter} 
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-stack-md py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none font-label-md text-sm"
              >
                <option value="">All Grades</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-xs text-on-surface-variant font-semibold">Section</label>
              <select 
                value={sectionFilter} 
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-stack-md py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none font-label-md text-sm"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setGradeFilter('')
                  setSectionFilter('')
                  setSearch('')
                }}
                className="w-full py-2.5 border border-outline text-on-surface-variant rounded-xl font-label-md text-sm hover:bg-surface-container-high transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </section>
        )}

        {/* Stats Overview (Premium Bento) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <div className="glass-card p-stack-md rounded-[24px] flex flex-col justify-between shadow-sm">
            <span className="text-on-surface-variant font-label-md text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display-lg text-headline-lg text-primary font-bold">{totalStudents}</span>
              <span className="text-green-600 text-xs font-bold flex items-center">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 3%
              </span>
            </div>
          </div>
          <div className="glass-card p-stack-md rounded-[24px] flex flex-col justify-between shadow-sm border-l-4 border-l-primary">
            <span className="text-on-surface-variant font-label-md text-xs font-semibold uppercase tracking-wider">Avg. Attendance</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display-lg text-headline-lg text-primary font-bold">{avgAttendance}</span>
            </div>
          </div>
          <div className="glass-card p-stack-md rounded-[24px] flex flex-col justify-between shadow-sm">
            <span className="text-on-surface-variant font-label-md text-xs font-semibold uppercase tracking-wider">New Admissions</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display-lg text-headline-lg text-primary font-bold">42</span>
              <span className="text-on-surface-variant text-[10px]">this month</span>
            </div>
          </div>
          <div className="glass-card p-stack-md rounded-[24px] flex flex-col justify-between shadow-sm">
            <span className="text-on-surface-variant font-label-md text-xs font-semibold uppercase tracking-wider">Attendance Flags</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display-lg text-headline-lg text-error font-bold">{lowAttendanceCount}</span>
              <span className="text-on-surface-variant text-[10px]">below 75%</span>
            </div>
          </div>
        </section>

        {/* Student Cards Grid */}
        {loading && students.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {displayStudents.map((student) => {
              const attendanceVal = student.attendance ?? 90
              const isLowAttendance = attendanceVal < 75
              return (
                <div 
                  key={student.id} 
                  className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant hover:shadow-md transition-all group relative flex flex-col justify-between h-[220px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="relative cursor-pointer" onClick={() => handleOpenViewModal(student)}>
                        {student.avatar ? (
                          <img alt={student.full_name} className="w-16 h-16 rounded-2xl object-cover border border-outline-variant" src={student.avatar}/>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center font-bold text-primary text-xl">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest ${
                          isLowAttendance ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                      </div>
                      
                      {/* More Vert Menu Toggle */}
                      <div className="relative">
                        <button 
                          onClick={() => setMenuOpenId(menuOpenId === student.id ? null : student.id)}
                          className="p-1.5 hover:bg-surface-container rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-outline">more_vert</span>
                        </button>
                        {menuOpenId === student.id && (
                          <div className="absolute right-0 top-8 w-28 bg-surface-container-lowest shadow-lg rounded-xl border border-outline-variant z-10 py-1.5 animate-fadeIn">
                            <button 
                              onClick={() => {
                                handleOpenViewModal(student)
                                setMenuOpenId(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors text-xs font-semibold"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => {
                                handleOpenEditModal(student)
                                setMenuOpenId(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors text-xs font-semibold"
                            >
                              Edit Profile
                            </button>
                            {!student.id.startsWith('mock') && (
                              <button 
                                onClick={() => {
                                  handleDelete(student.id)
                                  setMenuOpenId(null)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors text-xs font-bold text-error"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h3 
                        onClick={() => handleOpenViewModal(student)}
                        className="font-title-lg text-base text-on-surface font-bold hover:text-primary cursor-pointer truncate"
                      >
                        {student.full_name || `${student.first_name} ${student.last_name}`}
                      </h3>
                      <p className="text-on-surface-variant text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">id_card</span>
                        Roll: #{student.roll_number}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container p-2 rounded-xl">
                      <p className="text-[9px] uppercase tracking-wider text-outline font-bold">Class</p>
                      <p className="font-numeric-bold text-xs text-on-surface font-semibold">{student.grade}-{student.section}</p>
                    </div>
                    <div className={`p-2 rounded-xl border ${
                      isLowAttendance 
                        ? 'bg-red-50 border-red-100 text-error' 
                        : 'bg-green-50 border-green-100 text-green-700'
                    }`}>
                      <p className="text-[9px] uppercase tracking-wider font-bold">Attendance</p>
                      <p className="font-numeric-bold text-xs font-bold">{attendanceVal}%</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Onboard Student FAB */}
      <button 
        onClick={handleOpenCreateModal}
        className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group hover:shadow-2xl"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
        <span className="absolute right-full mr-4 bg-on-surface text-surface text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Onboard Student
        </span>
      </button>

      {/* Modal Overlay (Create / Edit / View) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
                <h3 className="font-title-lg text-lg text-primary font-bold">
                  {modalMode === 'create' && 'Onboard New Student'}
                  {modalMode === 'edit' && 'Edit Student Profile'}
                  {modalMode === 'view' && 'Student Records Profile'}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container p-1 rounded-full"
                >
                  close
                </button>
              </div>

              {formError && (
                <div className="bg-error-container text-on-error-container p-3 rounded-xl text-xs mb-4">
                  {formError}
                </div>
              )}

              {modalMode === 'view' ? (
                /* VIEW MODAL */
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-4 border-b border-outline-variant/10 pb-4">
                    {selectedStudent?.avatar ? (
                      <img src={selectedStudent.avatar} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center font-bold text-primary text-2xl">
                        {selectedStudent?.first_name?.[0]}{selectedStudent?.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg text-on-surface">
                        {selectedStudent?.full_name || `${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
                      </h4>
                      <p className="text-on-surface-variant text-xs">
                        Grade {selectedStudent?.grade}-{selectedStudent?.section} • Roll Number: {selectedStudent?.roll_number}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-outline font-semibold">Email Address</p>
                      <p className="font-medium text-on-surface truncate">{selectedStudent?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-outline font-semibold">Phone Number</p>
                      <p className="font-medium text-on-surface">{selectedStudent?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-outline font-semibold">Father's Name</p>
                      <p className="font-medium text-on-surface">{selectedStudent?.father_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-outline font-semibold">Mother's Name</p>
                      <p className="font-medium text-on-surface">{selectedStudent?.mother_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-outline font-semibold mb-1.5">Enrolled Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent?.subjects?.length > 0 ? (
                        selectedStudent.subjects.map((subj, idx) => (
                          <span key={idx} className="bg-surface-container px-2.5 py-1 rounded-full text-xs font-semibold text-primary">
                            {subj}
                          </span>
                        ))
                      ) : (
                        <span className="text-on-surface-variant italic text-xs">No subjects assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* CREATE / EDIT FORM */
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">First Name *</label>
                      <input 
                        type="text" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="Arjun"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Last Name *</label>
                      <input 
                        type="text" 
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="Sharma"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="student@school.com"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  {modalMode === 'create' && (
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Password *</label>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="Minimum 6 characters"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Grade *</label>
                      <select 
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                      >
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Section *</label>
                      <select 
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Roll Number *</label>
                      <input 
                        type="text" 
                        value={formData.roll_number}
                        onChange={(e) => setFormData({...formData, roll_number: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="e.g. 1024"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Father's Name</label>
                      <input 
                        type="text" 
                        value={formData.father_name}
                        onChange={(e) => setFormData({...formData, father_name: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="Mark Sharma"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Mother's Name</label>
                      <input 
                        type="text" 
                        value={formData.mother_name}
                        onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="Sarah Sharma"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-xs text-on-surface-variant mb-1 block">Subjects Assigned</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_SUBJECTS.map((subj) => {
                        const active = formData.subjects.includes(subj)
                        return (
                          <button
                            type="button"
                            key={subj}
                            onClick={() => handleToggleSubject(subj)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                              active 
                                ? 'bg-primary text-on-primary border-primary' 
                                : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {subj}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3 border-t border-outline-variant/15 mt-6 justify-end">
                    <button 
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2.5 border border-outline text-on-surface-variant rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-opacity-95 disabled:bg-opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Record'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
