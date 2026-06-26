import { useEffect, useState } from 'react'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

const AVAILABLE_CLASSES = ['9-A', '9-B', '9-C', '10-A', '10-B', '10-C', '11-A', '11-B', '11-C', '12-A', '12-B', '12-C']
const AVAILABLE_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'Biology', 'History']

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search and filter
  const [search, setSearch] = useState('')

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'view'
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    first_name: '',
    last_name: '',
    department: '',
    subjects: [],
    assigned_classes: [],
    qualifications: []
  })
  const [qualificationInput, setQualificationInput] = useState('')
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Credentials Modal States
  const [credsModalOpen, setCredsModalOpen] = useState(false)
  const [credsTargetUser, setCredsTargetUser] = useState(null)
  const [credsFormData, setCredsFormData] = useState({ email: '', phone: '', password: '' })
  const [credsSubmitting, setCredsSubmitting] = useState(false)
  const [credsMessage, setCredsMessage] = useState('')

  const handleOpenCredsModal = (teacher) => {
    setCredsTargetUser({
      user_id: teacher.user_id || teacher.id,
      name: teacher.full_name || `${teacher.first_name} ${teacher.last_name}`,
      role: 'teacher'
    })
    setCredsFormData({
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: ''
    })
    setCredsMessage('')
    setCredsModalOpen(true)
  }

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/teachers', { params: { search: search || undefined } })
      setTeachers(res.data || [])
    } catch (err) {
      console.error('Failed to load teachers:', err)
      setError('Could not fetch teacher records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchTeachers()
    }
  }

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setFormData({
      email: '',
      phone: '',
      password: '',
      first_name: '',
      last_name: '',
      department: '',
      subjects: [],
      assigned_classes: [],
      qualifications: []
    })
    setQualificationInput('')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenViewModal = (teacher) => {
    setModalMode('view')
    setSelectedTeacher(teacher)
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

  const handleToggleClass = (cls) => {
    setFormData(prev => {
      const active = prev.assigned_classes.includes(cls)
      return {
        ...prev,
        assigned_classes: active 
          ? prev.assigned_classes.filter(c => c !== cls) 
          : [...prev.assigned_classes, cls]
      }
    })
  }

  const handleAddQualification = () => {
    if (!qualificationInput.trim()) return
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, qualificationInput.trim()]
    }))
    setQualificationInput('')
  }

  const handleRemoveQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, idx) => idx !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields.')
      setIsSubmitting(false)
      return
    }

    try {
      await api.post('/teachers', formData)
      setModalOpen(false)
      fetchTeachers()
    } catch (err) {
      console.error('Failed to onboard teacher:', err)
      setFormError(err.response?.data?.detail || 'An error occurred during onboarding.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher record?')) return
    try {
      await api.delete(`/teachers/${teacherId}`)
      fetchTeachers()
    } catch (err) {
      console.error('Failed to delete teacher:', err)
      alert('Failed to delete teacher record.')
    }
  }

  // Fallback mock teachers if DB has few items
  const fallbackTeachers = [
    {
      id: 'mock1',
      full_name: 'Prof. Sarah Mitchell',
      first_name: 'Sarah',
      last_name: 'Mitchell',
      department: 'Mathematics',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRTLguG6i8VOp6bMIaHLDAL_HaHQl2B7LfavDcyMBN8NL_qur-p00uY4nLPBuudk1lm92SX25lXFOd0OuqaNDQ0jOYin4JTawigJSKfWRBIP3rS6jFRVhtgRD-oYlhwWhyOHBwQaXof95A2Uiz0nR9VDtH5gcoq4DUEWsI9o3P1RPhu9GvTQtMXA-KW0xjiyraS6DdWMjWbQuK6J2b6Lp9w_bNRUcjXaOyU4abNPOTQ12gTRHXAV0y4vu2_eeyaWXS3TdCPWmDoI0',
      assigned_classes: ['10-A', '12-B', '10-B'],
      email: 'sarah.mitchell@educore.com',
      phone: '9876543220',
      qualifications: ['M.Sc. Mathematics', 'Ph.D. in Geometry']
    },
    {
      id: 'mock2',
      full_name: 'Dr. James Carter',
      first_name: 'James',
      last_name: 'Carter',
      department: 'Physics',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUGBxw9t67EiyvJBtP31jVmxBx7OUKLmlr5bTCRMomQ59Bo1d6XU6ge73YVPocLYgoiaUUFi3zE4-rN240hKTswVOmSP4YIg8UNlh3LcRWqlrsuTwAMIDiZ-MAG2WSjUsP4O_9lUKc6lUkBdfvEEKrAhJjkOjy58n_rBQ81VCSOPvR4Y29VNGTuk6TUuFoALsMsbGoJ_skrG7CFntPCs_U_OpZ8gOo3cS1D2D5wgblDN7Ck04BhDvKmrREoyy-6-iZO1w7ZnSy-Qc',
      assigned_classes: ['11-C', '12-A'],
      email: 'james.carter@educore.com',
      phone: '9876543221',
      qualifications: ['Ph.D. in Astrophysics']
    },
    {
      id: 'mock3',
      full_name: 'Ms. Elena Rodriguez',
      first_name: 'Elena',
      last_name: 'Rodriguez',
      department: 'History',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUEPQvLHOHnyffT_Cw1uL1T1IjKSM59ghYEATi_0L9eiWIPDpSrUFmx1jQTHR_Wfbd2cZrrvmHTx-cIH1r-W8s6jJEi2cIhstYk-oRlt8X0uYkyLXyEi3-qfSKyZ0j0mXqksk1K6orXDQuClCPy1V67o8FaOYsT8OlqAC4qLPSz5d4BtfC7MXXCLgVN5L13rRaaRbutufH8YBJqi-tgN-gj2Yfr8C6-XrpuZRJGVCSamvvgXnVEdV9X_sg6PUqXlPdHzRLEl3XGQo',
      assigned_classes: ['9-B', '10-C', '11-A'],
      email: 'elena.rodriguez@educore.com',
      phone: '9876543222',
      qualifications: ['M.A. Modern History']
    }
  ]

  // Render combined lists
  const displayTeachers = [...teachers, ...fallbackTeachers.filter(f => !teachers.some(t => t.email === f.email))]

  const totalFacultyCount = teachers.length || 42
  const activeClassesCount = displayTeachers.reduce((acc, t) => acc + (t.assigned_classes?.length || 0), 0) || 128

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
        {/* Header Controls */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-gutter">
          <div className="relative flex-1 max-w-2xl group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
              search
            </span>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body-md text-body-md" 
              placeholder="Search teachers by name or department... (Press Enter)" 
              type="text"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchTeachers()}
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-opacity-95 active:scale-95 duration-200 transition-all font-label-md text-label-md"
            >
              Search
            </button>
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:bg-opacity-95 transition-all active:scale-95 duration-200 font-label-md text-label-md"
            >
              <span className="material-symbols-outlined">add</span>
              <span>Add New Teacher</span>
            </button>
          </div>
        </section>

        {/* Bento-style Grid for Analytics (Quick View) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-primary-container p-stack-md rounded-[24px] shadow-sm border border-primary/10 flex flex-col justify-between h-[130px]">
            <div>
              <p className="font-label-md text-xs font-semibold text-on-primary-container/80 uppercase tracking-wider">Total Faculty</p>
              <h2 className="font-headline-lg text-display-lg text-on-primary-container mt-1 font-bold">{totalFacultyCount}</h2>
            </div>
            <div className="flex items-center gap-1 text-on-primary-container/70">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-[10px] font-semibold">+2 this month</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-[130px]">
            <div>
              <p className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Assignments</p>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">{activeClassesCount}</h2>
            </div>
            <div className="w-full bg-outline-variant h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[85%] rounded-full"></div>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-stack-md rounded-[24px] shadow-sm border border-outline-variant/30 flex flex-col justify-between h-[130px]">
            <div>
              <p className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Avg. Student Load</p>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-bold">24.5</h2>
            </div>
            <p className="text-[10px] font-semibold text-on-surface-variant">Optimal: 25 per class</p>
          </div>
          <div className="bg-tertiary-fixed p-stack-md rounded-[24px] shadow-sm border border-tertiary-container/10 flex flex-col justify-between h-[130px]">
            <div>
              <p className="font-label-md text-xs font-semibold text-on-tertiary-fixed-variant uppercase tracking-wider">Certifications</p>
              <h2 className="font-headline-lg text-headline-lg text-on-tertiary-fixed mt-1 font-bold">98%</h2>
            </div>
            <p className="text-[10px] font-semibold text-on-tertiary-fixed-variant">Verified Professionals</p>
          </div>
        </section>

        {/* Teacher Cards Grid */}
        {loading && teachers.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {displayTeachers.map((teacher) => (
              <div 
                key={teacher.id} 
                className="glass-card rounded-[24px] overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col justify-between border border-outline-variant/30 p-stack-md min-h-[260px]"
              >
                <div>
                  <div className="flex items-start justify-between mb-stack-md">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleOpenViewModal(teacher)}>
                      <div className="relative">
                        {teacher.avatar ? (
                          <img alt={teacher.full_name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/10 border border-outline-variant" src={teacher.avatar}/>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center font-bold text-secondary text-2xl">
                            {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <h3 className="font-title-lg text-base text-on-surface font-bold truncate max-w-[150px] group-hover:text-primary transition-colors">
                          {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary rounded-md font-semibold text-[10px] mt-1">
                          {teacher.department || 'Academic'}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <button 
                        onClick={() => setMenuOpenId(menuOpenId === teacher.id ? null : teacher.id)}
                        className="text-outline hover:text-primary transition-colors p-1"
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      {menuOpenId === teacher.id && (
                        <div className="absolute right-0 top-8 w-28 bg-surface-container-lowest shadow-lg rounded-xl border border-outline-variant z-10 py-1.5 animate-fadeIn">
                          <button 
                            onClick={() => {
                              handleOpenViewModal(teacher)
                              setMenuOpenId(null)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors text-xs font-semibold"
                          >
                            View Details
                          </button>
                          {!teacher.id.startsWith('mock') && (
                            <>
                              <button 
                                onClick={() => {
                                  handleOpenCredsModal(teacher)
                                  setMenuOpenId(null)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors text-xs font-semibold text-primary"
                              >
                                Credentials
                              </button>
                              <button 
                                onClick={() => {
                                  handleDelete(teacher.id)
                                  setMenuOpenId(null)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-surface-container transition-colors text-xs font-bold text-error"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="font-label-md text-xs text-on-surface-variant mb-2 font-semibold">Assigned Classes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.assigned_classes?.length > 0 ? (
                          teacher.assigned_classes.map((cls, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-surface-container-high rounded-full font-semibold text-[10px] text-on-surface">
                              {cls}
                            </span>
                          ))
                        ) : (
                          <span className="text-on-surface-variant italic text-[11px]">No classes assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between py-3 border-t border-outline-variant/20 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-lg">group</span>
                      <span className="font-label-md text-[11px] text-on-surface-variant font-semibold">Student Load</span>
                    </div>
                    <span className="font-numeric-bold text-xs font-bold text-primary">
                      {teacher.assigned_classes?.length * 28 || 120} Students
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button 
                      onClick={() => handleOpenViewModal(teacher)}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container transition-all text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider">View</span>
                    </button>
                    <button 
                      onClick={() => handleOpenViewModal(teacher)}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container transition-all text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleOpenViewModal(teacher)}
                      className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container transition-all text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-base">assignment_ind</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider">Assign</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Expand Faculty Empty State Card */}
            <div 
              onClick={handleOpenCreateModal}
              className="border-2 border-dashed border-outline-variant rounded-[24px] flex flex-col items-center justify-center p-stack-lg bg-surface-container-low/50 hover:bg-surface-container-low transition-all group cursor-pointer min-h-[260px]"
            >
              <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
              </div>
              <h4 className="font-title-lg text-sm text-on-surface font-bold">Expand Faculty</h4>
              <p className="font-body-md text-xs text-on-surface-variant text-center px-4 mt-1">
                Onboard a new educator to your department.
              </p>
              <button className="mt-5 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-semibold text-xs transition-colors hover:bg-opacity-95">
                Add Teacher
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal Overlay (Create / View) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
                <h3 className="font-title-lg text-lg text-primary font-bold">
                  {modalMode === 'create' ? 'Onboard New Faculty' : 'Faculty Records Profile'}
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
                    {selectedTeacher?.avatar ? (
                      <img src={selectedTeacher.avatar} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center font-bold text-secondary text-2xl">
                        {selectedTeacher?.first_name?.[0]}{selectedTeacher?.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-lg text-on-surface">
                        {selectedTeacher?.full_name || `${selectedTeacher?.first_name} ${selectedTeacher?.last_name}`}
                      </h4>
                      <p className="text-on-surface-variant text-xs font-semibold">
                        Department of {selectedTeacher?.department || 'Academics'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-outline font-semibold">Email Address</p>
                      <p className="font-medium text-on-surface truncate">{selectedTeacher?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-outline font-semibold">Phone Number</p>
                      <p className="font-medium text-on-surface">{selectedTeacher?.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-outline font-semibold mb-1">Qualifications</p>
                    <ul className="list-disc pl-5 text-on-surface space-y-1">
                      {selectedTeacher?.qualifications?.length > 0 ? (
                        selectedTeacher.qualifications.map((q, idx) => <li key={idx}>{q}</li>)
                      ) : (
                        <li className="italic text-on-surface-variant text-xs">No qualifications added</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs text-outline font-semibold mb-1.5">Subjects Taught</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeacher?.subjects?.length > 0 ? (
                        selectedTeacher.subjects.map((subj, idx) => (
                          <span key={idx} className="bg-surface-container px-2.5 py-1 rounded-full text-xs font-semibold text-secondary">
                            {subj}
                          </span>
                        ))
                      ) : (
                        <span className="text-on-surface-variant italic text-xs">No subjects listed</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-outline font-semibold mb-1.5">Assigned Classes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeacher?.assigned_classes?.length > 0 ? (
                        selectedTeacher.assigned_classes.map((cls, idx) => (
                          <span key={idx} className="bg-surface-container px-2.5 py-1 rounded-full text-xs font-semibold text-on-surface">
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-on-surface-variant italic text-xs">No classes assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ONBOARD FORM */
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">First Name *</label>
                      <input 
                        type="text" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="Sarah"
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
                        placeholder="Jenkins"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Email Address *</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="teacher@school.com"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="2222222222"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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
                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-xs text-on-surface-variant">Department</label>
                      <input 
                        type="text" 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                        placeholder="e.g. Mathematics"
                      />
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-xs text-on-surface-variant">Qualifications</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={qualificationInput}
                        onChange={(e) => setQualificationInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary text-xs"
                        placeholder="e.g. Ph.D. in Physics"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddQualification}
                        className="px-3 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-opacity-95 text-xs"
                      >
                        Add
                      </button>
                    </div>
                    {formData.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.qualifications.map((q, idx) => (
                          <span key={idx} className="bg-surface-container-high px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface flex items-center gap-1.5">
                            {q}
                            <button type="button" onClick={() => handleRemoveQualification(idx)} className="material-symbols-outlined text-sm text-error hover:bg-error-container hover:rounded-full">close</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subjects */}
                  <div>
                    <label className="font-semibold text-xs text-on-surface-variant mb-1.5 block">Subjects Taught</label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_SUBJECTS.map((subj) => {
                        const active = formData.subjects.includes(subj)
                        return (
                          <button
                            type="button"
                            key={subj}
                            onClick={() => handleToggleSubject(subj)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                              active 
                                ? 'bg-secondary text-on-secondary border-secondary' 
                                : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {subj}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Assigned Classes */}
                  <div>
                    <label className="font-semibold text-xs text-on-surface-variant mb-1.5 block">Assigned Classes</label>
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto border border-outline-variant/15 p-2 rounded-xl bg-surface-container-low">
                      {AVAILABLE_CLASSES.map((cls) => {
                        const active = formData.assigned_classes.includes(cls)
                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => handleToggleClass(cls)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                              active 
                                ? 'bg-primary text-on-primary border-primary' 
                                : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            {cls}
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
                      {isSubmitting ? 'Onboarding...' : 'Onboard Faculty'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 mb-4">
                <h3 className="font-title-lg text-lg text-primary font-bold">
                  Change Credentials
                </h3>
                <button 
                  onClick={() => setCredsModalOpen(false)}
                  className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container p-1 rounded-full"
                >
                  close
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xs text-outline font-semibold">User</p>
                <p className="font-bold text-on-surface text-base">{credsTargetUser?.name}</p>
                <p className="text-xs text-on-surface-variant capitalize">{credsTargetUser?.role}</p>
              </div>

              {credsMessage && (
                <div className={`p-3 rounded-xl text-xs mb-4 ${
                  credsMessage.includes('success') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-error-container text-on-error-container'
                }`}>
                  {credsMessage}
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault()
                setCredsSubmitting(true)
                setCredsMessage('')
                try {
                  await api.put(`/admin/users/${credsTargetUser.user_id}/credentials`, credsFormData)
                  setCredsMessage('Credentials updated successfully!')
                  setTimeout(() => {
                    setCredsModalOpen(false)
                    fetchTeachers()
                  }, 1500)
                } catch (err) {
                  console.error('Failed to update credentials:', err)
                  setCredsMessage(err.response?.data?.detail || 'An error occurred.')
                } finally {
                  setCredsSubmitting(false)
                }
              }} className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-xs text-on-surface-variant">Email Address</label>
                  <input 
                    type="email" 
                    value={credsFormData.email}
                    onChange={(e) => setCredsFormData({...credsFormData, email: e.target.value})}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                    placeholder="email@school.com"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-xs text-on-surface-variant">Phone Number</label>
                  <input 
                    type="text" 
                    value={credsFormData.phone}
                    onChange={(e) => setCredsFormData({...credsFormData, phone: e.target.value})}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                    placeholder="Phone number"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-xs text-on-surface-variant">New Password</label>
                  <input 
                    type="password" 
                    value={credsFormData.password}
                    onChange={(e) => setCredsFormData({...credsFormData, password: e.target.value})}
                    className="px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-low outline-none focus:border-primary"
                    placeholder="Leave blank to keep unchanged"
                  />
                </div>

                <div className="pt-4 flex gap-3 border-t border-outline-variant/15 mt-6 justify-end">
                  <button 
                    type="button"
                    onClick={() => setCredsModalOpen(false)}
                    className="px-5 py-2.5 border border-outline text-on-surface-variant rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={credsSubmitting}
                    className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:bg-opacity-95 disabled:bg-opacity-50"
                  >
                    {credsSubmitting ? 'Updating...' : 'Update Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
