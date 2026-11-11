import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import loginIllustration from '../../assets/login_illustration.png'
import logo from '../../assets/logo.png'
import Icon from '../../components/common/Icon'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [siblingProfiles, setSiblingProfiles] = useState([])

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSelectProfile = async (profile) => {
    setError('')
    setLoading(true)
    try {
      const user = await login({ identifier, password, user_id: profile.id }, rememberMe)
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      setError(detail || 'Failed to sign in to the selected profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ identifier, password }, rememberMe)
      if (res && res.requires_profile_selection) {
        setSiblingProfiles(res.profiles || [])
        return
      }
      navigate(`/${res.role}/dashboard`, { replace: true })
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
              <img src={logo} alt="Quality Education" className="h-36 w-36 object-contain" />
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
            <img src={logo} alt="Quality Education" className="h-20 w-20 object-contain" />
          </div>

          {siblingProfiles.length > 0 ? (
            <div>
              <div className="mb-stack-lg">
                <h1 className="text-headline-lg font-semibold text-on-surface">Select Student</h1>
                <p className="text-body-md text-on-surface-variant">Multiple students are registered under this mobile number. Choose which profile to open:</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl mb-4">
                  <Icon name="error" className="text-error text-sm" />
                  <span className="text-label-md text-error">{error}</span>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {siblingProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProfile(p)}
                    disabled={loading}
                    className="w-full text-left p-4 rounded-2xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-title-md group-hover:scale-105 transition-transform">
                        {p.first_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {p.full_name || `${p.first_name} ${p.last_name}`}
                        </h3>
                        <p className="text-body-sm text-on-surface-variant">
                          {p.grade ? `Class ${p.grade}${p.section ? '-' + p.section : ''}` : 'Student'}
                          {p.roll_number ? ` • Roll ${p.roll_number}` : ''}
                        </p>
                      </div>
                    </div>
                    <Icon name="arrow_forward" className="text-outline group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setSiblingProfiles([]); setError(''); }}
                className="text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="arrow_back" className="text-sm" />
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-stack-lg">
                <h1 className="text-headline-lg font-semibold text-on-surface">Welcome back</h1>
                <p className="text-body-md text-on-surface-variant">Please enter your details to sign in.</p>
              </div>

              <form className="space-y-stack-md" onSubmit={handleSubmit}>


            {/* Email / Mobile */}
            <div className="space-y-base">
              <label className="text-label-md text-on-surface-variant ml-1" htmlFor="identifier">
                Email or Mobile <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <Icon name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
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
                Password <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
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
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
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
                <Icon name="error" className="text-error text-sm" />
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
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <Icon name="arrow_forward" />
                </>
              )}
            </button>

          </form>

          <p className="text-center text-label-md text-on-surface-variant mt-4">
            No account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </p>
          </>
        )}
        </div>
      </main>
    </div>
  )
}
