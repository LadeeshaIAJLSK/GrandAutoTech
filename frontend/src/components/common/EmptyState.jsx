function EmptyState({ 
  icon = '📭', 
  title = 'No data found', 
  message = '', 
  actionLabel = '',
  onAction = null 
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-12 text-center">
      <div className="text-7xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      {message && <p className="text-gray-600 mb-6">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState