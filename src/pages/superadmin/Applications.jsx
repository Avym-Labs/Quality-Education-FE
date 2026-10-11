import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'

const TABS = [
  { key: 'pending', label: 'Pending', countKey: 'pending' },
  { key: 'active', label: 'Approved', countKey: 'approved' },
  { key: 'rejected', label: 'Declined', countKey: 'rejected' },
]

const STATUS_STYLE = {
  pending_verification: 'bg-amber-50 text-amber-700',
  under_review: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  suspended: 'bg-slate-100 text-slate-600',
}
const STATUS_LABEL = {
  pending_verification: 'Pending',
  under_review: 'Pending',
  active: 'Approved',
  rejected: 'Declined',
  suspended: 'Suspended',
}

const fmt = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—')

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-outline-variant/15 text-xs">
      <span className="font-bold text-on-surface-variant">{label}</span>
      <span className="col-span-2 font-semibold text-on-surface break-words">{children || '—'}</span>
    </div>
  )
}

export default function Applications() {
  const [tab, setTab] = useState('pending')
  const [orgs, setOrgs] = useState([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/superadmin/organizations', { params: { status: tab } })
      setOrgs(data.organizations || [])
      if (data.counts) setCounts(data.counts)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load applications.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const openDetail = async (org) => {
    setSelected(org)
    setHistory([])
    setDeclining(false)
    setReason('')
    setActionError('')
    try {
      const { data } = await api.get(`/superadmin/organizations/${org.id}`)
      setHistory(data.verification_history || [])
    } catch { /* history is optional */ }
  }

  const approve = async () => {
    if (!window.confirm(`Approve "${selected.name}"? They will be able to sign in right away.`)) return
    setBusy(true)
    setActionError('')
    try {
      await api.post(`/superadmin/organizations/${selected.id}/approve`, {})
      setSelected(null)
      load()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not approve. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const decline = async () => {
    if (!reason.trim()) {
      setActionError('Please give a reason. The applicant will see it.')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      await api.post(`/superadmin/organizations/${selected.id}/reject`, { reason: reason.trim() })
      setSelected(null)
      load()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not decline. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const q = search.trim().toLowerCase()
  const visible = orgs.filter((o) =>
    !q || [o.name, o.owner_name, o.contact_email, o.admin_email, o.city, o.state].some((v) => String(v || '').toLowerCase().includes(q))
  )
  const canAct = selected && (selected.status === 'pending_verification' || selected.status === 'under_review' || selected.status === 'rejected')

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface">Applications</h1>
          <p className="text-body-md text-on-surface-variant">Organizations that signed up and are waiting for approval.</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex gap-2 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  tab === t.key ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm' : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {t.label} <span className="opacity-80">({counts[t.countKey] ?? 0})</span>
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, owner, email, city"
              className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {error && <div className="p-3 bg-error-container text-error text-xs font-semibold rounded-xl">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-16"><Icon name="progress_activity" className="animate-spin text-primary text-3xl" /></div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 text-xs font-semibold text-on-surface-variant">
            No applications here.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visible.map((o) => (
              <button
                key={o.id}
                onClick={() => openDetail(o)}
                className="text-left p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/35 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-on-surface truncate">{o.name}</h3>
                    <p className="text-[11px] font-semibold text-on-surface-variant truncate">
                      {o.owner_name || '—'} · {o.contact_email || o.admin_email || '—'}
                    </p>
                    <p className="text-[11px] text-outline font-semibold mt-0.5 truncate">
                      {[o.city, o.state].filter(Boolean).join(', ') || '—'} · Applied {fmt(o.verification_submitted_at || o.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => !busy && setSelected(null)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-[24px] p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-on-surface">{selected.name}</h2>
                <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_STYLE[selected.status] || ''}`}>
                  {STATUS_LABEL[selected.status] || selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-outline hover:text-on-surface"><Icon name="close" /></button>
            </div>

            <div>
              <Row label="Owner">{selected.owner_name}</Row>
              <Row label="Email">{selected.contact_email || selected.admin_email}</Row>
              <Row label="Phone">{selected.owner_phone || selected.contact_phone}</Row>
              <Row label="Website">
                {selected.website_url ? (
                  <a href={selected.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{selected.website_url}</a>
                ) : null}
              </Row>
              <Row label="Address">{selected.address}</Row>
              <Row label="City / State">{[selected.city, selected.state].filter(Boolean).join(', ')}</Row>
              <Row label="Applied">{fmt(selected.verification_submitted_at || selected.created_at)}</Row>
              <Row label="Reference">{selected.id.slice(-8).toUpperCase()}</Row>
              {selected.status === 'rejected' && <Row label="Decline reason">{selected.rejection_reason}</Row>}
            </div>

            {history.length > 0 && (
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">History</h4>
                <ul className="space-y-1">
                  {history.map((h) => (
                    <li key={h.id} className="text-[11px] text-on-surface-variant font-semibold">
                      {fmt(h.created_at)} — {STATUS_LABEL[h.new_status] || h.new_status}{h.notes ? ` (${h.notes})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {actionError && <div className="p-3 bg-error-container text-error text-xs font-semibold rounded-xl">{actionError}</div>}

            {canAct && !declining && (
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setDeclining(true); setActionError('') }} disabled={busy} className="flex-1 py-3 rounded-xl border border-error text-error text-xs font-bold hover:bg-red-50 disabled:opacity-60">
                  Decline
                </button>
                <button onClick={approve} disabled={busy} className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-60">
                  {busy ? 'Working…' : selected.status === 'rejected' ? 'Approve anyway' : 'Approve'}
                </button>
              </div>
            )}

            {canAct && declining && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant">Reason for declining (the applicant will see this)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setDeclining(false); setActionError('') }} disabled={busy} className="flex-1 py-3 rounded-xl border border-outline-variant text-xs font-bold disabled:opacity-60">Back</button>
                  <button onClick={decline} disabled={busy} className="flex-1 py-3 rounded-xl bg-error text-white text-xs font-bold hover:opacity-90 disabled:opacity-60">
                    {busy ? 'Working…' : 'Confirm decline'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
