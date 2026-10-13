import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import api from '../../api/axios'
import Icon from '../../components/common/Icon'

// Admin "Statistics": figures and tables only (no charts), filterable by
// overall / class / subject and by last 7 days / month / custom dates.

const pct = (v) => {
  const n = Number(v) || 0
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`
}
const num = (v) => Number(v) || 0
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const niceDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString([], { dateStyle: 'medium' })

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
        active ? 'bg-gradient-to-r from-[#6351E0] to-[#DD62F2] text-white shadow-sm' : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
      }`}
    >
      {children}
    </button>
  )
}

function Card({ title, children }) {
  return (
    <section className="bg-surface-container-lowest p-5 rounded-[20px] border border-outline-variant/35">
      {title && <h3 className="text-sm font-black text-on-surface mb-3">{title}</h3>}
      {children}
    </section>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/35">
      <p className="text-2xl font-black text-primary leading-none">{value}</p>
      <p className="text-[11px] font-bold text-on-surface-variant mt-1.5">{label}</p>
    </div>
  )
}

function KV({ label, value, bold }) {
  return (
    <div className="flex justify-between py-1.5 text-xs border-b border-outline-variant/10 last:border-0">
      <span className="text-on-surface-variant font-semibold">{label}</span>
      <span className={`text-on-surface ${bold ? 'font-black' : 'font-bold'}`}>{value}</span>
    </div>
  )
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-container-low text-on-surface-variant">
            {headers.map((h, i) => (
              <th key={h} className={`px-3 py-2 font-black ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-outline-variant/10 last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`px-3 py-2 font-semibold text-on-surface ${i === 0 ? 'text-left' : 'text-right'}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function People({ items, trailing, subtitle }) {
  return (
    <ul className="list-none p-0 m-0 divide-y divide-outline-variant/10">
      {items.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">{p.name}</p>
            <p className="text-[11px] text-on-surface-variant font-semibold">{subtitle(p)}</p>
          </div>
          <span className="text-sm font-black text-primary">{trailing(p)}</span>
        </li>
      ))}
    </ul>
  )
}

const SELECT = 'px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-bold outline-none focus:border-primary'

export default function Statistics() {
  const now = new Date()
  const [scope, setScope] = useState('overall')
  const [classKey, setClassKey] = useState('')
  const [subject, setSubject] = useState('')
  const [period, setPeriod] = useState('month')
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)))
  const [to, setTo] = useState(iso(now))

  const [options, setOptions] = useState({ classes: [], subjects: [] })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reqId = useRef(0)

  useEffect(() => {
    api.get('/admin/statistics/options').then(({ data: d }) => setOptions({ classes: d.classes || [], subjects: d.subjects || [] })).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    const params = { scope, period }
    if (scope === 'class') {
      if (!classKey) { setData(null); setLoading(false); return }
      params.class = classKey
    }
    if (scope === 'subject') {
      if (!subject) { setData(null); setLoading(false); return }
      params.subject = subject
      if (classKey) params.class = classKey
    }
    if (period === 'month') params.month = monthKey(month)
    if (period === 'custom') { params.from = from; params.to = to }

    const id = ++reqId.current
    setLoading(true)
    setError('')
    try {
      const { data: d } = await api.get('/admin/statistics', { params })
      if (id === reqId.current) setData(d)
    } catch (err) {
      if (id === reqId.current) setError(err.response?.data?.detail || 'Could not load statistics.')
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [scope, classKey, subject, period, month, from, to])

  useEffect(() => { load() }, [load])

  const changeScope = (s) => {
    setScope(s)
    if (s === 'overall') { setClassKey(''); setSubject('') }
    if (s === 'class' && !classKey) setClassKey(options.classes[0] || '')
    if (s === 'subject' && !subject) setSubject(options.subjects[0] || '')
  }

  const canGoNext = month < new Date(now.getFullYear(), now.getMonth(), 1)
  const att = data?.attendance
  const perf = data?.performance
  const empty = data && num(att.total_records) === 0 && num(perf.results_count) === 0

  return (
    <DashboardLayout>
      <div className="space-y-stack-lg pb-24">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface">Statistics</h1>
          <p className="text-body-md text-on-surface-variant">Attendance and performance figures for your organisation.</p>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Chip active={scope === 'overall'} onClick={() => changeScope('overall')}>Overall</Chip>
              <Chip active={scope === 'class'} onClick={() => changeScope('class')}>Class</Chip>
              <Chip active={scope === 'subject'} onClick={() => changeScope('subject')}>Subject</Chip>
            </div>

            {scope !== 'overall' && (
              <div className="flex flex-wrap gap-3">
                {scope === 'subject' && (
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className={SELECT}>
                    <option value="" disabled>Choose subject</option>
                    {options.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <select value={classKey} onChange={(e) => setClassKey(e.target.value)} className={SELECT}>
                  {scope === 'subject' ? <option value="">All classes</option> : <option value="" disabled>Choose class</option>}
                  {options.classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Chip active={period === 'week'} onClick={() => setPeriod('week')}>Last 7 days</Chip>
              <Chip active={period === 'month'} onClick={() => setPeriod('month')}>Month</Chip>
              <Chip active={period === 'custom'} onClick={() => setPeriod('custom')}>Custom</Chip>

              {period === 'month' && (
                <div className="flex items-center gap-1 ml-2">
                  <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-surface-container-high border-none bg-transparent cursor-pointer">
                    <Icon name="chevron_left" />
                  </button>
                  <span className="text-xs font-black text-on-surface min-w-[110px] text-center">
                    {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </span>
                  <button type="button" disabled={!canGoNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-surface-container-high border-none bg-transparent cursor-pointer disabled:opacity-30">
                    <Icon name="chevron_right" />
                  </button>
                </div>
              )}

              {period === 'custom' && (
                <div className="flex items-center gap-2 ml-2">
                  <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={SELECT} />
                  <span className="text-xs font-bold text-on-surface-variant">to</span>
                  <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={SELECT} />
                </div>
              )}
            </div>

            {data && <p className="text-[11px] font-semibold text-outline">{niceDate(data.from)} to {niceDate(data.to)}</p>}
          </div>
        </Card>

        {loading && <div className="flex justify-center py-12"><Icon name="progress_activity" className="animate-spin text-primary text-3xl" /></div>}
        {!loading && error && <div className="p-3 bg-error-container text-error text-xs font-semibold rounded-xl">{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Kpi label="Students" value={num(data.students_total)} />
              <Kpi label="Attendance rate" value={pct(att.rate)} />
              <Kpi label="Average score" value={pct(perf.avg_percentage)} />
              <Kpi label="Pass rate" value={pct(perf.pass_rate)} />
              <Kpi label="Tests held" value={num(perf.tests_count)} />
              <Kpi label="Results recorded" value={num(perf.results_count)} />
            </div>

            {empty && <Card><p className="text-center text-xs font-semibold text-on-surface-variant">No data for this selection.</p></Card>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Attendance">
                <KV label="Attendance records" value={num(att.total_records)} />
                <KV label="Present" value={num(att.present)} />
                <KV label="Absent" value={num(att.absent)} />
                <KV label="Late" value={num(att.late)} />
                <KV label="Attendance rate" value={pct(att.rate)} bold />
                <KV label={`Students below ${data.low_attendance_threshold}% attendance`} value={num(data.below_threshold_count)} />
              </Card>

              <Card title="Performance">
                <KV label="Average score" value={pct(perf.avg_percentage)} bold />
                <KV label="Highest score" value={pct(perf.highest)} />
                <KV label="Lowest score" value={pct(perf.lowest)} />
                <KV label="Passed" value={num(perf.passed)} />
                <KV label="Failed" value={num(perf.failed)} />
                <KV label="Pass rate" value={pct(perf.pass_rate)} />
                <p className="text-[11px] font-black text-on-surface-variant mt-3 mb-1">Grade distribution</p>
                <Table headers={Object.keys(perf.grade_distribution)} rows={[Object.values(perf.grade_distribution).map(num)]} />
                <p className="text-[10px] text-outline font-semibold mt-2">Pass mark is {data.pass_mark}%.</p>
              </Card>
            </div>

            {data.by_class?.length > 0 && (
              <Card title="By class">
                <Table
                  headers={['Class', 'Students', 'Attendance', 'Avg score', 'Pass rate']}
                  rows={data.by_class.map((r) => [r.class, num(r.students), pct(r.attendance_rate), pct(r.avg_score), pct(r.pass_rate)])}
                />
              </Card>
            )}

            {data.by_subject?.length > 0 && (
              <Card title="By subject">
                <Table
                  headers={['Subject', 'Attendance', 'Avg score', 'Pass rate', 'Results']}
                  rows={data.by_subject.map((r) => [r.subject, pct(r.attendance_rate), pct(r.avg_score), pct(r.pass_rate), num(r.results)])}
                />
              </Card>
            )}

            {data.timeline?.length > 0 && (
              <Card title="Timeline">
                <Table
                  headers={['Period', 'Attendance', 'Avg score', 'Results']}
                  rows={data.timeline.map((r) => [r.label, pct(r.attendance_rate), pct(r.avg_score), num(r.results)])}
                />
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {data.low_attendance?.length > 0 && (
                <Card title="Low attendance students">
                  <People items={data.low_attendance} trailing={(p) => pct(p.rate)} subtitle={(p) => `${p.class} • ${p.absent} absent`} />
                </Card>
              )}
              {data.top_performers?.length > 0 && (
                <Card title="Top performers">
                  <People items={data.top_performers} trailing={(p) => pct(p.average)} subtitle={(p) => `${p.class} • ${p.tests} results`} />
                </Card>
              )}
              {data.needs_attention?.length > 0 && (
                <Card title="Needs attention">
                  <People items={data.needs_attention} trailing={(p) => pct(p.average)} subtitle={(p) => `${p.class} • ${p.tests} results`} />
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
