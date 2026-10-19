export default function EmptyState({ title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">🏃</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
