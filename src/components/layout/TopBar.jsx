import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function TopBar({ onNotificationClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'student'
  
  // System notifications unread count State
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count || 0)
    } catch (err) {
      console.error('Failed to fetch unread notification count in TopBar:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      // Poll every 15 seconds to sync notification badges in real-time
      const interval = setInterval(fetchUnreadCount, 15000)
      return () => clearInterval(interval)
    }
  }, [user])

  return (
    <header className="w-full top-0 sticky z-40 bg-surface flex justify-between items-center px-container-padding-mobile py-stack-sm shadow-sm">
      <div className="flex items-center gap-stack-sm">
        <div
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed shadow-sm cursor-pointer"
          onClick={() => {
            if (role === 'superadmin') {
              navigate('/superadmin/dashboard')
            } else if (role === 'teacher') {
              navigate('/teacher/settings')
            } else {
              navigate(`/${role}/settings`) // Redirect to the renamed Account page
            }
          }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.first_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          )}
        </div>
        <h1 className="text-headline-lg-mobile font-bold text-primary tracking-tight">EduCore</h1>
      </div>
      
      <div className="flex items-center gap-1">
        
        {/* Notifications Icon with Unread Badge count */}
        <div className="relative">
          <button
            onClick={() => onNotificationClick ? onNotificationClick() : navigate(`/${role}/notifications`)}
            className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 cursor-pointer"
          >
            notifications
          </button>
          
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-error text-on-error font-extrabold text-[8px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center border border-surface shadow-sm animate-pulse pointer-events-none">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              const nextUser = logout()
              if (nextUser) {
                navigate(`/${nextUser.role}/dashboard`, { replace: true })
              } else {
                navigate('/login')
              }
            }
          }}
          className="material-symbols-outlined text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 cursor-pointer"
        >
          logout
        </button>
      </div>
    </header>
  )
}
