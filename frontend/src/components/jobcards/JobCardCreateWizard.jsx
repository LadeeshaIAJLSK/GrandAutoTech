import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function JobCardCreateWizard({ show, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [customerError, setCustomerError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedCustomerVehicles, setSelectedCustomerVehicles] = useState([])

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    current_mileage: '',
    customer_complaint: '',
    initial_inspection_notes: '',
    recommendations: '',
    estimated_completion_date: '',
  })

  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  useEffect(() => {
    if (show) {
      fetchCustomers()
    }
  }, [show])

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerVehicles(formData.customer_id)
    }
  }, [formData.customer_id])

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

  const fetchCustomerVehicles = async (customerId) => {
    try {
      const response = await axiosClient.get(`/vehicles/customer/${customerId}`)
      if (response.data?.data) {
        setSelectedCustomerVehicles(response.data.data)
      } else {
        setSelectedCustomerVehicles(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setSelectedCustomerVehicles([])
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 10) {
      alert('Maximum 10 images allowed')
      return
    }

    setImages([...images, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.customer_id || !formData.vehicle_id) {
        alert('Please select both customer and vehicle')
        return false
      }
    }
    if (step === 2) {
      if (!formData.customer_complaint.trim()) {
        alert('Please enter customer complaint')
        return false
      }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      // Create job card
      const response = await axiosClient.post('/job-cards', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const jobCardId = response.data.job_card.id

      // Upload images if any
      if (images.length > 0) {
        const imageFormData = new FormData()
        images.forEach(image => {
          imageFormData.append('images[]', image)
        })
        imageFormData.append('image_type', 'before')

        await axiosClient.post(`/job-cards/${jobCardId}/images`, imageFormData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      alert('✅ Job card created successfully!')
      onSuccess(response.data.job_card)
      handleClose()
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating job card')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      customer_id: '',
      vehicle_id: '',
      current_mileage: '',
      customer_complaint: '',
      initial_inspection_notes: '',
      recommendations: '',
      estimated_completion_date: '',
    })
    setImages([])
    setImagePreviews([])
    onClose()
  }

  if (!show) return null

  const selectedCustomer = customers.find(c => c.id === parseInt(formData.customer_id))
  const selectedVehicle = selectedCustomerVehicles.find(v => v.id === parseInt(formData.vehicle_id))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">Create New Job Card</h2>
              <p className="text-orange-100 mt-1">Step {step} of 4</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Select Customer & Vehicle */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">👤 Select Customer & Vehicle</h3>
                <p className="text-gray-600 mb-6">Choose the customer and their vehicle for this job</p>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Customer *</label>
                {loadingCustomers ? (
                  <div className="text-gray-500 p-3 bg-gray-50 rounded-lg">Loading customers...</div>
                ) : customerError ? (
                  <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{customerError}</div>
                ) : customers.length === 0 ? (
                  <div className="text-gray-500 p-3 bg-gray-50 rounded-lg">No customers found. Please create a customer first.</div>
                ) : (
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => {
                      setFormData({...formData, customer_id: e.target.value, vehicle_id: ''})
                      setSelectedCustomerVehicles([])
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Show selected customer info */}
              {selectedCustomer && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-800 mb-2">Selected Customer:</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-semibold">{selectedCustomer.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-semibold">{selectedCustomer.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-semibold">{selectedCustomer.email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">City:</span>
                      <span className="ml-2 font-semibold">{selectedCustomer.city || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Selection */}
              {formData.customer_id && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Vehicle *</label>
                  {selectedCustomerVehicles.length === 0 ? (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-800">This customer has no registered vehicles.</p>
                      <p className="text-sm text-yellow-700 mt-1">Please register a vehicle first.</p>
                    </div>
                  ) : (
                    <select
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
                    >
                      <option value="">Select a vehicle</option>
                      {selectedCustomerVehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.make} {vehicle.model} ({vehicle.year})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Show selected vehicle info */}
              {selectedVehicle && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-800 mb-2">Selected Vehicle:</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">License Plate:</span>
                      <span className="ml-2 font-bold text-lg text-primary">{selectedVehicle.license_plate}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Make & Model:</span>
                      <span className="ml-2 font-semibold">{selectedVehicle.make} {selectedVehicle.model}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <span className="ml-2 font-semibold">{selectedVehicle.year}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Color:</span>
                      <span className="ml-2 font-semibold">{selectedVehicle.color || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Mileage */}
              {formData.vehicle_id && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({...formData, current_mileage: e.target.value})}
                    placeholder="50000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none text-lg"
                  />
                  {selectedVehicle.mileage && (
                    <p className="text-sm text-gray-500 mt-1">
                      Previous recorded mileage: {selectedVehicle.mileage.toLocaleString()} km
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Complaint & Inspection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">📝 Complaint & Inspection</h3>
                <p className="text-gray-600 mb-6">Enter the customer's complaint and initial findings</p>
              </div>

              {/* Customer Complaint */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Customer Complaint *</label>
                <textarea
                  value={formData.customer_complaint}
                  onChange={(e) => setFormData({...formData, customer_complaint: e.target.value})}
                  placeholder="Describe what the customer reported... (e.g., Engine making unusual noise, brake issues, etc.)"
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              {/* Initial Inspection Notes */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Initial Inspection Notes</label>
                <textarea
                  value={formData.initial_inspection_notes}
                  onChange={(e) => setFormData({...formData, initial_inspection_notes: e.target.value})}
                  placeholder="Your initial findings after inspecting the vehicle..."
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Recommendations</label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                  placeholder="Any additional work you recommend to the customer..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              {/* Estimated Completion Date */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Estimated Completion Date</label>
                <input
                  type="datetime-local"
                  value={formData.estimated_completion_date}
                  onChange={(e) => setFormData({...formData, estimated_completion_date: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Upload Images */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">📸 Upload Vehicle Images</h3>
                <p className="text-gray-600 mb-6">Take photos of the vehicle condition (optional, max 10 images)</p>
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="imageUpload"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  <div className="text-6xl mb-4">📷</div>
                  <div className="text-lg font-semibold text-gray-700 mb-2">Click to upload images</div>
                  <div className="text-sm text-gray-500">PNG, JPG up to 5MB each (Max 10 images)</div>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div>
                  <div className="font-semibold text-gray-700 mb-3">
                    Uploaded Images ({imagePreviews.length}/10)
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">✅ Review & Confirm</h3>
                <p className="text-gray-600 mb-6">Please review the information before creating the job card</p>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-800 mb-3">👤 Customer</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-semibold">{selectedCustomer?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-semibold">{selectedCustomer?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-800 mb-3">🚗 Vehicle</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-600">License Plate:</span>
                    <span className="ml-2 font-bold text-primary">{selectedVehicle?.license_plate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Make & Model:</span>
                    <span className="ml-2 font-semibold">{selectedVehicle?.make} {selectedVehicle?.model}</span>
                  </div>
                  {formData.current_mileage && (
                    <div>
                      <span className="text-gray-600">Current Mileage:</span>
                      <span className="ml-2 font-semibold">{parseInt(formData.current_mileage).toLocaleString()} km</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Complaint */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-800 mb-3">📝 Customer Complaint</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.customer_complaint}</p>
              </div>

              {/* Inspection Notes */}
              {formData.initial_inspection_notes && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <h4 className="font-bold text-gray-800 mb-3">🔍 Inspection Notes</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.initial_inspection_notes}</p>
                </div>
              )}

              {/* Images */}
              {imagePreviews.length > 0 && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                  <h4 className="font-bold text-gray-800 mb-3">📸 Images ({imagePreviews.length})</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="bg-gray-50 px-8 py-6 border-t flex justify-between items-center">
          <div>
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                ← Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Creating...' : '✅ Create Job Card'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobCardCreateWizard