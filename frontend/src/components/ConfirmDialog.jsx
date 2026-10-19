export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', confirmClass = 'btn-primary', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="card p-6 max-w-sm w-full mx-4 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-gray-600 text-sm mb-6">{message}</p>}
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className={`${confirmClass} btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
