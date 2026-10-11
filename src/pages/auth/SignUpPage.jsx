import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import logo from '../../assets/logo.png'
import Icon from '../../components/common/Icon'
import PrivacyPolicyModal from '../../components/common/PrivacyPolicyModal'

const INPUT =
  'w-full px-4 py-3.5 bg-transparent border border-outline-variant rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50'

function Field({ label, required, children }) {
  return (
    <div className="space-y-base">
      <label className="text-label-md text-on-surface-variant ml-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  )
}

const EMPTY = {
  org_name: '', owner_name: '', email: '', owner_phone: '', website_url: '',
  address: '', city: '', state: '', password: '', confirm: '', company_fax: '',
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const [policyOpen, setPolicyOpen] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (!agree) return setError('Please accept the terms to continue.')

    setLoading(true)
    try {
      const { confirm, ...payload } = form
      const { data } = await api.post('/auth/apply', payload)
      setDone(data)
    } catch (err) {
      const d = err.response?.data
      setError(d?.error || d?.detail || 'Could not submit your application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <main className="w-full max-w-lg bg-surface-container-lowest rounded-[32px] shadow-lg border border-outline-variant/30 p-8 md:p-10 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="check_circle" className="text-primary text-4xl" />
          </div>
          <h1 className="text-headline-lg font-semibold text-on-surface">Application submitted</h1>
          <p className="text-body-md text-on-surface-variant">
            Your application was successful. Our team will review it and get back to you at{' '}
            <b className="text-on-surface">{done.email || form.email}</b> once it is approved.
          </p>
          {done.reference && (
            <div className="inline-block px-4 py-2 rounded-xl bg-surface-container-low text-label-md text-on-surface-variant">
              Reference: <b className="text-on-surface tracking-wider">{done.reference}</b>
            </div>
          )}
          <p className="text-label-md text-outline">
            You can sign in with the email and password you just set after approval. Until then, signing in will show your application status.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full bg-primary text-on-primary py-4 rounded-xl text-title-lg font-bold shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all"
          >
            Back to sign in
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4 md:p-8">
      <main className="w-full max-w-2xl bg-surface-container-lowest rounded-[32px] shadow-lg border border-outline-variant/30 p-6 md:p-10">
        <div className="flex items-center gap-3 mb-stack-lg">
          <img src={logo} alt="Quality Education" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-headline-lg font-semibold text-on-surface">Apply for access</h1>
            <p className="text-body-md text-on-surface-variant">Register your school or institute. We will review and approve it.</p>
          </div>
        </div>

        <form className="space-y-stack-md" onSubmit={handleSubmit} autoComplete="off">
          {/* Hidden trap field — real people never see or fill this */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.company_fax}
            onChange={set('company_fax')}
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />

          <Field label="Organization name" required>
            <input className={INPUT} value={form.org_name} onChange={set('org_name')} placeholder="e.g. Sunrise Public School" required maxLength={120} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Owner / applicant name" required>
              <input className={INPUT} value={form.owner_name} onChange={set('owner_name')} placeholder="Full name" required maxLength={100} />
            </Field>
            <Field label="Phone number" required>
              <input className={INPUT} value={form.owner_phone} onChange={set('owner_phone')} placeholder="+91 98765 43210" required maxLength={20} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" required>
              <input type="email" className={INPUT} value={form.email} onChange={set('email')} placeholder="you@school.com" required maxLength={150} />
            </Field>
            <Field label="Website (optional)">
              <input className={INPUT} value={form.website_url} onChange={set('website_url')} placeholder="https://www.school.com" maxLength={200} />
            </Field>
          </div>

          <Field label="Address" required>
            <textarea className={INPUT} rows={2} value={form.address} onChange={set('address')} placeholder="Street, area" required maxLength={300} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="City" required>
              <input className={INPUT} value={form.city} onChange={set('city')} required maxLength={80} />
            </Field>
            <Field label="State" required>
              <input className={INPUT} value={form.state} onChange={set('state')} required maxLength={80} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${INPUT} pr-12`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                  required
                  maxLength={100}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
            </Field>
            <Field label="Confirm password" required>
              <input type={showPassword ? 'text' : 'password'} className={INPUT} value={form.confirm} onChange={set('confirm')} required maxLength={100} />
            </Field>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0" />
            <span className="text-label-md text-on-surface-variant">
              I confirm the details are correct and agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPolicyOpen(true) }}
                className="text-primary font-bold underline hover:opacity-80"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
              <Icon name="error" className="text-error text-sm" />
              <span className="text-label-md text-error">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl text-title-lg font-bold shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Icon name="progress_activity" className="animate-spin" /> : <span>Submit application</span>}
          </button>

          <p className="text-center text-label-md text-on-surface-variant">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
              Sign in
            </button>
          </p>
        </form>
      </main>
      <PrivacyPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </div>
  )
}
