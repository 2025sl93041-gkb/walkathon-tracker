import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminGetAllLogs, adminDisputeLog, adminApplyAutoZeros } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function AdminLogs() {
  const { call, loading } = useApi()
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    const r = await call(adminGetAllLogs, { showErrorToast: false })
    if (r) setData(r.data)
  }

  useEffect(() => { load() }, [])

  async function toggleDispute(logId, current) {
    await call(() => adminDisputeLog(logId, !current), { successMsg: !current ? '⚠️ Log flagged as disputed' : 'Dispute cleared' })
    load()
  }

  async function viewProof(logId) {
    const token = localStorage.getItem('wt_token')
    const base = import.meta.env.VITE_API_URL ?? ''
    const res = await fetch(`${base}/api/logs/admin/${logId}/proof`, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    })
    if (res.ok) window.open(res.url, '_blank')
  }

  async function applyZeros() {
    const res = await call(adminApplyAutoZeros, { successMsg: 'Auto-zeros applied' })
    if (res) load()
  }

  const filtered = (data?.matrix ?? []).filter(row => {
    const matchSearch = search === '' || row.user.fullName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'ineligible' && !row.eligible) || (filter === 'disputed' && row.logs.some(l => l.isDisputed))
    return matchSearch && matchFilter
  })

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
        <h1 className="page-title mb-0">📋 Daily Logs</h1>
        <button onClick={applyZeros} className="btn-secondary btn-sm" disabled={loading}>
          Apply Auto-zeros
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input className="input max-w-xs" placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-44" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All members</option>
          <option value="ineligible">Ineligible only</option>
          <option value="disputed">Disputed logs</option>
        </select>
      </div>

      {!data ? (
        <div className="flex justify-center py-20"><div className="spinner" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(row => (
            <div key={row.user.id} className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 text-sm">{row.user.fullName}</span>
                  <StatusBadge status={row.eligible ? 'eligible' : 'ineligible'} />
                  <span className="text-xs text-gray-500">{row.submittedDays} / {data.dates?.length ?? 21} days</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Date</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-500">Steps</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Submitted</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Proof</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {row.logs.map((log, i) => (
                      <tr key={log.id ?? i} className={`hover:bg-blue-50 ${log.isDisputed ? 'bg-orange-50' : ''}`}>
                        <td className="px-3 py-2 text-gray-700">{log.logDate}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {log.missing ? '—' : log.isAutoZero ? '0 (auto)' : log.stepCount?.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {log.submittedAt ? new Date(log.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {log.missing ? <StatusBadge status="missing" /> : log.isAutoZero ? <StatusBadge status="auto_zero" /> : log.isDisputed ? <StatusBadge status="disputed" /> : <StatusBadge status="submitted" />}
                        </td>
                        <td className="px-3 py-2">
                          {log.proofStoragePath
                            ? <button onClick={() => viewProof(log.id)} className="text-xs text-blue-600 hover:underline font-medium">View</button>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {log.id && !log.missing && !log.isAutoZero && (
                            <button
                              onClick={() => toggleDispute(log.id, log.isDisputed)}
                              className={`text-xs px-2 py-1 rounded ${log.isDisputed ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                              {log.isDisputed ? '⚠️ Disputed' : 'Flag'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">No results match your filters.</div>
          )}
        </div>
      )}
    </div>
  )
}
