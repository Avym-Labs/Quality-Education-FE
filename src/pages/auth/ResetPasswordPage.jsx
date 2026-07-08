import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import loginIllustration from '../../assets/login_illustration.png'
import api from '../../api/axios'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid reset token in URL parameters.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword
      })
      setSuccess('Your password has been successfully reset!')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.')
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
              <h2 className="text-headline-lg font-semibold text-on-surface">Secure password reset.</h2>
              <p className="text-body-md text-on-surface-variant mt-2">Enter your new credentials to restore access.</p>
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Form Section */}
        <div className="p-container-padding-mobile md:p-stack-lg lg:p-16 flex flex-col justify-center text-left">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-stack-lg">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="text-headline-lg-mobile font-bold text-primary tracking-tight">EduCore</span>
          </div>

          <div className="mb-stack-lg">
            <h1 className="text-headline-lg font-semibold text-on-surface">Reset Password</h1>
            <p className="text-body-md text-on-surface-variant">Please choose a strong, secure new password for your account.</p>
          </div>

          {!token ? (
            <div className="p-4 bg-error-container rounded-2xl border border-error-variant/20 text-center w-full">
              <span className="material-symbols-outlined text-4xl text-error">lock_reset</span>
              <p className="text-xs text-error font-bold mt-2">Missing Reset Token.</p>
              <p className="text-[11px] text-outline font-medium mt-1">Please request a new reset email link.</p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-xs border-none cursor-pointer"
              >
                Go to Forgot Password
              </button>
            </div>
          ) : (
            <form className="space-y-stack-md w-full" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="space-y-base">
                <label className="text-label-md text-on-surface-variant ml-1" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-4 bg-transparent border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50 font-semibold"
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

              {/* Confirm Password */}
              <div className="space-y-base">
                <label className="text-label-md text-on-surface-variant ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-4 bg-transparent border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50 font-semibold"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
                  <span className="material-symbols-outlined text-error text-sm">error</span>
                  <span className="text-label-md text-error font-semibold">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="material-symbols-outlined text-green-700 text-sm">check_circle</span>
                  <span className="text-label-md text-green-700 font-bold">{success}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-4 rounded-xl text-title-lg font-bold shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <span className="material-symbols-outlined">check</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
