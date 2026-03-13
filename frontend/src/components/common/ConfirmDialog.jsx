function ConfirmDialog({ 
  show, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  type = 'warning'
}) {
  if (!show) return null

  const getIconStyle = () => {
    if (type === 'danger') return { bg: 'bg-red-50', text: 'text-red-600' }
    if (type === 'warning') return { bg: 'bg-orange-50', text: 'text-orange-600' }
    return { bg: 'bg-blue-50', text: 'text-blue-600' }
  }

  const getButtonStyle = () => {
    if (type === 'danger') return 'bg-red-600 hover:bg-red-700'
    if (type === 'warning') return 'bg-orange-600 hover:bg-orange-700'
    return 'bg-blue-600 hover:bg-blue-700'
  }

  const getIcon = () => {
    if (type === 'danger') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    } else if (type === 'warning') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m7-2a9 9 0 11-18 0 9 9 0 0118 0zm-9-4v.01M9 15h.01" />
        </svg>
      )
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 6H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7z" />
        </svg>
      )
    }
  }

  const iconStyle = getIconStyle()

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className={`flex items-center justify-center w-12 h-12 mx-auto ${iconStyle.bg} rounded-full`}>
            <div className={iconStyle.text}>
              {getIcon()}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 px-4 py-2.5 text-sm ${getButtonStyle()} text-white rounded-lg font-bold transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog