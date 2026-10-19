import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getLeaderboard, adminGetSnapshots, adminRecalculate } from '../../services/api'

export default function AdminLeaderboard() {
  const { call, loading } = useApi()
  const [live, setLive] = useState(null)
  const [snapWeek, setSnapWeek] = useState(3)
  const [snaps, setSnaps] = useState([])

  async function load() {
    const [l, s] = await Promise.all([
      call(getLeaderboard, { showErrorToast: false }),
      call(() => adminGetSnapshots(snapWeek), { showErrorToast: false }),
    ])
    if (l) setLive(l.data)
    if (s) setSnaps(s.data)
  }

  useEffect(() => { load() }, [snapWeek])

  async function recalc(week) {
    const res = await call(() => adminRecalculate(week), { successMsg: `Week ${week} leaderboard recalculated!` })
    if (res) load()
  }

  const soloSnaps = snaps.filter(s => s.category === 'solo')
  const duoSnaps  = snaps.filter(s => s.category === 'duo')

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">🏆 Leaderboard Admin</h1>

      {/* Recalculate buttons */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">Trigger Recalculation</h2>
        <p className="text-sm text-gray-500 mb-4">Manually store a leaderboard snapshot for a specific week end.</p>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map(w => (
            <button key={w} onClick={() => recalc(w)} disabled={loading} className="btn-secondary">
              {loading ? '…' : `Recalculate Week ${w}`}
            </button>
          ))}
        </div>
      </div>

      {/* Live leaderboard */}
      {live && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-blue-700 text-white text-sm font-semibold">🏃 Live Solo Top 5</div>
            <div className="divide-y divide-gray-100">
              {live.solo?.map(e => (
                <div key={e.userId} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-5 text-center font-bold text-gray-500">#{e.rank}</span>
                  <span className="flex-1 font-medium text-gray-900 truncate">{e.fullName}</span>
                  <span className={`text-xs ${e.eligible ? 'text-green-600' : 'text-red-500'}`}>{e.eligibleDays}d</span>
                  <span className="font-bold text-gray-900 text-right w-24">{e.totalSteps?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 bg-purple-700 text-white text-sm font-semibold">🤝 Live Duo Top 3</div>
            <div className="divide-y divide-gray-100">
              {live.duo?.map(e => (
                <div key={e.pairId} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="w-5 text-center font-bold text-gray-500">#{e.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {e.member1?.fullName?.split(' ')[0]} + {e.member2?.fullName?.split(' ')[0]}
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">{e.combinedSteps?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stored snapshots */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-semibold text-gray-900">Stored Snapshots</h2>
          <select className="input w-32" value={snapWeek} onChange={e => setSnapWeek(Number(e.target.value))}>
            <option value={1}>Week 1</option>
            <option value={2}>Week 2</option>
            <option value={3}>Week 3</option>
          </select>
        </div>
        {snaps.length === 0 ? (
          <p className="text-gray-500 text-sm">No snapshots for Week {snapWeek}. Click Recalculate above.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">SOLO</h3>
              {soloSnaps.map(s => (
                <div key={s.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                  <span>#{s.rank} {s.userId}</span>
                  <span className="font-bold">{s.totalSteps?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2">DUO</h3>
              {duoSnaps.map(s => (
                <div key={s.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                  <span>#{s.rank} Pair</span>
                  <span className="font-bold">{s.totalSteps?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
