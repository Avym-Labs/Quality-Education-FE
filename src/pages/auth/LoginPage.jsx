import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import loginIllustration from '../../assets/login_illustration.png'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleQuickLogin = async (idVal, passVal) => {
    setError('')
    setLoading(true)
    try {
      const user = await login({ identifier: idVal, password: passVal }, rememberMe)
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (err.response?.status === 403 && (detail.includes('paused') || detail.includes('Paused'))) {
        navigate('/paused', { replace: true })
        return
      }
      setError(detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login({ identifier, password }, rememberMe)
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (err.response?.status === 403 && (detail.includes('paused') || detail.includes('Paused'))) {
        navigate('/paused', { replace: true })
        return
      }
      setError(detail || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-container-padding-mobile md:p-container-padding-desktop">
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface-container-lowest rounded-[32px] overflow-hidden shadow-lg border border-outline-variant/30">

        {/* Illustration — desktop only */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-surface-container-low p-6 relative overflow-hidden">
          <div className="w-full max-w-sm flex flex-col items-center gap-3.5 relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <span className="text-3xl font-extrabold text-primary tracking-tight">EduCore</span>
            </div>
            
            {/* Photo */}
            <div className="w-full h-64 bg-transparent rounded-3xl flex items-center justify-center overflow-hidden">
              <img 
                src={loginIllustration} 
                alt="EduCore Illustration" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Text */}
            <div className="text-center mt-1">
              <h2 className="text-headline-lg font-semibold text-on-surface">Modern learning for the next generation.</h2>
              <p className="text-body-md text-on-surface-variant mt-2">Empowering teachers and students.</p>
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-48 h-48 bg-secondary/5 rounded-full blur-2xl" />
        </div>

        {/* Form Section */}
        <div className="p-container-padding-mobile md:p-stack-lg lg:p-16 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-stack-lg">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="text-headline-lg-mobile font-bold text-primary tracking-tight">EduCore</span>
          </div>

          <div className="mb-stack-lg">
            <h1 className="text-headline-lg font-semibold text-on-surface">Welcome back</h1>
            <p className="text-body-md text-on-surface-variant">Please enter your details to sign in.</p>
          </div>

          <form className="space-y-stack-md" onSubmit={handleSubmit}>


            {/* Email / Mobile */}
            <div className="space-y-base">
              <label className="text-label-md text-on-surface-variant ml-1" htmlFor="identifier">
                Email or Mobile
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or mobile"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-transparent border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-base">
              <label className="text-label-md text-on-surface-variant ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-transparent border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between py-base">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-label-md text-primary font-bold hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <span className="text-label-md text-error">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-xl text-title-lg font-bold shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-stack-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Login</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>

            {/* Quick login helper buttons */}
            <div className="pt-6 border-t border-outline-variant/20 mt-6 text-center space-y-3">
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Login as:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@educore.com', 'admin123')}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[11px] font-bold text-on-surface-variant transition-all hover:text-primary active:scale-95 cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('teacher@educore.com', 'teacher123')}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[11px] font-bold text-on-surface-variant transition-all hover:text-primary active:scale-95 cursor-pointer"
                >
                  Teacher Sarah
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student@educore.com', 'student123')}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[11px] font-bold text-on-surface-variant transition-all hover:text-primary active:scale-95 cursor-pointer"
                >
                  Student Arjun
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}
