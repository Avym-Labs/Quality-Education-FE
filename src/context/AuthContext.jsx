import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (credentials, rememberMe = false) => {
    const { data } = await api.post('/auth/login', credentials)
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
    <AuthContext.Provider value={{ user, loading, login, logout, switchAccount, addAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
