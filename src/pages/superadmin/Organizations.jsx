import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'

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

const fmt = (d) => (d ? new Date(d).toLocaleDateString([], { dateStyle: 'medium' }) : '—')

function Stat({ label, value, icon, tone }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
        <Icon name={icon} className="text-xl" />
      </div>
      <div>
        <p className="text-2xl font-black text-on-surface leading-none">{value ?? 0}</p>
        <p className="text-[11px] font-bold text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-outline-variant/15 text-xs">
      <span className="font-bold text-on-surface-variant">{label}</span>
      <span className="col-span-2 font-semibold text-on-surface break-words">{children || '—'}</span>
    </div>
  )
}

export default function Organizations() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/superadmin/organizations')
      setOrgs(data.organizations || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load organisations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const open = async (org) => {
    setSelected(org)
    setDetail(null)
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/superadmin/organizations/${org.id}`)
      setDetail(data)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const q = search.trim().toLowerCase()
  const visible = orgs.filter((o) =>
    !q || [o.name, o.owner_name, o.contact_email, o.admin_email, o.city, o.state].some((v) => String(v || '').toLowerCase().includes(q))
  )
  const org = detail?.organization || selected
  const stats = detail?.stats

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface">Organisations</h1>
          <p className="text-body-md text-on-surface-variant">Every organisation on the platform with its students, teachers, classes and admins.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations"
            className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <div className="p-3 bg-error-container text-error text-xs font-semibold rounded-xl">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-16"><Icon name="progress_activity" className="animate-spin text-primary text-3xl" /></div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center bg-surface-container-lowest rounded-[24px] border border-outline-variant/35 text-xs font-semibold text-on-surface-variant">
            No organisations found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visible.map((o) => (
              <button
                key={o.id}
                onClick={() => open(o)}
                className="text-left p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/35 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-on-surface truncate">{o.name}</h3>
                    <p className="text-[11px] font-semibold text-on-surface-variant truncate">{o.contact_email || o.admin_email || '—'}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  {[
                    ['Students', o.students_count, 'text-emerald-600'],
                    ['Teachers', o.teachers_count, 'text-blue-600'],
                    ['Classes', o.classes_count, 'text-amber-600'],
                    ['Admins', o.admins_count, 'text-primary'],
                  ].map(([label, n, tone]) => (
                    <div key={label}>
                      <p className={`text-lg font-black ${tone}`}>{n ?? 0}</p>
                      <p className="text-[9.5px] font-bold text-on-surface-variant">{label}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-[24px] p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-on-surface">{org.name}</h2>
                <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_STYLE[org.status] || ''}`}>
                  {STATUS_LABEL[org.status] || org.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-outline hover:text-on-surface"><Icon name="close" /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-8"><Icon name="progress_activity" className="animate-spin text-primary text-2xl" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Students" value={stats?.students} icon="school" tone="bg-emerald-50 text-emerald-600" />
                  <Stat label="Teachers" value={stats?.teachers} icon="badge" tone="bg-blue-50 text-blue-600" />
                  <Stat label="Classes" value={stats?.classes} icon="class" tone="bg-amber-50 text-amber-600" />
                  <Stat label="Admins" value={stats?.admins} icon="shield" tone="bg-primary/10 text-primary" />
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">Organisation details</h4>
                  <Row label="Owner">{org.owner_name}</Row>
                  <Row label="Email">{org.contact_email}</Row>
                  <Row label="Phone">{org.owner_phone || org.contact_phone}</Row>
                  <Row label="Website">
                    {org.website_url ? <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{org.website_url}</a> : null}
                  </Row>
                  <Row label="Address">{org.address}</Row>
                  <Row label="City / State">{[org.city, org.state].filter(Boolean).join(', ')}</Row>
                  <Row label="Plan">{org.plan}</Row>
                  <Row label="Created">{fmt(org.created_at)}</Row>
                  <Row label="Reference">{org.id?.slice(-8).toUpperCase()}</Row>
                  {org.status === 'rejected' && <Row label="Decline reason">{org.rejection_reason}</Row>}
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">Administrators</h4>
                  {(detail?.admins || []).length === 0 ? (
                    <p className="text-xs text-on-surface-variant font-semibold">No administrators.</p>
                  ) : (
                    <ul className="space-y-2 list-none p-0 m-0">
                      {detail.admins.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 p-3 bg-surface-container-low rounded-xl">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-on-surface truncate">{a.full_name}</p>
                            <p className="text-[11px] text-on-surface-variant font-semibold truncate">{a.email}{a.phone ? ` • ${a.phone}` : ''}</p>
                          </div>
                          {!a.is_active && <span className="text-[10px] font-black text-error">Inactive</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
