import React, { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function Settings({ onLogoChange }) {
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(localStorage.getItem('appLogo') || 'https://placehold.co/240x64/1f2937/ffffff?text=LOGO')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' })
        return
      }

      setLogoFile(file)

      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result)
      }
      reader.readAsDataURL(file)

      setMessage({ type: '', text: '' })
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setMessage({ type: 'warning', text: 'Please select a logo file first' })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('logo', logoFile)

      const token = localStorage.getItem('token')
      const response = await axiosClient.post('/settings/upload-logo', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      // Save logo to localStorage
      localStorage.setItem('appLogo', logoPreview)

      // Notify parent component
      if (onLogoChange) {
        onLogoChange(logoPreview)
      }

      setMessage({ type: 'success', text: 'Logo updated successfully!' })
      setLogoFile(null)

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error uploading logo:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to upload logo. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetLogo = () => {
    const defaultLogo = 'https://placehold.co/240x64/1f2937/ffffff?text=LOGO'
    setLogoPreview(defaultLogo)
    localStorage.setItem('appLogo', defaultLogo)
    setLogoFile(null)
    if (onLogoChange) {
      onLogoChange(defaultLogo)
    }
    setMessage({ type: 'success', text: 'Logo reset to default!' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application settings</p>
      </div>

      {/* Logo Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Logo Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo Preview */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Current Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center bg-gray-50 min-h-40">
                <img
                  src={logoPreview}
                  alt="Current Logo Preview"
                  className="max-h-32 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Upload New Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => document.getElementById('logoInput').click()}>
                <input
                  id="logoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.414-1.414a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 text-sm font-medium">Click to upload logo</p>
                <p className="text-gray-500 text-xs mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Messages */}
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleLogoUpload}
                disabled={!logoFile || loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <button
                onClick={handleResetLogo}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            <strong>Note:</strong> The logo will be displayed in the header. Recommended size is 240x64 pixels for best results.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Settings
