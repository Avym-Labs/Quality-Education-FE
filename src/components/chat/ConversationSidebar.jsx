import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function ConversationSidebar({ activeConversationId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'student'

  const [conversations, setConversations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('direct') // 'direct' | 'broadcast'
  const [contacts, setContacts] = useState([])
  const [contactSearch, setContactSearch] = useState('')
  const [contactsLoading, setContactsLoading] = useState(false)

  // Broadcast States
  const [broadcastScope, setBroadcastScope] = useState('overall') // 'overall' | 'class' | 'subject'
  const [broadcastTarget, setBroadcastTarget] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)

  // Standard drop-down options for broadcast
  const classOptions = ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B']
  const subjectOptions = ['Mathematics', 'Physics', 'Chemistry', 'Science', 'English Literature']

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations')
      setConversations(data)
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchConversations()
      // Polling conversation list status every 10 seconds for real-time unread badges update
      const interval = setInterval(fetchConversations, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

  const openNewChatModal = async () => {
    setIsModalOpen(true)
    setContactSearch('')
    setContactsLoading(true)
    try {
      const { data } = await api.get('/chat/contacts')
      setContacts(data)
    } catch (err) {
      console.error('Failed to load contacts:', err)
    } finally {
      setContactsLoading(false)
    }
  }

  const handleStartChat = (contact) => {
    // Generate sorted conversation ID
    const sortedIds = [user.id, contact.user_id].sort()
    const convId = `${sortedIds[0]}__${sortedIds[1]}`
    setIsModalOpen(false)
    navigate(`/${role}/chat/${convId}`)
  }

  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if (!broadcastContent.trim()) return
    setBroadcasting(true)
    try {
      await api.post('/chat/broadcast', {
        scope: broadcastScope,
        target_id: broadcastScope === 'overall' ? null : broadcastTarget,
        content: broadcastContent
      })
      setBroadcastContent('')
      setBroadcastTarget('')
      setIsModalOpen(false)
      fetchConversations()
    } catch (err) {
      console.error('Failed to send broadcast:', err)
      alert('Failed to send broadcast message.')
    } finally {
      setBroadcasting(false)
    }
  }

  // Helper: Format message time nicely
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      const now = new Date()
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  // Helper: Simulated deterministic presence indicator
  const isUserOnline = (otherId) => {
    if (!otherId) return false
    return otherId.charCodeAt(otherId.length - 1) % 2 === 0
  }

  const filteredConversations = conversations.filter((c) =>
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(contactSearch.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant/35 w-full">
      {/* Search Header */}
      <div className="p-4 border-b border-outline-variant/20 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-primary uppercase tracking-wider">Inbox Messages</h2>
          <button
            onClick={openNewChatModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold hover:bg-opacity-90 transition-colors active:scale-95 duration-100 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_comment</span>
            <span>New Chat</span>
          </button>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-base">search</span>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-outline bg-surface-container-low rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
          />
        </div>
      </div>

      {/* Roster list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-outline gap-2">
            <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
            <p className="text-[10px] font-bold uppercase tracking-wider">Loading inbox...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16 px-4 text-outline space-y-2">
            <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
            <p className="text-xs font-semibold">No active conversations found.</p>
            <p className="text-[10px] leading-relaxed">Click "New Chat" to connect with others.</p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.conversation_id === activeConversationId
            const isOnline = isUserOnline(c.other_user_id)
            return (
              <div
                key={c.conversation_id}
                onClick={() => navigate(`/${role}/chat/${c.conversation_id}`)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-primary-container/20 border-primary shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-surface-container-low hover:border-outline-variant/30'
                }`}
              >
                {/* Avatar with status indicator */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm border border-outline-variant/20 shadow-sm">
                    {c.other_user_avatar ? (
                      <img src={c.other_user_avatar} alt={c.other_user_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{c.other_user_name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline gap-1">
                    <h4 className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                      {c.other_user_name}
                    </h4>
                    <span className="text-[9px] text-outline shrink-0 font-semibold">
                      {formatTime(c.last_message_time)}
                    </span>
                  </div>
                  <p className={`text-[10px] truncate mt-0.5 font-medium ${c.unread_count > 0 ? 'text-on-surface font-black' : 'text-on-surface-variant'}`}>
                    {c.last_message}
                  </p>
                </div>

                {/* Badge for unread count */}
                {c.unread_count > 0 && !isActive && (
                  <div className="shrink-0 bg-error text-on-error w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                    {c.unread_count}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Roster / Broadcast Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/45 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/40">
              <h3 className="text-sm font-black text-primary uppercase tracking-wider">
                {modalMode === 'direct' ? 'Start a New Chat' : 'Broadcast Message'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Roster Toggles (Only for Teachers/Admins) */}
            {user?.role !== 'student' && (
              <div className="flex border-b border-outline-variant/20 bg-surface-container-low/20">
                <button
                  onClick={() => setModalMode('direct')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalMode === 'direct'
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  Direct Message
                </button>
                <button
                  onClick={() => setModalMode('broadcast')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                    modalMode === 'broadcast'
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  Bulk Broadcast
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {modalMode === 'direct' ? (
                /* Direct Message Flow: Searchable Contact roster */
                <div className="space-y-4 h-full flex flex-col">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-base">search</span>
                    <input
                      type="text"
                      placeholder={user?.role === 'student' ? 'Search teachers...' : 'Search students...'}
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-outline bg-surface-container-low rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[250px] max-h-[350px] pr-1">
                    {contactsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-outline gap-2">
                        <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider">Loading roster...</p>
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center py-12 text-outline">
                        <span className="material-symbols-outlined text-3xl">group_off</span>
                        <p className="text-xs font-semibold mt-2">No matching contacts found.</p>
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <div
                          key={contact.user_id}
                          onClick={() => handleStartChat(contact)}
                          className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/20 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                              {contact.avatar ? (
                                <img src={contact.avatar} alt={contact.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{contact.full_name?.[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                                {contact.full_name}
                              </h4>
                              <p className="text-[9px] text-outline font-semibold uppercase mt-0.5">
                                {contact.role === 'teacher' ? (contact.department || 'Faculty') : `Class ${contact.grade}-${contact.section}`}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-outline text-lg group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Broadcast Flow Form */
                <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                  {/* Select Scope */}
                  <div className="flex flex-col gap-1 text-left">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Recipient Scope</label>
                    <select
                      value={broadcastScope}
                      onChange={(e) => {
                        setBroadcastScope(e.target.value)
                        setBroadcastTarget('')
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold text-xs outline-none focus:border-primary"
                    >
                      <option value="overall">All Registered Students</option>
                      <option value="class">Class Wise</option>
                      <option value="subject">Subject Wise</option>
                    </select>
                  </div>

                  {/* Target Scope Selection */}
                  {broadcastScope === 'class' && (
                    <div className="flex flex-col gap-1 text-left animate-fadeIn">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Select Class</label>
                      <select
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold text-xs outline-none focus:border-primary"
                        required
                      >
                        <option value="">-- Choose Class --</option>
                        {classOptions.map((cls) => (
                          <option key={cls} value={cls}>Class {cls}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {broadcastScope === 'subject' && (
                    <div className="flex flex-col gap-1 text-left animate-fadeIn">
                      <label className="font-bold text-[10px] text-on-surface-variant uppercase">Select Subject</label>
                      <select
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold text-xs outline-none focus:border-primary"
                        required
                      >
                        <option value="">-- Choose Subject --</option>
                        {subjectOptions.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Select Prebuilt Template */}
                  <div className="flex flex-col gap-1 text-left">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Prebuilt Message Template</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          setBroadcastContent(val)
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold text-xs outline-none focus:border-primary"
                    >
                      <option value="">-- Choose designed template (Optional) --</option>
                      <option value="Hello {name},&#10;&#10;Your results for the recent exam have been uploaded. Please log in to your Academics Hub to review your marks.&#10;&#10;Regards, Admin.">📚 Exam Results Uploaded</option>
                      <option value="Dear {name},&#10;&#10;This is a reminder that your tuition fee installment is currently pending. Please proceed with payment via the payments section.&#10;&#10;Thank you.">💰 Outstanding Fee Reminder</option>
                      <option value="Hi {name},&#10;&#10;Please check your homework panel. You have outstanding assignments due for submission. Ensure completion by the deadline.&#10;&#10;Regards, {sender_name}.">📝 Pending Homework Alert</option>
                      <option value="Hi {name},&#10;&#10;Your attendance rate is currently below the 75% minimum requirement. Please meet with your homeroom teacher to address this standing.">⚠️ Attendance Shortage Warning</option>
                    </select>
                    <p className="text-[9px] text-outline font-semibold uppercase tracking-wider mt-0.5">
                      Tip: Use <span className="text-primary font-bold">{"{name}"}</span> or <span className="text-primary font-bold">{"{first_name}"}</span> for auto student personalization.
                    </p>
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col gap-1 text-left">
                    <label className="font-bold text-[10px] text-on-surface-variant uppercase">Message Content</label>
                    <textarea
                      placeholder="Type your announcement broadcast..."
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      rows={4}
                      className="px-3.5 py-2.5 rounded-xl border border-outline bg-surface-container-low font-semibold text-xs outline-none focus:border-primary resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="w-full mt-2 py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl shadow-md hover:bg-opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">campaign</span>
                    <span>{broadcasting ? 'Sending Broadcast...' : 'Broadcast to Group'}</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
