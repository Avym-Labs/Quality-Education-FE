import { useState } from 'react'
import api from '../../api/axios'
import Icon from './Icon'

// Settings row + confirmation dialog for deleting your own account.
// Google Play requires an in-app way to delete an account.
// Backend: GET /auth/me/deletion-info (what will be deleted), DELETE /auth/me (needs password).
export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState(null)
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openDialog = async () => {
    setOpen(true)
    setError('')
    setPassword('')
    setOrgName('')
    setInfo(null)
    try {
      const { data } = await api.get('/auth/me/deletion-info')
      setInfo(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load account details. Please try again.')
    }
  }

  const finishAndLeave = () => {
    // Drop this account from the saved-accounts switcher, clear the session, and go to login.
    try {
      const me = JSON.parse(localStorage.getItem('user') || '{}')
      const saved = JSON.parse(localStorage.getItem('educore_saved_accounts') || '[]')
      localStorage.setItem('educore_saved_accounts', JSON.stringify(saved.filter((a) => a.user_id !== me.id)))
    } catch { /* ignore */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleDelete = async () => {
    setError('')
    if (!password) {
      setError('Please enter your password to confirm.')
      return
    }
    setLoading(true)
    try {
      await api.delete('/auth/me', { data: { password, confirm_org_name: orgName } })
      finishAndLeave()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete the account. Please try again.')
      setLoading(false)
    }
  }

  const isOrg = info?.scope === 'organization'

  return (
    <>
      <div
        onClick={openDialog}
        className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl hover:bg-red-50 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <Icon name="delete_forever" className="text-error text-xl" />
          <div className="text-left">
            <h4 className="text-xs font-bold text-error">Delete Account</h4>
            <p className="text-[10px] text-red-400 font-semibold mt-0.5">Permanently delete your account and data</p>
          </div>
        </div>
        <Icon name="chevron_right" className="text-red-300 group-hover:translate-x-0.5 transition-transform text-lg" />
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => !loading && setOpen(false)}>
          <div className="w-full max-w-md bg-surface-container-lowest rounded-[24px] p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Icon name="warning" className="text-error text-2xl" />
              <h3 className="text-base font-black text-on-surface">Delete your account?</h3>
            </div>

            {isOrg ? (
              <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">
                You are the only admin of <b>{info.org_name}</b>. Deleting your account will{' '}
                <b className="text-error">permanently delete the whole organization</b>: every teacher and student account,
                attendance, results, homework, announcements, chats and uploaded files. This cannot be undone.
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant font-semibold leading-relaxed">
                This permanently deletes your account and your personal records (attendance, results, messages and
                notifications). Content you created for the school, such as homework and announcements, stays with the school. This cannot be undone.
              </p>
            )}

            {isOrg && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant">Type the organization name to confirm</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={info.org_name}
                  className="w-full px-3 py-3 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant">Enter your password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl">
                <Icon name="error" className="text-error text-sm" />
                <span className="text-xs font-semibold text-error">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || !info}
                className="flex-1 py-3 rounded-xl bg-error text-white text-xs font-bold hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Deleting…' : isOrg ? 'Delete organization' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
