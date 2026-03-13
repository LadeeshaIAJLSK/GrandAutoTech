import { useState, useEffect } from 'react'

function ThirdPartyServiceModal({ isOpen, onClose, onSave, initialData, branches, user, defaultBranchId = '' }) {
  const [form, setForm] = useState({
    company_name: '',
    telephone_number: '',
    email_address: '',
    services_offered: [],
    is_active: true,
    branch_id: ''
  })

  const [currentService, setCurrentService] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // For branch_admin, always force their own branch_id
    const userBranchId = user?.role?.name === 'branch_admin' ? String(user.branch_id) : ''
    
    if (initialData) {
      setForm({
        company_name: initialData.company_name || '',
        telephone_number: initialData.telephone_number || '',
        email_address: initialData.email_address || '',
        services_offered: Array.isArray(initialData.services_offered)
          ? initialData.services_offered
          : (initialData.services_offered ? [initialData.services_offered] : []),
        is_active: initialData.is_active !== false,
        branch_id: userBranchId || String(initialData.branch_id || '')
      })
    } else {
      setForm({
        company_name: '',
        telephone_number: '',
        email_address: '',
        services_offered: [],
        is_active: true,
        branch_id: userBranchId || String(defaultBranchId || '')
      })
    }
    setCurrentService('')
    setErrors({})
  }, [initialData, isOpen, defaultBranchId, user])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddService = () => {
    if (currentService.trim() && !form.services_offered.includes(currentService.trim())) {
      setForm(prev => ({
        ...prev,
        services_offered: [...prev.services_offered, currentService.trim()]
      }))
      setCurrentService('')
    }
  }

  const handleRemoveService = (idx) => {
    setForm(prev => ({
      ...prev,
      services_offered: prev.services_offered.filter((_, i) => i !== idx)
    }))
  }

  const isValidEmail = (email) => {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.company_name.trim()) newErrors.company_name = 'Company name is required'
    if (!form.telephone_number.trim()) newErrors.telephone_number = 'Telephone number is required'
    if (form.email_address && !isValidEmail(form.email_address)) newErrors.email_address = 'Invalid email address'
    if (!form.branch_id) newErrors.branch_id = 'Branch is required'
    if (!form.services_offered || form.services_offered.length === 0) newErrors.services_offered = 'At least one service must be added'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(form)
    }
  }

  if (!isOpen) return null

  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/10'
        : 'border-gray-200 focus:border-primary focus:ring-primary/10'
    }`

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {initialData ? 'Edit Service Provider' : 'Add Service Provider'}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {initialData ? initialData.company_name : 'Fill in the details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

            {/* Company Name */}
            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className={inputClass('company_name')}
              />
              {errors.company_name && <p className="text-xs text-red-500 font-semibold">{errors.company_name}</p>}
            </div>

            {/* Telephone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Telephone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="telephone_number"
                value={form.telephone_number}
                onChange={handleInputChange}
                placeholder="+94771234567"
                className={inputClass('telephone_number')}
              />
              {errors.telephone_number && <p className="text-xs text-red-500 font-semibold">{errors.telephone_number}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                name="email_address"
                value={form.email_address}
                onChange={handleInputChange}
                placeholder="email@example.com (optional)"
                className={inputClass('email_address')}
              />
              {errors.email_address && <p className="text-xs text-red-500 font-semibold">{errors.email_address}</p>}
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Branch <span className="text-red-400">*</span>
                {user?.role?.name === 'branch_admin' && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">(Restricted to your branch)</span>
                )}
              </label>
              <select
                name="branch_id"
                value={form.branch_id}
                onChange={handleInputChange}
                disabled={user?.role?.name === 'branch_admin'}
                className={`${inputClass('branch_id')} ${user?.role?.name === 'branch_admin' ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
              >
                <option value="">Select a branch</option>
                {user?.role?.name === 'branch_admin' 
                  ? branches.filter(branch => branch.id == user.branch_id).map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))
                  : branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))
                }
              </select>
              {errors.branch_id && <p className="text-xs text-red-500 font-semibold">{errors.branch_id}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
              <select
                name="is_active"
                value={form.is_active}
                onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                className={inputClass('is_active')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Services Offered */}
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Services Offered <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-400">Add all services this provider offers. Press Enter or click + to add.</p>

              {/* Input row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentService}
                  onChange={(e) => setCurrentService(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddService() }
                  }}
                  placeholder="e.g. Tire Repair, Battery Service"
                  className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-sm flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Tags list */}
              {form.services_offered.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {form.services_offered.map((svc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                    >
                      {svc}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full text-blue-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.services_offered && <p className="text-xs text-red-500 font-semibold">{errors.services_offered}</p>}
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors border border-gray-300 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0"
            >
              {initialData ? 'Update Provider' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ThirdPartyServiceModal
