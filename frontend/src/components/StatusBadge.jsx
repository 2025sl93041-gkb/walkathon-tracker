const STATUS_CONFIG = {
  // Eligibility
  eligible:   { label: 'Eligible',    cls: 'bg-green-100 text-green-800' },
  ineligible: { label: 'Ineligible',  cls: 'bg-red-100 text-red-800' },
  // Logs
  disputed:   { label: 'Disputed',    cls: 'bg-orange-100 text-orange-800' },
  auto_zero:  { label: 'Auto-zero',   cls: 'bg-gray-100 text-gray-500' },
  submitted:  { label: 'Submitted',   cls: 'bg-green-100 text-green-800' },
  missing:    { label: 'Missing',     cls: 'bg-red-100 text-red-600' },
  // Pairing
  paired:     { label: 'Paired',      cls: 'bg-green-100 text-green-800' },
  unpaired:   { label: 'Unpaired',    cls: 'bg-gray-100 text-gray-600' },
  // Pool
  draw:       { label: 'Draw Pool',   cls: 'bg-blue-100 text-blue-800' },
  be_drawn:   { label: 'Name Pool',   cls: 'bg-purple-100 text-purple-800' },
  // Registration
  open:       { label: 'Open',        cls: 'bg-green-100 text-green-800' },
  closed:     { label: 'Closed',      cls: 'bg-red-100 text-red-800' },
  // Results
  published:  { label: 'Published',   cls: 'bg-green-100 text-green-800' },
  pending:    { label: 'Pending',     cls: 'bg-yellow-100 text-yellow-800' },
  // Roles
  admin:      { label: 'Admin',       cls: 'bg-indigo-100 text-indigo-800' },
  member:     { label: 'Member',      cls: 'bg-teal-100 text-teal-800' },
  // Draw methods
  chit_draw:  { label: 'Chit Draw',   cls: 'bg-blue-100 text-blue-800' },
  manual:     { label: 'Manual',      cls: 'bg-gray-100 text-gray-700' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
