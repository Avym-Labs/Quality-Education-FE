import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import i18n from '../i18n'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Refreshes the cached profile from the server — the copy saved at login
  // never otherwise updates on its own, so a class/subject reassignment made
  // after the session started (e.g. a teacher assigned a new class later)
  // would stay invisible until the user logged out and back in. Stable via
  // useCallback so the poll/focus effect below doesn't need to depend on it.
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      return data
    } catch (err) {
      console.error('Failed to refresh user profile:', err)
      return null
    }
  }, [])

  // Persists the language choice to this account's own profile (not just
  // this device) and updates the cached user so the switch takes effect
  // immediately without waiting on the next poll.
  const changeLanguage = useCallback(async (language) => {
    const { data } = await api.patch('/auth/me/language', { language })
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      // The cached copy could be arbitrarily stale (e.g. a tab left open for
      // days) — reconcile it immediately rather than waiting on the poll.
      refreshUser()
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Language is a per-account preference, not a per-device one — whichever
  // account is active drives the UI language. A fresh/different account
  // that never set one defaults to "en" from the backend, so switching
  // accounts (or logging out to no account) naturally falls back to English
  // unless that specific account chose Gujarati itself.
  useEffect(() => {
    i18n.changeLanguage(user?.preferred_language || 'en')
  }, [user?.preferred_language, user?.id])

  // Keeps every page's view of assigned_classes/subjects/etc. fresh without
  // each one having to remember to refetch itself — a single shared poll,
  // plus an immediate refresh whenever the tab/window regains focus so
  // coming back from being away doesn't wait out the poll interval.
  useEffect(() => {
    if (!user) return
    const interval = setInterval(refreshUser, 60000)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') refreshUser()
    }
    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
    // Depends on user?.id, not user itself — refreshUser() replaces the
    // whole user object every time it succeeds, and depending on the object
    // would tear down and restart this effect (and the interval) on every
    // single poll tick instead of only when the logged-in identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshUser])

  const login = async (credentials, rememberMe = false) => {
    const { data } = await api.post('/auth/login', { ...credentials, remember_me: rememberMe })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)

    if (rememberMe) {
      const savedRaw = localStorage.getItem('educore_saved_accounts')
      let savedList = savedRaw ? JSON.parse(savedRaw) : []
      savedList = savedList.filter(acc => acc.user_id !== data.user.id)
      savedList.push({
        user_id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role,
        avatar: data.user.avatar,
        access_token: data.access,
        refresh_token: data.refresh,
        user_data: data.user
      })
      localStorage.setItem('educore_saved_accounts', JSON.stringify(savedList))
    }
    return data.user
  }

  const logout = () => {
    const currentUserId = user?.id
    
    const savedRaw = localStorage.getItem('educore_saved_accounts')
    let savedList = savedRaw ? JSON.parse(savedRaw) : []
    savedList = savedList.filter(acc => acc.user_id !== currentUserId)
    localStorage.setItem('educore_saved_accounts', JSON.stringify(savedList))

    if (savedList.length > 0) {
      const nextAcc = savedList[0]
      localStorage.setItem('access_token', nextAcc.access_token)
      localStorage.setItem('refresh_token', nextAcc.refresh_token)
      localStorage.setItem('user', JSON.stringify(nextAcc.user_data))
      setUser(nextAcc.user_data)
      return nextAcc.user_data
    } else {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      return null
    }
  }

  const switchAccount = (targetUserId) => {
    const savedRaw = localStorage.getItem('educore_saved_accounts')
    let savedList = savedRaw ? JSON.parse(savedRaw) : []
    
    if (user) {
      savedList = savedList.map(acc => {
        if (acc.user_id === user.id) {
          return {
            ...acc,
            access_token: localStorage.getItem('access_token'),
            refresh_token: localStorage.getItem('refresh_token')
          }
        }
        return acc
      })
    }

    const targetAcc = savedList.find(acc => acc.user_id === targetUserId)
    if (!targetAcc) return null

    localStorage.setItem('access_token', targetAcc.access_token)
    localStorage.setItem('refresh_token', targetAcc.refresh_token)
    localStorage.setItem('user', JSON.stringify(targetAcc.user_data))
    localStorage.setItem('educore_saved_accounts', JSON.stringify(savedList))
    setUser(targetAcc.user_data)
    return targetAcc.user_data
  }

  const addAccount = () => {
    const savedRaw = localStorage.getItem('educore_saved_accounts')
    let savedList = savedRaw ? JSON.parse(savedRaw) : []
    
    if (user) {
      savedList = savedList.map(acc => {
        if (acc.user_id === user.id) {
          return {
            ...acc,
            access_token: localStorage.getItem('access_token'),
            refresh_token: localStorage.getItem('refresh_token')
          }
        }
        return acc
      })
      localStorage.setItem('educore_saved_accounts', JSON.stringify(savedList))
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchAccount, addAccount, refreshUser, changeLanguage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
