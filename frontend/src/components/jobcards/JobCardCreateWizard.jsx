import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'
import Notification from '../common/Notification'
import CustomerModal from '../customers/CustomerModal'
import VehicleModal from '../customers/VehicleModal'

function JobCardCreateWizard({ show, onClose, onSuccess, user, branches = [], initialBranchId = '', jobCard = null }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [jobCardNumber, setJobCardNumber] = useState('')
  const [createdDate, setCreatedDate] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    branch_id: initialBranchId || '',
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
  const [existingImages, setExistingImages] = useState({})
  const [notification, setNotification] = useState(null)

  const [tasks, setTasks] = useState([{ description: '', category: '' }])
  const [showCustomerCreateForm, setShowCustomerCreateForm] = useState(false)
  const [showVehicleCreateForm, setShowVehicleCreateForm] = useState(false)
  const [customerModalData, setCustomerModalData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    type: 'individual', 
    branch_id: initialBranchId || '' 
  })
  const [vehicleModalData, setVehicleModalData] = useState({ 
    customer_id: '', 
    license_plate: '', 
    make: '', 
    model: '', 
    year: new Date().getFullYear(), 
    branch_id: initialBranchId || '' 
  })

  const categories = ['Mechanical','Electrical','Bodywork','Painting','Diagnostic','Maintenance','Other']

  const isEditMode = jobCard !== null

  useEffect(() => {
    if (show) {
      fetchCustomers()
      if (isEditMode && jobCard) {
        console.log('Loading job card data:', jobCard)
        console.log('Details field content:', jobCard.details)
        console.log('Job card images array:', jobCard.images)
        setJobCardNumber(jobCard.job_card_number)
        setCreatedDate(jobCard.created_at)
        setFormData({
          customer_id: jobCard.customer_id || '',
          vehicle_id: jobCard.vehicle_id || '',
          branch_id: jobCard.branch_id || '',
          expected_completion_date: jobCard.estimated_completion_date ? jobCard.estimated_completion_date.split('T')[0] : '',
          test_run_required: jobCard.test_run_required ? true : false,
          details: jobCard.details || jobCard.complaint || jobCard.customer_complaint || '',
          current_mileage: jobCard.current_mileage || '',
          additional_details: jobCard.additional_details || jobCard.notes || '',
        })
        console.log('Form data set to:', { details: jobCard.details || jobCard.complaint || jobCard.customer_complaint || '' })
        
        // Load existing images from job card - map image_type to the state keys
        if (jobCard.images && Array.isArray(jobCard.images) && jobCard.images.length > 0) {
          const imageMap = {}
          const imageTypeMap = {
            'front': 'front',
            'back': 'back',
            'right': 'right',
            'left': 'left',
            'interior1': 'interior1',
            'interior2': 'interior2',
            'dashboard': 'dashboard',
            'top': 'top',
            'other1': 'other1',
            'other2': 'other2',
            'right side': 'right',
            'left side': 'left',
            'interior 1': 'interior1',
            'interior 2': 'interior2',
            'other 1': 'other1',
            'other 2': 'other2',
          }
          
          jobCard.images.forEach(img => {
            const normalizedType = img.image_type?.toLowerCase().trim() || ''
            const key = imageTypeMap[normalizedType]
            if (key) {
              imageMap[key] = img.image_url || img.url
              console.log(`Mapped ${normalizedType} -> ${key} : ${imageMap[key]}`)
            } else {
              console.warn(`Unknown image type: ${normalizedType}`)
            }
          })
          console.log('Final existing images map:', imageMap)
          setExistingImages(imageMap)
        } else {
          console.log('No images found in job card')
          setExistingImages({})
        }
        
        if (jobCard.customer_id) fetchVehicles(jobCard.customer_id)
        if (jobCard.tasks && Array.isArray(jobCard.tasks) && jobCard.tasks.length > 0) {
          const loadedTasks = jobCard.tasks.map(t => ({ 
            description: t.description || '', 
            category: t.category || '' 
          }))
          console.log('Loaded tasks:', loadedTasks)
          setTasks(loadedTasks)
        } else {
          setTasks([{ description: '', category: '' }])
        }
        setCustomerSearch(jobCard.customer?.name || '')
      } else if (!isEditMode) {
        generateJobCardNumber()
        setCreatedDate('')
        setFormData({
          customer_id: '',
          vehicle_id: '',
          branch_id: initialBranchId || '',
          expected_completion_date: '',
          test_run_required: false,
          details: '',
          current_mileage: '',
          additional_details: '',
        })
        setImages({ front: null, back: null, right: null, left: null, interior1: null, interior2: null, dashboard: null, top: null, other1: null, other2: null })
        setExistingImages({})
        setTasks([{ description: '', category: '' }])
      }
    }
  }, [show, jobCard])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      // Fetch all customers regardless of branch when creating job card
      const response = await axiosClient.get('/customers?all=true', { headers: { Authorization: `Bearer ${token}` } })
      setCustomers(response.data.data || response.data)
    } catch (error) { 
      console.error('Error fetching customers:', error)
      // Fallback: try without all parameter
      try {
        const token = localStorage.getItem('token')
        const response = await axiosClient.get('/customers', { headers: { Authorization: `Bearer ${token}` } })
        setCustomers(response.data.data || response.data)
      } catch (e) { console.error('Fallback error:', e) }
    }
  }

  const fetchVehicles = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      // Fetch vehicles for customer regardless of branch
      const response = await axiosClient.get(`/vehicles/customer/${customerId}`, { headers: { Authorization: `Bearer ${token}` } })
      setVehicles(response.data)
    } catch (error) { console.error('Error fetching vehicles:', error); setVehicles([]) }
  }

  const handleCustomerCreated = (newCustomer) => {
    setShowCustomerCreateForm(false)
    setFormData({ ...formData, customer_id: newCustomer.id })
    setCustomerSearch(newCustomer.name)
    setShowCustomerDropdown(true)
    fetchVehicles(newCustomer.id)
    setCustomerModalData({ name: '', email: '', phone: '', address: '', type: 'individual', branch_id: initialBranchId || '' })
    // Refetch customers to ensure new customer is in the list
    fetchCustomers()
  }

  const handleVehicleCreated = (newVehicle) => {
    setShowVehicleCreateForm(false)
    setFormData({ ...formData, vehicle_id: newVehicle.id })
    setVehicleModalData({ customer_id: '', license_plate: '', make: '', model: '', year: new Date().getFullYear(), branch_id: initialBranchId || '' })
    // Refetch vehicles to ensure new vehicle is in the list
    fetchVehicles(formData.customer_id)
  }

  const handleCustomerModalSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post('/customers', customerModalData, { headers: { Authorization: `Bearer ${token}` } })
      const newCustomer = response.data.data || response.data
      handleCustomerCreated(newCustomer)
      showNotification('success', 'Customer Created', `${newCustomer.name} has been created successfully!`)
    } catch (error) {
      console.error('Error creating customer:', error)
      showNotification('error', 'Creation Failed', error.response?.data?.message || 'Error creating customer')
    }
  }

  const handleVehicleModalSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post('/vehicles', vehicleModalData, { headers: { Authorization: `Bearer ${token}` } })
      const newVehicle = response.data.data || response.data
      handleVehicleCreated(newVehicle)
      showNotification('success', 'Vehicle Created', `${newVehicle.make} ${newVehicle.model} (${newVehicle.license_plate}) has been created successfully!`)
    } catch (error) {
      console.error('Error creating vehicle:', error)
      showNotification('error', 'Creation Failed', error.response?.data?.message || 'Error creating vehicle')
    }
  }

  const generateJobCardNumber = () => {
    const year = new Date().getFullYear()
    
    // Get the branch code from current branch selection (only first 3 letters)
    let branchCode = ''
    if (formData.branch_id && branches && branches.length > 0) {
      const selectedBranch = branches.find(b => String(b.id) === String(formData.branch_id))
      if (selectedBranch && selectedBranch.code) {
        // Extract only letters and take first 3 characters
        branchCode = selectedBranch.code.replace(/[0-9]/g, '').substring(0, 3).toUpperCase()
      }
    }
    
    // Generate temporary sequence (will be replaced by actual backend number on creation)
    const tempSequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const formattedCode = branchCode ? `${branchCode}` : ''
    setJobCardNumber(`JC-${formattedCode}-${year}-${tempSequence}`)
  }

  const handleCustomerChange = (customerId) => {
    setFormData({ ...formData, customer_id: customerId, vehicle_id: '' })
    setShowCustomerDropdown(false)
    if (customerId) fetchVehicles(customerId); else setVehicles([])
  }

  const getTodayDateString = () => new Date().toISOString().split('T')[0]

  const filteredCustomers = customers.filter(c => {
    if (!c || !c.name) return false
    if (!customerSearch) return true
    const s = customerSearch.toLowerCase()
    return c.name.toLowerCase().includes(s) || (c.phone && c.phone.toLowerCase().includes(s)) || (c.email && c.email.toLowerCase().includes(s))
  })

  const handleImageUpload = (key, file) => {
    setImages({ ...images, [key]: file })
  }
  
  const removeExistingImage = (key) => {
    setExistingImages({ ...existingImages, [key]: null })
  }

  const addTask = () => setTasks([...tasks, { description: '', category: '' }])
  const removeTask = (index) => { if (tasks.length > 1) setTasks(tasks.filter((_, i) => i !== index)) }
  const updateTask = (index, field, value) => { const t = [...tasks]; t[index][field] = value; setTasks(t) }

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message })
  }

  const handleSubmit = async () => {
    try {
      const tasksWithDescription = tasks.filter(t => t.description && t.description.trim())
      if (!isEditMode && tasksWithDescription.length === 0) { 
        showNotification('error', 'Missing Tasks', 'Please add at least one task with a description')
        return 
      }
      if (!formData.details || !formData.details.trim()) { 
        showNotification('error', 'Missing Information', 'Please fill in the Customer Complaint field')
        return 
      }
      if (!formData.branch_id) { 
        showNotification('error', 'Missing Branch', 'Please select a branch')
        return 
      }
      if (!formData.expected_completion_date) { 
        showNotification('error', 'Missing Date', 'Please select an Expected Completion Date')
        return 
      }
      const token = localStorage.getItem('token')
      
      if (isEditMode) {
        // Update existing job card
        await axiosClient.put(`/job-cards/${jobCard.id}`, { ...formData }, { headers: { Authorization: `Bearer ${token}` } })
        
        // Handle new images - send with their types
        const newImages = Object.entries(images).filter(([key, file]) => file)
        if (newImages.length > 0) {
          const imageFormData = new FormData()
          newImages.forEach(([key, file]) => {
            imageFormData.append('images[]', file)
            imageFormData.append('image_types[]', key) // Send the image type with each image
          })
          await axiosClient.post(`/job-cards/${jobCard.id}/images`, imageFormData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          })
        }
      } else {
        // Create new job card
        const response = await axiosClient.post('/job-cards', { ...formData, tasks: tasksWithDescription }, { headers: { Authorization: `Bearer ${token}` } })
        const jobCardId = response.data.job_card.id
        
        // Handle images - send with their types
        const newImages = Object.entries(images).filter(([key, file]) => file)
        if (newImages.length > 0) {
          const imageFormData = new FormData()
          newImages.forEach(([key, file]) => {
            imageFormData.append('images[]', file)
            imageFormData.append('image_types[]', key) // Send the image type with each image
          })
          await axiosClient.post(`/job-cards/${jobCardId}/images`, imageFormData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          })
        }
      }
      // Success - close form immediately and let parent show notification
      onSuccess()
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      showNotification('error', isEditMode ? 'Update Failed' : 'Creation Failed', error.response?.data?.message || (isEditMode ? 'Error updating job card' : 'Error creating job card'))
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setFormData({ customer_id: '', vehicle_id: '', branch_id: initialBranchId || '', expected_completion_date: '', test_run_required: false, details: '', current_mileage: '', additional_details: '' })
    setImages({ front: null, back: null, right: null, left: null, interior1: null, interior2: null, dashboard: null, top: null, other1: null, other2: null })
    setExistingImages({})
    setTasks([{ description: '', category: '' }])
    generateJobCardNumber()
  }

  if (!show) return null

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  const steps = [
    { n: 1, label: 'Service Details', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" fill="#2563A8" /> },
    { n: 2, label: 'Service Images', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#2563A8" /> },
    { n: 3, label: 'Task List', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 12l2 2 4-4" fill="#2563A8" /> },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 right-24 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{isEditMode ? 'Edit Job Card' : 'Create New Job Card'}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{isEditMode ? 'Update job card information below' : 'Fill in all required information below'}</p>
            </div>
            <button onClick={() => { onClose(); resetForm() }} className="p-1.5 rounded-lg text-red-500 hover:text-white hover:bg-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 px-8 py-5 bg-gray-50 border-b border-gray-100">
          {(() => {
            const visibleSteps = steps.filter(s => !isEditMode || s.n !== 3)
            return visibleSteps.map((s, i) => (
              <div key={`step-${s.n}`} className="flex items-center">
                <button
                  onClick={() => s.n < currentStep && setCurrentStep(s.n)}
                  disabled={s.n > currentStep}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    currentStep === s.n
                      ? 'bg-[#2563A8] text-white shadow-md scale-105'
                      : currentStep > s.n
                      ? 'bg-[#2563A8] text-white cursor-pointer hover:bg-[#1E4E7E]'
                      : 'bg-[#2563A8] text-white border border-[#2563A8] cursor-not-allowed'
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
                {i < visibleSteps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 bg-[#2563A8]`} />
                )}
              </div>
            ))
          })()}
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
                  <label className={labelCls}>{isEditMode ? 'Created Date' : 'Date and Time'} <span className="text-red-400">*</span></label>
                  <input type="text" value={isEditMode ? new Date(createdDate).toLocaleString() : new Date().toLocaleString()} readOnly className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500" />
                  <p className="text-xs text-gray-400 mt-1">{isEditMode ? 'Original creation date cannot be changed' : 'Automatically set to current date and time'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Expected Completion Date <span className="text-red-400">*</span></label>
                  {isEditMode ? (
                    <>
                      <input type="date" value={formData.expected_completion_date} readOnly className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500" />
                      <p className="text-xs text-gray-400 mt-1">Cannot be edited after creation</p>
                    </>
                  ) : (
                    <>
                      <input type="date" value={formData.expected_completion_date} onChange={e => setFormData({...formData, expected_completion_date: e.target.value})} min={getTodayDateString()} required className={inputCls} />
                      <p className="text-xs text-gray-400 mt-1">Select when you expect this job to be completed <span className="text-red-500">*</span></p>
                    </>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Branch <span className="text-red-400">*</span></label>
                  {initialBranchId || isEditMode ? (
                    <>
                      <input 
                        type="text" 
                        value={branches.find(b => b.id === parseInt(isEditMode ? formData.branch_id : initialBranchId))?.name || ''} 
                        readOnly 
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-semibold" 
                      />
                      <p className="text-xs text-gray-400 mt-1">{isEditMode ? 'Branch cannot be changed after creation' : 'Branch is locked based on filter'}</p>
                    </>
                  ) : (
                    <select value={formData.branch_id} onChange={e => {
                      setFormData({...formData, branch_id: e.target.value})
                      // Regenerate job card number with new branch code
                      setTimeout(() => {
                        const year = new Date().getFullYear()
                        const selectedBranch = branches.find(b => String(b.id) === String(e.target.value))
                        // Extract only letters and take first 3 characters
                        const branchCode = selectedBranch?.code?.replace(/[0-9]/g, '').substring(0, 3).toUpperCase() || ''
                        const tempSequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                        setJobCardNumber(`JC-${branchCode}-${year}-${tempSequence}`)
                      }, 0)
                    }} required className={inputCls}>
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={`branch-${b.id}`} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
                  <p className="text-xs text-gray-400 mb-1.5">Search by name, phone, or email</p>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Search customer..."
                        disabled={isEditMode}
                        className={`${inputCls} ${isEditMode ? 'disabled:cursor-not-allowed disabled:bg-gray-100' : ''}`}
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-xl bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                          {filteredCustomers.map(c => (
                            <div key={`customer-${c.id}`} onClick={() => { handleCustomerChange(c.id); setCustomerSearch(c.name) }}
                              className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                              <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                              <p className="text-xs text-gray-400">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => setShowCustomerCreateForm(true)}
                        className="px-3.5 py-2.5 bg-[#2563A8] hover:bg-[#1E4E7E] text-white rounded-lg font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Vehicle <span className="text-red-400">*</span></label>
                  <p className="text-xs text-gray-400 mb-1.5">{isEditMode ? 'Vehicle selected at creation' : 'Select a customer first'}</p>
                  <div className="flex gap-2">
                    <select value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} required disabled={!formData.customer_id || isEditMode} className={`flex-1 ${inputCls} disabled:cursor-not-allowed disabled:bg-gray-100`}>
                      <option value="">Select vehicle...</option>
                      {vehicles.map(v => <option key={`vehicle-${v.id}`} value={v.id}>{v.license_plate} — {v.make} {v.model}</option>)}
                    </select>
                    {!isEditMode && formData.customer_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleModalData({ ...vehicleModalData, customer_id: formData.customer_id })
                          setShowVehicleCreateForm(true)
                        }}
                        className="px-3.5 py-2.5 bg-[#2563A8] hover:bg-[#1E4E7E] text-white rounded-lg font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Test Run Required <span className="text-red-400">*</span></label>
                <div className="flex gap-5">
                  {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map((opt, idx) => (
                    <label key={`testrun-${idx}`} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={formData.test_run_required === opt.val} onChange={() => setFormData({...formData, test_run_required: opt.val})} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Customer Complaint <span className="text-red-400">*</span></label>
                <textarea value={formData.details || ''} onChange={e => setFormData({...formData, details: e.target.value})} placeholder="Enter customer complaint or service request..." rows="4" required className={`${inputCls} resize-none`} />
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
                  <div key={`image-${img.key}`} className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl overflow-hidden transition-colors relative">
                    <label className="cursor-pointer block h-full">
                      {images[img.key] ? (
                        <div className="relative">
                          <img src={URL.createObjectURL(images[img.key])} alt={img.label} className="w-full h-28 object-cover" />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">New</div>
                          <button type="button" onClick={e => { e.preventDefault(); handleImageUpload(img.key, null) }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">
                            ×
                          </button>
                        </div>
                      ) : existingImages[img.key] ? (
                        <div className="relative">
                          <img src={existingImages[img.key]} alt={img.label} className="w-full h-28 object-cover" />
                          <div className="absolute top-1 left-1 bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded">Existing</div>
                          <button type="button" onClick={e => { e.preventDefault(); removeExistingImage(img.key) }}
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
          {currentStep === 3 && !isEditMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 14l2 2 4-4" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Step 3 — Task List</h3>
              </div>

              <div className="space-y-2.5">
                {tasks.map((task, index) => (
                  <div key={`task-${index}`} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
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
                          {categories.map((cat, idx) => <option key={`category-${idx}`} value={cat.toLowerCase()}>{cat}</option>)}
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded-lg text-sm font-semibold shadow-sm transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </button>

            {currentStep < (isEditMode ? 2 : 3) ? (
              <button onClick={() => {
                if (currentStep === 1 && !formData.customer_id) { showNotification('error', 'Missing Customer', 'Please select a customer'); return }
                if (currentStep === 1 && !formData.vehicle_id) { showNotification('error', 'Missing Vehicle', 'Please select a vehicle'); return }
                if (currentStep === 1 && !formData.details.trim()) { showNotification('error', 'Missing Information', 'Please fill in the Customer Complaint field'); return }
                setCurrentStep(currentStep + 1)
              }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#2563A8] hover:bg-[#1E4E7E] text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-2 bg-[#2563A8] hover:bg-[#1E4E7E] text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isEditMode ? 'Update Job Card' : 'Create Job Card'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>

      {showCustomerCreateForm && (
        <CustomerModal 
          show={showCustomerCreateForm}
          onClose={() => {
            setShowCustomerCreateForm(false)
            setCustomerModalData({ name: '', email: '', phone: '', address: '', type: 'individual', branch_id: initialBranchId || '' })
          }}
          onSubmit={handleCustomerModalSubmit}
          formData={customerModalData}
          setFormData={setCustomerModalData}
          isEditing={false}
          branches={branches}
          filterBranch={initialBranchId}
        />
      )}

      {showVehicleCreateForm && (
        <VehicleModal 
          show={showVehicleCreateForm}
          onClose={() => {
            setShowVehicleCreateForm(false)
            setVehicleModalData({ customer_id: formData.customer_id || '', license_plate: '', make: '', model: '', year: new Date().getFullYear(), branch_id: initialBranchId || '' })
          }}
          onSubmit={handleVehicleModalSubmit}
          formData={vehicleModalData}
          setFormData={setVehicleModalData}
          isEditing={false}
          branches={branches}
          filterBranch={initialBranchId}
        />
      )}

      <Notification notification={notification} onClose={() => setNotification(null)} />
    </>
  )
}

export default JobCardCreateWizard