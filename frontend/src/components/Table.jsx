import EmptyState from './EmptyState'

export default function Table({ columns, rows, keyField = 'id', emptyTitle, emptyDescription }) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle || 'No records'} description={emptyDescription} />
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={row[keyField] ?? i} className="hover:bg-blue-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
