import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function VehicleModal({ 
  show, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isEditing 
}) {
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [customerError, setCustomerError] = useState(null)

  useEffect(() => {
    if (show) {
      fetchCustomers()
    }
  }, [show])

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      setCustomerError(null)
      const response = await axiosClient.get('/customers')
      if (response.data?.data) {
        setCustomers(response.data.data)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomerError('Failed to load customers. Please try again.')
      setCustomers([])
    } finally {
      setLoadingCustomers(false)
    }
  }

  if (!show) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({length: 30}, (_, i) => currentYear - i)

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
            {isEditing ? '✏️ Edit Vehicle' : '🚗 Register New Vehicle'}
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
          {/* Customer Selection */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Customer *</label>
            {loadingCustomers ? (
              <div className="text-gray-500">Loading customers...</div>
            ) : customerError ? (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{customerError}</div>
            ) : customers.length === 0 ? (
              <div className="text-gray-500 p-3 bg-gray-50 rounded-lg">No active customers found. Please create a customer first.</div>
            ) : (
              <select
                value={formData.customer_id || ''}
                onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                required
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* License Plate */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">License Plate Number *</label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})}
                required
                placeholder="ABC-1234"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none uppercase"
              />
            </div>

            {/* Make */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Make (Brand) *</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({...formData, make: e.target.value})}
                required
                placeholder="Toyota, Honda, Nissan..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Model *</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                required
                placeholder="Corolla, Civic, Altima..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Year *</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                required
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                placeholder="White, Black, Silver..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Mileage (km)</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                placeholder="50000"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="">Select Fuel Type</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Transmission</label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({...formData, transmission: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value="">Select Transmission</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

            {/* VIN */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">VIN (Vehicle Identification Number)</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                placeholder="1HGBH41JXMN109186"
                maxLength="17"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none uppercase"
              />
            </div>

            {/* Engine Number */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Engine Number</label>
              <input
                type="text"
                value={formData.engine_number}
                onChange={(e) => setFormData({...formData, engine_number: e.target.value.toUpperCase()})}
                placeholder="2ZR1234567"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none uppercase"
              />
            </div>

            {/* Chassis Number */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Chassis Number</label>
              <input
                type="text"
                value={formData.chassis_number}
                onChange={(e) => setFormData({...formData, chassis_number: e.target.value.toUpperCase()})}
                placeholder="ZRE1521234567"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none uppercase"
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

          {/* Notes */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional information about the vehicle..."
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
              {isEditing ? '💾 Update Vehicle' : '✅ Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleModal