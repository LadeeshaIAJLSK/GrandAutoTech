import React from 'react'

function Notification({ notification, onClose }) {
  if (!notification) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className={`rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden ${
        notification.type === 'success'
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
          : notification.type === 'error'
          ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300'
          : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300'
      }`}>
        <div className="p-8 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
              notification.type === 'success'
                ? 'bg-green-100'
                : notification.type === 'error'
                ? 'bg-red-100'
                : 'bg-blue-100'
            }`}>
              {notification.type === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-2">
            <h3 className={`text-lg font-bold ${
              notification.type === 'success'
                ? 'text-green-900'
                : notification.type === 'error'
                ? 'text-red-900'
                : 'text-blue-900'
            }`}>
              {notification.title}
            </h3>
            <p className={`text-sm leading-relaxed ${
              notification.type === 'success'
                ? 'text-green-700'
                : notification.type === 'error'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}>
              {notification.message}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              notification.type === 'success'
                ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                : notification.type === 'error'
                ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notification
