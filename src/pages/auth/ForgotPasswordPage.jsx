import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginIllustration from '../../assets/login_illustration.png'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSuccess(res.data.detail || 'Password reset link sent to your email.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send password reset request.')
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
              <Icon name="school" className="text-primary text-5xl" filled />
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
              <p className="text-body-md text-on-surface-variant mt-2">Get back to managing your account safely.</p>
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Form Section */}
        <div className="p-container-padding-mobile md:p-stack-lg lg:p-16 flex flex-col justify-center text-left">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-stack-lg">
            <Icon name="school" className="text-primary text-3xl" filled />
            <span className="text-headline-lg-mobile font-bold text-primary tracking-tight">EduCore</span>
          </div>

          <div className="mb-stack-lg">
            <h1 className="text-headline-lg font-semibold text-on-surface">Forgot Password</h1>
            <p className="text-body-md text-on-surface-variant">Enter your email and we'll send you a password reset link valid for 30 minutes.</p>
          </div>

          <form className="space-y-stack-md" onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="space-y-base">
              <label className="text-label-md text-on-surface-variant ml-1" htmlFor="email">
                Registered Email Address
              </label>
              <div className="relative group">
                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-transparent border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50 font-semibold"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
                <Icon name="error" className="text-error text-sm" />
                <span className="text-label-md text-error font-semibold">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                <Icon name="check_circle" className="text-green-700 text-sm" />
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
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <Icon name="send" />
                </>
              )}
            </button>

            {/* Return to Login */}
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-label-md text-primary font-bold hover:underline flex items-center justify-center gap-1 mx-auto border-none bg-transparent cursor-pointer"
              >
                <Icon name="arrow_back" className="text-sm" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
