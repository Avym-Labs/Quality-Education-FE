import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Icon from '../../components/common/Icon'
import DateInput from '../../components/common/DateInput'

export default function HomeworkAssignment({ embed = false }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form states
  const subjects = user?.subjects || []
  const assignedClasses = user?.assigned_classes || []

  const [subject, setSubject] = useState(subjects[0] || '')
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [homeworkLink, setHomeworkLink] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploadingFile, setUploadingFile] = useState(false)
  
  const [homeworkList, setHomeworkList] = useState([])
  const [activeTab, setActiveTab] = useState('active') // active | past
  const [editingHomeworkId, setEditingHomeworkId] = useState(null)
  const [messageIsSuccess, setMessageIsSuccess] = useState(false)

  const handleCancelEdit = () => {
    setEditingHomeworkId(null)
    setTitle('')
    setDescription('')
    setDueDate('')
    setHomeworkLink('')
    setAttachments([])
    setMessage('')
  }
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAttachments(prev => [...prev, { name: file.name, url: data.url }])
      setMessage(t('homeworkAssignment.fileUploadedSuccess'))
      setMessageIsSuccess(true)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('File upload failed:', err)
      setMessage(err.response?.data?.detail || t('homeworkAssignment.fileUploadFailed'))
      setMessageIsSuccess(false)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index))
  }
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Load homeworks
  async function loadHomework() {
    setLoading(true)
    setMessage('')
    try {
      const res = await api.get('/homework')
      if (res.data) {
        setHomeworkList(res.data)
      }
    } catch (err) {
      console.error('Failed to load homework assignments:', err)
      setMessage(t('homeworkAssignment.errorLoadingHomework'))
      setMessageIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHomework()
  }, [])

  // Assign Homework handler
  const handleAssign = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!title || !dueDate) {
      setMessage(t('homeworkAssignment.enterTitleAndDueDate'))
      setMessageIsSuccess(false)
      return
    }

    try {
      const [grade, section] = selectedClass.split('-')
      const payload = {
        title,
        description,
        subject,
        grade,
        section: section || '',
        due_date: dueDate,
        attachments: attachments.map(a => `${a.name}|${a.url}`),
        homework_link: homeworkLink
      }

      if (editingHomeworkId) {
        await api.put(`/homework/${editingHomeworkId}`, payload)
        setMessage(t('homeworkAssignment.homeworkUpdatedSuccess'))
      } else {
        await api.post('/homework', payload)
        setMessage(t('homeworkAssignment.homeworkAssignedSuccess'))
      }
      setMessageIsSuccess(true)

      // Clear form
      setTitle('')
      setDescription('')
      setDueDate('')
      setHomeworkLink('')
      setAttachments([])
      setEditingHomeworkId(null)

      // Reload list
      loadHomework()
      
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to save homework:', err)
      setMessage(editingHomeworkId ? t('homeworkAssignment.failedToUpdate') : t('homeworkAssignment.failedToAssign'))
      setMessageIsSuccess(false)
    }
  }

  // Delete Homework handler
  const handleDelete = async (id) => {
    if (!window.confirm(t('homeworkAssignment.confirmDelete'))) return
    setMessage('')
    try {
      await api.delete(`/homework/${id}`)
      setMessage(t('homeworkAssignment.assignmentDeleted'))
      setMessageIsSuccess(true)
      loadHomework()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Failed to delete homework:', err)
      setMessage(t('homeworkAssignment.failedToDelete'))
      setMessageIsSuccess(false)
    }
  }

  // Duplicate/Reuse homework
  const handleDuplicate = (hw) => {
    setTitle(hw.title)
    setDescription(hw.description)
    setSubject(hw.subject)
    setSelectedClass(`${hw.grade}-${hw.section}`)
    setHomeworkLink(hw.homework_link || '')
    setAttachments(hw.attachments ? hw.attachments.map(attStr => {
      const [name, url] = attStr.includes('|') ? attStr.split('|') : ['Attachment', attStr]
      return { name, url }
    }) : [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage(t('homeworkAssignment.loadedAssignmentParams'))
    setMessageIsSuccess(true)
    setTimeout(() => setMessage(''), 3000)
  }

  // Filter homeworks into Active vs Past based on due date
  const todayStr = new Date().toISOString().split('T')[0]
  
  const activeHomeworks = homeworkList.filter(hw => hw.due_date >= todayStr)
  const pastHomeworks = homeworkList.filter(hw => hw.due_date < todayStr)

  const content = (
    <div className="space-y-stack-lg mt-stack-sm pb-24">

      {/* Header */}
      {!embed && (
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              {t('homeworkAssignment.title')}
            </h2>
          </div>
        </section>
      )}

        {/* Message Banner */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold ${
            messageIsSuccess
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-primary-container/20 text-primary border border-primary/20'
          }`}>
            {message}
          </div>
        )}

        {/* Form and List Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
          
          {/* Assignment form (Col Span 5) */}
          <div className="lg:col-span-5">
            <section className="bg-surface-container-lowest p-stack-md rounded-[28px] shadow-sm border border-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <h3 className="font-title-lg text-sm text-on-surface font-bold">
                  {editingHomeworkId ? t('homeworkAssignment.editHomework') : t('homeworkAssignment.assignHomework')}
                </h3>
                <Icon name={editingHomeworkId ? 'edit' : 'edit_note'} className="text-primary" />
              </div>

              <form onSubmit={handleAssign} className="space-y-4">
                {/* Subject Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('homeworkAssignment.subject')}</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {subjects.length === 0 && <option value="">{t('homeworkAssignment.noSubjectsAssigned')}</option>}
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                {/* Class Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('homeworkAssignment.assignedClass')}</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {assignedClasses.length === 0 && <option value="">{t('homeworkAssignment.noClassesAssigned')}</option>}
                    {assignedClasses.map(cls => (
                      <option key={cls} value={cls}>{t('homeworkAssignment.classLabel', { cls })}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('homeworkAssignment.homeworkTitle')} <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('homeworkAssignment.titlePlaceholder')}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('homeworkAssignment.description')}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('homeworkAssignment.descriptionPlaceholder')}
                    rows="3"
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                 {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">{t('homeworkAssignment.dueDate')} <span className="text-error">*</span></label>
                  <DateInput
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Homework Link */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                    <Icon name="link" className="text-xs" />
                    <span>{t('homeworkAssignment.homeworkLink')}</span>
                  </label>
                  <input
                    type="url"
                    value={homeworkLink}
                    onChange={(e) => setHomeworkLink(e.target.value)}
                    placeholder={t('homeworkAssignment.linkPlaceholder')}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* File Attachments */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                    <Icon name="upload_file" className="text-xs" />
                    <span>{t('homeworkAssignment.uploadDocuments')}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-colors">
                      <Icon name="cloud_upload" className="text-base text-primary" />
                      <span className="text-[11px] font-semibold text-on-surface-variant">
                        {uploadingFile ? t('homeworkAssignment.uploading') : t('homeworkAssignment.chooseFile')}
                      </span>
                      <input 
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low border border-outline-variant/35">
                          <span className="text-[11px] font-semibold truncate max-w-[180px] text-on-surface flex items-center gap-1">
                            <Icon name="description" className="text-[14px] text-primary" />
                            {file.name}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-xs text-error hover:bg-error-container p-1 rounded-full cursor-pointer"
                          >
                            <Icon name="close" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                 <div className="flex gap-2">
                   <button 
                     type="submit"
                     className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                   >
                     <Icon name={editingHomeworkId ? 'save' : 'send'} className="text-sm" />
                     <span>{editingHomeworkId ? t('homeworkAssignment.updateHomework') : t('homeworkAssignment.assignHomework')}</span>
                   </button>
                   {editingHomeworkId && (
                     <button
                       type="button"
                       onClick={handleCancelEdit}
                       className="px-4 py-3 border border-outline text-xs text-on-surface-variant font-bold rounded-2xl hover:bg-surface-container transition-all active:scale-95 cursor-pointer bg-transparent"
                     >
                       {t('homeworkAssignment.cancel')}
                     </button>
                   )}
                 </div>
              </form>
            </section>
          </div>

          {/* Tab lists (Col Span 7) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Tabs toggle */}
            <div className="flex border-b border-outline-variant/30">
              <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'active' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('homeworkAssignment.activeHomework', { count: activeHomeworks.length })}
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'past' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('homeworkAssignment.pastHomework', { count: pastHomeworks.length })}
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'active' ? (
                  activeHomeworks.length === 0 ? (
                    <div className="text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
                      {t('homeworkAssignment.noActiveHomework')}
                    </div>
                  ) : (
                    activeHomeworks.map(hw => (
                      <div 
                        key={hw.id}
                        className="bg-surface-container-lowest p-stack-md rounded-[24px] border border-outline-variant/25 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {t('homeworkAssignment.gradeSection', { grade: hw.grade, section: hw.section })}
                            </span>
                            <h4 className="font-title-lg text-sm text-on-surface font-bold mt-1.5">{hw.title}</h4>
                            <p className="text-xs text-on-surface-variant font-medium mt-1 pr-4">{hw.description}</p>
                            {hw.homework_link && (
                              <div className="mt-2.5">
                                <a 
                                  href={hw.homework_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/15 text-primary text-[11px] font-bold rounded-xl hover:bg-primary/25 transition-colors"
                                >
                                  <Icon name="link" className="text-xs" />
                                  <span>{t('homeworkAssignment.referenceLink')}</span>
                                </a>
                              </div>
                            )}
                            {hw.attachments && hw.attachments.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {hw.attachments.map((attStr, aIdx) => {
                                  const [name, url] = attStr.includes('|') ? attStr.split('|') : ['Attachment', attStr]
                                  const downloadUrl = url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${url}` : url
                                  return (
                                    <a 
                                      key={aIdx}
                                      href={downloadUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-xl hover:bg-opacity-90 transition-colors"
                                    >
                                      <Icon name="download" className="text-xs" />
                                      <span>{name}</span>
                                    </a>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3 gap-4 pt-1">
                          <div className="flex items-center gap-1">
                            <Icon name="event" className="text-xs" />
                            <span>{t('homeworkAssignment.due', { date: hw.due_date })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="book" className="text-xs" />
                            <span>{hw.subject}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-outline-variant/15 pt-2.5">
                          <button 
                            onClick={() => {
                              setEditingHomeworkId(hw.id)
                              setTitle(hw.title)
                              setDescription(hw.description)
                              setSubject(hw.subject)
                              setSelectedClass(`${hw.grade}-${hw.section}`)
                              setDueDate(hw.due_date)
                              setHomeworkLink(hw.homework_link || '')
                              setAttachments(hw.attachments ? hw.attachments.map(attStr => {
                                const [name, url] = attStr.includes('|') ? attStr.split('|') : ['Attachment', attStr]
                                return { name, url }
                              }) : [])
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold border-none cursor-pointer"
                          >
                            <Icon name="edit" className="text-xs" />
                            <span>{t('homeworkAssignment.edit')}</span>
                          </button>
                          <button 
                            onClick={() => handleDuplicate(hw)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold border-none cursor-pointer"
                          >
                            <Icon name="content_copy" className="text-xs" />
                            <span>{t('homeworkAssignment.reuse')}</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(hw.id)}
                            className="p-1.5 rounded-xl bg-error-container/20 text-error hover:bg-error-container/40 transition-colors active:scale-95 flex items-center justify-center border-none cursor-pointer"
                          >
                            <Icon name="delete" className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  pastHomeworks.length === 0 ? (
                    <div className="text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
                      {t('homeworkAssignment.noExpiredAssignments')}
                    </div>
                  ) : (
                    pastHomeworks.map(hw => (
                      <div 
                        key={hw.id}
                        className="bg-surface-container-lowest/80 p-stack-md rounded-[24px] border border-outline-variant/25 shadow-sm opacity-80"
                      >
                        <div className="mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-outline-variant/40 text-on-surface-variant text-[10px] font-bold">
                            {t('homeworkAssignment.gradeSection', { grade: hw.grade, section: hw.section })}
                          </span>
                          <h4 className="font-title-lg text-sm text-on-surface font-bold mt-1.5">{hw.title}</h4>
                          <p className="text-xs text-on-surface-variant font-medium mt-1 pr-4">{hw.description}</p>
                          {hw.homework_link && (
                            <div className="mt-2.5">
                              <a 
                                href={hw.homework_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-outline-variant text-on-surface-variant text-[11px] font-bold rounded-xl hover:bg-outline-variant/65 transition-colors"
                              >
                                <Icon name="link" className="text-xs" />
                                <span>{t('homeworkAssignment.referenceLink')}</span>
                              </a>
                            </div>
                          )}
                          {hw.attachments && hw.attachments.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {hw.attachments.map((attStr, aIdx) => {
                                const [name, url] = attStr.includes('|') ? attStr.split('|') : ['Attachment', attStr]
                                const downloadUrl = url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${url}` : url
                                return (
                                  <a 
                                    key={aIdx}
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-xl hover:bg-opacity-90 transition-colors"
                                  >
                                    <Icon name="download" className="text-xs" />
                                    <span>{name}</span>
                                  </a>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3 gap-4">
                          <div className="flex items-center gap-1 text-error">
                            <Icon name="event_busy" className="text-xs" />
                            <span>{t('homeworkAssignment.expired', { date: hw.due_date })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="book" className="text-xs" />
                            <span>{hw.subject}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-outline-variant/15 pt-2.5">
                          <button 
                            onClick={() => {
                              setEditingHomeworkId(hw.id)
                              setTitle(hw.title)
                              setDescription(hw.description)
                              setSubject(hw.subject)
                              setSelectedClass(`${hw.grade}-${hw.section}`)
                              setDueDate(hw.due_date)
                              setHomeworkLink(hw.homework_link || '')
                              setAttachments(hw.attachments ? hw.attachments.map(attStr => {
                                const [name, url] = attStr.includes('|') ? attStr.split('|') : ['Attachment', attStr]
                                return { name, url }
                              }) : [])
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold border-none cursor-pointer"
                          >
                            <Icon name="edit" className="text-xs" />
                            <span>{t('homeworkAssignment.edit')}</span>
                          </button>
                          <button 
                            onClick={() => handleDuplicate(hw)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold border-none cursor-pointer"
                          >
                            <Icon name="restore" className="text-xs" />
                            <span>{t('homeworkAssignment.reuse')}</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(hw.id)}
                            className="p-1.5 rounded-xl bg-error-container/20 text-error hover:bg-error-container/40 transition-colors active:scale-95 flex items-center justify-center border-none cursor-pointer"
                          >
                            <Icon name="delete" className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            )}

          </div>

        </div>

    </div>
  )

  if (embed) return content
  return <DashboardLayout>{content}</DashboardLayout>
}
