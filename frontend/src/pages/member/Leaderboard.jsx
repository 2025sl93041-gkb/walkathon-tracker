import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getLeaderboard } from '../../services/api'
import EmptyState from '../../components/EmptyState'

function Medal({ rank }) {
  return ['🥇','🥈','🥉'][rank - 1] || `#${rank}`
}

export default function Leaderboard() {
  const { call, loading } = useApi()
  const [data, setData] = useState(null)

  useEffect(() => {
    call(getLeaderboard, { showErrorToast: false }).then(r => r && setData(r.data))
  }, [])

  if (loading && !data) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">🏆 Leaderboard</h1>
        {data?.lastUpdated && (
          <span className="text-xs text-gray-400">Updated {new Date(data.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>

      {!data ? (
        <EmptyState title="No leaderboard data yet" description="Leaderboard updates once participants start logging steps." />
      ) : (
        <>
          {/* Fun stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{data.funStats?.teamTotalSteps?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Team Total Steps</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{data.funStats?.teamTotalKm?.toLocaleString()} km</div>
              <div className="text-xs text-gray-500 mt-1">Equivalent Distance</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-purple-700 truncate">{data.funStats?.mostConsistent?.fullName?.split(' ')[0] ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Most Consistent Walker</div>
              <div className="text-xs text-purple-500">{data.funStats?.mostConsistent?.daysLogged ?? 0} days</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-lg font-bold text-orange-700">{data.funStats?.biggestSingleDay?.stepCount?.toLocaleString() ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Biggest Single Day</div>
              <div className="text-xs text-orange-500 truncate">{data.funStats?.biggestSingleDay?.fullName?.split(' ')[0]}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Solo top 5 */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 bg-blue-700 text-white">
                <h2 className="font-semibold">🏃 Solo — Top 5</h2>
                <p className="text-blue-200 text-xs mt-0.5">Highest individual step count</p>
              </div>
              {data.solo?.length ? (
                <div className="divide-y divide-gray-100">
                  {data.solo.map(entry => (
                    <div key={entry.userId} className={`flex items-center gap-4 px-5 py-3 ${entry.rank === 1 ? 'bg-yellow-50' : ''}`}>
                      <span className="text-xl w-8 text-center"><Medal rank={entry.rank} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{entry.fullName}</div>
                        <div className="text-xs text-gray-500">{entry.eligibleDays} days logged {!entry.eligible && <span className="text-red-500">· ineligible</span>}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{entry.totalSteps?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">steps</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">No solo data yet</div>
              )}
            </div>

            {/* Duo top 3 */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 bg-purple-700 text-white">
                <h2 className="font-semibold">🤝 Duo — Top 3</h2>
                <p className="text-purple-200 text-xs mt-0.5">Highest combined step count per pair</p>
              </div>
              {data.duo?.length ? (
                <div className="divide-y divide-gray-100">
                  {data.duo.map(entry => (
                    <div key={entry.pairId} className={`flex items-center gap-4 px-5 py-3 ${entry.rank === 1 ? 'bg-yellow-50' : ''}`}>
                      <span className="text-xl w-8 text-center"><Medal rank={entry.rank} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {entry.member1?.fullName?.split(' ')[0]} + {entry.member2?.fullName?.split(' ')[0]}
                        </div>
                        <div className="text-xs text-gray-400">Duo Pair</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{entry.combinedSteps?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">combined</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">No pairs formed yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
