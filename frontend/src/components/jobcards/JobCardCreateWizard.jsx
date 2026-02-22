import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function JobCardCreateWizard({ show, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [jobCardNumber, setJobCardNumber] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  // Step 1: Service Details
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    expected_completion_date: '',
    test_run_required: false,
    details: '',
    current_mileage: '',
    additional_details: '',
  })

  // Step 2: Images
  const [images, setImages] = useState({
    front: null,
    back: null,
    right: null,
    left: null,
    interior1: null,
    interior2: null,
    dashboard: null,
    top: null,
    other1: null,
    other2: null,
  })

  // Step 3: Tasks
  const [tasks, setTasks] = useState([
    { description: '', category: '' },
  ])

  const categories = [
    'Mechanical',
    'Electrical',
    'Bodywork',
    'Painting',
    'Diagnostic',
    'Maintenance',
    'Other',
  ]

  useEffect(() => {
    if (show) {
      fetchCustomers()
      generateJobCardNumber()
    }
  }, [show])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/customers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomers(response.data.data || response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchVehicles = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/vehicles/customer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVehicles(response.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setVehicles([])
    }
  }

  const generateJobCardNumber = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setJobCardNumber(`JC${random}${year % 100}`)
  }

  const handleCustomerChange = (customerId) => {
    setFormData({ ...formData, customer_id: customerId, vehicle_id: '' })
    setShowCustomerDropdown(false)
    if (customerId) {
      fetchVehicles(customerId)
    } else {
      setVehicles([])
    }
  }

  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const filteredCustomers = customers.filter(customer => {
    const search = customerSearch.toLowerCase()
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.phone.toLowerCase().includes(search) ||
      (customer.email && customer.email.toLowerCase().includes(search))
    )
  })

  const handleImageUpload = (key, file) => {
    setImages({ ...images, [key]: file })
  }

  const addTask = () => {
    setTasks([...tasks, { description: '', category: '' }])
  }

  const removeTask = (index) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index))
    }
  }

  const updateTask = (index, field, value) => {
    const newTasks = [...tasks]
    newTasks[index][field] = value
    setTasks(newTasks)
  }

  const handleSubmit = async () => {
    try {
      const tasksWithDescription = tasks.filter(t => t.description && t.description.trim())
      
      if (tasksWithDescription.length === 0) {
        alert('Please add at least one task with a description')
        return
      }

      if (!formData.details || !formData.details.trim()) {
        alert('Please fill in the Customer Complaint field')
        return
      }

      const token = localStorage.getItem('token')
      
      // Create job card with tasks
      const jobCardData = {
        ...formData,
        tasks: tasksWithDescription
      }

      const response = await axiosClient.post('/job-cards', jobCardData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const jobCardId = response.data.job_card.id

      // Upload images if any
      const imageFormData = new FormData()
      let hasImages = false

      Object.entries(images).forEach(([key, file]) => {
        if (file) {
          imageFormData.append('images[]', file)
          hasImages = true
        }
      })

      if (hasImages) {
        await axiosClient.post(`/job-cards/${jobCardId}/images`, imageFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      alert('✅ Job Card created successfully!')
      onSuccess()
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error creating job card')
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setFormData({
      customer_id: '',
      vehicle_id: '',
      expected_completion_date: '',
      test_run_required: false,
      details: '',
      current_mileage: '',
      additional_details: '',
    })
    setImages({
      front: null,
      back: null,
      right: null,
      left: null,
      interior1: null,
      interior2: null,
      dashboard: null,
      top: null,
      other1: null,
      other2: null,
    })
    setTasks([{ description: '', category: '' }])
    generateJobCardNumber()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-6 rounded-t-xl">
          <h2 className="text-3xl font-bold text-center">Create New Job Card</h2>
          <p className="text-center text-gray-300 mt-1">Fill in all the required information to create a new job card</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 p-6 bg-gray-50">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition-all ${
              currentStep === 1
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : currentStep > 1
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className="text-xl">ℹ️</span>
            <span>Service Details</span>
          </button>

          <div className="w-12 h-1 bg-gray-300"></div>

          <button
            onClick={() => currentStep > 1 && setCurrentStep(2)}
            disabled={currentStep < 2}
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition-all ${
              currentStep === 2
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : currentStep > 2
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className="text-xl">📷</span>
            <span>Service Images</span>
          </button>

          <div className="w-12 h-1 bg-gray-300"></div>

          <button
            onClick={() => currentStep > 2 && setCurrentStep(3)}
            disabled={currentStep < 3}
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition-all ${
              currentStep === 3
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className="text-xl">📋</span>
            <span>Task List</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {/* STEP 1: Service Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">ℹ️</span>
                <h3 className="text-2xl font-bold text-gray-800">Step 1: Service Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Job Card Number *
                  </label>
                  <input
                    type="text"
                    value={jobCardNumber}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Date and Time *
                  </label>
                  <input
                    type="text"
                    value={new Date().toLocaleString()}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current date and time (automatically set)</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Expected Completion Date *
                </label>
                <input
                  type="date"
                  value={formData.expected_completion_date}
                  onChange={(e) => setFormData({...formData, expected_completion_date: e.target.value})}
                  min={getTodayDateString()}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Select when you expect this job to be completed</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Customer Name * (Search by Name, Phone, or Email)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 border-2 border-gray-200 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredCustomers.map(customer => (
                          <div
                            key={customer.id}
                            onClick={() => {
                              handleCustomerChange(customer.id)
                              setCustomerSearch(customer.name)
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-gray-800">{customer.name}</div>
                            <div className="text-sm text-gray-600">{customer.phone} {customer.email ? `- ${customer.email}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Vehicle *
                  </label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    required
                    disabled={!formData.customer_id}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-100"
                  >
                    <option value="">Select a customer first</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Test Run Required *
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.test_run_required === true}
                      onChange={() => setFormData({...formData, test_run_required: true})}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.test_run_required === false}
                      onChange={() => setFormData({...formData, test_run_required: false})}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Customer Complaint *
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  placeholder="Enter customer complaint or service request..."
                  rows="4"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Additional Details
                </label>
                <textarea
                  value={formData.additional_details}
                  onChange={(e) => setFormData({...formData, additional_details: e.target.value})}
                  placeholder="Any other additional notes..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Service Images */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📷</span>
                <h3 className="text-2xl font-bold text-gray-800">Step 2: Service Images</h3>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {[
                  { key: 'front', label: 'Front Image' },
                  { key: 'back', label: 'Back Image' },
                  { key: 'right', label: 'Right Side Image' },
                  { key: 'left', label: 'Left Side Image' },
                  { key: 'interior1', label: 'Interior 1 Image' },
                  { key: 'interior2', label: 'Interior 2 Image' },
                  { key: 'dashboard', label: 'Dashboard Image' },
                  { key: 'top', label: 'Top Image' },
                  { key: 'other1', label: 'Other Image 01', optional: true },
                  { key: 'other2', label: 'Other Image 02', optional: true },
                ].map((img) => (
                  <div key={img.key} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <label className="cursor-pointer block">
                      {images[img.key] ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(images[img.key])}
                            alt={img.label}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              handleImageUpload(img.key, null)
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-6xl text-gray-400 mb-2">📷</div>
                          <div className="text-sm font-semibold text-gray-700">{img.label}</div>
                          {img.optional && (
                            <div className="text-xs text-gray-500 mt-1">Optional</div>
                          )}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(img.key, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Task List */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📋</span>
                <h3 className="text-2xl font-bold text-gray-800">Step 3: Task List</h3>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-7">
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) => updateTask(index, 'description', e.target.value)}
                          placeholder="Enter task description..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <select
                          value={task.category}
                          onChange={(e) => updateTask(index, 'category', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                        >
                          <option value="">Select Service Type</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(index)}
                            className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTask}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                Add Another Task
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-xl">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center gap-2"
              >
                ← Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold flex items-center gap-2"
            >
              ✖ Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !formData.customer_id) {
                    alert('Please select a customer')
                    return
                  }
                  if (currentStep === 1 && !formData.vehicle_id) {
                    alert('Please select a vehicle')
                    return
                  }
                  if (currentStep === 1 && !formData.details.trim()) {
                    alert('Please fill in the Customer Complaint field')
                    return
                  }
                  setCurrentStep(currentStep + 1)
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 text-lg"
              >
                📄 Create Job Card
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobCardCreateWizard