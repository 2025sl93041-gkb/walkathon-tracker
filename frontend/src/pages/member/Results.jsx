import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { getResults } from '../../services/api'
import EmptyState from '../../components/EmptyState'

function PersonalBanner({ data, userId }) {
  const isSoloWinner   = data.soloWinner?.user?.id === userId
  const isSoloRunnerUp = data.soloRunnerUp?.user?.id === userId
  const isDuoWinner    = data.duoWinner?.pair?.user1Id === userId || data.duoWinner?.pair?.user2Id === userId
  const isDuoRunnerUp  = data.duoRunnerUp?.pair?.user1Id === userId || data.duoRunnerUp?.pair?.user2Id === userId
  const myAwards       = (data.bonusAwards || []).filter(a => a.recipientUserId === userId)

  if (!isSoloWinner && !isSoloRunnerUp && !isDuoWinner && !isDuoRunnerUp && myAwards.length === 0) return null

  return (
    <div className="mb-8 space-y-3">
      {isSoloWinner && (
        <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
          <div className="text-4xl mb-1">🥇</div>
          <div className="text-white font-bold text-xl">You are the Solo Step Champion!</div>
          <div className="text-yellow-100 text-sm mt-1">{data.soloWinner.totalSteps?.toLocaleString()} steps · {data.soloWinner.daysLogged} days</div>
        </div>
      )}
      {isSoloRunnerUp && (
        <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#6b7280,#9ca3af)' }}>
          <div className="text-4xl mb-1">🥈</div>
          <div className="text-white font-bold text-xl">You are the Solo Runner-up!</div>
          <div className="text-gray-100 text-sm mt-1">{data.soloRunnerUp.totalSteps?.toLocaleString()} steps · {data.soloRunnerUp.daysLogged} days</div>
        </div>
      )}
      {isDuoWinner && (
        <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
          <div className="text-4xl mb-1">🥇</div>
          <div className="text-white font-bold text-xl">You & your partner are the Power Pair!</div>
          <div className="text-blue-100 text-sm mt-1">{data.duoWinner.combinedSteps?.toLocaleString()} combined steps</div>
        </div>
      )}
      {isDuoRunnerUp && (
        <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' }}>
          <div className="text-4xl mb-1">🥈</div>
          <div className="text-white font-bold text-xl">You & your partner are the Duo Runner-up!</div>
          <div className="text-purple-100 text-sm mt-1">{data.duoRunnerUp.combinedSteps?.toLocaleString()} combined steps</div>
        </div>
      )}
      {myAwards.map(a => (
        <div key={a.id} className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)' }}>
          <div className="text-4xl mb-1">🌟</div>
          <div className="text-white font-bold text-xl">{a.category}</div>
          {a.description && <div className="text-teal-100 text-sm mt-1 italic">{a.description}</div>}
        </div>
      ))}
    </div>
  )
}

export default function Results() {
  const { call, loading } = useApi()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    call(getResults, { showErrorToast: false })
      .then(r => r ? setData(r.data) : setError(true))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>

  if (error || !data) {
    return (
      <div className="animate-fade-in">
        <h1 className="page-title">🎉 Results</h1>
        <EmptyState
          title="Results not published yet"
          description="The organizer will publish results once all days are complete and verified."
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="page-title text-center">🎉 Final Results</h1>
      <p className="text-center text-gray-500 text-sm mb-8">Official Results</p>

      {/* Personal highlight banner */}
      <PersonalBanner data={data} userId={user?.id} />

      {/* Solo */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🏃 Solo Category</h2>
        {!data.soloWinner && !data.soloRunnerUp ? (
          <p className="text-sm text-gray-400 text-center py-2">No eligible solo participants yet (need ≥14 days logged).</p>
        ) : (
          <div className="space-y-4">
            {[
              { place: '🥇 Winner', entry: data.soloWinner },
              { place: '🥈 Runner-up', entry: data.soloRunnerUp },
            ].map(({ place, entry }) => entry && (
              <div key={place} className={`flex items-center gap-4 rounded-xl p-4 ${entry.user?.id === user?.id ? 'bg-yellow-50 ring-2 ring-yellow-300' : 'bg-gray-50'}`}>
                <div className="text-3xl">{place.split(' ')[0]}</div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">{place.split(' ').slice(1).join(' ')}</div>
                  <div className="text-xl font-bold text-gray-900">{entry.user?.fullName} {entry.user?.id === user?.id && <span className="text-sm text-yellow-600">(You)</span>}</div>
                  <div className="text-sm text-gray-500">{entry.totalSteps?.toLocaleString()} steps · {entry.daysLogged} days</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duo */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🤝 Duo Category</h2>
        {!data.duoWinner ? (
          <p className="text-sm text-gray-400 text-center py-2">No eligible duo pairs yet.</p>
        ) : (
          <div className="space-y-4">
            {[
              { place: '🥇 Winner', entry: data.duoWinner },
              { place: '🥈 Runner-up', entry: data.duoRunnerUp },
            ].map(({ place, entry }) => {
              const isMe = entry && (entry.pair?.user1Id === user?.id || entry.pair?.user2Id === user?.id)
              return entry && (
                <div key={place} className={`flex items-center gap-4 rounded-xl p-4 ${isMe ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'}`}>
                  <div className="text-3xl">{place.split(' ')[0]}</div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">{place.split(' ').slice(1).join(' ')}</div>
                    <div className="text-xl font-bold text-gray-900">
                      {entry.member1?.fullName} & {entry.member2?.fullName} {isMe && <span className="text-sm text-blue-600">(You)</span>}
                    </div>
                    <div className="text-sm text-gray-500">{entry.combinedSteps?.toLocaleString()} combined steps</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bonus awards — everyone sees all, own award highlighted */}
      {data.bonusAwards?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🌟 Special Awards</h2>
          <div className="space-y-3">
            {data.bonusAwards.map(a => {
              const isMe = a.recipientUserId === user?.id
              return (
                <div key={a.id} className={`flex items-center gap-4 rounded-xl p-4 ${isMe ? 'bg-teal-50 ring-2 ring-teal-300' : 'bg-yellow-50'}`}>
                  <div className="text-3xl">🌟</div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">{a.category}</div>
                    <div className="text-lg font-bold text-gray-900">{a.recipientName} {isMe && <span className="text-sm text-teal-600">(You)</span>}</div>
                    {a.description && <div className="text-sm text-gray-500">{a.description}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recap stats */}
      {data.recapStats && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📊 Team Recap</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{data.recapStats.teamTotalSteps?.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">Total Team Steps</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{data.recapStats.teamTotalKm} km</div>
              <div className="text-xs text-gray-600 mt-1">Distance Covered</div>
            </div>
            {data.recapStats.biggestSingleDay && (
              <div className="col-span-2 bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Biggest Single Day</div>
                <div className="text-xl font-bold text-orange-700">{data.recapStats.biggestSingleDay.stepCount?.toLocaleString()} steps</div>
                <div className="text-sm text-gray-600">by {data.recapStats.biggestSingleDay.fullName} on {data.recapStats.biggestSingleDay.logDate}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
