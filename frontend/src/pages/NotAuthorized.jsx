import { useNavigate } from 'react-router-dom'

function NotAuthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m0 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>

        {/* Error Details */}
        <div className="bg-white rounded-lg border border-red-200 p-4 mb-8">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Error:</span> Insufficient permissions
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-8">
          If you need access to this section, please request the appropriate permissions from your administrator.
        </p>
      </div>
    </div>
  )
}

export default NotAuthorized
