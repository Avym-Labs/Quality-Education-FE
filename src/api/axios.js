import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Multiple requests can 401 at once on page load (chat, analytics, notifications, etc.
// all fire in parallel). The backend enforces a single active token per device, and
// each refresh call overwrites it — so if every 401'd request refreshed independently,
// they'd stomp on each other's tokens and the loser(s) would 401 again. Sharing one
// in-flight refresh promise means every concurrent 401 waits for the same new token.
let refreshPromise = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const detail = error.response?.data?.detail || ''
    if (error.response?.status === 403 && (detail.includes('paused') || detail.includes('Paused'))) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/paused'
      return Promise.reject(error)
    }
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios.post(
              `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/token/refresh`,
              { refresh }
            ).finally(() => {
              refreshPromise = null
            })
          }
          const { data } = await refreshPromise
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
