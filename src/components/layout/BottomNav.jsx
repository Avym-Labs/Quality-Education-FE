import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const NAV_ITEMS = {
  student: [
    { icon: 'home', label: 'Home', path: '/student/dashboard' },
    { icon: 'school', label: 'Academics', path: '/student/academics' },
    { icon: 'assignment', label: 'Homework', path: '/student/homework' },
    { icon: 'chat', label: 'Chat', path: '/student/chat' },
    { icon: 'person', label: 'Account', path: '/student/settings' },
  ],
  teacher: [
    { icon: 'home', label: 'Home', path: '/teacher/dashboard' },
    { icon: 'calendar_today', label: 'Attendance', path: '/teacher/attendance' },
    { icon: 'assignment', label: 'Homework', path: '/teacher/homework' },
    { icon: 'school', label: 'Academics', path: '/teacher/academics' },
    { icon: 'chat', label: 'Chat', path: '/teacher/chat' },
    { icon: 'person', label: 'Account', path: '/teacher/settings' },
  ],
  admin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: 'group', label: 'Users', path: '/admin/users' },
    { icon: 'school', label: 'Academics', path: '/admin/academics' },
    { icon: 'campaign', label: 'Announce', path: '/admin/announcements' },
    { icon: 'chat', label: 'Chat', path: '/admin/chat' },
    { icon: 'person', label: 'Account', path: '/admin/settings' },
  ],
  superadmin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/superadmin/dashboard' },
    { icon: 'shield', label: 'Admins', path: '/superadmin/admins' },
    { icon: 'payments', label: 'Payments', path: '/superadmin/payments' },
    { icon: 'person', label: 'Account', path: '/superadmin/settings' },
  ],
}

export default function BottomNav({ role = 'student' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const items = NAV_ITEMS[role] || NAV_ITEMS.student
  
  // Instagram Switch Account states
  const [isOpen, setIsOpen] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState([])
  
  // Chat Unread Count Notification badge State
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  
  // Long press timer references
  const timerRef = useRef(null)
  const isLongPress = useRef(false)

  // Fetch unread messages tally
  const fetchChatUnreadCount = async () => {
    if (!user) return
    try {
      const { data } = await api.get('/chat/conversations')
      const total = data.reduce((sum, c) => sum + (c.unread_count || 0), 0)
      setChatUnreadCount(total)
    } catch (err) {
      console.error('Failed to load chat unread count inside BottomNav:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchChatUnreadCount()
      // Poll every 12 seconds to sync unread badge counts in real-time
      const interval = setInterval(fetchChatUnreadCount, 12000)
      return () => clearInterval(interval)
    }
  }, [user, location.pathname])

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
        setSavedAccounts(saved.filter(r => r.user_id !== user.id))
      } catch (err) {
        console.error(err)
      }
    }
  }, [isOpen])

  // Custom long press event handlers
  const handleStart = () => {
    isLongPress.current = false
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      setIsOpen(true)
    }, 600)
  }

  const handleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleClick = (e, path) => {
    if (isLongPress.current) {
      e.preventDefault()
      e.stopPropagation()
      isLongPress.current = false
    } else {
      navigate(path)
    }
  }

  const handleSwitchProfile = async (targetUserId) => {
    try {
      const saved = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const match = saved.find(r => r.user_id === targetUserId)
      if (!match) return

      // Save active session user to saved before switching
      const current = saved.filter(r => r.user_id !== user.id)
      current.push({
        user_id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        avatar: user.avatar,
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
      })
      localStorage.setItem('educore_saved_accounts', JSON.stringify(current))

      // Swap active session details
      localStorage.setItem('access_token', match.access_token)
      localStorage.setItem('refresh_token', match.refresh_token)
      localStorage.setItem('user', JSON.stringify(match.user_data || {
        id: match.user_id,
        email: match.email,
        phone: match.phone,
        role: match.role,
        first_name: match.first_name,
        last_name: match.last_name,
        full_name: match.full_name,
        avatar: match.avatar,
      }))

      setIsOpen(false)
      window.location.href = `/${match.role}/dashboard`
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddNewAccount = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      const current = saved.filter(r => r.user_id !== user.id)
      current.push({
        user_id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: user.full_name,
        avatar: user.avatar,
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
      })
      localStorage.setItem('educore_saved_accounts', JSON.stringify(current))

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')

      setIsOpen(false)
      window.location.href = '/login'
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-surface-container-lowest shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] rounded-t-xl pb-safe">
        {items.map(({ icon, label, path }, index) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
          const isLast = index === items.length - 1
          const isChat = label.toLowerCase() === 'chat'
          
          return (
            <NavLink
              key={path}
              to={path}
              onClick={(e) => isLast ? handleClick(e, path) : null}
              onTouchStart={isLast ? handleStart : null}
              onTouchEnd={isLast ? handleEnd : null}
              onMouseDown={isLast ? handleStart : null}
              onMouseUp={isLast ? handleEnd : null}
              onMouseLeave={isLast ? handleEnd : null}
              className={`flex flex-col items-center justify-center transition-all active:scale-90 px-3 py-1 rounded-full select-none ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <div className="relative">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {icon}
                </span>
                
                {/* Chat notifications badge */}
                {isChat && chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-error text-on-error font-extrabold text-[8px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center border border-surface-container-lowest shadow-sm animate-pulse">
                    {chatUnreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Instagram-style Bottom Sheet  Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/45 z-50 transition-opacity duration-300 animate-fadeIn" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-surface-container-lowest border-t border-outline-variant/35 rounded-t-[28px] p-5 shadow-2xl max-h-[80vh] flex flex-col animate-slideUp text-xs select-none max-w-md mx-auto">
            
            {/* Drag indicator handle */}
            <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
            
            <h3 className="text-sm font-black text-primary uppercase tracking-wider text-center mb-4">
              Switch Accounts
            </h3>

            {/*  list */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-5 pr-1">
              {savedAccounts.length === 0 ? (
                <div className="text-center py-6 text-outline font-semibold">
                  No other saved profiles found.
                </div>
              ) : (
                savedAccounts.map(acc => {
                  const isActive = acc.user_id === user?.id
                  return (
                    <div 
                      key={acc.user_id}
                      onClick={() => {
                        if (!isActive) handleSwitchProfile(acc.user_id)
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-outline-variant/30 hover:bg-surface-container-low cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-extrabold text-xs uppercase shadow-sm">
                          {acc.full_name?.[0] || 'U'}
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-on-surface">{acc.full_name}</h4>
                          <p className="text-[9px] text-outline font-semibold uppercase">{acc.role}</p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Add active  option */}
            <div className="space-y-2">
              <button 
                onClick={handleAddNewAccount}
                className="w-full flex items-center justify-center gap-1.5 py-3.5 border border-dashed border-primary/45 hover:bg-primary/5 rounded-2xl transition-colors text-xs font-bold text-primary cursor-pointer border-medium"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Add Existing Account</span>
              </button>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 bg-surface-container-high hover:bg-surface-container-highest rounded-2xl text-xs font-bold text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </>
      )}
    </>
  )
}
