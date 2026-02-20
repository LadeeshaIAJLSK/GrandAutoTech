import { useState } from 'react'

function QuickActionsMenu({ actions }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div className="mb-4 space-y-3 animate-slide-in">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              className="block w-full bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg shadow-lg font-semibold transition-all hover:scale-105 text-left"
            >
              <span className="text-2xl mr-3">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 bg-primary hover:bg-primary-dark text-white rounded-full shadow-2xl font-bold text-2xl transition-all ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  )
}

export default QuickActionsMenu