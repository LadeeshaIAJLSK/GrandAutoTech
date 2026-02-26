import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function JobCardCreateWizard({ show, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [jobCardNumber, setJobCardNumber] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    expected_completion_date: '',
    test_run_required: false,
    details: '',
    current_mileage: '',
    additional_details: '',
  })

  const [images, setImages] = useState({
    front: null, back: null, right: null, left: null,
    interior1: null, interior2: null, dashboard: null,
    top: null, other1: null, other2: null,
  })

  const [tasks, setTasks] = useState([{ description: '', category: '' }])

  const categories = ['Mechanical','Electrical','Bodywork','Painting','Diagnostic','Maintenance','Other']

  useEffect(() => {
    if (show) { fetchCustomers(); generateJobCardNumber() }
  }, [show])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/customers', { headers: { Authorization: `Bearer ${token}` } })
      setCustomers(response.data.data || response.data)
    } catch (error) { console.error('Error fetching customers:', error) }
  }

  const fetchVehicles = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/vehicles/customer/${customerId}`, { headers: { Authorization: `Bearer ${token}` } })
      setVehicles(response.data)
    } catch (error) { console.error('Error fetching vehicles:', error); setVehicles([]) }
  }

  const generateJobCardNumber = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setJobCardNumber(`JC${random}${year % 100}`)
  }

  const handleCustomerChange = (customerId) => {
    setFormData({ ...formData, customer_id: customerId, vehicle_id: '' })
    setShowCustomerDropdown(false)
    if (customerId) fetchVehicles(customerId); else setVehicles([])
  }

  const getTodayDateString = () => new Date().toISOString().split('T')[0]

  const filteredCustomers = customers.filter(c => {
    const s = customerSearch.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s) || (c.email && c.email.toLowerCase().includes(s))
  })

  const handleImageUpload = (key, file) => setImages({ ...images, [key]: file })
  const addTask = () => setTasks([...tasks, { description: '', category: '' }])
  const removeTask = (index) => { if (tasks.length > 1) setTasks(tasks.filter((_, i) => i !== index)) }
  const updateTask = (index, field, value) => { const t = [...tasks]; t[index][field] = value; setTasks(t) }

  const handleSubmit = async () => {
    try {
      const tasksWithDescription = tasks.filter(t => t.description && t.description.trim())
      if (tasksWithDescription.length === 0) { alert('Please add at least one task with a description'); return }
      if (!formData.details || !formData.details.trim()) { alert('Please fill in the Customer Complaint field'); return }
      const token = localStorage.getItem('token')
      const response = await axiosClient.post('/job-cards', { ...formData, tasks: tasksWithDescription }, { headers: { Authorization: `Bearer ${token}` } })
      const jobCardId = response.data.job_card.id
      const imageFormData = new FormData()
      let hasImages = false
      Object.entries(images).forEach(([key, file]) => { if (file) { imageFormData.append('images[]', file); hasImages = true } })
      if (hasImages) {
        await axiosClient.post(`/job-cards/${jobCardId}/images`, imageFormData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
      }
      alert('Job Card created successfully!')
      onSuccess()
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error creating job card')
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setFormData({ customer_id: '', vehicle_id: '', expected_completion_date: '', test_run_required: false, details: '', current_mileage: '', additional_details: '' })
    setImages({ front: null, back: null, right: null, left: null, interior1: null, interior2: null, dashboard: null, top: null, other1: null, other2: null })
    setTasks([{ description: '', category: '' }])
    generateJobCardNumber()
  }

  if (!show) return null

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  const steps = [
    { n: 1, label: 'Service Details', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { n: 2, label: 'Service Images', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /> },
    { n: 3, label: 'Task List',       icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 14l2 2 4-4" /> },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 right-24 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create New Job Card</h2>
              <p className="text-gray-400 text-sm mt-0.5">Fill in all required information below</p>
            </div>
            <button onClick={() => { onClose(); resetForm() }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 px-8 py-5 bg-gray-50 border-b border-gray-100">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button
                onClick={() => s.n < currentStep && setCurrentStep(s.n)}
                disabled={s.n > currentStep}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  currentStep === s.n
                    ? 'bg-primary text-white shadow-md scale-105'
                    : currentStep > s.n
                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                    : 'bg-white text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {currentStep > s.n ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{s.icon}</svg>
                )}
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${currentStep > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-7 overflow-y-auto max-h-[60vh]">

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Step 1 — Service Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Job Card Number <span className="text-red-400">*</span></label>
                  <input type="text" value={jobCardNumber} readOnly className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-mono font-bold" />
                </div>
                <div>
                  <label className={labelCls}>Date and Time <span className="text-red-400">*</span></label>
                  <input type="text" value={new Date().toLocaleString()} readOnly className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500" />
                  <p className="text-xs text-gray-400 mt-1">Automatically set to current date and time</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Expected Completion Date <span className="text-red-400">*</span></label>
                <input type="date" value={formData.expected_completion_date} onChange={e => setFormData({...formData, expected_completion_date: e.target.value})} min={getTodayDateString()} required className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Select when you expect this job to be completed</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
                  <p className="text-xs text-gray-400 mb-1.5">Search by name, phone, or email</p>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer..."
                      className={inputCls}
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-xl bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredCustomers.map(c => (
                          <div key={c.id} onClick={() => { handleCustomerChange(c.id); setCustomerSearch(c.name) }}
                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                            <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Vehicle <span className="text-red-400">*</span></label>
                  <p className="text-xs text-gray-400 mb-1.5">Select a customer first</p>
                  <select value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} required disabled={!formData.customer_id} className={`${inputCls} disabled:cursor-not-allowed`}>
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} — {v.make} {v.model}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Test Run Required <span className="text-red-400">*</span></label>
                <div className="flex gap-5">
                  {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => (
                    <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.test_run_required === opt.val} onChange={() => setFormData({...formData, test_run_required: opt.val})} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Customer Complaint <span className="text-red-400">*</span></label>
                <textarea value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} placeholder="Enter customer complaint or service request..." rows="4" required className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Additional Details</label>
                <textarea value={formData.additional_details} onChange={e => setFormData({...formData, additional_details: e.target.value})} placeholder="Any other additional notes..." rows="3" className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Step 2 — Service Images</h3>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {[
                  { key: 'front', label: 'Front' },
                  { key: 'back', label: 'Back' },
                  { key: 'right', label: 'Right Side' },
                  { key: 'left', label: 'Left Side' },
                  { key: 'interior1', label: 'Interior 1' },
                  { key: 'interior2', label: 'Interior 2' },
                  { key: 'dashboard', label: 'Dashboard' },
                  { key: 'top', label: 'Top' },
                  { key: 'other1', label: 'Other 1', optional: true },
                  { key: 'other2', label: 'Other 2', optional: true },
                ].map(img => (
                  <div key={img.key} className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl overflow-hidden transition-colors">
                    <label className="cursor-pointer block h-full">
                      {images[img.key] ? (
                        <div className="relative">
                          <img src={URL.createObjectURL(images[img.key])} alt={img.label} className="w-full h-28 object-cover" />
                          <button type="button" onClick={e => { e.preventDefault(); handleImageUpload(img.key, null) }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-28 gap-1.5 px-2 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-500">{img.label}</span>
                          {img.optional && <span className="text-xs text-gray-400 -mt-0.5">Optional</span>}
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(img.key, e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 14l2 2 4-4" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Step 3 — Task List</h3>
              </div>

              <div className="space-y-2.5">
                {tasks.map((task, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0 grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={task.description}
                          onChange={e => updateTask(index, 'description', e.target.value)}
                          placeholder="Enter task description..."
                          className={inputCls}
                        />
                        <select value={task.category} onChange={e => updateTask(index, 'category', e.target.value)} className={inputCls}>
                          <option value="">Service Type</option>
                          {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                        </select>
                      </div>
                      {tasks.length > 1 && (
                        <button type="button" onClick={() => removeTask(index)}
                          className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-lg transition-colors flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addTask}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Task
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-7 py-4 border-t border-gray-100 bg-gray-50">
          <div>
            {currentStep > 1 && (
              <button onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => { onClose(); resetForm() }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </button>

            {currentStep < 3 ? (
              <button onClick={() => {
                if (currentStep === 1 && !formData.customer_id) { alert('Please select a customer'); return }
                if (currentStep === 1 && !formData.vehicle_id) { alert('Please select a vehicle'); return }
                if (currentStep === 1 && !formData.details.trim()) { alert('Please fill in the Customer Complaint field'); return }
                setCurrentStep(currentStep + 1)
              }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Create Job Card
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default JobCardCreateWizard