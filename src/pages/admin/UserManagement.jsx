import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

export default function UserManagement() {
  const { t } = useTranslation()
  const [activeRole, setActiveRole] = useState('student') // 'student' | 'teacher' | 'classes'
  const [usersList, setUsersList] = useState([])
  const [teachersList, setTeachersList] = useState([]) // Loaded for student mapping
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // Classes tab state
  const [classesList, setClassesList] = useState([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [newClassGrade, setNewClassGrade] = useState('')
  const [newClassSection, setNewClassSection] = useState('')
  const [classFormError, setClassFormError] = useState(null)
  const [classSubmitting, setClassSubmitting] = useState(false)

  // No hardcoded fallback here on purpose: showing class options that don't
  // actually exist in Academics is exactly what let a teacher end up
  // "assigned" to phantom classes before. Empty means empty.
  const classKeys = classesList.map(c => `${c.grade}-${c.section}`)
  const gradeOptions = [...new Set(classesList.map(c => c.grade))].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
  const sectionOptions = [...new Set(classesList.map(c => c.section))].sort()

  // Real subjects actually being taught in this school, derived from
  // teachersList (already fetched below) instead of a hardcoded guess list.
  const AVAILABLE_SUBJECTS = [...new Set(teachersList.flatMap(t => t.subjects || []))].sort()
  
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

  // Tracks which lecturing classes the teacher had when the edit modal
  // opened, so we know which ones were removed and need their per-class
  // subject assignments cleared on save.
  const [originalAssignedClasses, setOriginalAssignedClasses] = useState([])

  // Real teacher-assignment rows for the student's current class, used to
  // filter the "Enrolled Subjects & Mentors" picker down to teachers who are
  // actually assigned to teach that subject in that specific class.
  const [classAssignments, setClassAssignments] = useState([])

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

  const fetchClasses = async () => {
    try {
      setClassesLoading(true)
      const res = await api.get('/classes')
      setClassesList(res.data || [])
    } catch (err) {
      console.error('Failed to load classes:', err)
    } finally {
      setClassesLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleOpenCreateClassModal = () => {
    setNewClassGrade('')
    setNewClassSection('')
    setClassFormError(null)
    setClassModalOpen(true)
  }

  const handleCreateClass = async (e) => {
    e.preventDefault()
    if (!newClassGrade.trim() || !newClassSection.trim()) {
      setClassFormError(t('userManagement.gradeAndSectionRequired'))
      return
    }
    setClassSubmitting(true)
    setClassFormError(null)
    try {
      await api.post('/classes', { grade: newClassGrade.trim(), section: newClassSection.trim() })
      setClassModalOpen(false)
      fetchClasses()
    } catch (err) {
      setClassFormError(err.response?.data?.detail || t('userManagement.failedToAddClass'))
    } finally {
      setClassSubmitting(false)
    }
  }

  const handleDeleteClass = async (cls) => {
    const classKey = `${cls.grade}-${cls.section}`
    const warnings = []
    if (cls.student_count > 0) warnings.push(t('userManagement.confirmDeleteClassWarnStudents', { count: cls.student_count, plural: cls.student_count === 1 ? '' : 's' }))
    if (cls.teacher_count > 0) warnings.push(t('userManagement.confirmDeleteClassWarnTeachers', { count: cls.teacher_count, plural: cls.teacher_count === 1 ? '' : 's' }))
    const suffix = warnings.length ? t('userManagement.thisWillSuffix', { warnings: warnings.join(t('userManagement.and')) }) : ''
    if (!window.confirm(t('userManagement.confirmDeleteClass', { cls: classKey, suffix }))) return
    try {
      await api.delete(`/classes/${cls.id}`)
      fetchClasses()
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert(t('userManagement.failedToDeleteClass'))
    }
  }

  // Fetch users list based on activeRole
  const fetchUsers = async () => {
    if (activeRole === 'classes') return
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
      setError(t('userManagement.couldNotFetchRecords', { role: activeRole }))
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
      grade: classesList[0]?.grade || '',
      section: classesList[0]?.section || '',
      roll_number: '',
      father_name: '',
      mother_name: '',
      subjects: [],
      subject_teachers: {},
      department: '',
      assigned_classes: [],
      qualifications: [],
      classSubjects: {}
    })
    setQualificationInput('')
    setFormError(null)
    setOriginalAssignedClasses([])
    setModalOpen(true)
  }

  const handleOpenEditModal = async (item) => {
    setModalMode('edit')
    setSelectedUser(item)
    
    if (activeRole === 'student') {
      setFormData({
        first_name: item.first_name || '',
        last_name: item.last_name || '',
        email: item.email || '',
        phone: item.phone || '',
        password: '', // Hidden on edit
        grade: item.grade || classesList[0]?.grade || '',
        section: item.section || classesList[0]?.section || '',
        roll_number: item.roll_number || '',
        father_name: item.father_name || '',
        mother_name: item.mother_name || '',
        subjects: item.subjects || [],
        subject_teachers: item.subject_teachers || {},
        department: '',
        assigned_classes: [],
        qualifications: [],
        classSubjects: {}
      })
      setOriginalAssignedClasses([])
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
        qualifications: item.qualifications || [],
        classSubjects: {}
      })
      setOriginalAssignedClasses(item.assigned_classes || [])
      // Prefill which subjects are taught in each class from the real
      // per-class assignment rows, instead of assuming every subject applies
      // to every lecturing class.
      try {
        const res = await api.get('/teacher-assignments', { params: { teacher_id: item.id } })
        const byClass = {}
        for (const row of res.data || []) {
          if (!byClass[row.class_key]) byClass[row.class_key] = []
          byClass[row.class_key].push(row.subject)
        }
        setFormData(prev => ({ ...prev, classSubjects: byClass }))
      } catch (err) {
        console.error('Failed to load class-subject assignments:', err)
      }
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
      if (exists) {
        // Unchecking must also drop any stale mentor assignment (student
        // form) or per-class pairing (teacher form) for this subject —
        // otherwise a leftover reference to a subject no longer selected
        // fails backend validation on save.
        const restMentors = Object.fromEntries(
          Object.entries(prev.subject_teachers).filter(([key]) => key !== sub)
        )
        const restClassSubjects = Object.fromEntries(
          Object.entries(prev.classSubjects || {}).map(([cls, subs]) => [cls, subs.filter(s => s !== sub)])
        )
        return {
          ...prev,
          subjects: prev.subjects.filter(s => s !== sub),
          subject_teachers: restMentors,
          classSubjects: restClassSubjects
        }
      }
      return { ...prev, subjects: [...prev.subjects, sub] }
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

  // Lecturing Classes dropdown (multi-select, since a teacher can
  // teach more than one class) — closes when clicking anywhere outside it.
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)
  const classDropdownRef = useRef(null)

  useEffect(() => {
    if (!classDropdownOpen) return
    const handleClickOutside = (e) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setClassDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [classDropdownOpen])

  useEffect(() => {
    if (!modalOpen) setClassDropdownOpen(false)
  }, [modalOpen])

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

  // Refetch eligible mentors whenever the student form's class changes.
  useEffect(() => {
    if (!modalOpen || activeRole !== 'student' || !formData.grade || !formData.section) {
      setClassAssignments([])
      return
    }
    const classKey = `${formData.grade}-${formData.section}`
    api.get('/teacher-assignments', { params: { class_key: classKey } })
      .then(res => setClassAssignments(res.data || []))
      .catch(err => {
        console.error('Failed to load eligible mentors for class:', err)
        setClassAssignments([])
      })
  }, [modalOpen, activeRole, formData.grade, formData.section])

  // A teacher is only offered as a subject's mentor if there's a real
  // TeacherAssignment row pairing them to this exact class + subject.
  const eligibleMentorsForSubject = (sub) => {
    const teacherDocIds = classAssignments.filter(a => a.subject === sub).map(a => a.teacher_id)
    return teachersList.filter(t => teacherDocIds.includes(t.id))
  }

  const handleToggleClassSubject = (classKey, subject) => {
    setFormData(prev => {
      const current = prev.classSubjects[classKey] || []
      const exists = current.includes(subject)
      return {
        ...prev,
        classSubjects: {
          ...prev.classSubjects,
          [classKey]: exists ? current.filter(s => s !== subject) : [...current, subject]
        }
      }
    })
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

    // Form Validation — same base fields required for both roles; a few
    // extras differ by role (password only matters for teacher login,
    // students fall back to their phone number; roll number/class only
    // make sense for students; lecturing classes only for teachers).
    if (!formData.first_name || !formData.last_name || (modalMode === 'create' && !formData.phone)) {
      setFormError(t('userManagement.firstLastPhoneRequired'))
      setIsSubmitting(false)
      return
    }

    if (modalMode === 'create' && activeRole === 'teacher' && !formData.password) {
      setFormError(t('userManagement.passwordRequiredForTeacher'))
      setIsSubmitting(false)
      return
    }

    if (activeRole === 'student') {
      if (!formData.roll_number) {
        setFormError(t('userManagement.rollNumberRequired'))
        setIsSubmitting(false)
        return
      }
      if (!formData.grade || !formData.section) {
        setFormError(t('userManagement.createClassFirst'))
        setIsSubmitting(false)
        return
      }
    }

    if (activeRole === 'teacher' && formData.assigned_classes.length === 0) {
      setFormError(t('userManagement.assignAtLeastOneClass'))
      setIsSubmitting(false)
      return
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
          // Only enrolled subjects' mentors are sent — a stale entry left
          // over from an earlier edit (or old data predating per-class
          // validation) must never block a save for a subject that isn't
          // even selected anymore.
          subject_teachers: Object.fromEntries(
            Object.entries(formData.subject_teachers).filter(([sub]) => formData.subjects.includes(sub))
          )
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

        let teacherId
        if (modalMode === 'create') {
          const res = await api.post('/teachers', payload)
          teacherId = res.data?.id
        } else {
          teacherId = selectedUser.id || selectedUser._id
          await api.put(`/teachers/${teacherId}`, payload)
        }

        // Sync per-class subject assignments: clear rows for any class that
        // was removed, then set the current subject list for each remaining
        // lecturing class.
        if (teacherId) {
          const removedClasses = originalAssignedClasses.filter(c => !formData.assigned_classes.includes(c))
          for (const cls of removedClasses) {
            await api.put(`/teacher-assignments/${teacherId}/${cls}`, { subjects: [] })
          }
          for (const cls of formData.assigned_classes) {
            await api.put(`/teacher-assignments/${teacherId}/${cls}`, { subjects: formData.classSubjects[cls] || [] })
          }
        }
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      console.error('Failed to save user:', err)
      setFormError(err.response?.data?.detail || t('userManagement.failedToSubmitRecords'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete User Action
  const handleDeleteUser = async (item) => {
    const name = item.full_name || `${item.first_name} ${item.last_name}`
    if (!window.confirm(t('userManagement.confirmDeleteUser', { name }))) return
    try {
      if (activeRole === 'student') {
        await api.delete(`/students/${item.id}`)
      } else {
        await api.delete(`/teachers/${item.id || item._id}`)
      }
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert(t('userManagement.failedToDeleteUser'))
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
      setCredsMessage(t('userManagement.credentialsUpdatedSuccess'))
      setTimeout(() => {
        setCredsModalOpen(false)
        fetchUsers()
      }, 1500)
    } catch (err) {
      setCredsMessage(err.response?.data?.detail || t('userManagement.errorUpdatingCredentials'))
    } finally {
      setCredsSubmitting(false)
    }
  }

  // Bulk Import File Handler
  const handleBulkImportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setImportError(t('userManagement.selectFileToUpload'))
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
      setImportError(err.response?.data?.detail || t('userManagement.failedToParseSheet'))
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
              {t('userManagement.title')}
            </h2>
          </div>
          <div className="flex gap-2.5">
            {activeRole !== 'classes' && (
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
                <Icon name="publish" className="text-sm" />
                <span>{t('userManagement.bulkImport')}</span>
              </button>
            )}
            <button
              onClick={activeRole === 'classes' ? handleOpenCreateClassModal : handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary hover:opacity-95 rounded-2xl cursor-pointer border-none shadow-sm font-bold text-xs"
            >
              <Icon name={activeRole === 'classes' ? 'add_circle' : 'person_add'} className="text-sm" />
              <span>{activeRole === 'student' ? t('userManagement.addStudent') : activeRole === 'teacher' ? t('userManagement.addTeacher') : t('userManagement.addClass')}</span>
            </button>
          </div>
        </section>

        {/* Filters and Search toolbar */}
        <section className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-outline uppercase font-bold">{t('userManagement.manage')}</span>
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
              <option value="classes">{t('userManagement.classesOption')}</option>
              <option value="student">{t('userManagement.studentsListOption')}</option>
              <option value="teacher">{t('userManagement.teachersListOption')}</option>
            </select>
          </div>

          {activeRole !== 'classes' && (
          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            <div className="relative min-w-[200px]">
              <Icon name="search" className="absolute left-3 top-2.5 text-outline text-base" />
              <input
                type="text"
                placeholder={t('userManagement.searchByName')}
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
                  <option value="">{t('userManagement.allGrades')}</option>
                  {gradeOptions.map(g => <option key={g} value={g}>{t('userManagement.gradeLabel', { grade: g })}</option>)}
                </select>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-outline bg-surface-container-low text-xs outline-none focus:border-primary"
                >
                  <option value="">{t('userManagement.allSections')}</option>
                  {sectionOptions.map(s => <option key={s} value={s}>{t('userManagement.sectionLabel', { section: s })}</option>)}
                </select>
              </>
            )}

            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-xl text-xs font-bold border-none cursor-pointer"
            >
              {t('userManagement.applyFilter')}
            </button>
          </div>
          )}
        </section>

        {/* Classes Grid */}
        {activeRole === 'classes' && (
          classesLoading ? (
            <div className="flex justify-center items-center py-24 bg-surface-container-lowest rounded-3xl border border-outline-variant/15">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
            </div>
          ) : classesList.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 text-outline">
              <Icon name="school" className="text-4xl" />
              <p className="mt-2 font-semibold">{t('userManagement.noClassesYetClickAdd')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {classesList.map(cls => (
                <div key={cls.id} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {cls.grade}-{cls.section}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-on-surface">{t('userManagement.classLabel', { grade: cls.grade, section: cls.section })}</h4>
                    <p className="text-[10px] text-outline font-semibold mt-0.5">
                      {t('userManagement.studentsCount', { count: cls.student_count, plural: cls.student_count === 1 ? '' : 's' })} • {t('userManagement.teachersCount', { count: cls.teacher_count, plural: cls.teacher_count === 1 ? '' : 's' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(cls)}
                    className="p-2 hover:bg-error/10 text-error rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center shrink-0"
                    title={t('userManagement.deleteClass')}
                  >
                    <Icon name="delete" className="text-base" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Users Table / Grid list */}
        {activeRole !== 'classes' && (loading ? (
          <div className="flex justify-center items-center py-24 bg-surface-container-lowest rounded-3xl border border-outline-variant/15">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 text-error">
            <Icon name="error" className="text-3xl" />
            <p className="mt-2 font-semibold">{error}</p>
          </div>
        ) : usersList.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 text-outline">
            <Icon name="group_off" className="text-4xl" />
            <p className="mt-2 font-semibold">{t('userManagement.noRecordsFound', { role: activeRole })}</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/25 text-outline font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">{t('userManagement.name')}</th>
                    <th className="p-4">{t('userManagement.contactInfo')}</th>
                    {activeRole === 'student' ? (
                      <>
                        <th className="p-4">{t('userManagement.class')}</th>
                        <th className="p-4">{t('userManagement.rollNumber')}</th>
                        <th className="p-4">{t('userManagement.subjects')}</th>
                        <th className="p-4">{t('userManagement.addedBy')}</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4">{t('userManagement.department')}</th>
                        <th className="p-4">{t('userManagement.subjects')}</th>
                        <th className="p-4">{t('userManagement.assignedClasses')}</th>
                      </>
                    )}
                    <th className="p-4 text-center">{t('userManagement.actions')}</th>
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
                            <p className="text-[10px] text-outline font-medium mt-0.5">{t('userManagement.uid', { id: item.user_id || item.id })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p>{item.email}</p>
                          <p className="text-outline text-[10px] mt-0.5">{item.phone || t('userManagement.noPhone')}</p>
                        </div>
                      </td>
                      {activeRole === 'student' ? (
                        <>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                              {t('userManagement.classLabel', { grade: item.grade, section: item.section })}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-outline">{item.roll_number || t('userManagement.notAvailable')}</td>
                          <td className="p-4">
                            <p className="truncate max-w-[200px] text-outline text-[10px]">
                              {item.subjects?.join(', ') || t('userManagement.noSubjectsEnrolled')}
                            </p>
                          </td>
                          <td className="p-4 text-outline text-[10px]">{item.added_by || t('userManagement.notAvailable')}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary text-[10px] font-bold">
                              {item.department || t('userManagement.general')}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="truncate max-w-[200px] text-outline text-[10px]">
                              {item.subjects?.join(', ') || t('userManagement.none')}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {item.assigned_classes?.map(cls => (
                                <span key={cls} className="text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded text-outline font-bold">{cls}</span>
                              )) || t('userManagement.none')}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="p-4 text-center">
                        <div className="relative flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            className="p-2 hover:bg-surface-container-high text-on-surface rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title={t('userManagement.viewProfile')}
                          >
                            <Icon name="visibility" className="text-base" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 hover:bg-primary/10 text-primary rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title={t('userManagement.editDetails')}
                          >
                            <Icon name="edit" className="text-base" />
                          </button>
                          <button
                            onClick={() => handleOpenCredsModal(item)}
                            className="p-2 hover:bg-tertiary/10 text-tertiary rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title={t('userManagement.updatePassword')}
                          >
                            <Icon name="vpn_key" className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item)}
                            className="p-2 hover:bg-error/10 text-error rounded-xl border-none bg-transparent cursor-pointer transition-colors flex items-center justify-center"
                            title={t('userManagement.deleteUser')}
                          >
                            <Icon name="delete" className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Modal: Bulk Import Excel/CSV */}
        {bulkImportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant shadow-2xl max-w-md w-full animate-slideUp text-left space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <Icon name="publish" className="text-primary" />
                  {t('userManagement.bulkSpreadsheetImport')}
                </h3>
                <button
                  onClick={() => setBulkImportModalOpen(false)}
                  className="hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.importTargetRole')}</label>
                  <select
                    value={importRole}
                    onChange={(e) => setImportRole(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
                  >
                    <option value="student">{t('userManagement.studentsListOption')}</option>
                    <option value="teacher">{t('userManagement.teachersListOption')}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.selectSpreadsheetFile')} <span className="text-error">*</span></label>
                  <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="px-3.5 py-3 border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    required
                  />
                  <p className="text-[9px] text-outline mt-1 font-semibold">
                    {t('userManagement.headersAutoMapped')}
                  </p>
                </div>

                {importResult && (
                  <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-bold text-center">
                    {t('userManagement.importedCount', { detail: importResult.detail, count: importResult.imported_count })}
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
                    {t('userManagement.close')}
                  </button>
                  <button
                    type="submit"
                    disabled={importing}
                    className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                  >
                    {importing ? (
                      <>
                        <Icon name="sync" className="animate-spin text-sm" />
                        <span>{t('userManagement.uploading')}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="upload_file" className="text-sm" />
                        <span>{t('userManagement.importRecords')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add New Class */}
        {classModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 rounded-[28px] border border-outline-variant shadow-2xl max-w-sm w-full animate-slideUp text-left space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <Icon name="school" className="text-primary" />
                  {t('userManagement.addNewClass')}
                </h3>
                <button
                  onClick={() => setClassModalOpen(false)}
                  className="hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.grade')} <span className="text-error">*</span></label>
                  <input
                    type="text"
                    placeholder={t('userManagement.gradePlaceholder')}
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.section')} <span className="text-error">*</span></label>
                  <input
                    type="text"
                    placeholder={t('userManagement.sectionPlaceholder')}
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value.toUpperCase())}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    required
                  />
                </div>

                {classFormError && (
                  <div className="p-3 bg-error-container/20 border border-error/25 text-error rounded-xl text-[10px] font-bold text-center">
                    {classFormError}
                  </div>
                )}

                <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-3">
                  <button
                    type="button"
                    onClick={() => setClassModalOpen(false)}
                    className="px-4 py-2.5 border border-outline hover:bg-surface-container text-xs font-bold rounded-xl cursor-pointer bg-transparent"
                  >
                    {t('userManagement.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={classSubmitting}
                    className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm"
                  >
                    {classSubmitting ? t('userManagement.adding') : t('userManagement.addClass')}
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
                  <Icon name="vpn_key" className="text-tertiary" />
                  {t('userManagement.editAccessAccess')}
                </h3>
                <button
                  onClick={() => setCredsModalOpen(false)}
                  className="hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  <Icon name="close" />
                </button>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant font-bold">{t('userManagement.targetUser')} <span className="text-primary font-black">{credsTargetUser?.name}</span></p>
                <p className="text-[10px] text-outline mt-0.5">{t('userManagement.roleType', { role: credsTargetUser?.role.toUpperCase() })}</p>
              </div>

              <form onSubmit={handleCredsSubmit} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.systemLoginEmail')} <span className="text-error">*</span></label>
                  <input
                    type="email"
                    value={credsFormData.email}
                    onChange={(e) => setCredsFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.contactPhone')}</label>
                  <input
                    type="text"
                    value={credsFormData.phone}
                    onChange={(e) => setCredsFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.newSecurePassword')}</label>
                  <input
                    type="password"
                    placeholder={t('userManagement.passwordPlaceholder')}
                    value={credsFormData.password}
                    onChange={(e) => setCredsFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                  />
                </div>

                {credsMessage && (
                  <div className={`p-3 rounded-xl text-center text-[10px] font-bold ${
                    credsMessage === t('userManagement.credentialsUpdatedSuccess') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-error-container/20 text-error border border-error/25'
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
                    {t('userManagement.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={credsSubmitting}
                    className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm flex items-center justify-center gap-1"
                  >
                    {credsSubmitting ? t('userManagement.updating') : t('userManagement.saveSettings')}
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
                  {(() => {
                    const roleLabel = activeRole === 'student' ? t('userManagement.student') : t('userManagement.teacher')
                    return modalMode === 'create' ? t('userManagement.registerNew', { role: roleLabel }) : modalMode === 'edit' ? t('userManagement.editProfile', { role: roleLabel }) : t('userManagement.details', { role: roleLabel })
                  })()}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="hover:bg-surface-container-high p-1 rounded-full cursor-pointer text-outline border-none bg-transparent"
                >
                  <Icon name="close" />
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
                    <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.firstName')} <span className="text-error">*</span></label>
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
                    <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.lastName')} <span className="text-error">*</span></label>
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
                      <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.email')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.phoneNumber')} <span className="text-error">*</span></label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-bold uppercase">
                        {t('userManagement.securePassword')} {activeRole === 'teacher' && <span className="text-error">*</span>}
                        {activeRole === 'student' && <span className="text-outline normal-case font-medium"> {t('userManagement.passwordOptionalHint')}</span>}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        required={activeRole === 'teacher'}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Student specific inputs */}
                {activeRole === 'student' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.grade')} <span className="text-error">*</span></label>
                        <select
                          disabled={modalMode === 'view' || gradeOptions.length === 0}
                          value={formData.grade}
                          onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
                        >
                          {gradeOptions.length === 0
                            ? <option value="">{t('userManagement.noClassesYet')}</option>
                            : gradeOptions.map(g => <option key={g} value={g}>{t('userManagement.gradeLabel', { grade: g })}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.section')} <span className="text-error">*</span></label>
                        <select
                          disabled={modalMode === 'view' || sectionOptions.length === 0}
                          value={formData.section}
                          onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-bold outline-none focus:border-primary"
                        >
                          {sectionOptions.length === 0
                            ? <option value="">{t('userManagement.noClassesYet')}</option>
                            : sectionOptions.map(s => <option key={s} value={s}>{t('userManagement.sectionLabel', { section: s })}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.rollNumber')} <span className="text-error">*</span></label>
                        <input
                          type="text"
                          disabled={modalMode === 'view'}
                          value={formData.roll_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.fathersName')}</label>
                        <input
                          type="text"
                          disabled={modalMode === 'view'}
                          value={formData.father_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.mothersName')}</label>
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
                      <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.enrolledSubjectsMentors')}</label>
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
                                <>
                                  <select
                                    disabled={modalMode === 'view'}
                                    value={formData.subject_teachers[sub] || ''}
                                    onChange={(e) => handleSubjectTeacherChange(sub, e.target.value)}
                                    className="mt-1 px-2 py-1 rounded bg-surface-container-low text-[10px] font-semibold outline-none border border-outline-variant/40"
                                  >
                                    <option value="">{t('userManagement.assignTeacher')}</option>
                                    {eligibleMentorsForSubject(sub)
                                      .map(t => (
                                        <option key={t.user_id} value={t.user_id}>{t.full_name}</option>
                                      ))}
                                  </select>
                                  {eligibleMentorsForSubject(sub).length === 0 && (
                                    <span className="text-[9px] text-outline-variant italic px-0.5">
                                      {t('userManagement.noTeacherAssignedToSubject', { subject: sub })}
                                    </span>
                                  )}
                                </>
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
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.facultyDepartment')}</label>
                        <input
                          type="text"
                          placeholder={t('userManagement.departmentPlaceholder')}
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
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.departmentSubjects')}</label>
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

                      <div className="flex flex-col gap-1.5 text-left relative self-start" ref={classDropdownRef}>
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.lecturingClasses')} <span className="text-error">*</span></label>

                        <button
                          type="button"
                          disabled={modalMode === 'view' || classKeys.length === 0}
                          onClick={() => setClassDropdownOpen(prev => !prev)}
                          className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold outline-none focus:border-primary text-on-surface disabled:opacity-60"
                        >
                          <span className="truncate text-left">
                            {classKeys.length === 0
                              ? t('userManagement.noClassesCreatedYet')
                              : formData.assigned_classes.length === 0
                                ? t('userManagement.selectClassesEllipsis')
                                : formData.assigned_classes.length === 1
                                  ? t('userManagement.classLabelSingle', { cls: formData.assigned_classes[0] })
                                  : t('userManagement.nClassesSelected', { count: formData.assigned_classes.length })}
                          </span>
                          <Icon name={classDropdownOpen ? 'expand_less' : 'expand_more'} className="text-base text-outline shrink-0" />
                        </button>

                        {classDropdownOpen && classKeys.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-lg p-2 max-h-[200px] overflow-y-auto animate-scaleIn">
                            {classKeys.map((cls) => {
                              const isAssigned = formData.assigned_classes.includes(cls)
                              return (
                                <label
                                  key={cls}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-low cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => handleToggleClass(cls)}
                                    className="w-3.5 h-3.5 accent-tertiary shrink-0"
                                  />
                                  <span>{t('userManagement.classLabelSingle', { cls })}</span>
                                </label>
                              )
                            })}
                          </div>
                        )}

                        {classKeys.length === 0 && (
                          <p className="text-[10px] text-outline-variant italic px-1">
                            {t('userManagement.noClassesCreatedFirst')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subjects taught per class — pins each Department
                        Subject to specific Lecturing Classes, instead of
                        assuming a teacher teaches every subject in every
                        assigned class. */}
                    {formData.assigned_classes.length > 0 && (
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.subjectsTaughtPerClass')}</label>
                        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-container-low/30 border border-outline-variant/20">
                          {formData.assigned_classes.map((cls) => (
                            <div key={cls} className="flex flex-col gap-1.5 p-2 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
                              <span className="text-[10px] font-bold text-on-surface">{t('userManagement.classLabelSingle', { cls })}</span>
                              {formData.subjects.length === 0 ? (
                                <span className="text-[9px] text-outline-variant italic">{t('userManagement.pickDepartmentSubjectsFirst')}</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {formData.subjects.map((sub) => {
                                    const isTaughtHere = (formData.classSubjects[cls] || []).includes(sub)
                                    return (
                                      <button
                                        key={sub}
                                        type="button"
                                        disabled={modalMode === 'view'}
                                        onClick={() => handleToggleClassSubject(cls, sub)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                          isTaughtHere
                                            ? 'bg-tertiary text-on-tertiary border-tertiary'
                                            : 'bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container'
                                        }`}
                                      >
                                        {sub}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Qualifications section */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] text-outline font-bold uppercase">{t('userManagement.qualificationsAndDegrees')}</label>
                      {modalMode !== 'view' && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={t('userManagement.qualificationPlaceholder')}
                            value={qualificationInput}
                            onChange={(e) => setQualificationInput(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                          />
                          <button
                            type="button"
                            onClick={handleAddQualification}
                            className="px-4 bg-secondary-container text-on-secondary-container hover:bg-opacity-95 rounded-xl font-bold cursor-pointer border-none"
                          >
                            {t('userManagement.add')}
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
                                className="text-xs text-error hover:bg-error-container p-0.5 rounded-full cursor-pointer border-none bg-transparent"
                              >
                                <Icon name="close" />
                              </button>
                            )}
                          </div>
                        ))}
                        {formData.qualifications?.length === 0 && (
                          <p className="text-[10px] text-outline italic">{t('userManagement.noQualificationsAdded')}</p>
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
                    {modalMode === 'view' ? t('userManagement.close') : t('userManagement.cancel')}
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-95 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm flex items-center gap-1"
                    >
                      {isSubmitting ? t('userManagement.saving') : t('userManagement.saveProfile')}
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
