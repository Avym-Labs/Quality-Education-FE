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

  const [studentStats, setStudentStats] = useState(null)
  const fetchStudentStats = async () => {
    if (user && role === 'student') {
      try {
        const { data } = await api.get('/student/dashboard-stats')
        setStudentStats(data)
      } catch (err) {
        console.error('Failed to fetch student stats in TopBar:', err)
      }
    }
  }

  useEffect(() => {
    if (user && role === 'student') {
      fetchStudentStats()
    }
  }, [user, role])

  const score = studentStats?.average_score ?? 85.0
  const tier = score >= 90 ? 'Legend Tier' : score >= 80 ? 'Elite Tier' : 'Aspirant Tier'


  return (
    <header className="w-full top-0 sticky z-40 bg-surface flex justify-between items-center px-container-padding-mobile py-stack-sm shadow-sm">
      <div className="flex items-center gap-stack-sm">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-fixed shadow-sm cursor-pointer shrink-0"
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
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-primary tracking-tight leading-tight">
              {user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User'}
            </h1>
            {role === 'student' && (
              <div className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm text-[9px] font-bold shrink-0">
                <span className="material-symbols-outlined text-[10px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  stars
                </span>
                <span>{tier}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-outline font-semibold tracking-wide leading-tight mt-0.5">
            {role === 'student' && `Grade ${user?.grade || '10'}-${user?.section || 'A'} • Academic Precision School`}
            {role === 'teacher' && `${user?.department || 'Mathematics Department'} Faculty`}
            {role === 'admin' && 'System Administrator'}
            {role === 'superadmin' && 'Platform Suite Manager'}
          </p>
        </div>
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
      </div>
    </header>
  )
}
