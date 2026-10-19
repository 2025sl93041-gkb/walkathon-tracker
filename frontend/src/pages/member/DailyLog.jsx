import { useEffect, useState, useRef } from 'react'
import { useApi } from '../../hooks/useApi'
import { getDeadlineStatus, getMyLogs, submitLog } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import Table from '../../components/Table'

function fmt12h(time24) {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function DailyLog() {
  const { call, loading } = useApi()
  const [deadline, setDeadline] = useState(null)
  const [logs, setLogs] = useState(null)
  const [stepCount, setStepCount] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [errors, setErrors] = useState({})
  const fileRef = useRef()

  async function load() {
    const [ds, ml] = await Promise.all([
      call(getDeadlineStatus, { showErrorToast: false }),
      call(getMyLogs, { showErrorToast: false }),
    ])
    if (ds) setDeadline(ds.data)
    if (ml) setLogs(ml.data)
  }

  useEffect(() => { load() }, [])

  function validate() {
    const e = {}
    if (stepCount === '' || isNaN(Number(stepCount)) || Number(stepCount) < 0) e.stepCount = 'Enter a valid step count'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const fd = new FormData()
    fd.append('stepCount', stepCount)
    if (proofFile) fd.append('proof', proofFile)
    const res = await call(() => submitLog(fd), { successMsg: `✅ ${Number(stepCount).toLocaleString()} steps logged!` })
    if (res) {
      setStepCount('')
      setProofFile(null)
      if (fileRef.current) fileRef.current.value = ''
      load()
    }
  }

  const todayAlreadyLogged = logs?.logs?.some(l => deadline && l.logDate === deadline.targetDate && !l.isAutoZero)

  const logColumns = [
    { key: 'logDate', label: 'Date' },
    { key: 'stepCount', label: 'Steps', render: r => r.isAutoZero ? '—' : r.stepCount?.toLocaleString() },
    { key: 'submittedAt', label: 'Submitted', render: r => r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—' },
    { key: 'status', label: 'Status', render: r => {
      if (r.missing) return <StatusBadge status="missing" />
      if (r.isAutoZero) return <StatusBadge status="auto_zero" />
      if (r.isDisputed) return <StatusBadge status="disputed" />
      return <StatusBadge status="submitted" />
    }},
    { key: 'proof', label: 'Proof', render: r => r.proofStoragePath ? <span className="text-green-600 text-xs">✅ Uploaded</span> : <span className="text-gray-400 text-xs">—</span> },
  ]

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">👟 Daily Log</h1>

      {/* Deadline status banner */}
      {deadline && (() => {
        const { status, targetDate, openTime, deadlineTime } = deadline
        if (status === 'no_config') return (
          <div className="mb-6 rounded-xl px-5 py-4 border bg-gray-50 border-gray-200 text-gray-600 text-sm">
            ⏳ Event not configured yet. Admin needs to set start/end dates.
          </div>
        )
        if (status === 'pre_event') return (
          <div className="mb-6 rounded-xl px-5 py-4 border bg-blue-50 border-blue-200 text-blue-800 text-sm">
            🚶 <strong>Event starts today!</strong> Walk and record your steps. First submission window opens tomorrow at <strong>{fmt12h(openTime)}</strong>.
          </div>
        )
        if (status === 'event_over') return (
          <div className="mb-6 rounded-xl px-5 py-4 border bg-gray-50 border-gray-200 text-gray-600 text-sm">
            🏁 <strong>Event has ended.</strong> All submission windows are closed.
          </div>
        )
        if (status === 'not_open') return (
          <div className="mb-6 rounded-xl px-5 py-4 border bg-yellow-50 border-yellow-200 text-yellow-800 text-sm">
            🔒 <strong>Window not open yet</strong> — Submission for <strong>{targetDate}</strong> opens at <strong>{fmt12h(openTime)}</strong> today.
          </div>
        )
        if (status === 'open') return (
          <div className="mb-6 rounded-xl px-5 py-4 border bg-green-50 border-green-200 text-green-800 text-sm">
            ✅ <strong>Form Open</strong> — Submit your steps for <strong>{targetDate}</strong> before <strong>{fmt12h(deadlineTime)}</strong> today.
          </div>
        )
        if (status === 'passed') return (
          <div className="mb-6 rounded-xl px-5 py-4 border bg-orange-50 border-orange-200 text-orange-800 text-sm">
            🔒 <strong>Deadline Passed</strong> — Submission window for <strong>{targetDate}</strong> is closed. Next window opens at <strong>{fmt12h(openTime)}</strong> tomorrow.
          </div>
        )
        return null
      })()}

      {/* Submit form */}
      {deadline?.open && !todayAlreadyLogged && (
        <div className="card p-6 mb-8 max-w-md">
          <h2 className="font-semibold text-gray-900 mb-4">Submit for {deadline.targetDate}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Step Count</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="e.g. 8500"
                value={stepCount}
                onChange={e => setStepCount(e.target.value)}
                autoFocus
              />
              {errors.stepCount && <p className="field-error">{errors.stepCount}</p>}
            </div>
            <div>
              <label className="label">Proof Upload <span className="text-gray-400 font-normal">(jpg/png/gif/pdf, max 5MB)</span></label>
              <input
                ref={fileRef}
                className="input"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                onChange={e => setProofFile(e.target.files[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">Screenshot from Google Fit, Apple Health, Samsung Health, Fitbit, Garmin, etc.</p>
            </div>
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Steps'}
            </button>
          </form>
        </div>
      )}

      {todayAlreadyLogged && deadline?.open && (
        <div className="card p-5 mb-8 bg-green-50 border-green-200 max-w-md">
          <p className="text-green-800 text-sm font-medium">✅ You've already submitted for {deadline.targetDate}.</p>
        </div>
      )}

      {/* Eligibility summary */}
      {logs && (
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="card px-5 py-3 text-sm">
            <span className="text-gray-500">Days submitted: </span>
            <span className="font-bold text-gray-900">{logs.submittedDays} / {logs.totalEventDays ?? 21}</span>
          </div>
          <div className="card px-5 py-3 text-sm flex items-center gap-2">
            <span className="text-gray-500">Prize eligibility: </span>
            <StatusBadge status={logs.eligible ? 'eligible' : 'ineligible'} />
            {!logs.eligible && <span className="text-xs text-gray-400">(need {14 - logs.submittedDays} more {14 - logs.submittedDays === 1 ? 'day' : 'days'})</span>}
          </div>
        </div>
      )}

      {/* Log history */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Log History</h2>
        </div>
        <div className="p-1">
          <Table
            columns={logColumns}
            rows={logs?.logs?.slice().reverse() ?? []}
            keyField="id"
            emptyTitle="No logs yet"
            emptyDescription="Logs will appear here once you submit your daily steps."
          />
        </div>
      </div>
    </div>
  )
}
