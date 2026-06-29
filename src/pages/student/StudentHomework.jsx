import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function StudentHomework() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [homeworkList, setHomeworkList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('active') // active | past

  useEffect(() => {
    async function fetchHomework() {
      if (!user?.grade || !user?.section) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await api.get('/homework', {
          params: { grade: user.grade, section: user.section }
        })
        if (res.data) {
          setHomeworkList(res.data)
        }
      } catch (err) {
        console.error('Failed to load homework:', err)
        setError('Failed to load assigned homework assignments.')
      } finally {
        setLoading(false)
      }
    }
    fetchHomework()
  }, [user])

  const todayStr = new Date().toISOString().split('T')[0]
  const activeHomeworks = homeworkList.filter(hw => hw.due_date >= todayStr)
  const pastHomeworks = homeworkList.filter(hw => hw.due_date < todayStr)

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg mt-stack-md pb-24">
        
        {/* Header */}
        <section className="flex items-center gap-3 pb-2 border-b border-outline-variant/20">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
          >
            arrow_back
          </button>
          <div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
              Homework Hub
            </h2>
            <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
              View assignments, deadlines, and reference sheets.
            </p>
          </div>
        </section>

        {error && (
          <div className="p-3 bg-error-container rounded-xl text-error text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-xs">error</span>
            <span>{error}</span>
          </div>
        )}

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
            Assigned Tasks ({activeHomeworks.length})
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'past' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Past Deadlines ({pastHomeworks.length})
          </button>
        </div>

        {/* Homework List Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === 'active' ? (
              activeHomeworks.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
                  Yay! No active homework assignments assigned.
                </div>
              ) : (
                activeHomeworks.map(hw => (
                  <div 
                    key={hw.id}
                    className="bg-surface-container-lowest p-5 rounded-[24px] border border-outline-variant/25 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {hw.subject}
                        </span>
                        <span className="text-[10px] text-error font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">alarm</span>
                          Due: {hw.due_date}
                        </span>
                      </div>
                      <h4 className="font-title-lg text-sm text-on-surface font-bold mt-1.5">{hw.title}</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1 pr-2 line-clamp-3">{hw.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/15 space-y-2">
                      {hw.homework_link && (
                        <div>
                          <a 
                            href={hw.homework_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1 py-2 bg-primary/15 text-primary text-xs font-bold rounded-xl hover:bg-primary/25 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">link</span>
                            <span>Open Reference Link</span>
                          </a>
                        </div>
                      )}
                      
                      {hw.attachments && hw.attachments.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Attached files:</p>
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
                                className="w-full flex items-center justify-between p-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl border border-outline-variant/20 transition-colors"
                              >
                                <span className="text-xs font-bold text-on-surface truncate pr-4 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-base text-primary">description</span>
                                  {name}
                                </span>
                                <span className="material-symbols-outlined text-base text-outline">download</span>
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              pastHomeworks.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-xs font-semibold text-on-surface-variant bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
                  No expired assignments.
                </div>
              ) : (
                pastHomeworks.map(hw => (
                  <div 
                    key={hw.id}
                    className="bg-surface-container-lowest/80 p-5 rounded-[24px] border border-outline-variant/25 shadow-sm opacity-80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-outline-variant/45 text-on-surface-variant text-[10px] font-bold">
                          {hw.subject}
                        </span>
                        <span className="text-[10px] text-outline font-bold flex items-center gap-0.5">
                          Expired: {hw.due_date}
                        </span>
                      </div>
                      <h4 className="font-title-lg text-sm text-on-surface font-bold mt-1.5">{hw.title}</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1 line-clamp-3">{hw.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/15 space-y-2">
                      {hw.homework_link && (
                        <div>
                          <a 
                            href={hw.homework_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1 py-2 bg-outline-variant text-on-surface-variant text-xs font-bold rounded-xl hover:bg-opacity-95 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">link</span>
                            <span>Reference Link</span>
                          </a>
                        </div>
                      )}
                      
                      {hw.attachments && hw.attachments.length > 0 && (
                        <div className="space-y-1.5">
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
                                className="w-full flex items-center justify-between p-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl border border-outline-variant/20 transition-colors"
                              >
                                <span className="text-xs font-bold text-on-surface truncate pr-4 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-base text-outline">description</span>
                                  {name}
                                </span>
                                <span className="material-symbols-outlined text-base text-outline">download</span>
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
