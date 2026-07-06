import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import DashboardLayout from '../../components/layout/DashboardLayout'

export default function AdminChatLogs() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All') // All | Student | Teacher

  const loadChatLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/admin/chat-logs')
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to load chat logs:', err)
      setError('Failed to fetch surveillance logs from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChatLogs()
  }, [])

  // Resolve file static paths
  const getAttachmentUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const backendHost = apiBase.replace('/api', '')
    return `${backendHost}${url}`
  }

  // Format local browser time matches to IST
  const formatIST = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateStr
    }
  }

  // Filter logic
  const filteredLogs = logs.filter(log => {
    // Search match
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      log.sender_name.toLowerCase().includes(searchLower) ||
      log.receiver_name.toLowerCase().includes(searchLower) ||
      log.content.toLowerCase().includes(searchLower) ||
      log.sender_email.toLowerCase().includes(searchLower) ||
      log.receiver_email.toLowerCase().includes(searchLower)

    // Role match
    let matchesRole = true
    if (roleFilter === 'Student') {
      matchesRole = log.sender_role === 'student' || log.receiver_role === 'student'
    } else if (roleFilter === 'Teacher') {
      matchesRole = log.sender_role === 'teacher' || log.receiver_role === 'teacher'
    }

    return matchesSearch && matchesRole
  })

  return (
    <DashboardLayout>
      <div className="space-y-stack-md mt-stack-sm pb-24 text-left">
        
        {/* Header bar */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="material-symbols-outlined text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors active:scale-95 duration-200"
            >
              arrow_back
            </button>
            <div>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Chat Logs
              </h2>
              <p className="text-on-surface-variant text-xs font-semibold mt-0.5">
                Audit student-teacher chat sessions and media files.
              </p>
            </div>
          </div>
          
          {/* Refresh Action */}
          <button
            onClick={loadChatLogs}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-xs font-bold text-primary border border-outline-variant/30 transition-colors shadow-xs active:scale-95 duration-100 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh Logs</span>
          </button>
        </section>

        {/* Filter Toolbar */}
        <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input 
              type="text"
              placeholder="Search by sender/receiver name, email, or message content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low/30 border border-outline-variant rounded-xl py-2 pl-10 pr-4 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-xs font-semibold"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-bold text-outline shrink-0">Role Involved:</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-surface-container-low/30 border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:outline-none"
            >
              <option value="All">All Conversations</option>
              <option value="Student">Involves Students</option>
              <option value="Teacher">Involves Teachers</option>
            </select>
          </div>
        </div>

        {/* Audit Log Stream */}
        {loading ? (
          <div className="py-20 text-center text-outline font-semibold flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span>Fetching surveillance logs...</span>
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl border border-outline-variant/30 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-outline">visibility_off</span>
            <p className="text-xs text-outline font-bold mt-2">No chat logs match active search filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-surface-container-lowest p-4.5 rounded-3xl border border-outline-variant/25 shadow-xs flex flex-col gap-3 hover:border-primary/20 transition-all">
                
                {/* Meta details header: Sender -> Receiver */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/10 pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {/* Sender */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-surface">{log.sender_name}</span>
                      <span className={`px-1.5 py-0.2 bg-surface-container text-outline text-[8px] font-black uppercase rounded-md`}>
                        {log.sender_role}
                      </span>
                      <span className="text-[10px] text-outline font-medium">({log.sender_email})</span>
                    </div>

                    <span className="material-symbols-outlined text-outline text-sm">trending_flat</span>

                    {/* Receiver */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-surface">{log.receiver_name}</span>
                      <span className={`px-1.5 py-0.2 bg-surface-container text-outline text-[8px] font-black uppercase rounded-md`}>
                        {log.receiver_role}
                      </span>
                      <span className="text-[10px] text-outline font-medium">({log.receiver_email})</span>
                    </div>
                  </div>

                  <span className="text-[9px] text-outline font-bold bg-surface-container-low px-2 py-0.5 rounded-md self-start sm:self-auto shadow-xs">
                    {formatIST(log.created_at)}
                  </span>
                </div>

                {/* Message Body Content */}
                <div className="text-xs leading-relaxed text-left space-y-2 pl-1.5">
                  {log.is_deleted ? (
                    <p className="text-outline font-semibold italic line-through">[Message Deleted by User]</p>
                  ) : (
                    <>
                      {log.content && <p className="font-semibold text-on-surface-variant whitespace-pre-wrap">{log.content}</p>}
                      {log.is_edited && <span className="text-[8px] text-outline font-semibold italic">(Edited)</span>}
                    </>
                  )}

                  {/* Attachments preview */}
                  {log.attachments && log.attachments.length > 0 && !log.is_deleted && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {log.attachments.map((att, idx) => {
                        const ext = att.split('.').pop().toLowerCase()
                        const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
                        const fileName = att.split('/').pop()
                        return (
                          <a
                            key={idx}
                            href={getAttachmentUrl(att)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-primary-fixed hover:text-primary rounded-xl text-[10px] font-bold text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">{isImg ? 'image' : 'description'}</span>
                            <span className="truncate max-w-[120px]">{fileName}</span>
                            <span className="material-symbols-outlined text-xs">download</span>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
