import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function NewAnnouncement() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetRoles, setTargetRoles] = useState(['student']) // student, teacher
  const [targetGrades, setTargetGrades] = useState([]) // "9", "10", "11", "12"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleToggleRole = (role) => {
    setTargetRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleToggleGrade = (grade) => {
    setTargetGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    if (!title.trim() || !content.trim()) {
      setError('Please fill in both the title and the message content.')
      setLoading(false)
      return
    }

    if (targetRoles.length === 0) {
      setError('Please select at least one target audience (Students or Teachers).')
      setLoading(false)
      return
    }

    try {
      await api.post('/announcements', {
        title: title.trim(),
        content: content.trim(),
        target_roles: targetRoles,
        target_grades: targetGrades
      })
      setSuccess(true)
      setTitle('')
      setContent('')
      setTargetRoles(['student'])
      setTargetGrades([])
      setTimeout(() => {
        navigate('/admin/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Failed to publish announcement:', err)
      setError(err.response?.data?.detail || 'An error occurred while publishing the announcement.')
    } finally {
      setLoading(false)
    }
  }

  const hasContent = title.trim() !== '' || content.trim() !== ''

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
        {/* Header Title */}
        <section className="flex items-center gap-stack-sm pb-2 border-b border-outline-variant/20">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">New Announcement</h2>
            <p className="text-on-surface-variant text-xs">Publish system-wide notifications and broadcasts</p>
          </div>
        </section>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm animate-fadeIn">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded-xl text-sm font-semibold animate-fadeIn">
            Announcement published successfully! Redirecting to dashboard...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-lg">
          
          {/* Form Column (7 Cols) */}
          <form onSubmit={handleSubmit} className="md:col-span-7 flex flex-col gap-stack-lg">
            
            {/* Content Details Card */}
            <section className="bg-surface-container-lowest p-stack-lg rounded-[24px] border border-outline-variant/30 flex flex-col gap-stack-md shadow-sm">
              <div className="flex items-center gap-stack-sm border-b border-outline-variant/20 pb-stack-sm mb-stack-sm">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-title-lg text-sm text-on-surface font-bold">Content Details</h3>
              </div>
              
              <div className="flex flex-col gap-unit">
                <label className="font-semibold text-xs text-on-surface-variant" htmlFor="title">Announcement Title *</label>
                <input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-stack-md py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-sm" 
                  placeholder="e.g. Annual Sports Meet 2026" 
                  type="text"
                  required
                />
              </div>
              
              {/* Select Prebuilt Notice Template */}
              <div className="flex flex-col gap-unit mt-2">
                <label className="font-semibold text-xs text-on-surface-variant">Notice Template (Optional)</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value
                    if (val) {
                      const [tplTitle, tplContent] = val.split('|||')
                      setTitle(tplTitle)
                      setContent(tplContent)
                    }
                  }}
                  className="w-full px-stack-md py-2.5 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-xs font-semibold"
                >
                  <option value="">-- Select prebuilt designed layout --</option>
                  <option value="School Holiday Announcement|||Dear Students and Faculty,&#10;&#10;Please note that the school will remain closed on [Date] on account of [Occasion]. Normal classes will resume on [Resume Date].&#10;&#10;Regards,&#10;School Administration">🏫 Holiday Notice Layout</option>
                  <option value="Upcoming Examination Schedule|||Dear Students,&#10;&#10;The schedule for the upcoming term examinations has been published. Please check the academics portal for timetables, guidelines, and syllabus details. Prep well!&#10;&#10;Best wishes,&#10;Academic Coordinator">📅 Exam Schedule Notice Layout</option>
                  <option value="Scheduled Campus Maintenance|||Dear Students and Staff,&#10;&#10;Please be informed that campus [facilities/servers] will undergo maintenance on [Date] from [Start Time] to [End Time]. Some services may be temporarily unavailable. We apologize for any inconvenience.&#10;&#10;Sincerely,&#10;IT Support Services">🔧 Maintenance Alert Layout</option>
                </select>
              </div>

              <div className="flex flex-col gap-unit mt-2">
                <label className="font-semibold text-xs text-on-surface-variant" htmlFor="message">Message Body *</label>
                <textarea 
                  id="message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-stack-md py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-sm resize-none" 
                  placeholder="Provide detailed announcement details here..." 
                  rows="5"
                  required
                ></textarea>
              </div>
            </section>

            {/* Audience Selection Card */}
            <section className="bg-surface-container-lowest p-stack-lg rounded-[24px] border border-outline-variant/30 flex flex-col gap-stack-md shadow-sm">
              <div className="flex items-center gap-stack-sm border-b border-outline-variant/20 pb-stack-sm mb-stack-sm">
                <span className="material-symbols-outlined text-primary">group_add</span>
                <h3 className="font-title-lg text-sm text-on-surface font-bold">Audience Target</h3>
              </div>
              
              {/* Target Roles Checkbox Chips */}
              <div className="flex flex-col gap-unit">
                <label className="font-semibold text-xs text-on-surface-variant">Recipient Roles *</label>
                <div className="flex flex-wrap gap-stack-sm mt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleRole('student')}
                    className={`px-4 py-2 rounded-full border font-semibold text-xs transition-all active:scale-95 flex items-center gap-2 ${
                      targetRoles.includes('student')
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">groups</span>
                    All Students
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleRole('teacher')}
                    className={`px-4 py-2 rounded-full border font-semibold text-xs transition-all active:scale-95 flex items-center gap-2 ${
                      targetRoles.includes('teacher')
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">supervisor_account</span>
                    Teachers
                  </button>
                </div>
              </div>

              {/* Target Grades (For students specifically) */}
              <div className="flex flex-col gap-unit mt-4">
                <label className="font-semibold text-xs text-on-surface-variant">Limit to Specific Grades (Optional)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['9', '10', '11', '12'].map((grade) => {
                    const active = targetGrades.includes(grade)
                    return (
                      <button
                        type="button"
                        key={grade}
                        onClick={() => handleToggleGrade(grade)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                          active 
                            ? 'bg-secondary text-on-secondary border-secondary shadow-sm' 
                            : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        Grade {grade}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-on-surface-variant italic mt-1">If no grade is selected, the announcement will be visible to all grades.</p>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-3 border border-outline text-on-surface-variant rounded-2xl font-bold transition-colors hover:bg-surface-container"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-on-primary rounded-2xl font-bold shadow-lg hover:shadow-primary/20 hover:bg-opacity-95 transition-all active:scale-95 disabled:bg-opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">send</span>
                {loading ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>

          {/* Live Mobile Notification Preview (5 Cols) */}
          <div className="md:col-span-5 flex flex-col gap-stack-lg sticky top-24 h-fit">
            <section className="bg-surface-container-highest/20 p-stack-lg rounded-[24px] border border-outline-variant/30 flex flex-col gap-stack-md">
              <div className="flex items-center justify-between mb-unit border-b border-outline-variant/20 pb-2">
                <h3 className="font-title-lg text-xs font-bold text-on-surface-variant uppercase tracking-wider">Live Preview</h3>
                <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest animate-pulse">
                  LIVE
                </span>
              </div>
              
              {/* Phone Mockup Screen */}
              <div className="relative w-full max-w-[280px] mx-auto aspect-[9/18.5] bg-inverse-surface rounded-[40px] border-[5px] border-outline shadow-2xl p-3 overflow-hidden select-none">
                
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-inverse-surface rounded-b-2xl z-10"></div>
                
                {/* Screen Content Wrapper */}
                <div 
                  className="w-full h-full bg-cover bg-center rounded-[32px] p-3 flex flex-col gap-stack-sm pt-10" 
                  style={{ 
                    backgroundImage: `linear-gradient(to bottom, rgba(48, 47, 57, 0.7), rgba(48, 47, 57, 0.95)), url('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=250')` 
                  }}
                >
                  
                  {/* Push Notification Card */}
                  <div 
                    className={`bg-surface/95 backdrop-blur-md p-stack-md rounded-2xl shadow-xl transform transition-all duration-500 ${
                      hasContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-on-primary shrink-0">
                        <span className="material-symbols-outlined text-lg">campaign</span>
                      </div>
                      <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-semibold text-[10px] text-primary truncate">EduCore Broadcast</span>
                          <span className="text-[8px] text-on-surface-variant font-medium">Now</span>
                        </div>
                        <h4 className="font-bold text-xs text-on-surface line-clamp-1">
                          {title.trim() || 'Announcement Title'}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant line-clamp-2 leading-relaxed mt-0.5">
                          {content.trim() || 'Your message body will render here...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto mb-4 flex flex-col items-center gap-1.5 text-white/50">
                    <span className="material-symbols-outlined text-2xl">lock</span>
                    <p className="text-[9px] font-medium tracking-wider">Swipe up to unlock</p>
                  </div>
                </div>
              </div>

              <div className="mt-unit flex flex-col gap-2 text-xs">
                <p className="text-on-surface-variant flex items-center gap-1 text-[11px] font-medium">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Push preview updates in real-time as you write.
                </p>
                <div className="flex items-center gap-2 p-2 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-sm">smartphone</span>
                  <span className="font-semibold text-[10px] text-on-surface-variant">Push Notification Enabled</span>
                  <div className="ml-auto w-8 h-4 bg-primary rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

            </section>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
