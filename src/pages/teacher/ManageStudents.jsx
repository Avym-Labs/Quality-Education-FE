import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'

const CSV_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'password', 'grade', 'section', 'roll_number', 'father_name', 'mother_name']

const emptyFormRow = (grade = '', section = '') => ({
  first_name: '', last_name: '', email: '', phone: '', password: '',
  grade, section, roll_number: '', father_name: '', mother_name: '',
})

function pillClass(active) {
  return `flex-1 text-center py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer select-none ${
    active
      ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm font-black'
      : 'text-on-surface-variant hover:bg-surface-container-low font-semibold'
  }`
}

export default function ManageStudents() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const assignedClasses = user?.assigned_classes || []

  const [activeTab, setActiveTab] = useState('manage') // manage | import
  const [message, setMessage] = useState('')

  // Manage tab
  const [roster, setRoster] = useState([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // add | edit
  const [editingId, setEditingId] = useState(null)
  const [formRows, setFormRows] = useState([emptyFormRow(assignedClasses[0]?.split('-')[0], assignedClasses[0]?.split('-')[1])])
  const [submitting, setSubmitting] = useState(false)

  // Import tab: add a single student manually
  const [singleForm, setSingleForm] = useState(emptyFormRow(assignedClasses[0]?.split('-')[0], assignedClasses[0]?.split('-')[1]))
  const [singleSubmitting, setSingleSubmitting] = useState(false)

  // Import tab: CSV upload
  const [csvRows, setCsvRows] = useState([])
  const [csvSelectedRows, setCsvSelectedRows] = useState([])
  const [csvResults, setCsvResults] = useState(null)
  const [importingCsv, setImportingCsv] = useState(false)

  const loadRoster = async () => {
    setLoadingRoster(true)
    try {
      const res = await api.get('/students/roster')
      setRoster(res.data || [])
    } catch (err) {
      console.error('Failed to load roster:', err)
      setMessage(t('manageStudents.failedToLoadRoster'))
    } finally {
      setLoadingRoster(false)
    }
  }

  useEffect(() => {
    loadRoster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------
  // Manage tab
  // ---------------------------------------------------------------------
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === roster.length ? [] : roster.map(s => s.id))
  }
  const toggleSelect = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(t('manageStudents.confirmBulkDelete', { count: selectedIds.length }))) return
    setMessage('')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/students/${id}`)))
      setMessage(t('manageStudents.deletedNStudents', { count: selectedIds.length }))
      setSelectedIds([])
      loadRoster()
    } catch (err) {
      console.error('Bulk delete failed:', err)
      setMessage(t('manageStudents.someCouldNotBeDeleted'))
    }
  }

  const handleDeleteOne = async (id) => {
    if (!window.confirm(t('manageStudents.confirmDeleteOne'))) return
    setMessage('')
    try {
      await api.delete(`/students/${id}`)
      setMessage(t('manageStudents.studentDeleted'))
      setSelectedIds(prev => prev.filter(x => x !== id))
      loadRoster()
    } catch (err) {
      console.error('Delete failed:', err)
      setMessage(t('manageStudents.failedToDelete'))
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setEditingId(null)
    setFormRows([emptyFormRow(assignedClasses[0]?.split('-')[0], assignedClasses[0]?.split('-')[1])])
    setModalOpen(true)
  }

  const openEditModal = (student) => {
    setModalMode('edit')
    setEditingId(student.id)
    setFormRows([{
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      grade: student.grade || '',
      section: student.section || '',
      roll_number: student.roll_number || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
    }])
    setModalOpen(true)
  }

  const updateFormRow = (idx, field, value) => {
    setFormRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  const addFormRow = () => setFormRows(prev => [...prev, emptyFormRow(assignedClasses[0]?.split('-')[0], assignedClasses[0]?.split('-')[1])])
  const removeFormRow = (idx) => setFormRows(prev => prev.filter((_, i) => i !== idx))

  const handleSubmitForm = async () => {
    setSubmitting(true)
    setMessage('')
    try {
      if (modalMode === 'edit') {
        const { password, ...rest } = formRows[0]
        await api.put(`/students/${editingId}`, rest)
        setMessage(t('manageStudents.studentUpdated'))
      } else {
        const res = await api.post('/students/bulk', { students: formRows })
        const failed = res.data.results.filter(r => !r.success)
        const okCount = res.data.results.length - failed.length
        setMessage(
          failed.length > 0
            ? t('manageStudents.addedNStudents', { count: okCount, failedCount: failed.length, errors: failed.map(f => f.error).join('; ') })
            : t('manageStudents.addedNStudentsOnly', { count: okCount })
        )
      }
      setModalOpen(false)
      loadRoster()
    } catch (err) {
      console.error('Failed to save student(s):', err)
      setMessage(err.response?.data?.detail || t('manageStudents.failedToSave'))
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Import tab: add a single student manually
  // ---------------------------------------------------------------------
  const updateSingleForm = (field, value) => {
    setSingleForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSingleAddSubmit = async (e) => {
    e.preventDefault()
    setSingleSubmitting(true)
    setMessage('')
    try {
      await api.post('/students', singleForm)
      setMessage(t('manageStudents.addedStudent', { name: `${singleForm.first_name} ${singleForm.last_name}` }))
      setSingleForm(emptyFormRow(assignedClasses[0]?.split('-')[0], assignedClasses[0]?.split('-')[1]))
      loadRoster()
    } catch (err) {
      console.error('Failed to add student:', err)
      setMessage(err.response?.data?.detail || t('manageStudents.failedToAdd'))
    } finally {
      setSingleSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Import tab: CSV bulk upload
  // ---------------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const csvContent = CSV_FIELDS.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'student_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Parsing (flexible header matching: either 'first_name'+'last_name' columns
  // or a single 'name'/'full_name' column) happens server-side via
  // /students/parse-csv, so the website and the app share identical logic.
  const handleCsvFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/students/parse-csv', formData)
      const rows = res.data.rows || []

      setCsvRows(rows)
      setCsvSelectedRows(rows.map((_, i) => i))
      setCsvResults(null)
      setMessage(
        rows.length === 0
          ? t('manageStudents.noValidRows')
          : ''
      )
    } catch (err) {
      console.error('CSV parse failed:', err)
      setMessage(err.response?.data?.detail || t('manageStudents.failedToParse'))
    }
  }

  const toggleCsvSelectAll = () => {
    setCsvSelectedRows(csvSelectedRows.length === csvRows.length ? [] : csvRows.map((_, i) => i))
  }
  const toggleCsvSelect = (idx) => {
    setCsvSelectedRows(prev => (prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]))
  }

  const handleImportCsv = async () => {
    if (csvSelectedRows.length === 0) return
    setImportingCsv(true)
    setMessage('')
    try {
      const rows = csvSelectedRows.map(i => csvRows[i])
      const res = await api.post('/students/bulk', { students: rows })
      setCsvResults(res.data.results)
      const successCount = res.data.results.filter(r => r.success).length
      setMessage(t('manageStudents.importedNOfM', { success: successCount, total: rows.length }))
      loadRoster()
    } catch (err) {
      console.error('Bulk CSV import failed:', err)
      setMessage(t('manageStudents.bulkImportFailed'))
    } finally {
      setImportingCsv(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mt-stack-sm pb-24 md:pb-10 text-left">

        {/* Mobile Header (stacked navigation with back button) */}
        <section className="md:hidden flex items-center gap-3 pb-2 border-b border-outline-variant/20 mb-4">
          <button
            onClick={() => navigate('/teacher/settings')}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Icon name="arrow_back" />
          </button>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
            {t('manageStudents.title')}
          </h2>
        </section>

        {/* Desktop Header */}
        <div className="hidden md:block mb-6">
          <h1 className="text-xl font-bold text-on-surface">{t('manageStudents.title')}</h1>
          <p className="text-on-surface-variant text-[10px] uppercase font-bold mt-1 tracking-wider">{t('manageStudents.departmentFacultyPortal')}</p>
        </div>

        <div className="space-y-stack-lg">

        {message && (
          <div className="p-3 rounded-xl text-center text-xs font-bold bg-primary-container/20 text-primary border border-primary/20">
            {message}
          </div>
        )}

        {/* Tab pill */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-full p-1 flex gap-1 max-w-md shadow-xs">
          <div onClick={() => setActiveTab('manage')} className={pillClass(activeTab === 'manage')}>{t('manageStudents.manageTab')}</div>
          <div onClick={() => setActiveTab('import')} className={pillClass(activeTab === 'import')}>{t('manageStudents.importTab')}</div>
        </div>

        {/* ============================= MANAGE TAB ============================= */}
        {activeTab === 'manage' && (
          <section className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold text-on-surface-variant">
                {t('manageStudents.studentsInClasses', { classes: assignedClasses.join(', ') || t('manageStudents.noneAssigned') })}
              </p>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-2 bg-error-container/30 text-error rounded-xl font-bold text-xs hover:bg-error-container/50 transition-colors border-none cursor-pointer"
                  >
                    <Icon name="delete" className="text-sm" />
                    <span>{t('manageStudents.deleteSelected', { count: selectedIds.length })}</span>
                  </button>
                )}
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 transition-colors border-none cursor-pointer"
                >
                  <Icon name="add" className="text-sm" />
                  <span>{t('manageStudents.addStudent')}</span>
                </button>
              </div>
            </div>

            {loadingRoster ? (
              <div className="flex justify-center items-center py-12">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
              </div>
            ) : roster.length === 0 ? (
              <div className="text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-dashed border-outline-variant">
                {t('manageStudents.noStudentsYet')}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase text-[10px] font-bold">
                      <th className="p-3 text-left w-8">
                        <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={selectedIds.length === roster.length} onChange={toggleSelectAll} />
                      </th>
                      <th className="p-3 text-left">{t('manageStudents.name')}</th>
                      <th className="p-3 text-left">{t('manageStudents.rollNo')}</th>
                      <th className="p-3 text-left">{t('manageStudents.class')}</th>
                      <th className="p-3 text-left">{t('manageStudents.subjects')}</th>
                      <th className="p-3 text-left">{t('manageStudents.contact')}</th>
                      <th className="p-3 text-right">{t('manageStudents.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(s => (
                      <tr key={s.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low">
                        <td className="p-3">
                          <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                        </td>
                        <td className="p-3 font-bold text-on-surface">{s.full_name}</td>
                        <td className="p-3 text-on-surface-variant">{s.roll_number}</td>
                        <td className="p-3 text-on-surface-variant">{s.grade}-{s.section}</td>
                        <td className="p-3 text-on-surface-variant">{(s.subjects || []).join(', ') || '—'}</td>
                        <td className="p-3 text-on-surface-variant">{s.email || s.phone || '—'}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEditModal(s)} className="p-1.5 rounded-lg bg-primary-container/20 text-primary hover:bg-primary-container/40 border-none cursor-pointer">
                              <Icon name="edit" className="text-xs" />
                            </button>
                            <button onClick={() => handleDeleteOne(s.id)} className="p-1.5 rounded-lg bg-error-container/20 text-error hover:bg-error-container/40 border-none cursor-pointer">
                              <Icon name="delete" className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============================= IMPORT TAB ============================= */}
        {activeTab === 'import' && (
          <section className="space-y-6 animate-fadeIn">

            {/* Add a single student manually */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-5 shadow-sm space-y-3">
              <div>
                <h3 className="font-title-lg text-sm text-on-surface font-bold">{t('manageStudents.addAStudent')}</h3>
                <p className="text-[10px] text-on-surface-variant font-semibold">{t('manageStudents.addAStudentDesc')}</p>
              </div>

              <form onSubmit={handleSingleAddSubmit} className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase px-1">{t('manageStudents.firstName')} <span className="text-error">*</span></label>
                  <input placeholder={t('manageStudents.firstName')} value={singleForm.first_name} onChange={e => updateSingleForm('first_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase px-1">{t('manageStudents.lastName')} <span className="text-error">*</span></label>
                  <input placeholder={t('manageStudents.lastName')} value={singleForm.last_name} onChange={e => updateSingleForm('last_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" required />
                </div>
                <input placeholder={t('manageStudents.emailOptional')} value={singleForm.email} onChange={e => updateSingleForm('email', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none self-end" />
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase px-1">{t('manageStudents.phone')} <span className="text-error">*</span></label>
                  <input placeholder={t('manageStudents.phone')} value={singleForm.phone} onChange={e => updateSingleForm('phone', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" required />
                </div>
                <input placeholder={t('manageStudents.passwordDefaultPhoneRoll')} value={singleForm.password} onChange={e => updateSingleForm('password', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none self-end" />
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase px-1">{t('manageStudents.class_')} <span className="text-error">*</span></label>
                  <select value={`${singleForm.grade}-${singleForm.section}`} onChange={e => { const [g, s] = e.target.value.split('-'); updateSingleForm('grade', g); updateSingleForm('section', s) }} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none" required>
                    {assignedClasses.length === 0 && <option value="-">{t('manageStudents.noAssignedClasses')}</option>}
                    {assignedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-outline uppercase px-1">{t('manageStudents.rollNumber')} <span className="text-error">*</span></label>
                  <input placeholder={t('manageStudents.rollNumber')} value={singleForm.roll_number} onChange={e => updateSingleForm('roll_number', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" required />
                </div>
                <input placeholder={t('manageStudents.fathersNameOptional')} value={singleForm.father_name} onChange={e => updateSingleForm('father_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none self-end" />
                <input placeholder={t('manageStudents.mothersNameOptional')} value={singleForm.mother_name} onChange={e => updateSingleForm('mother_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />

                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={singleSubmitting}
                    className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 border-none cursor-pointer"
                  >
                    {singleSubmitting ? t('manageStudents.adding') : t('manageStudents.addStudent')}
                  </button>
                </div>
              </form>
            </div>

            {/* CSV bulk upload */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-title-lg text-sm text-on-surface font-bold">{t('manageStudents.bulkUploadCsv')}</h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">{t('manageStudents.bulkUploadDesc')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    <Icon name="download" className="text-xs" />
                    <span>{t('manageStudents.downloadTemplate')}</span>
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs cursor-pointer hover:opacity-90 transition-colors">
                    <Icon name="upload_file" className="text-xs" />
                    <span>{t('manageStudents.chooseCsvFile')}</span>
                    <input type="file" accept=".csv,text/csv,.xlsx" onChange={handleCsvFile} className="hidden" />
                  </label>
                </div>
              </div>

              {csvRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase px-1">
                      <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={csvSelectedRows.length === csvRows.length} onChange={toggleCsvSelectAll} />
                      {t('manageStudents.selectAllRowsParsed', { count: csvRows.length })}
                    </label>
                    <button
                      onClick={handleImportCsv}
                      disabled={importingCsv || csvSelectedRows.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 border-none cursor-pointer"
                    >
                      {importingCsv ? t('manageStudents.importing') : t('manageStudents.importSelected', { count: csvSelectedRows.length })}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto border border-outline-variant/20 rounded-xl">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase text-[9px] font-bold bg-surface-container-low sticky top-0">
                          <th className="p-2 text-left w-6"></th>
                          <th className="p-2 text-left">{t('manageStudents.name')}</th>
                          <th className="p-2 text-left">{t('manageStudents.rollNo')}</th>
                          <th className="p-2 text-left">{t('manageStudents.class')}</th>
                          <th className="p-2 text-left">{t('manageStudents.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row, idx) => {
                          const result = csvResults?.find(r => r.index === idx)
                          return (
                            <tr key={idx} className="border-b border-outline-variant/10">
                              <td className="p-2">
                                <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={csvSelectedRows.includes(idx)} onChange={() => toggleCsvSelect(idx)} />
                              </td>
                              <td className="p-2 font-bold text-on-surface">{row.first_name} {row.last_name}</td>
                              <td className="p-2 text-on-surface-variant">{row.roll_number}</td>
                              <td className="p-2 text-on-surface-variant">{row.grade}-{row.section}</td>
                              <td className="p-2">
                                {result ? (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${result.success ? 'bg-emerald-100 text-emerald-800' : 'bg-error-container text-error'}`}>
                                    {result.success ? t('manageStudents.added') : result.error}
                                  </span>
                                ) : (
                                  <span className="text-on-surface-variant/60">{t('manageStudents.pending')}</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        </div>

        {/* Add/Edit modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setModalOpen(false)}>
            <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-xl max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-on-surface">{modalMode === 'edit' ? t('manageStudents.editStudent') : t('manageStudents.addStudents')}</h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border-none cursor-pointer">
                  <Icon name="close" className="text-sm" />
                </button>
              </div>

              <div className="space-y-4">
                {formRows.map((row, idx) => (
                  <div key={idx} className="bg-surface-container-low/50 rounded-2xl p-4 border border-outline-variant/20 space-y-3 relative">
                    {formRows.length > 1 && (
                      <button
                        onClick={() => removeFormRow(idx)}
                        className="absolute top-3 right-3 p-1 rounded-full bg-error-container/30 text-error hover:bg-error-container/50 border-none cursor-pointer"
                      >
                        <Icon name="close" className="text-xs" />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder={t('manageStudents.firstName')} value={row.first_name} onChange={e => updateFormRow(idx, 'first_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder={t('manageStudents.lastName')} value={row.last_name} onChange={e => updateFormRow(idx, 'last_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder={t('manageStudents.emailOptional')} value={row.email} onChange={e => updateFormRow(idx, 'email', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder={`${t('manageStudents.phone')} (optional)`} value={row.phone} onChange={e => updateFormRow(idx, 'phone', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      {modalMode === 'add' && (
                        <input placeholder={t('manageStudents.passwordDefaultPhoneRoll')} value={row.password} onChange={e => updateFormRow(idx, 'password', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      )}
                      <select value={`${row.grade}-${row.section}`} onChange={e => { const [g, s] = e.target.value.split('-'); updateFormRow(idx, 'grade', g); updateFormRow(idx, 'section', s) }} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none">
                        {assignedClasses.length === 0 && <option value="-">{t('manageStudents.noAssignedClasses')}</option>}
                        {assignedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input placeholder={t('manageStudents.rollNumber')} value={row.roll_number} onChange={e => updateFormRow(idx, 'roll_number', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder={t('manageStudents.fathersNameOptional')} value={row.father_name} onChange={e => updateFormRow(idx, 'father_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder={t('manageStudents.mothersNameOptional')} value={row.mother_name} onChange={e => updateFormRow(idx, 'mother_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              {modalMode === 'add' && (
                <button onClick={addFormRow} className="flex items-center gap-1.5 text-primary font-bold text-xs hover:underline border-none bg-transparent cursor-pointer">
                  <Icon name="add" className="text-sm" />
                  <span>{t('manageStudents.addAnother')}</span>
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-full border border-outline-variant text-on-surface font-bold text-xs hover:bg-surface-container-low bg-transparent cursor-pointer">
                  {t('manageStudents.cancel')}
                </button>
                <button
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-full bg-primary text-on-primary font-bold text-xs hover:opacity-95 shadow-md disabled:opacity-50 border-none cursor-pointer"
                >
                  {submitting ? t('manageStudents.saving') : modalMode === 'edit' ? t('manageStudents.saveChanges') : t('manageStudents.addNStudents', { count: formRows.length })}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
