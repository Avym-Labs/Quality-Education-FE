import { useEffect, useState } from 'react'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

const AVAILABLE_CLASSES = ['9-A', '9-B', '9-C', '10-A', '10-B', '10-C', '11-A', '11-B', '11-C', '12-A', '12-B', '12-C']
const AVAILABLE_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English Literature', 'Biology', 'History']

export default function UserManagement() {
  const [activeRole, setActiveRole] = useState('student') // 'student' | 'teacher'
  const [usersList, setUsersList] = useState([])
  const [teachersList, setTeachersList] = useState([]) // Loaded for student mapping
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  
  // Student Filters
  const [gradeFilter, setGradeFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit' | 'view'
  const [selectedUser, setSelectedUser] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)

  // Credentials Modal States
  const [credsModalOpen, setCredsModalOpen] = useState(false)
  const [credsTargetUser, setCredsTargetUser] = useState(null)
  const [credsFormData, setCredsFormData] = useState({ email: '', phone: '', password: '' })
  const [credsSubmitting, setCredsSubmitting] = useState(false)
  const [credsMessage, setCredsMessage] = useState('')

  // Bulk Import Modal States
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false)
  const [importRole, setImportRole] = useState('student')
  const [selectedFile, setSelectedFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)

  // Combined Form States
  const [formData, setFormData] = useState({
    // User credentials (create only)
    email: '',
    phone: '',
    password: '',
    first_name: '',
    last_name: '',
    // Student specifics
    grade: '10',
    section: 'A',
    roll_number: '',
    father_name: '',
    mother_name: '',
    subjects: [],
    subject_teachers: {}
    // Teacher specifics
  })
  
  const [qualificationInput, setQualificationInput] = useState('')
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load teachers for student-teacher mapping
  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await api.get('/teachers')
        setTeachersList(res.data || [])
      } catch (err) {
        console.error('Failed to load teachers for mappings:', err)
      }
    }
    loadTeachers()
  }, [])

  // Fetch users list based on activeRole
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      if (activeRole === 'student') {
        const params = {}
        if (gradeFilter) params.grade = gradeFilter
        if (sectionFilter) params.section = sectionFilter
        if (search) params.search = search
        const res = await api.get('/students', { params })
        setUsersList(res.data || [])
      } else {
        const res = await api.get('/teachers', { params: { search: search || undefined } })
        setUsersList(res.data || [])
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(`Could not fetch ${activeRole} records.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [activeRole, gradeFilter, sectionFilter])

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchUsers()
    }
  }

  // Add/Edit Modals handlers
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setFormData({
      email: '',
      phone: '',
      password: '',
      first_name: '',
      last_name: '',
      grade: '10',
      section: 'A',
      roll_number: '',
      father_name: '',
      mother_name: '',
      subjects: [],
      subject_teachers: {},
      department: '',
      assigned_classes: [],
      qualifications: []
    })
    setQualificationInput('')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setModalMode('edit')
    setSelectedUser(item)
    
    if (activeRole === 'student') {
      setFormData({
        first_name: item.first_name || '',
        last_name: item.last_name || '',
        email: item.email || '',
        phone: item.phone || '',
        password: '', // Hidden on edit
        grade: item.grade || '10',
        section: item.section || 'A',
        roll_number: item.roll_number || '',
        father_name: item.father_name || '',
        mother_name: item.mother_name || '',
        subjects: item.subjects || [],
        subject_teachers: item.subject_teachers || {},
        department: '',
        assigned_classes: [],
        qualifications: []
      })
    } else {
      setFormData({
        first_name: item.first_name || '',
        last_name: item.last_name || '',
        email: item.email || '',
        phone: item.phone || '',
        password: '',
        grade: '10',
        section: 'A',
        roll_number: '',
        father_name: '',
        mother_name: '',
        subjects: item.subjects || [],
        subject_teachers: {},
        department: item.department || '',
        assigned_classes: item.assigned_classes || [],
        qualifications: item.qualifications || []
      })
    }
    setQualificationInput('')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenViewModal = (item) => {
    setModalMode('view')
    setSelectedUser(item)
    setModalOpen(true)
  }

  const handleOpenCredsModal = (item) => {
    setCredsTargetUser({
      user_id: item.user_id || item.id,
      name: item.full_name || `${item.first_name} ${item.last_name}`,
      role: activeRole
    })
    setCredsFormData({
      email: item.email || '',
      phone: item.phone || '',
      password: ''
    })
    setCredsMessage('')
    setCredsModalOpen(true)
  }

  // Toggles for arrays
  const handleToggleSubject = (sub) => {
    setFormData(prev => {
      const exists = prev.subjects.includes(sub)
      return {
        ...prev,
        subjects: exists ? prev.subjects.filter(s => s !== sub) : [...prev.subjects, sub]
      }
    })
  }

  const handleToggleClass = (cls) => {
    setFormData(prev => {
      const exists = prev.assigned_classes.includes(cls)
      return {
        ...prev,
        assigned_classes: exists ? prev.assigned_classes.filter(c => c !== cls) : [...prev.assigned_classes, cls]
      }
    })
  }

  // Qualifications list mapping
  const handleAddQualification = () => {
    if (qualificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualificationInput.trim()]
      }))
      setQualificationInput('')
    }
  }

  const handleRemoveQualification = (idx) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== idx)
    }))
  }

  // Subject Teacher mapping mapping
  const handleSubjectTeacherChange = (subject, teacherUserId) => {
    setFormData(prev => ({
      ...prev,
      subject_teachers: {
        ...prev.subject_teachers,
        [subject]: teacherUserId
      }
    }))
  }

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    // Form Validation
    if (modalMode === 'create') {
      if (!formData.first_name || !formData.email || !formData.password) {
        setFormError('First Name, Email, and Password are required fields.')
        setIsSubmitting(false)
        return
      }
    } else {
      if (!formData.first_name) {
        setFormError('First Name is required.')
        setIsSubmitting(false)
        return
      }
    }

    try {
      if (activeRole === 'student') {
        const payload = {
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password || undefined,
          first_name: formData.first_name,
          last_name: formData.last_name,
          grade: formData.grade,
          section: formData.section,
          roll_number: formData.roll_number,
          father_name: formData.father_name,
          mother_name: formData.mother_name,
          subjects: formData.subjects,
          subject_teachers: formData.subject_teachers
        }

        if (modalMode === 'create') {
          await api.post('/students', payload)
        } else {
          await api.put(`/students/${selectedUser.id}`, payload)
        }
      } else {
        const payload = {
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password || undefined,
          first_name: formData.first_name,
          last_name: formData.last_name,
          department: formData.department,
          subjects: formData.subjects,
          assigned_classes: formData.assigned_classes,
          qualifications: formData.qualifications
        }

        if (modalMode === 'create') {
          await api.post('/teachers', payload)
        } else {
          await api.put(`/teachers/${selectedUser.id || selectedUser._id}`, payload)
        }
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      console.error('Failed to save user:', err)
      setFormError(err.response?.data?.detail || 'Failed to submit records.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete User Action
  const handleDeleteUser = async (item) => {
    const name = item.full_name || `${item.first_name} ${item.last_name}`
    if (!window.confirm(`Are you sure you want to completely delete ${name}'s profile and access?`)) return
    try {
      if (activeRole === 'student') {
        await api.delete(`/students/${item.id}`)
      } else {
        await api.delete(`/teachers/${item.id || item._id}`)
      }
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert('Failed to delete user profile.')
    }
  }

  // Update Credentials handler
  const handleCredsSubmit = async (e) => {
    e.preventDefault()
    setCredsSubmitting(true)
    setCredsMessage('')
    try {
      await api.put(`/admin/users/${credsTargetUser.user_id}/credentials`, {
        email: credsFormData.email || null,
        phone: credsFormData.phone || null,
        password: credsFormData.password || null
      })
      setCredsMessage('Access credentials updated successfully.')
      setTimeout(() => {
        setCredsModalOpen(false)
        fetchUsers()
      }, 1500)
    } catch (err) {
      setCredsMessage(err.response?.data?.detail || 'Error updating credentials.')
    } finally {
      setCredsSubmitting(false)
    }
  }

  // Bulk Import File Handler
  const handleBulkImportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setImportError('Please select a file to upload.')
      return
    }
    setImporting(true)
    setImportResult(null)
    setImportError(null)

    const formDataUpload = new FormData()
    formDataUpload.append('file', selectedFile)
    formDataUpload.append('role', importRole)

    try {
      const res = await api.post('/admin/bulk-import', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImportResult(res.data)
      setSelectedFile(null)
      fetchUsers()
    } catch (err) {
      setImportError(err.response?.data?.detail || 'Failed to parse sheet template.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24 text-xs font-semibold">
        
        {/* Header Block */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              User Management
            </h2>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={() => {
                setImportRole(activeRole)
                setImportResult(null)
                setImportError(null)
                setSelectedFile(null)
                setBulkImportModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary-container text-on-secondary-container hover:bg-opacity-95 rounded-2xl cursor-pointer border-none shadow-sm font-bold text-xs"
            >
              <span className="material-symbols-outlined text-sm">publish</span>
              <span>Bulk Import</span>
            </button>
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary hover:opacity-95 rounded-2xl cursor-pointer border-none shadow-sm font-bold text-xs"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Add {activeRole === 'student' ? 'Student' : 'Teacher'}</span>
            </button>
          </div>
        </section>

        {/* Filters and Search toolbar */}
        <section className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-outline uppercase font-bold">Manage Role:</span>
            <select
              value={activeRole}
              onChange={(e) => {
                setActiveRole(e.target.value)
                setSearch('')
                setGradeFilter('')
                setSectionFilter('')
              }}
              className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
            >
              <option value="student">🎓 Students List</option>
              <option value="teacher">👨‍🏫 Teachers List</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-base">search</span>
              <input
                type="text"
                placeholder={`Search by name...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-9 pr-4 py-2 border border-outline bg-surface-container-low rounded-xl text-xs outline-none focus:border-primary text-on-surface"
              />
            </div>

            {activeRole === 'student' && (
              <>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-outline bg-surface-container-low text-xs outline-none focus:border-primary"
                >
                  <option value="">All Grades</option>
                  {['9', '10', '11', '12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-outline bg-surface-container-low text-xs outline-none focus:border-primary"
                >
                  <option value="">All Sections</option>
                  {['A', 'B', 'C'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </>
            )}

            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-xl text-xs font-bold border-none cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </section>

        {/* Users Table / Grid list */}
        {loading ? (
          <div className="flex justify-center items-center py-24 bg-surface-container-lowest rounded-3xl border border-outline-variant/15">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 text-error">
            <span className="material-symbols-outlined text-3xl">error</span>
            <p className="mt-2 font-semibold">{error}</p>
          </div>
        ) : usersList.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 text-outline">
            <span className="material-symbols-outlined text-4xl">group_off</span>
            <p className="mt-2 font-semibold">No {activeRole} records found matching constraints.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25 text-outline font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Contact Info</th>
                    {activeRole === 'student' ? (
                      <>
                        <th className="p-4">Class</th>
                        <th className="p-4">Roll Number</th>
                        <th className="p-4">Subjects</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4">Department</th>
                        <th className="p-4">Subjects</th>
                        <th className="p-4">Assigned Classes</th>
                      </>
                    )}
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-semibold text-on-surface">
                  {usersList.map((item) => (
                    <tr key={item.id || item._id} className="hover:bg-surface-container-lowest/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.full_name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span>{item.first_name?.[0]}{item.last_name?.[0]}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface">{item.full_name || `${item.first_name} ${item.last_name}`}</h4>
                            <p className="text-[10px] text-outline font-medium mt-0.5">UID: {item.user_id || item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p>{item.email}</p>
                          <p className="text-outline text-[10px] mt-0.5">{item.phone || 'No Phone'}</p>
                        </div>
                      </td>
                      {activeRole === 'student' ? (
                        <>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                              Grade {item.grade}-{item.section}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-outline">{item.roll_number || 'N/A'}</td>
                          <td className="p-4">
                            <p className="truncate max-w-[200px] text-outline text-[10px]">
                              {item.subjects?.join(', ') || 'No subjects enrolled'}
                            </p>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold">
                              {item.department || 'General'}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="truncate max-w-[200px] text-outline text-[10px]">
                              {item.subjects?.join(', ') || 'None'}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {item.assigned_classes?.map(cls => (
                                <span key={cls} className="text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded text-outline font-bold">{cls}</span>
                              )) || 'None'}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="p-4 text-center">
                        <div className="relative flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            className="p-2 hover:bg-surface-container-high text-on-surface rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title="View Profile"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 hover:bg-primary/10 text-primary rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title="Edit Details"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => handleOpenCredsModal(item)}
                            className="p-2 hover:bg-tertiary/10 text-tertiary rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title="Update Password"
                          >
                            <span className="material-symbols-outlined text-base">vpn_key</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item)}
                            className="p-2 hover:bg-error/10 text-error rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title="Delete User"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Bulk Import Excel/CSV */}
        {bulkImportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant shadow-2xl max-w-md w-full animate-slideUp text-left space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary">publish</span>
                  Bulk Spreadsheet Import
                </h3>
                <button 
                  onClick={() => setBulkImportModalOpen(false)}
                  className="material-symbols-outlined hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  close
                </button>
              </div>

              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">Import Target Role</label>
                  <select
                    value={importRole}
                    onChange={(e) => setImportRole(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
                  >
                    <option value="student">🎓 Students List</option>
                    <option value="teacher">👨‍🏫 Teachers List</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">Select Spreadsheet File (.csv, .xlsx)</label>
                  <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="px-3.5 py-3 border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    required
                  />
                  <p className="text-[9px] text-outline mt-1 font-semibold">
                    Headers are auto-mapped via column regex patterns. Supported formats: .csv, .xlsx
                  </p>
                </div>

                {importResult && (
                  <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-bold text-center">
                    {importResult.detail}. Imported count: {importResult.imported_count}
                  </div>
                )}

                {importError && (
                  <div className="p-3 bg-error-container/20 border border-error/25 text-error rounded-xl text-[10px] font-bold text-center">
                    {importError}
                  </div>
                )}

                <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-3">
                  <button
                    type="button"
                    onClick={() => setBulkImportModalOpen(false)}
                    className="px-4 py-2.5 border border-outline hover:bg-surface-container text-xs font-bold rounded-xl cursor-pointer bg-transparent"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={importing}
                    className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                  >
                    {importing ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        <span>Import Records</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Change Access Credentials (Email / Phone / Password) */}
        {credsModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant shadow-2xl max-w-md w-full animate-slideUp text-left space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary">vpn_key</span>
                  Edit Access Access
                </h3>
                <button 
                  onClick={() => setCredsModalOpen(false)}
                  className="material-symbols-outlined hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  close
                </button>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant font-bold">Target User: <span className="text-primary font-black">{credsTargetUser?.name}</span></p>
                <p className="text-[10px] text-outline mt-0.5">Role Type: {credsTargetUser?.role.toUpperCase()}</p>
              </div>

              <form onSubmit={handleCredsSubmit} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">System Login Email</label>
                  <input
                    type="email"
                    value={credsFormData.email}
                    onChange={(e) => setCredsFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={credsFormData.phone}
                    onChange={(e) => setCredsFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">New Secure Password</label>
                  <input
                    type="password"
                    placeholder="•••••••• (Leave blank to keep current)"
                    value={credsFormData.password}
                    onChange={(e) => setCredsFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                {credsMessage && (
                  <div className={`p-3 rounded-xl text-center text-[10px] font-bold ${
                    credsMessage.includes('success') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-error-container/20 text-error border border-error/25'
                  }`}>
                    {credsMessage}
                  </div>
                )}

                <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setCredsModalOpen(false)}
                    className="px-4 py-2.5 border border-outline hover:bg-surface-container text-xs font-bold rounded-xl cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={credsSubmitting}
                    className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm flex items-center justify-center gap-1"
                  >
                    {credsSubmitting ? 'Updating...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Creation & Editing details form */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slideUp text-left space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-sm font-bold text-on-surface">
                  {modalMode === 'create' ? `Register New ${activeRole === 'student' ? 'Student' : 'Teacher'}` : modalMode === 'edit' ? `Edit ${activeRole === 'student' ? 'Student' : 'Teacher'} Profile` : `${activeRole === 'student' ? 'Student' : 'Teacher'} Details`}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="material-symbols-outlined hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  close
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-error-container/20 border border-error/25 text-error rounded-xl text-[10px] font-bold text-center">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
                
                {/* 1. General Profile attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-outline font-bold uppercase">First Name</label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-outline font-bold uppercase">Last Name</label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    />
                  </div>
                </div>

                {modalMode === 'create' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-bold uppercase">Email Identifier</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-bold uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-bold uppercase">Secure Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* 2. Student specific inputs */}
                {activeRole === 'student' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">Grade</label>
                        <select
                          disabled={modalMode === 'view'}
                          value={formData.grade}
                          onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
                        >
                          {['9', '10', '11', '12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">Section</label>
                        <select
                          disabled={modalMode === 'view'}
                          value={formData.section}
                          onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
                        >
                          {['A', 'B', 'C'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">Roll Number</label>
                        <input
                          type="text"
                          disabled={modalMode === 'view'}
                          value={formData.roll_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">Father's Name</label>
                        <input
                          type="text"
                          disabled={modalMode === 'view'}
                          value={formData.father_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">Mother's Name</label>
                        <input
                          type="text"
                          disabled={modalMode === 'view'}
                          value={formData.mother_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, mother_name: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>
                    </div>

                    {/* Enrolled subjects switcher */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] text-outline font-bold uppercase">Enrolled Subjects & Mentors</label>
                      <div className="grid grid-cols-2 gap-3 bg-surface-container-low/30 p-3 rounded-2xl border border-outline-variant/20">
                        {AVAILABLE_SUBJECTS.map((sub) => {
                          const isEnrolled = formData.subjects.includes(sub)
                          return (
                            <div key={sub} className="flex flex-col gap-1 p-2 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
                              <label className="flex items-center gap-1.5 font-bold text-xs cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  disabled={modalMode === 'view'}
                                  checked={isEnrolled}
                                  onChange={() => handleToggleSubject(sub)}
                                />
                                <span>{sub}</span>
                              </label>
                              {isEnrolled && (
                                <select
                                  disabled={modalMode === 'view'}
                                  value={formData.subject_teachers[sub] || ''}
                                  onChange={(e) => handleSubjectTeacherChange(sub, e.target.value)}
                                  className="mt-1 px-2 py-1 rounded bg-surface-container-low text-[10px] font-semibold outline-none border border-outline-variant/40"
                                >
                                  <option value="">-- Assign Teacher --</option>
                                  {teachersList
                                    .filter(t => t.subjects?.includes(sub))
                                    .map(t => (
                                      <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                                    ))}
                                </select>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* 3. Teacher specific inputs */}
                {activeRole === 'teacher' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">Faculty Department</label>
                        <input
                          type="text"
                          placeholder="e.g. Science, Mathematics"
                          disabled={modalMode === 'view'}
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>
                    </div>

                    {/* Subjects and Assigned classes switchers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] text-outline font-bold uppercase">Department Subjects</label>
                        <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-surface-container-low/30 border border-outline-variant/20 max-h-[150px] overflow-y-auto">
                          {AVAILABLE_SUBJECTS.map((sub) => {
                            const isEnrolled = formData.subjects.includes(sub)
                            return (
                              <button
                                key={sub}
                                type="button"
                                disabled={modalMode === 'view'}
                                onClick={() => handleToggleSubject(sub)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                                  isEnrolled 
                                    ? 'bg-primary text-on-primary border-primary' 
                                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-low'
                                }`}
                              >
                                {sub}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] text-outline font-bold uppercase">Assigned Lecturing Classes</label>
                        <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-surface-container-low/30 border border-outline-variant/20 max-h-[150px] overflow-y-auto">
                          {AVAILABLE_CLASSES.map((cls) => {
                            const isAssigned = formData.assigned_classes.includes(cls)
                            return (
                              <button
                                key={cls}
                                type="button"
                                disabled={modalMode === 'view'}
                                onClick={() => handleToggleClass(cls)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                                  isAssigned 
                                    ? 'bg-tertiary text-on-tertiary border-tertiary' 
                                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-low'
                                }`}
                              >
                                Class {cls}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Qualifications section */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] text-outline font-bold uppercase">Qualifications & Degrees</label>
                      {modalMode !== 'view' && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Master of Education, PhD in Physics"
                            value={qualificationInput}
                            onChange={(e) => setQualificationInput(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                          />
                          <button
                            type="button"
                            onClick={handleAddQualification}
                            className="px-4 bg-secondary-container text-on-secondary-container hover:bg-opacity-95 rounded-xl font-bold cursor-pointer border-none"
                          >
                            Add
                          </button>
                        </div>
                      )}
                      
                      <div className="space-y-1 mt-1 font-semibold">
                        {formData.qualifications?.map((q, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low border border-outline-variant/35">
                            <span className="text-[11px] font-semibold">{q}</span>
                            {modalMode !== 'view' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQualification(idx)}
                                className="material-symbols-outlined text-xs text-error hover:bg-error-container p-0.5 rounded-full cursor-pointer border-none bg-transparent"
                              >
                                close
                              </button>
                            )}
                          </div>
                        ))}
                        {formData.qualifications?.length === 0 && (
                          <p className="text-[10px] text-outline italic">No qualifications added.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Submit actions */}
                <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 border border-outline hover:bg-surface-container text-xs font-bold rounded-xl cursor-pointer bg-transparent"
                  >
                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm flex items-center gap-1"
                    >
                      {isSubmitting ? 'Saving...' : 'Onboard Profile'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
