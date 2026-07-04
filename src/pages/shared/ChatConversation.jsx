import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ConversationSidebar from '../../components/chat/ConversationSidebar'
import api from '../../api/axios'

export default function ChatConversation() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role || 'student'

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [recipient, setRecipient] = useState(null)
  const [ws, setWs] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Media Attachment States
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)

  // Specific hidden input refs matches to WhatsApp options
  const docInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const audioInputRef = useRef(null)
  
  // Edit & Delete Options States
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [activeMenuId, setActiveMenuId] = useState(null)
  
  const messagesEndRef = useRef(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Resolve backend static upload hosts dynamically
  const getAttachmentUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const backendHost = apiBase.replace('/api', '')
    return `${backendHost}${url}`
  }

  // Fetch historical messages & other details
  const loadChatDetails = async () => {
    try {
      // 1. Fetch messages
      const { data } = await api.get(`/chat/messages/${conversationId}`)
      setMessages(data)
      
      // 2. Mark messages as read
      await api.put(`/chat/conversations/${conversationId}/read`)

      // 3. Find other participant info from conversations list
      const resConv = await api.get('/chat/conversations')
      const match = resConv.data.find(c => c.conversation_id === conversationId)
      if (match) {
        setRecipient({
          id: match.other_user_id,
          full_name: match.other_user_name,
          avatar: match.other_user_avatar,
          role: match.other_user_role || 'Contact'
        })
      } else {
        // Fallback: decode recipient user ID from conversationId
        const parts = conversationId.split('__')
        const otherUserId = parts.find(id => id !== user.id)
        setRecipient({
          id: otherUserId,
          full_name: 'Recipient',
          avatar: null,
          role: 'Contact'
        })
      }
    } catch (err) {
      console.error('Failed to load chat conversation details:', err)
    }
  }

  useEffect(() => {
    if (user && conversationId) {
      loadChatDetails()
      setEditingMessageId(null)
      setEditingText('')
      setActiveMenuId(null)
      setSelectedFiles([])
      setIsAttachmentMenuOpen(false)
    }
  }, [user, conversationId])

  // Establish WebSocket connection
  useEffect(() => {
    if (!user || !conversationId) return

    const token = localStorage.getItem('access_token')
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const wsBase = apiBase.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '')
    const wsUrl = `${wsBase}/ws/chat/${conversationId}?token=${token}`

    const socket = new WebSocket(wsUrl)
    setWs(socket)

    socket.onopen = () => {
      setIsConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.action === 'edit') {
          // Update the message in-place
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: msg.content, is_edited: true } : m))
        } else if (msg.action === 'delete') {
          // Mark the message as deleted in-place
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: msg.content, is_deleted: true } : m))
        } else {
          // Standard send/receive new message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          
          if (msg.sender_id !== user.id) {
            api.put(`/chat/conversations/${conversationId}/read`).catch(console.error)
          }
        }
      } catch (err) {
        console.error('WebSocket parsing error:', err)
      }
    }

    socket.onclose = () => {
      setIsConnected(false)
    }

    socket.onerror = (err) => {
      console.error('WebSocket connection error:', err)
      setIsConnected(false)
    }

    return () => {
      socket.close()
    }
  }, [user, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // File picker handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    const newFiles = files.map(file => {
      const isImg = file.type.startsWith('image/')
      return {
        file,
        name: file.name,
        type: file.type,
        previewUrl: isImg ? URL.createObjectURL(file) : null
      }
    })
    
    setSelectedFiles(prev => [...prev, ...newFiles])
    e.target.value = '' // Reset native selector value
  }

  const handleRemoveSelectedFile = (idx) => {
    setSelectedFiles(prev => {
      const target = prev[idx]
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // Handle WhatsApp media transmission
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!inputText.trim() && selectedFiles.length === 0) || !ws || ws.readyState !== WebSocket.OPEN) return

    setIsUploading(true)
    const uploadedUrls = []

    try {
      // 1. Upload files to the storage endpoints
      for (const sf of selectedFiles) {
        const formData = new FormData()
        formData.append('file', sf.file)
        
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (data.url) {
          uploadedUrls.push(data.url)
        }
      }
    } catch (err) {
      console.error('Failed to upload files:', err)
      alert('Failed to upload attachment(s). Please try again.')
      setIsUploading(false)
      return
    }

    const parts = conversationId.split('__')
    const receiverId = parts.find(id => id !== user.id)

    // 2. Submit payload over WebSockets
    const payload = {
      receiver_id: receiverId,
      content: inputText,
      attachments: uploadedUrls
    }

    ws.send(JSON.stringify(payload))
    
    // Cleanup states
    setInputText('')
    selectedFiles.forEach(sf => {
      if (sf.previewUrl) URL.revokeObjectURL(sf.previewUrl)
    })
    setSelectedFiles([])
    setIsUploading(false)
  }

  // Handle Edit Action
  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingText.trim() || !ws || ws.readyState !== WebSocket.OPEN) return
    
    ws.send(JSON.stringify({
      action: 'edit',
      message_id: editingMessageId,
      content: editingText
    }))
    setEditingMessageId(null)
    setEditingText('')
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  // Format timestamp for display
  const formatMsgTime = (timeStr) => {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ''
    }
  }

  // Group messages chronologically by date headers (e.g. "Today", "Yesterday", "July 2")
  const renderMessageGroups = () => {
    const groups = {}
    messages.forEach(m => {
      try {
        const d = new Date(m.created_at)
        const dateStr = d.toDateString()
        if (!groups[dateStr]) groups[dateStr] = []
        groups[dateStr].push(m)
      } catch (e) {
        if (!groups['Unknown']) groups['Unknown'] = []
        groups['Unknown'].push(m)
      }
    })

    const formatHeaderDate = (dateStr) => {
      if (dateStr === 'Unknown') return 'System Messages'
      const date = new Date(dateStr)
      const now = new Date()
      const yesterday = new Date()
      yesterday.setDate(now.getDate() - 1)

      if (date.toDateString() === now.toDateString()) return 'Today'
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
    }

    return Object.keys(groups).map(dateStr => (
      <div key={dateStr} className="space-y-4">
        {/* Date Divider Header */}
        <div className="flex justify-center my-4 animate-fadeIn">
          <span className="px-3 py-1 bg-surface-container-high/60 text-outline text-[9px] font-bold uppercase rounded-full tracking-wider shadow-xs">
            {formatHeaderDate(dateStr)}
          </span>
        </div>

        {/* Group Messages */}
        {groups[dateStr].map((msg, index) => {
          const isMine = msg.sender_id === user.id
          const isMenuOpen = activeMenuId === msg.id
          return (
            <div
              key={msg.id || index}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn group/msg relative`}
            >
              <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                
                <div className="flex items-center gap-2 max-w-full">
                  {/* Delete/Edit options menu for my own active messages */}
                  {isMine && !msg.is_deleted && (
                    <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(isMenuOpen ? null : msg.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container text-outline hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </button>
                      
                      {isMenuOpen && (
                        <div className="absolute right-0 bottom-7 z-30 bg-surface-container-lowest border border-outline-variant/35 rounded-xl shadow-lg p-1 w-24 text-left animate-scaleIn">
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id)
                              setEditingText(msg.content)
                              setActiveMenuId(null)
                            }}
                            className="w-full px-2.5 py-1.5 hover:bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this message?')) {
                                ws.send(JSON.stringify({
                                  action: 'delete',
                                  message_id: msg.id
                                }))
                              }
                              setActiveMenuId(null)
                            }}
                            className="w-full px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-[10px] font-bold text-error flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message bubble content */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                      isMine
                        ? 'bg-primary text-on-primary rounded-tr-none'
                        : 'bg-surface-container-lowest border border-outline-variant/25 text-on-surface rounded-tl-none'
                    } ${msg.is_deleted ? 'italic opacity-60 bg-surface-container text-on-surface-variant line-through border border-dashed border-outline-variant' : ''}`}
                  >
                    {/* Render message attachments */}
                    {msg.attachments && msg.attachments.length > 0 && !msg.is_deleted && (
                      <div className="space-y-2 mb-2">
                        {msg.attachments.map((attUrl, attIdx) => {
                          const fullUrl = getAttachmentUrl(attUrl)
                          const ext = attUrl.split('.').pop().toLowerCase()
                          const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
                          const isVid = ['mp4', 'webm', 'ogg'].includes(ext)
                          const isAud = ['mp3', 'wav', 'm4a'].includes(ext)

                          if (isImg) {
                            return (
                              <img 
                                key={attIdx} 
                                src={fullUrl} 
                                alt="Attachment" 
                                onClick={() => window.open(fullUrl, '_blank')}
                                className="max-w-full max-h-48 object-cover rounded-xl mt-1 cursor-pointer border border-outline-variant/10 shadow-xs hover:opacity-95 transition-opacity" 
                              />
                            )
                          }

                          if (isVid) {
                            return (
                              <video 
                                key={attIdx} 
                                src={fullUrl} 
                                controls 
                                className="max-w-full rounded-xl mt-1 shadow-xs border border-outline-variant/10" 
                              />
                            )
                          }

                          if (isAud) {
                            return (
                              <audio 
                                key={attIdx} 
                                src={fullUrl} 
                                controls 
                                className="max-w-full mt-1 scale-95 origin-left" 
                              />
                            )
                          }

                          const fileName = attUrl.split('/').pop()
                          return (
                            <a 
                              key={attIdx}
                              href={fullUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`flex items-center gap-2 p-2.5 rounded-xl border border-outline-variant/20 transition-colors mt-1 ${
                                isMine 
                                  ? 'bg-primary-container/10 hover:bg-primary-container/20 text-on-primary' 
                                  : 'bg-surface-container-high/40 hover:bg-surface-container-high text-on-surface'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xl">description</span>
                              <div className="text-left min-w-0 flex-1">
                                <p className="text-[10px] font-bold truncate leading-tight">{fileName}</p>
                                <p className="text-[8px] opacity-75 font-semibold uppercase">document</p>
                              </div>
                              <span className="material-symbols-outlined text-base">download</span>
                            </a>
                          )
                        })}
                      </div>
                    )}

                    {/* Content text */}
                    {msg.content && (
                      <p className="whitespace-pre-wrap text-left break-words">{msg.content}</p>
                    )}
                  </div>
                </div>
                
                {/* Timestamp & metadata */}
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[9px] text-outline font-bold">
                    {formatMsgTime(msg.created_at)}
                  </span>
                  {msg.is_edited && !msg.is_deleted && (
                    <span className="text-[8px] text-outline font-medium italic">(edited)</span>
                  )}
                  {isMine && !msg.is_deleted && (
                    <span className={`material-symbols-outlined text-[13px] ${
                      msg.is_read ? 'text-primary' : 'text-outline/70'
                    }`}>
                      {msg.is_read ? 'done_all' : 'done'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    ))
  }

  // Simulated presence status
  const isOnline = recipient ? recipient.id.charCodeAt(recipient.id.length - 1) % 2 === 0 : false

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] rounded-3xl overflow-hidden border border-outline-variant/35 shadow-sm mt-3 bg-surface-container-lowest">
        
        {/* Left Pane: Hide on mobile, show on desktop */}
        <div className="hidden md:block w-80 lg:w-96 shrink-0 h-full">
          <ConversationSidebar activeConversationId={conversationId} />
        </div>

        {/* Right Pane: Active Message Feed Workspace */}
        <div className="flex-1 flex flex-col h-full bg-surface-container-low/10">
          
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-3">
              {/* Back navigation button (mobile only) */}
              <button
                onClick={() => navigate(`/${role}/chat`)}
                className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>

              {/* Recipient info */}
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs border border-outline-variant/20 shadow-sm">
                  {recipient?.avatar ? (
                    <img src={recipient.avatar} alt={recipient.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{recipient?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>

              <div className="text-left">
                <h3 className="text-xs font-bold text-on-surface leading-tight">
                  {recipient?.full_name || 'Loading Chat...'}
                </h3>
                <p className="text-[9px] text-outline font-semibold uppercase flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <span>{isConnected ? 'connected' : 'connecting'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Messages Stream list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-surface-container-lowest/20">
            {renderMessageGroups()}
            <div ref={messagesEndRef} />
          </div>

          {/* Hidden File Picker Inputs matches to WhatsApp categories */}
          <input
            type="file"
            ref={docInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            multiple
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*"
            capture="environment"
          />
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*"
            multiple
          />
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="audio/*"
            multiple
          />

          {/* Attachment Tray Preview area */}
          {selectedFiles.length > 0 && (
            <div className="px-4 py-3 border-t border-outline-variant/15 flex items-center gap-2.5 flex-wrap bg-surface-container-lowest/90 animate-fadeIn">
              {selectedFiles.map((sf, idx) => (
                <div key={idx} className="relative bg-surface-container p-2 rounded-2xl flex items-center gap-2.5 border border-outline-variant/30 min-w-0 max-w-[200px] shadow-xs">
                  {sf.previewUrl ? (
                    <img src={sf.previewUrl} className="w-9 h-9 rounded-xl object-cover border border-outline-variant/15" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center border border-outline-variant/15">
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                  )}
                  <div className="text-left flex-1 min-w-0 pr-4">
                    <p className="text-[9px] font-bold text-on-surface truncate leading-tight">{sf.name}</p>
                    <p className="text-[7px] text-outline font-semibold uppercase">{(sf.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedFile(idx)}
                    className="absolute -top-1 -right-1 bg-surface-container-highest hover:bg-error hover:text-on-error w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] text-outline border border-surface shadow-sm cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[11px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Input / Inline Edit Box Form */}
          <div className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest">
            {editingMessageId ? (
              <form onSubmit={handleSaveEdit} className="flex gap-2 items-center">
                <div className="flex-1 bg-surface-container-low border border-outline rounded-2xl px-4 py-2 flex items-center justify-between gap-2 min-w-0">
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-[9px] text-primary font-bold uppercase">Editing Message</span>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold focus:outline-none text-on-surface"
                      required
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high text-outline text-xs cursor-pointer border-none bg-transparent"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!editingText.trim() || !isConnected}
                  className="w-10 h-10 shrink-0 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:bg-opacity-95 disabled:opacity-40 transition-colors active:scale-95 duration-100 cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                
                {/* Paperclip attachment menu toggler */}
                <div className="relative">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-xs transition-colors active:scale-95 duration-100 cursor-pointer border-none disabled:opacity-55 ${
                      isAttachmentMenuOpen 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-surface-container-low hover:bg-surface-container-high text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isAttachmentMenuOpen ? 'close' : 'add'}
                    </span>
                  </button>

                  {/* Floating WhatsApp Menu */}
                  {isAttachmentMenuOpen && (
                    <div className="absolute bottom-12 left-0 mb-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl p-3.5 flex gap-4 animate-scaleIn z-50">
                      {/* Document */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            docInputRef.current.click()
                            setIsAttachmentMenuOpen(false)
                          }}
                          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md active:scale-95 duration-100 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">description</span>
                        </button>
                        <span className="text-[9px] font-bold text-outline">Document</span>
                      </div>

                      {/* Camera */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            cameraInputRef.current.click()
                            setIsAttachmentMenuOpen(false)
                          }}
                          className="w-11 h-11 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center shadow-md active:scale-95 duration-100 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">photo_camera</span>
                        </button>
                        <span className="text-[9px] font-bold text-outline">Camera</span>
                      </div>

                      {/* Gallery */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            galleryInputRef.current.click()
                            setIsAttachmentMenuOpen(false)
                          }}
                          className="w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-md active:scale-95 duration-100 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">image</span>
                        </button>
                        <span className="text-[9px] font-bold text-outline">Gallery</span>
                      </div>

                      {/* Audio */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            audioInputRef.current.click()
                            setIsAttachmentMenuOpen(false)
                          }}
                          className="w-11 h-11 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-md active:scale-95 duration-100 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">volume_up</span>
                        </button>
                        <span className="text-[9px] font-bold text-outline">Audio</span>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isUploading ? "Uploading file(s)..." : "Type your message..."}
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 border border-outline bg-surface-container-low rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary text-on-surface disabled:opacity-75"
                />
                
                <button
                  type="submit"
                  disabled={(!inputText.trim() && selectedFiles.length === 0) || !isConnected || isUploading}
                  className="w-10 h-10 shrink-0 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:bg-opacity-95 disabled:opacity-40 transition-colors active:scale-95 duration-100 cursor-pointer border-none"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-base">send</span>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
