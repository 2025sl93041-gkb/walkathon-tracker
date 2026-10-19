import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { adminPublishResults, adminUnpublishResults, adminAddBonusAward, adminRemoveBonusAward, adminPreviewResults, getAllUsers, adminGetBonusAwards } from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

const BONUS_CATEGORIES = ['Most Consistent Walker', 'Most Improved', 'Team Spirit']

export default function AdminResults() {
  const { call, loading } = useApi()
  const [results, setResults] = useState(null)
  const [awards, setAwards] = useState([])
  const [users, setUsers] = useState([])
  const [publishConfirm, setPublishConfirm] = useState(false)
  const [unpublishConfirm, setUnpublishConfirm] = useState(false)
  const [award, setAward] = useState({ category: '', recipientName: '', recipientUserId: '', description: '' })
  const [awardError, setAwardError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function load() {
    call(getAllUsers, { showErrorToast: false }).then(r => r && setUsers(r.data))
    call(adminGetBonusAwards, { showErrorToast: false }).then(r => r && setAwards(r.data))
    call(adminPreviewResults, { showErrorToast: false }).then(r => r && setResults(r.data))
  }

  useEffect(() => { load() }, [])

  async function handlePublish() {
    const res = await call(adminPublishResults, { successMsg: '🎉 Results published! All members notified.' })
    if (res) load()
    setPublishConfirm(false)
  }

  async function handleUnpublish() {
    const res = await call(adminUnpublishResults, { successMsg: 'Results unpublished. Members can no longer see results.' })
    if (res) load()
    setUnpublishConfirm(false)
  }

  async function handleAddAward(e) {
    e.preventDefault()
    setAwardError('')
    if (!award.category || !award.recipientName) { setAwardError('Category and recipient name required'); return }
    const res = await call(() => adminAddBonusAward(award), { successMsg: 'Bonus award added!' })
    if (res) { setAward({ category: '', recipientName: '', recipientUserId: '', description: '' }); load() }
  }

  async function handleDeleteAward() {
    await call(() => adminRemoveBonusAward(deleteConfirm.id), { successMsg: 'Award removed' })
    setDeleteConfirm(null)
    load()
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="page-title">🎉 Results Management</h1>

      {/* Publish button */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Publish Results</h2>
            <p className="text-sm text-gray-500 mt-1">
              {results?.resultsPublished ? '✅ Results are live — members can view them' : 'Results are hidden until you publish'}
            </p>
          </div>
          {!results?.resultsPublished && (
            <button onClick={() => setPublishConfirm(true)} className="btn-primary">
              Publish Results
            </button>
          )}
          {results?.resultsPublished && (
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Published</span>
              <button onClick={() => setUnpublishConfirm(true)} className="btn-secondary text-sm">Unpublish</button>
            </div>
          )}
        </div>
      </div>

      {/* Results preview — always visible to admin, eligibility filter not applied */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Results Preview</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">eligibility filter off for preview</span>
        </div>
        {results ? (
          <div className="space-y-2 text-sm">
            {results.soloWinner && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">🥇 Solo Winner</span><span className="font-medium">{results.soloWinner.user?.fullName} <span className="text-xs text-gray-400">({results.soloWinner.daysLogged}d)</span></span></div>}
            {results.soloRunnerUp && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">🥈 Solo Runner-up</span><span className="font-medium">{results.soloRunnerUp.user?.fullName} <span className="text-xs text-gray-400">({results.soloRunnerUp.daysLogged}d)</span></span></div>}
            {results.duoWinner && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">🥇 Duo Winner</span><span className="font-medium">{results.duoWinner.member1?.fullName} + {results.duoWinner.member2?.fullName} <span className="text-xs text-gray-400">({results.duoWinner.days1}d + {results.duoWinner.days2}d)</span></span></div>}
            {results.duoRunnerUp && <div className="flex justify-between py-1"><span className="text-gray-500">🥈 Duo Runner-up</span><span className="font-medium">{results.duoRunnerUp.member1?.fullName} + {results.duoRunnerUp.member2?.fullName} <span className="text-xs text-gray-400">({results.duoRunnerUp.days1}d + {results.duoRunnerUp.days2}d)</span></span></div>}
            {!results.soloWinner && !results.duoWinner && <p className="text-gray-400 text-sm">No data yet — members need to submit logs first.</p>}
          </div>
        ) : (
          <div className="flex justify-center py-6"><div className="spinner" /></div>
        )}
      </div>

      {/* Bonus awards */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Bonus Awards</h2>

        {/* Current awards */}
        {awards.length > 0 && (
          <div className="space-y-2 mb-6">
            {awards.map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-yellow-50 rounded-lg px-4 py-3">
                <span className="text-xl">🌟</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">{a.category}</div>
                  <div className="font-medium text-gray-900 text-sm">{a.recipientName}</div>
                  {a.description && <div className="text-xs text-gray-500">{a.description}</div>}
                </div>
                <button onClick={() => setDeleteConfirm(a)} className="btn-danger btn-sm text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* Add award form */}
        <form onSubmit={handleAddAward} className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Add Bonus Award</h3>
          <div>
            <label className="label">Category</label>
            <select className="input" value={award.category} onChange={e => setAward(a => ({ ...a, category: e.target.value }))}>
              <option value="">Select category…</option>
              {BONUS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Recipient Name</label>
              <input className="input" placeholder="Full name" value={award.recipientName} onChange={e => setAward(a => ({ ...a, recipientName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Link to Member <span className="font-normal text-gray-400">(optional)</span></label>
              <select className="input" value={award.recipientUserId} onChange={e => setAward(a => ({ ...a, recipientUserId: e.target.value }))}>
                <option value="">None</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description <span className="font-normal text-gray-400">(optional)</span></label>
            <input className="input" placeholder="Why they deserve this award…" value={award.description} onChange={e => setAward(a => ({ ...a, description: e.target.value }))} />
          </div>
          {awardError && <p className="field-error">{awardError}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>Add Award</button>
        </form>
      </div>

      <ConfirmDialog
        open={publishConfirm}
        title="Publish results?"
        message="This makes results visible to all members and sends email notifications. You can unpublish and republish again any time."
        confirmLabel="Publish Results"
        confirmClass="btn-primary"
        onConfirm={handlePublish}
        onCancel={() => setPublishConfirm(false)}
      />

      <ConfirmDialog
        open={unpublishConfirm}
        title="Unpublish results?"
        message="Members will no longer see the results tab. You can republish again at any time."
        confirmLabel="Unpublish"
        confirmClass="btn-danger"
        onConfirm={handleUnpublish}
        onCancel={() => setUnpublishConfirm(false)}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove this award?"
        message={`Remove "${deleteConfirm?.category}" for ${deleteConfirm?.recipientName}?`}
        confirmLabel="Remove"
        confirmClass="btn-danger"
        onConfirm={handleDeleteAward}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
