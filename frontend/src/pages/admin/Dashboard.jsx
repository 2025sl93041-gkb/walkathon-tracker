import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { getAdminConfig, getAllUsers, adminGetAllLogs } from '../../services/api'

function StatCard({ label, value, to, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', yellow: 'bg-yellow-50 text-yellow-700', purple: 'bg-purple-50 text-purple-700' }
  const inner = (
    <div className={`card p-5 ${colors[color || 'blue']}`}>
      <div className="text-3xl font-bold">{value ?? '—'}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function AdminDashboard() {
  const { call } = useApi()
  const [cfg, setCfg] = useState(null)
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    call(getAdminConfig, { showErrorToast: false }).then(r => r && setCfg(r.data))
    call(getAllUsers, { showErrorToast: false }).then(r => r && setUsers(r.data))
    call(adminGetAllLogs, { showErrorToast: false }).then(r => r && setLogs(r.data))
  }, [])

  const totalUsers = users.length
  const pairedUsers = users.filter(u => u.isPaired).length
  const eligibleUsers = users.filter(u => u.eligible).length
  const disputedCount = logs?.matrix?.flatMap(m => m.logs).filter(l => l.isDisputed).length ?? 0

  const alerts = []
  if (cfg?.registrationOpen) alerts.push({ msg: 'Registration is open', to: '/admin/event', icon: '📝' })
  if (pairedUsers < totalUsers && cfg?.groupingTabEnabled) alerts.push({ msg: `${totalUsers - pairedUsers} users still unpaired`, to: '/admin/grouping', icon: '🎲' })
  if (disputedCount > 0) alerts.push({ msg: `${disputedCount} disputed log entries`, to: '/admin/logs', icon: '⚠️' })
  if (!cfg?.resultsPublished && !cfg?.challengeTabEnabled && logs) alerts.push({ msg: 'Event ended — consider publishing results', to: '/admin/results', icon: '🎉' })

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">⚙️ Admin Dashboard</h1>

      {/* Alerts */}
      {alerts.map(a => (
        <Link key={a.msg} to={a.to} className="flex items-center gap-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 hover:bg-yellow-100 transition-colors">
          <span className="text-xl">{a.icon}</span>
          <span className="text-yellow-800 text-sm font-medium">{a.msg}</span>
          <span className="ml-auto text-yellow-600">→</span>
        </Link>
      ))}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4">
        <StatCard label="Total Members" value={totalUsers} to="/admin/users" color="blue" />
        <StatCard label="Paired" value={pairedUsers} to="/admin/grouping" color="green" />
        <StatCard label="Prize Eligible" value={eligibleUsers} to="/admin/logs" color="purple" />
        <StatCard label="Disputed Logs" value={disputedCount} to="/admin/logs" color={disputedCount > 0 ? 'yellow' : 'blue'} />
      </div>

      {/* Event status */}
      {cfg && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Event Status</h2>
            <Link to="/admin/event" className="btn-secondary btn-sm">Edit Config</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              { k: 'Event Name', v: cfg.eventName },
              { k: 'Dates', v: `${cfg.startDate || '—'} → ${cfg.endDate || '—'}` },
              { k: 'Deadline', v: cfg.dailyDeadlineTime + ' AM (IST)' },
              { k: 'Registration', v: cfg.registrationOpen ? '🟢 Open' : '🔴 Closed' },
              { k: 'Grouping Tab', v: cfg.groupingTabEnabled ? '🟢 On' : '⚫ Off' },
              { k: 'Challenge Tab', v: cfg.challengeTabEnabled ? '🟢 On' : '⚫ Off' },
              { k: 'Results', v: cfg.resultsPublished ? '🟢 Published' : '⚫ Hidden' },
            ].map(({ k, v }) => (
              <div key={k}>
                <div className="text-gray-500 text-xs">{k}</div>
                <div className="font-medium text-gray-900 mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/admin/event', icon: '⚙️', label: 'Event Config' },
          { to: '/admin/users', icon: '👥', label: 'Manage Users' },
          { to: '/admin/grouping', icon: '🎲', label: 'Manage Pairs' },
          { to: '/admin/logs', icon: '📋', label: 'View All Logs' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card p-5 text-center hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-sm font-medium text-gray-700">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
