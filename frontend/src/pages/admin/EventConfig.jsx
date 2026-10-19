import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getAdminConfig, updateConfig, setEventStatus, resetEvent } from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const FIELDS = [
  { key: 'eventName',         label: 'Event Name',            type: 'text' },
  { key: 'startDate',         label: 'Start Date',            type: 'date' },
  { key: 'endDate',           label: 'End Date',              type: 'date' },
  { key: 'dailyOpenTime',     label: 'Daily Window Open Time', type: 'time' },
  { key: 'dailyDeadlineTime', label: 'Daily Deadline Time',   type: 'time' },
]
const TOGGLES = [
  { key: 'registrationOpen',    label: '📝 Registration Open',              sub: 'Allow new members to register' },
  { key: 'groupingTabEnabled',  label: '🎲 Grouping Tab',                   sub: 'Show chit draw tab to members' },
  { key: 'challengeTabEnabled', label: '👟 Daily Log Tab',                  sub: 'Show daily log tab to members' },
  { key: 'resultsPublished',    label: '🎉 Results Published',              sub: 'Show results tab to everyone' },
  { key: 'leaderboardAutoRecalc', label: '📊 Auto-recalculate Leaderboard', sub: 'Recalculate on Day 7, 14, 21' },
]

const STATUS_LABELS = {
  draft:        { label: 'Draft',        color: 'bg-gray-100 text-gray-700' },
  registration: { label: 'Registration', color: 'bg-blue-100 text-blue-700' },
  active:       { label: 'Active',       color: 'bg-green-100 text-green-700' },
  completed:    { label: 'Completed',    color: 'bg-purple-100 text-purple-700' },
}

export default function EventConfig() {
  const { call, loading } = useApi()
  const [cfg, setCfg] = useState(null)
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  async function reload() {
    const r = await call(getAdminConfig, { showErrorToast: false })
    if (r) { setCfg(r.data); setForm(r.data) }
  }

  useEffect(() => { reload() }, [])

  async function handleSave(e) {
    e.preventDefault()
    const res = await call(() => updateConfig(form), { successMsg: 'Event config saved!' })
    if (res) { setCfg(res.data); setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  async function handleStatus(status) {
    const res = await call(() => setEventStatus(status), { successMsg: `Status set to: ${status}` })
    if (res) reload()
  }

  async function handleReset() {
    const res = await call(resetEvent, { successMsg: 'Event reset. All data cleared, users kept.' })
    if (res) reload()
    setResetConfirm(false)
  }

  function toggle(key) {
    setForm(f => ({ ...f, [key]: !f[key] }))
  }

  if (!cfg) return <div className="flex justify-center py-20"><div className="spinner" /></div>

  const statusInfo = STATUS_LABELS[cfg.eventStatus] || STATUS_LABELS.draft

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="page-title">⚙️ Event Config</h1>

      {/* Event status control */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Event Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleStatus('registration')}
            disabled={loading || cfg.eventStatus === 'registration'}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            📝 Open Registration
          </button>
          <button
            onClick={() => handleStatus('active')}
            disabled={loading || cfg.eventStatus === 'active'}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            🏃 Start Event
          </button>
          <button
            onClick={() => handleStatus('completed')}
            disabled={loading || cfg.eventStatus === 'completed'}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            🏁 End Event
          </button>
          <button
            onClick={() => handleStatus('draft')}
            disabled={loading || cfg.eventStatus === 'draft'}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            ↩ Back to Draft
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setResetConfirm(true)}
            className="btn-danger text-sm"
          >
            🗑 Reset Event Data
          </button>
          <p className="text-xs text-gray-400 mt-1">Wipes all logs, pairs, awards. Keeps users.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Text/date fields */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input
                  className="input"
                  type={f.type}
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tab Visibility & Controls</h2>
          <div className="space-y-3">
            {TOGGLES.map(t => (
              <label key={t.key} className="flex items-center justify-between gap-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.sub}</div>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${form[t.key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                  onClick={() => toggle(t.key)}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form[t.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Config'}
          </button>
          {saved && <span className="text-green-600 text-sm font-medium">✅ Saved!</span>}
        </div>
      </form>

      <ConfirmDialog
        open={resetConfirm}
        title="Reset all event data?"
        message="This permanently deletes all daily logs, pairs, bonus awards, and leaderboard snapshots. User accounts are kept. This cannot be undone."
        confirmLabel="Reset Event"
        confirmClass="btn-danger"
        onConfirm={handleReset}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  )
}
