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

  const bgColor = type === 'danger' ? 'bg-red-600' : 
                  type === 'warning' ? 'bg-orange-600' : 'bg-primary'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-slide-in">
        <div className={`${bgColor} text-white p-6 rounded-t-xl`}>
          <h3 className="text-2xl font-bold flex items-center gap-3">
            {type === 'danger' ? '⚠️' : type === 'warning' ? '❓' : 'ℹ️'}
            {title}
          </h3>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-lg">{message}</p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 ${bgColor} hover:opacity-90 text-white rounded-lg font-semibold transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog