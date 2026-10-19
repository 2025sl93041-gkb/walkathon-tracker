import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useApi } from '../../hooks/useApi'
import { getConfig, getMyPair, getMyLogs, getDeadlineStatus } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', yellow: 'bg-yellow-50 text-yellow-700', red: 'bg-red-50 text-red-700' }
  return (
    <div className={`card p-5 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value ?? '—'}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function MemberDashboard() {
  const { user } = useAuth()
  const { call } = useApi()
  const [cfg, setCfg] = useState(null)
  const [pair, setPair] = useState(undefined)
  const [logs, setLogs] = useState(null)
  const [deadline, setDeadline] = useState(null)

  useEffect(() => {
    call(getConfig, { showErrorToast: false }).then(r => r && setCfg(r.data))
    call(getMyPair, { showErrorToast: false }).then(r => r && setPair(r.data))
    call(getMyLogs, { showErrorToast: false }).then(r => r && setLogs(r.data))
    call(getDeadlineStatus, { showErrorToast: false }).then(r => r && setDeadline(r.data))
  }, [])

  const submittedDays = logs?.submittedDays ?? 0
  const eligible = logs?.eligible ?? false
  const totalEventDays = logs?.totalEventDays ?? 21
  const recentLogs = (logs?.logs ?? []).filter(l => !l.isAutoZero && l.stepCount > 0).slice(-5).reverse()

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">👋 Welcome, {user?.fullName?.split(' ')[0]}!</h1>

      {/* Deadline alert */}
      {deadline && cfg?.challengeTabEnabled && (
        <div className={`mb-6 rounded-xl px-5 py-3 text-sm font-medium flex items-center gap-3 ${deadline.open ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-orange-50 text-orange-800 border border-orange-200'}`}>
          {deadline.open
            ? `✅ Form open — submit your steps for ${deadline.targetDate} before ${cfg.dailyDeadlineTime} AM`
            : `🔒 Deadline passed for ${deadline.targetDate}. Next slot opens at midnight.`}
          {deadline.open && (
            <Link to="/daily-log" className="ml-auto btn-primary btn-sm shrink-0">Log Steps →</Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Days Logged" value={submittedDays} sub={`out of ${totalEventDays}`} color="blue" />
        <StatCard label="Prize Eligibility" value={eligible ? '✅' : submittedDays >= 14 ? '✅' : `${14 - submittedDays} more`} sub="need 14 days" color={eligible ? 'green' : 'yellow'} />
        <StatCard label="Duo Pair" value={pair === null ? 'Not yet' : pair?.partner?.fullName?.split(' ')[0]} sub={pair ? 'paired' : 'draw pending'} color={pair ? 'green' : 'yellow'} />
        <StatCard label="Event" value={cfg?.eventName ? '🏃 Live' : '—'} sub={cfg ? `${cfg.startDate} → ${cfg.endDate}` : ''} color="blue" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cfg?.groupingTabEnabled && !pair && (
          <Link to="/grouping" className="card p-5 hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">🎲</div>
            <div className="font-semibold text-gray-900">Draw Your Partner</div>
            <div className="text-xs text-gray-500 mt-1">Pick your Duo teammate</div>
          </Link>
        )}
        {cfg?.challengeTabEnabled && (
          <Link to="/daily-log" className="card p-5 hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">👟</div>
            <div className="font-semibold text-gray-900">Log Today's Steps</div>
            <div className="text-xs text-gray-500 mt-1">{deadline?.open ? 'Form open now' : 'Check deadline status'}</div>
          </Link>
        )}
        <Link to="/leaderboard" className="card p-5 hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="font-semibold text-gray-900">View Leaderboard</div>
          <div className="text-xs text-gray-500 mt-1">Solo & Duo rankings</div>
        </Link>
      </div>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Logs</h2>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{log.logDate}</span>
                <span className="font-semibold text-gray-900">{log.stepCount?.toLocaleString()} steps</span>
                <StatusBadge status={log.isDisputed ? 'disputed' : 'submitted'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
