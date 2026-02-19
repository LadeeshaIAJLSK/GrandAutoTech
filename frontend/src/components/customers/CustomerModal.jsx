function CustomerModal({ 
  show, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isEditing 
}) {
  if (!show) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold text-gray-800">
            {isEditing ? `✏️ Edit Customer` : '➕ Add New Customer'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✖️
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Type */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Customer Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="individual"
                  checked={formData.customer_type === 'individual'}
                  onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                  className="w-4 h-4 text-primary"
                />
                <span>👤 Individual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="business"
                  checked={formData.customer_type === 'business'}
                  onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                  className="w-4 h-4 text-primary"
                />
                <span>🏢 Business</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                {formData.customer_type === 'business' ? 'Contact Person Name' : 'Full Name'} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="John Doe"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Company Name (if business) */}
            {formData.customer_type === 'business' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  placeholder="ABC Company Ltd"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Phone Number *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                placeholder="+94771234567"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Secondary Phone */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Secondary Phone</label>
              <input
                type="text"
                value={formData.secondary_phone}
                onChange={(e) => setFormData({...formData, secondary_phone: e.target.value})}
                placeholder="+94112345678"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="customer@example.com"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                {formData.customer_type === 'business' ? 'Business Registration Number' : 'ID / Driving License'}
              </label>
              <input
                type="text"
                value={formData.id_number}
                onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                placeholder="123456789V"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Colombo"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Status</label>
              <select
                value={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="No. 123, Main Street, Colombo 03"
              rows="2"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional information..."
              rows="3"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t-2 border-gray-100 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
            >
              {isEditing ? '💾 Update Customer' : '✅ Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerModal