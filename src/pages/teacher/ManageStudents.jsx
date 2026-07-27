import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
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

  // Import tab: existing students
  const [importable, setImportable] = useState([])
  const [loadingImportable, setLoadingImportable] = useState(false)
  const [importSelectedIds, setImportSelectedIds] = useState([])

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
      setMessage('Failed to load your students.')
    } finally {
      setLoadingRoster(false)
    }
  }

  const loadImportable = async () => {
    setLoadingImportable(true)
    try {
      const res = await api.get('/students/importable')
      setImportable(res.data || [])
    } catch (err) {
      console.error('Failed to load importable students:', err)
    } finally {
      setLoadingImportable(false)
    }
  }

  useEffect(() => {
    loadRoster()
    loadImportable()
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
    if (!window.confirm(`Delete ${selectedIds.length} selected student(s)? This cannot be undone.`)) return
    setMessage('')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/students/${id}`)))
      setMessage(`Deleted ${selectedIds.length} student(s).`)
      setSelectedIds([])
      loadRoster()
    } catch (err) {
      console.error('Bulk delete failed:', err)
      setMessage('Some students could not be deleted.')
    }
  }

  const handleDeleteOne = async (id) => {
    if (!window.confirm('Delete this student? This cannot be undone.')) return
    setMessage('')
    try {
      await api.delete(`/students/${id}`)
      setMessage('Student deleted.')
      setSelectedIds(prev => prev.filter(x => x !== id))
      loadRoster()
    } catch (err) {
      console.error('Delete failed:', err)
      setMessage('Failed to delete student.')
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
        setMessage('Student updated.')
      } else {
        const res = await api.post('/students/bulk', { students: formRows })
        const failed = res.data.results.filter(r => !r.success)
        const okCount = res.data.results.length - failed.length
        setMessage(
          failed.length > 0
            ? `Added ${okCount} student(s); ${failed.length} failed: ${failed.map(f => f.error).join('; ')}`
            : `Added ${okCount} student(s).`
        )
      }
      setModalOpen(false)
      loadRoster()
    } catch (err) {
      console.error('Failed to save student(s):', err)
      setMessage(err.response?.data?.detail || 'Failed to save student(s).')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------
  // Import tab: existing students
  // ---------------------------------------------------------------------
  const toggleImportSelectAll = () => {
    setImportSelectedIds(importSelectedIds.length === importable.length ? [] : importable.map(s => s.id))
  }
  const toggleImportSelect = (id) => {
    setImportSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const handleImportSelected = async () => {
    if (importSelectedIds.length === 0) return
    setMessage('')
    try {
      await Promise.all(importSelectedIds.map(id => api.post(`/students/${id}/import-subjects`, {})))
      setMessage(`Added ${importSelectedIds.length} student(s) to your roster.`)
      setImportSelectedIds([])
      loadImportable()
      loadRoster()
    } catch (err) {
      console.error('Import failed:', err)
      setMessage('Some students could not be imported.')
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

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map(r => {
          const row = {}
          CSV_FIELDS.forEach(f => { row[f] = (r[f] || '').toString().trim() })
          return row
        }).filter(r => r.first_name || r.last_name || r.roll_number)
        setCsvRows(rows)
        setCsvSelectedRows(rows.map((_, i) => i))
        setCsvResults(null)
        setMessage('')
      },
      error: (err) => {
        console.error('CSV parse error:', err)
        setMessage('Failed to parse CSV file.')
      }
    })
    e.target.value = ''
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
      setMessage(`Imported ${successCount} of ${rows.length} student(s).`)
      loadRoster()
    } catch (err) {
      console.error('Bulk CSV import failed:', err)
      setMessage('Bulk import failed.')
    } finally {
      setImportingCsv(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24 text-left">

        {/* Header */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
          <button
            onClick={() => navigate('/teacher/settings')}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Icon name="arrow_back" />
          </button>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
            Manage Students
          </h2>
        </section>

        {message && (
          <div className="p-3 rounded-xl text-center text-xs font-bold bg-primary-container/20 text-primary border border-primary/20">
            {message}
          </div>
        )}

        {/* Tab pill */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-full p-1 flex gap-1 max-w-md shadow-xs">
          <div onClick={() => setActiveTab('manage')} className={pillClass(activeTab === 'manage')}>Manage</div>
          <div onClick={() => setActiveTab('import')} className={pillClass(activeTab === 'import')}>Import Students</div>
        </div>

        {/* ============================= MANAGE TAB ============================= */}
        {activeTab === 'manage' && (
          <section className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold text-on-surface-variant">
                Students in your assigned classes: {assignedClasses.join(', ') || 'none assigned'}
              </p>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-2 bg-error-container/30 text-error rounded-xl font-bold text-xs hover:bg-error-container/50 transition-colors border-none cursor-pointer"
                  >
                    <Icon name="delete" className="text-sm" />
                    <span>Delete Selected ({selectedIds.length})</span>
                  </button>
                )}
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 transition-colors border-none cursor-pointer"
                >
                  <Icon name="add" className="text-sm" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            {loadingRoster ? (
              <div className="flex justify-center items-center py-12">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
              </div>
            ) : roster.length === 0 ? (
              <div className="text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-dashed border-outline-variant">
                No students in your assigned classes yet. Use "Add Student" to create one.
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase text-[10px] font-bold">
                      <th className="p-3 text-left w-8">
                        <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={selectedIds.length === roster.length} onChange={toggleSelectAll} />
                      </th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Roll No.</th>
                      <th className="p-3 text-left">Class</th>
                      <th className="p-3 text-left">Subjects</th>
                      <th className="p-3 text-left">Contact</th>
                      <th className="p-3 text-right">Actions</th>
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

            {/* Existing students created by other teachers */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-title-lg text-sm text-on-surface font-bold">Add Existing Students</h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Students in your classes not yet on your subject roster</p>
                </div>
                {importSelectedIds.length > 0 && (
                  <button
                    onClick={handleImportSelected}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 border-none cursor-pointer"
                  >
                    <Icon name="download" className="text-sm" />
                    <span>Import Selected ({importSelectedIds.length})</span>
                  </button>
                )}
              </div>

              {loadingImportable ? (
                <div className="flex justify-center items-center py-8">
                  <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></span>
                </div>
              ) : importable.length === 0 ? (
                <div className="text-center py-8 text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant">
                  Nothing to import — every student in your classes is already on your roster.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase px-1">
                    <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={importSelectedIds.length === importable.length} onChange={toggleImportSelectAll} />
                    Select all
                  </label>
                  {importable.map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={importSelectedIds.includes(s.id)} onChange={() => toggleImportSelect(s.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface">{s.full_name}</p>
                        <p className="text-[10px] text-on-surface-variant">Roll #{s.roll_number} • Class {s.grade}-{s.section} • Currently: {(s.subjects || []).join(', ') || 'no subjects'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* CSV bulk upload */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-title-lg text-sm text-on-surface font-bold">Bulk Upload via CSV</h3>
                  <p className="text-[10px] text-on-surface-variant font-semibold">Create many new students at once (export Excel sheets as CSV first)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    <Icon name="download" className="text-xs" />
                    <span>Download Template</span>
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs cursor-pointer hover:opacity-90 transition-colors">
                    <Icon name="upload_file" className="text-xs" />
                    <span>Choose CSV File</span>
                    <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="hidden" />
                  </label>
                </div>
              </div>

              {csvRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase px-1">
                      <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer" checked={csvSelectedRows.length === csvRows.length} onChange={toggleCsvSelectAll} />
                      Select all ({csvRows.length} rows parsed)
                    </label>
                    <button
                      onClick={handleImportCsv}
                      disabled={importingCsv || csvSelectedRows.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-50 border-none cursor-pointer"
                    >
                      {importingCsv ? 'Importing...' : `Import Selected (${csvSelectedRows.length})`}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto border border-outline-variant/20 rounded-xl">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase text-[9px] font-bold bg-surface-container-low sticky top-0">
                          <th className="p-2 text-left w-6"></th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Roll No.</th>
                          <th className="p-2 text-left">Class</th>
                          <th className="p-2 text-left">Status</th>
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
                                    {result.success ? 'Added' : result.error}
                                  </span>
                                ) : (
                                  <span className="text-on-surface-variant/60">Pending</span>
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

        {/* Add/Edit modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setModalOpen(false)}>
            <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-xl max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-on-surface">{modalMode === 'edit' ? 'Edit Student' : 'Add Student(s)'}</h3>
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
                      <input placeholder="First name" value={row.first_name} onChange={e => updateFormRow(idx, 'first_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder="Last name" value={row.last_name} onChange={e => updateFormRow(idx, 'last_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder="Email (optional)" value={row.email} onChange={e => updateFormRow(idx, 'email', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder="Phone (optional)" value={row.phone} onChange={e => updateFormRow(idx, 'phone', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      {modalMode === 'add' && (
                        <input placeholder="Password (defaults to roll no.)" value={row.password} onChange={e => updateFormRow(idx, 'password', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      )}
                      <select value={`${row.grade}-${row.section}`} onChange={e => { const [g, s] = e.target.value.split('-'); updateFormRow(idx, 'grade', g); updateFormRow(idx, 'section', s) }} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none">
                        {assignedClasses.length === 0 && <option value="-">No assigned classes</option>}
                        {assignedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input placeholder="Roll number" value={row.roll_number} onChange={e => updateFormRow(idx, 'roll_number', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder="Father's name (optional)" value={row.father_name} onChange={e => updateFormRow(idx, 'father_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                      <input placeholder="Mother's name (optional)" value={row.mother_name} onChange={e => updateFormRow(idx, 'mother_name', e.target.value)} className="bg-white border border-outline-variant rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>

              {modalMode === 'add' && (
                <button onClick={addFormRow} className="flex items-center gap-1.5 text-primary font-bold text-xs hover:underline border-none bg-transparent cursor-pointer">
                  <Icon name="add" className="text-sm" />
                  <span>Add another</span>
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-full border border-outline-variant text-on-surface font-bold text-xs hover:bg-surface-container-low bg-transparent cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-full bg-primary text-on-primary font-bold text-xs hover:opacity-95 shadow-md disabled:opacity-50 border-none cursor-pointer"
                >
                  {submitting ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : `Add ${formRows.length} Student${formRows.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
