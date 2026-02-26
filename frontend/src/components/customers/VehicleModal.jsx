import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function VehicleModal({ show, onClose, onSubmit, formData, setFormData, isEditing }) {
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [customerError, setCustomerError] = useState(null)

  useEffect(() => {
    if (show) fetchCustomers()
  }, [show])

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      setCustomerError(null)
      const response = await axiosClient.get('/customers')
      setCustomers(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomerError('Failed to load customers. Please try again.')
      setCustomers([])
    } finally {
      setLoadingCustomers(false)
    }
  }

  if (!show) return null

  const handleSubmit = (e) => { e.preventDefault(); onSubmit() }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h10l1-1zm0 0l1.5-4.5M13 6l1.5-1.5M13 6h5l2 4.5" />
              </svg>
              {isEditing ? 'Edit Vehicle' : 'Register New Vehicle'}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{isEditing ? 'Update vehicle information below' : 'Fill in the vehicle details to register'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">

            {/* Customer */}
            <div>
              <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
              {loadingCustomers ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Loading customers...</span>
                </div>
              ) : customerError ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {customerError}
                </div>
              ) : customers.length === 0 ? (
                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400">
                  No active customers found. Please create a customer first.
                </div>
              ) : (
                <select value={formData.customer_id || ''} onChange={e => setFormData({...formData, customer_id: e.target.value})} required className={inputCls}>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
              )}
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className={labelCls}>License Plate <span className="text-red-400">*</span></label>
                <input type="text" value={formData.license_plate} onChange={e => setFormData({...formData, license_plate: e.target.value.toUpperCase()})} required placeholder="ABC-1234" className={`${inputCls} font-mono tracking-widest uppercase`} />
              </div>

              <div>
                <label className={labelCls}>Make (Brand) <span className="text-red-400">*</span></label>
                <input type="text" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} required placeholder="Toyota, Honda, Nissan..." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Model <span className="text-red-400">*</span></label>
                <input type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required placeholder="Corolla, Civic, Altima..." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Year <span className="text-red-400">*</span></label>
                <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required className={inputCls}>
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Color</label>
                <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="White, Black, Silver..." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Mileage (km)</label>
                <input type="number" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} placeholder="50000" min="0" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Fuel Type</label>
                <select value={formData.fuel_type} onChange={e => setFormData({...formData, fuel_type: e.target.value})} className={inputCls}>
                  <option value="">Select Fuel Type</option>
                  {['Petrol','Diesel','Electric','Hybrid'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Transmission</label>
                <select value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value})} className={inputCls}>
                  <option value="">Select Transmission</option>
                  {['Manual','Automatic','CVT'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>VIN</label>
                <input type="text" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value.toUpperCase()})} placeholder="1HGBH41JXMN109186" maxLength="17" className={`${inputCls} font-mono uppercase tracking-wider`} />
              </div>

              <div>
                <label className={labelCls}>Engine Number</label>
                <input type="text" value={formData.engine_number} onChange={e => setFormData({...formData, engine_number: e.target.value.toUpperCase()})} placeholder="2ZR1234567" className={`${inputCls} font-mono uppercase`} />
              </div>

              <div>
                <label className={labelCls}>Chassis Number</label>
                <input type="text" value={formData.chassis_number} onChange={e => setFormData({...formData, chassis_number: e.target.value.toUpperCase()})} placeholder="ZRE1521234567" className={`${inputCls} font-mono uppercase`} />
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})} className={inputCls}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any additional information about the vehicle..." rows="3" className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2.5 px-7 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                {isEditing
                  ? <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                  : <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                }
              </svg>
              {isEditing ? 'Update Vehicle' : 'Register Vehicle'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default VehicleModal