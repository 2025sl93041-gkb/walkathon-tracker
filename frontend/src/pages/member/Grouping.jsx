import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import { getPoolStatus, getMyPair, performDraw } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function Grouping() {
  const { user } = useAuth()
  const { call, loading } = useApi()
  const [poolStatus, setPoolStatus] = useState(null)
  const [pair, setPair] = useState(undefined)
  const [preference, setPreference] = useState(null)
  const [drawing, setDrawing] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [newPair, setNewPair] = useState(null)

  async function load() {
    const [ps, p] = await Promise.all([
      call(getPoolStatus, { showErrorToast: false }),
      call(getMyPair, { showErrorToast: false }),
    ])
    if (ps) setPoolStatus(ps.data)
    if (p) { setPair(p.data?.pair ?? null); setPreference(p.data?.preference ?? null) }
  }

  useEffect(() => { load() }, [])

  async function handleDraw() {
    setAnimating(true)
    setTimeout(async () => {
      setDrawing(true)
      const res = await call(performDraw, { successMsg: '🎉 You drew a partner!' })
      setDrawing(false)
      setAnimating(false)
      if (res?.data) {
        setNewPair(res.data)
        setPair(res.data)
        load()
      }
    }, 1800)
  }

  const alreadyPaired = !!pair

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <h1 className="page-title">🎲 Chit Draw</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Draw a name from the box to find your Duo partner. Each person draws exactly once.
      </p>

      {/* Pool counts */}
      {poolStatus && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-5 text-center">
            <div className="text-3xl font-bold text-blue-700">{poolStatus.drawPoolAvailable}</div>
            <div className="text-sm text-gray-600 mt-1">Available in Draw Pool</div>
            <div className="text-xs text-gray-400">of {poolStatus.drawPoolTotal} total</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl font-bold text-purple-700">{poolStatus.namePoolAvailable}</div>
            <div className="text-sm text-gray-600 mt-1">Available in Name Pool</div>
            <div className="text-xs text-gray-400">of {poolStatus.namePoolTotal} total</div>
          </div>
        </div>
      )}

      {/* Already paired */}
      {alreadyPaired ? (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're paired!</h2>
          <div className="bg-blue-50 rounded-xl p-5 mt-4">
            <div className="text-sm text-gray-500 mb-1">Your Duo Partner</div>
            <div className="text-2xl font-bold text-blue-900">{pair.partner?.fullName}</div>
            <div className="text-sm text-gray-500 mt-1">{pair.partner?.email}</div>
            <div className="mt-3">
              <StatusBadge status={pair.method ?? 'chit_draw'} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Pair formed on {pair.createdAt?.split('T')[0]}</p>
        </div>
      ) : preference === 'be_drawn' ? (
        /* Waiting to be drawn */
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your name is in the box</h2>
          <p className="text-sm text-gray-500 mb-4">
            You're in the Name Pool. Wait for a teammate to draw your name — you'll be notified when paired.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-5 py-3 inline-block">
            <StatusBadge status="be_drawn" />
          </div>
        </div>
      ) : (
        /* Draw box */
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Draw a Name</h2>
          <p className="text-sm text-gray-500 mb-8">Click the box to randomly draw your Duo partner</p>

          {/* Animated box */}
          <div className="relative flex flex-col items-center mb-8">
            <div
              className={`w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 ${animating ? 'animate-bounce2' : 'hover:scale-105'}`}
              onClick={!animating && !drawing && poolStatus?.namePoolAvailable > 0 ? handleDraw : undefined}
            >
              {animating ? (
                <div className="text-4xl animate-spin">🎲</div>
              ) : (
                <div className="text-5xl">📦</div>
              )}
            </div>
            {animating && (
              <div className="mt-4 text-blue-600 font-medium animate-pulse">Drawing a name…</div>
            )}
          </div>

          {poolStatus?.namePoolAvailable === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              No names available in the box. Ask admin to add members to the Name Pool.
            </div>
          ) : (
            <button
              className="btn-primary"
              onClick={handleDraw}
              disabled={animating || drawing || loading}
            >
              {animating ? 'Drawing…' : '🎲 Draw a Name'}
            </button>
          )}
        </div>
      )}

      {/* New pair reveal */}
      {newPair && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-green-800 font-semibold">You drew <strong>{newPair.partner?.fullName}</strong>!</p>
          <p className="text-green-700 text-sm mt-1">You are now a Duo team. Good luck! 🏃</p>
        </div>
      )}
    </div>
  )
}
