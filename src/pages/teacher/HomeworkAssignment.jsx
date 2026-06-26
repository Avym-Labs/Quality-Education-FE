import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function HomeworkAssignment() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form states
  const subjects = user?.subjects || ['Mathematics', 'Science']
  const assignedClasses = user?.assigned_classes || ['10-A', '11-B']

  const [subject, setSubject] = useState(subjects[0] || 'Mathematics')
  const [selectedClass, setSelectedClass] = useState(assignedClasses[0] || '10-A')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [homeworkLink, setHomeworkLink] = useState('')
  
  const [homeworkList, setHomeworkList] = useState([])
  const [activeTab, setActiveTab] = useState('active') // active | past
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
      setMessage('Error loading homework assignments.')
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
      setMessage('Please enter a title and select a due date.')
      return
    }

    try {
      const [grade, section] = selectedClass.split('-')
      await api.post('/homework', {
        title,
        description,
        subject,
        grade,
        section: section || '',
        due_date: dueDate,
        attachments: [],
        homework_link: homeworkLink
      })

      setMessage('Homework assigned successfully!')
      // Clear form
      setTitle('')
      setDescription('')
      setDueDate('')
      setHomeworkLink('')

      // Reload list
      loadHomework()
      
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error('Failed to assign homework:', err)
      setMessage('Failed to assign homework.')
    }
  }

  // Delete Homework handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this homework assignment?')) return
    setMessage('')
    try {
      await api.delete(`/homework/${id}`)
      setMessage('Assignment deleted.')
      loadHomework()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Failed to delete homework:', err)
      setMessage('Failed to delete assignment.')
    }
  }

  // Duplicate/Reuse homework
  const handleDuplicate = (hw) => {
    setTitle(hw.title)
    setDescription(hw.description)
    setSubject(hw.subject)
    setSelectedClass(`${hw.grade}-${hw.section}`)
    setHomeworkLink(hw.homework_link || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage('Loaded assignment parameters to form.')
    setTimeout(() => setMessage(''), 3000)
  }

  // Filter homeworks into Active vs Past based on due date
  const todayStr = new Date().toISOString().split('T')[0]
  
  const activeHomeworks = homeworkList.filter(hw => hw.due_date >= todayStr)
  const pastHomeworks = homeworkList.filter(hw => hw.due_date < todayStr)

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-sm pb-24">
        
        {/* Header */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            arrow_back
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              Homework assignments
            </h2>
            <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
              Assign tasks & manage due schedules
            </p>
          </div>
        </section>

        {/* Message Banner */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-xs font-bold ${
            message.includes('successfully') || message.includes('deleted') || message.includes('Loaded')
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
                <h3 className="font-title-lg text-sm text-on-surface font-bold">Assign Homework</h3>
                <span className="material-symbols-outlined text-primary">edit_note</span>
              </div>

              <form onSubmit={handleAssign} className="space-y-4">
                {/* Subject Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Subject</label>
                  <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                {/* Class Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Assigned Class</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    {assignedClasses.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Homework Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Calculus Practice Set 4"
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide description of questions or materials to refer..."
                    rows="3"
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                 {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant">Due Date</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Homework Link */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">link</span>
                    <span>Homework Link / Reference URL</span>
                  </label>
                  <input 
                    type="url"
                    value={homeworkLink}
                    onChange={(e) => setHomeworkLink(e.target.value)}
                    placeholder="e.g. https://docs.google.com/document/d/..."
                    className="w-full bg-surface-container-low border-outline-variant/60 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Assign Homework</span>
                </button>
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
                Active Homework ({activeHomeworks.length})
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                  activeTab === 'past' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Past Homework ({pastHomeworks.length})
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
                      No active homework assigned.
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
                              Grade {hw.grade} • Sec {hw.section}
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
                                  <span className="material-symbols-outlined text-xs">link</span>
                                  <span>Reference Link</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3 gap-4 pt-1">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">event</span>
                            <span>Due: {hw.due_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">book</span>
                            <span>{hw.subject}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-outline-variant/15 pt-2.5">
                          <button 
                            onClick={() => handleDuplicate(hw)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold"
                          >
                            <span className="material-symbols-outlined text-xs">content_copy</span>
                            <span>Reuse</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(hw.id)}
                            className="p-1.5 rounded-xl bg-error-container/20 text-error hover:bg-error-container/40 transition-colors active:scale-95 flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  pastHomeworks.length === 0 ? (
                    <div className="text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
                      No expired assignments found.
                    </div>
                  ) : (
                    pastHomeworks.map(hw => (
                      <div 
                        key={hw.id}
                        className="bg-surface-container-lowest/80 p-stack-md rounded-[24px] border border-outline-variant/25 shadow-sm opacity-80"
                      >
                        <div className="mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-outline-variant/40 text-on-surface-variant text-[10px] font-bold">
                            Grade {hw.grade} • Sec {hw.section}
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
                                <span className="material-symbols-outlined text-xs">link</span>
                                <span>Reference Link</span>
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3 gap-4">
                          <div className="flex items-center gap-1 text-error">
                            <span className="material-symbols-outlined text-xs">event_busy</span>
                            <span>Expired: {hw.due_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">book</span>
                            <span>{hw.subject}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-outline-variant/15 pt-2.5">
                          <button 
                            onClick={() => handleDuplicate(hw)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold"
                          >
                            <span className="material-symbols-outlined text-xs">restore</span>
                            <span>Reuse Parameters</span>
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
    </DashboardLayout>
  )
}
