import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count || 0)
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      refreshUnreadCount()
      // Poll every 15 seconds so the badge stays in sync across devices/tabs;
      // refreshUnreadCount() is also called directly right after a mark-read
      // action for an instant update instead of waiting on the poll.
      const interval = setInterval(refreshUnreadCount, 15000)
      return () => clearInterval(interval)
    } else {
      setUnreadCount(0)
    }
  }, [user, refreshUnreadCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
