import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getAllUsers, updateUser, deleteUser } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import Table from '../../components/Table'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminUsers() {
  const { call, loading } = useApi()
  const [users, setUsers] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function load() {
    const r = await call(getAllUsers, { showErrorToast: false })
    if (r) setUsers(r.data)
  }

  useEffect(() => { load() }, [])

  function promptRoleChange(user) {
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    setConfirm({ user, newRole })
  }

  async function doRoleChange() {
    const res = await call(() => updateUser(confirm.user.id, { role: confirm.newRole }), { successMsg: `Role updated to ${confirm.newRole}` })
    if (res) load()
    setConfirm(null)
  }

  async function doDelete() {
    const res = await call(() => deleteUser(deleteConfirm.id), { successMsg: `${deleteConfirm.fullName} deleted` })
    if (res) load()
    setDeleteConfirm(null)
  }

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'role', label: 'Role', render: r => <StatusBadge status={r.role} /> },
    { key: 'chitPreference', label: 'Pool', render: r => r.chitPreference ? <StatusBadge status={r.chitPreference} /> : '—' },
    { key: 'paired', label: 'Pairing', render: r => <StatusBadge status={r.isPaired ? 'paired' : 'unpaired'} /> },
    { key: 'daysLogged', label: 'Days', render: r => <span className={r.daysLogged < 14 ? 'text-red-600 font-medium' : 'text-green-700 font-medium'}>{r.daysLogged}</span> },
    { key: 'eligible', label: 'Eligible', render: r => <StatusBadge status={r.eligible ? 'eligible' : 'ineligible'} /> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        <button onClick={() => promptRoleChange(r)} className="btn-secondary btn-sm text-xs">
          Make {r.role === 'admin' ? 'Member' : 'Admin'}
        </button>
        <button onClick={() => setDeleteConfirm(r)} className="btn-danger btn-sm text-xs">
          Delete
        </button>
      </div>
    )},
  ]

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">👥 Users</h1>
      <div className="flex gap-4 mb-4 text-sm flex-wrap">
        <span className="text-gray-500">Total: <strong>{users.length}</strong></span>
        <span className="text-gray-500">Paired: <strong>{users.filter(u => u.isPaired).length}</strong></span>
        <span className="text-gray-500">Eligible: <strong>{users.filter(u => u.eligible).length}</strong></span>
      </div>
      <Table
        columns={columns}
        rows={users}
        keyField="id"
        emptyTitle="No users registered"
        emptyDescription="Members will appear here once they register."
      />
      <ConfirmDialog
        open={!!confirm}
        title={`Change role to ${confirm?.newRole}?`}
        message={`${confirm?.user?.fullName} will be changed from ${confirm?.user?.role} to ${confirm?.newRole}.`}
        confirmLabel="Change Role"
        confirmClass="btn-primary"
        onConfirm={doRoleChange}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete this user?"
        message={`${deleteConfirm?.fullName} (${deleteConfirm?.email}) will be permanently removed along with all their logs and pair data. This cannot be undone.`}
        confirmLabel="Delete User"
        confirmClass="btn-danger"
        onConfirm={doDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
