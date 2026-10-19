import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminGetGrouping, adminMovePool, adminToggleExclude, adminCreatePair, adminBreakPair } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminGrouping() {
  const { call, loading } = useApi()
  const [data, setData] = useState(null)
  const [breakConfirm, setBreakConfirm] = useState(null)
  const [createPair, setCreatePair] = useState({ u1: '', u2: '' })
  const [pairError, setPairError] = useState('')

  async function load() {
    const r = await call(adminGetGrouping, { showErrorToast: false })
    if (r) setData(r.data)
  }

  useEffect(() => { load() }, [])

  async function movePool(userId, preference) {
    await call(() => adminMovePool(userId, preference), { successMsg: 'Pool updated' })
    load()
  }

  async function toggleExclude(userId, excluded) {
    await call(() => adminToggleExclude(userId, excluded), { successMsg: excluded ? 'User excluded from draw' : 'User included in draw' })
    load()
  }

  async function handleBreakPair() {
    await call(() => adminBreakPair(breakConfirm.id), { successMsg: 'Pair broken' })
    setBreakConfirm(null)
    load()
  }

  async function handleCreatePair(e) {
    e.preventDefault()
    setPairError('')
    if (!createPair.u1 || !createPair.u2) { setPairError('Select both users'); return }
    if (createPair.u1 === createPair.u2) { setPairError('Cannot pair a user with themselves'); return }
    const res = await call(() => adminCreatePair(createPair.u1, createPair.u2), { successMsg: 'Pair created!' })
    if (res) { setCreatePair({ u1: '', u2: '' }); load() }
  }

  const drawPool = data?.users?.filter(u => u.preference === 'draw' && !u.excludedFromDraw) ?? []
  const namePool = data?.users?.filter(u => u.preference === 'be_drawn' && !u.excludedFromDraw) ?? []
  const excluded = data?.users?.filter(u => u.excludedFromDraw) ?? []
  const unpaired = data?.users?.filter(u => !u.pairId) ?? []

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">🎲 Grouping Management</h1>

      {/* Pool summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{drawPool.length}</div>
          <div className="text-xs text-gray-500 mt-1">Draw Pool</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{namePool.length}</div>
          <div className="text-xs text-gray-500 mt-1">Name Pool</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{data?.pairs?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Pairs Formed</div>
        </div>
      </div>

      {/* Manual pair creation */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Create Pair Manually</h2>
        <form onSubmit={handleCreatePair} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">User 1</label>
            <select className="input w-48" value={createPair.u1} onChange={e => setCreatePair(p => ({ ...p, u1: e.target.value }))}>
              <option value="">Select user…</option>
              {unpaired.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">User 2</label>
            <select className="input w-48" value={createPair.u2} onChange={e => setCreatePair(p => ({ ...p, u2: e.target.value }))}>
              <option value="">Select user…</option>
              {unpaired.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>Create Pair</button>
          {pairError && <p className="field-error w-full">{pairError}</p>}
        </form>
      </div>

      {/* Current pairs */}
      {data?.pairs?.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Current Pairs ({data.pairs.length})</h2>
          <div className="space-y-2">
            {data.pairs.map(pair => {
              const u1 = data.users?.find(u => u.id === pair.user1Id)
              const u2 = data.users?.find(u => u.id === pair.user2Id)
              return (
                <div key={pair.id} className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex-1 text-sm font-medium text-gray-900">
                    {u1?.fullName} <span className="text-gray-400">+</span> {u2?.fullName}
                  </div>
                  <StatusBadge status={pair.method} />
                  <button onClick={() => setBreakConfirm(pair)} className="btn-danger btn-sm text-xs">Break</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All users table */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">All Members</h2>
        {!data?.users?.length ? (
          <p className="text-gray-500 text-sm">No members registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Pool', 'Paired', 'Excluded', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                    <td className="px-4 py-3">{u.preference ? <StatusBadge status={u.preference} /> : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.pairId ? 'paired' : 'unpaired'} /></td>
                    <td className="px-4 py-3 text-xs">{u.excludedFromDraw ? '🚫 Excluded' : '✅ Included'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {u.preference && !u.pairId && (
                          <button
                            onClick={() => movePool(u.id, u.preference === 'draw' ? 'be_drawn' : 'draw')}
                            className="btn-secondary btn-sm text-xs"
                          >
                            → {u.preference === 'draw' ? 'Name Pool' : 'Draw Pool'}
                          </button>
                        )}
                        <button
                          onClick={() => toggleExclude(u.id, !u.excludedFromDraw)}
                          className="btn-secondary btn-sm text-xs"
                        >
                          {u.excludedFromDraw ? 'Include' : 'Exclude'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!breakConfirm}
        title="Break this pair?"
        message="Both users will be returned to their respective pools and can be re-paired."
        confirmLabel="Break Pair"
        confirmClass="btn-danger"
        onConfirm={handleBreakPair}
        onCancel={() => setBreakConfirm(null)}
      />
    </div>
  )
}
