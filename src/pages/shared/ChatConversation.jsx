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
  
  const messagesEndRef = useRef(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        // If no conversations found yet, mock recipient layout
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
        setMessages((prev) => {
          // Prevent duplicates if REST load overlap
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        
        // Auto-mark conversation as read on receiving message
        if (msg.sender_id !== user.id) {
          api.put(`/chat/conversations/${conversationId}/read`).catch(console.error)
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

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim() || !ws || ws.readyState !== WebSocket.OPEN) return

    const parts = conversationId.split('__')
    const receiverId = parts.find(id => id !== user.id)

    const payload = {
      receiver_id: receiverId,
      content: inputText,
      attachments: []
    }

    ws.send(JSON.stringify(payload))
    setInputText('')
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

  // Simulated presence dots
  const isOnline = recipient ? recipient.id.charCodeAt(recipient.id.length - 1) % 2 === 0 : false

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] rounded-3xl overflow-hidden border border-outline-variant/35 shadow-sm mt-3 bg-surface-container-lowest">
        
        {/* Left Pane: Hide on mobile, show on desktop */}
        <div className="hidden md:block w-80 lg:w-96 shrink-0 h-full">
          <ConversationSidebar activeConversationId={conversationId} />
        </div>

        {/* Right Pane: Active Message Feed Workspace (visible everywhere on /chat/:conversationId) */}
        <div className="flex-1 flex flex-col h-full bg-surface-container-low/10">
          
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-3">
              {/* Back navigation button (only visible on mobile) */}
              <button
                onClick={() => navigate(`/${role}/chat`)}
                className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>

              {/* Recipient avatar & status */}
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
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === user.id
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                        isMine
                          ? 'bg-primary text-on-primary rounded-tr-none'
                          : 'bg-surface-container-lowest border border-outline-variant/25 text-on-surface rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-left break-words">{msg.content}</p>
                    </div>
                    
                    {/* Timestamp & read receipt checkmarks */}
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[9px] text-outline font-bold">
                        {formatMsgTime(msg.created_at)}
                      </span>
                      {isMine && (
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
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box Form */}
          <div className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-outline bg-surface-container-low rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                required
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !isConnected}
                className="w-10 h-10 shrink-0 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:bg-opacity-95 disabled:opacity-40 transition-colors active:scale-95 duration-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
