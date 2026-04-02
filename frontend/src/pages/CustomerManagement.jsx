import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'
import CustomerTable from '../components/customers/CustomerTable'
import CustomerModal from '../components/customers/CustomerModal'
import VehicleModal from '../components/customers/VehicleModal'
import Notification from '../components/common/Notification'

function CustomerManagement({ user }) {
  const [customers, setCustomers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showCustomerViewModal, setShowCustomerViewModal] = useState(false)
  const [showVehicleViewModal, setShowVehicleViewModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [viewingVehicle, setViewingVehicle] = useState(null)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [notification, setNotification] = useState(null)
  const [deleteCustomerConfirm, setDeleteCustomerConfirm] = useState(null)
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState(null)
  const branchDropdownRef = useRef(null)

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    city: '',
    id_number: '',
    company_name: '',
    customer_type: 'individual',
    is_active: true,
    notes: '',
    branch_id: ''
  })

  const [vehicleForm, setVehicleForm] = useState({
    customer_id: '',
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    color: '',
    vin: '',
    engine_number: '',
    chassis_number: '',
    odometer_reading: '',
    fuel_type: '',
    transmission: '',
    notes: '',
    is_active: true,
    branch_id: ''
  })

  // Permissions - Super admin has access to all actions
  const canViewCustomers = user.role.name === 'super_admin' || user.permissions.includes('view_customers')
  const canAddCustomers = user.role.name === 'super_admin' || user.permissions.includes('add_customers')
  const canUpdateCustomers = user.role.name === 'super_admin' || user.permissions.includes('update_customers')
  const canDeleteCustomers = user.role.name === 'super_admin' || user.permissions.includes('delete_customers')
  const canViewVehicles = user.role.name === 'super_admin' || user.permissions.includes('view_vehicles')
  const canAddVehicles = user.role.name === 'super_admin' || user.permissions.includes('add_vehicles')
  const canUpdateVehicles = user.role.name === 'super_admin' || user.permissions.includes('update_vehicles')
  const canDeleteVehicles = user.role.name === 'super_admin' || user.permissions.includes('delete_vehicles')

  console.log('User Permissions:', {
    role: user.role.name,
    permissions: user.permissions,
    canAddCustomers,
    canUpdateCustomers,
    canDeleteCustomers
  })

  useEffect(() => {
    if (user.role.name === 'super_admin') {
      const savedBranch = localStorage.getItem('selectedBranchId') || ''
      setFilterBranch(savedBranch)
    }
    fetchBranches()
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchCustomers()
  }, [search, filterBranch])

  useEffect(() => {
    const handleClick = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) {
        params.search = search
      }
      if (filterBranch) {
        params.branch_id = filterBranch
      }

      const response = await axiosClient.get('/customers', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Customers Response:', response.data)
      setCustomers(response.data.data || response.data)
    } catch (error) {
      console.error('Error fetching customers:', error.response?.data || error.message)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  // Customer Actions
  const openAddCustomerModal = () => {
    setEditingCustomer(null)
    // For super admin, use filtered branch if available, otherwise use their own branch
    const initialBranchId = user.role.name === 'super_admin' 
      ? (filterBranch || user.branch?.id || '')
      : (user.branch?.id || '')
    
    console.log('Opening Add Customer Modal:', {
      userRole: user.role.name,
      userBranch: user.branch,
      initialBranchId: initialBranchId,
      branches: branches
    })
    
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      secondary_phone: '',
      address: '',
      city: '',
      id_number: '',
      company_name: '',
      customer_type: 'individual',
      is_active: true,
      notes: '',
      branch_id: initialBranchId
    })
    setShowCustomerModal(true)
  }

  const openEditCustomerModal = (customer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      secondary_phone: customer.secondary_phone || '',
      address: customer.address || '',
      city: customer.city || '',
      id_number: customer.id_number || '',
      company_name: customer.company_name || '',
      customer_type: customer.customer_type,
      is_active: customer.is_active,
      notes: customer.notes || '',
      branch_id: customer.branch_id || ''
    })
    setShowCustomerModal(true)
  }

  const openViewCustomerModal = (customer) => {
    setViewingCustomer(customer)
    setShowCustomerViewModal(true)
  }

  const openViewVehicleModal = (vehicle) => {
    setViewingVehicle(vehicle)
    setShowVehicleViewModal(true)
  }

  const handleCustomerSubmit = async () => {
    try {
      const token = localStorage.getItem('token')

      console.log('User info:', {
        role: user.role.name,
        branch_id: user.branch?.id,
        branch: user.branch
      })
      console.log('Submitting customer form:', customerForm)

      if (editingCustomer) {
        await axiosClient.put(`/customers/${editingCustomer.id}`, customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotification({ type: 'success', title: 'Success', message: 'Customer updated successfully!' })
      } else {
        const response = await axiosClient.post('/customers', customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Customer created response:', response.data)
        setNotification({ type: 'success', title: 'Success', message: 'Customer created successfully!' })
      }

      setShowCustomerModal(false)
      fetchCustomers()
    } catch (error) {
      console.error('Error saving customer:', error.response?.data)
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error saving customer' })
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', title: 'Success', message: 'Customer deleted successfully!' })
      setDeleteCustomerConfirm(null)
      fetchCustomers()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error deleting customer' })
    }
  }
  // Vehicle Actions
  const openAddVehicleModalForCustomer = (customerId) => {
    setEditingVehicle(null)
    const initialBranchId = user.role.name === 'super_admin' 
      ? (filterBranch || user.branch?.id || '')
      : (user.branch?.id || '')
    
    setVehicleForm({
      customer_id: customerId,
      license_plate: '',
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      color: '',
      vin: '',
      engine_number: '',
      chassis_number: '',
      odometer_reading: '',
      fuel_type: '',
      transmission: '',
      notes: '',
      is_active: true,
      branch_id: initialBranchId
    })
    setShowVehicleModal(true)
  }

  const openAddVehicleModal = () => {
    setEditingVehicle(null)
    const initialBranchId = user.role.name === 'super_admin' 
      ? (filterBranch || user.branch?.id || '')
      : (user.branch?.id || '')
    
    setVehicleForm({
      customer_id: '',
      license_plate: '',
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      color: '',
      vin: '',
      engine_number: '',
      chassis_number: '',
      odometer_reading: '',
      fuel_type: '',
      transmission: '',
      notes: '',
      is_active: true,
      branch_id: initialBranchId
    })
    setShowVehicleModal(true)
  }

  const openEditVehicleModal = (vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleForm({
      customer_id: vehicle.customer_id,
      license_plate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color || '',
      vin: vehicle.vin || '',
      engine_number: vehicle.engine_number || '',
      chassis_number: vehicle.chassis_number || '',
      odometer_reading: vehicle.odometer_reading || '',
      fuel_type: vehicle.fuel_type || '',
      transmission: vehicle.transmission || '',
      notes: vehicle.notes || '',
      is_active: vehicle.is_active,
      branch_id: vehicle.branch_id || ''
    })
    setShowVehicleModal(true)
  }

  const handleVehicleSubmit = async () => {
    try {
      const token = localStorage.getItem('token')

      if (editingVehicle) {
        await axiosClient.put(`/vehicles/${editingVehicle.id}`, vehicleForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotification({ type: 'success', title: 'Success', message: 'Vehicle updated successfully!' })
      } else {
        await axiosClient.post('/vehicles', vehicleForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotification({ type: 'success', title: 'Success', message: 'Vehicle registered successfully!' })
      }

      setShowVehicleModal(false)
      fetchCustomers()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error saving vehicle' })
    }
  }

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', title: 'Success', message: 'Vehicle deleted successfully!' })
      setDeleteVehicleConfirm(null)
      fetchCustomers()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error deleting vehicle' })
    }
  }

  // Wrapper functions for delete confirmations
  const showDeleteCustomerConfirm = (customerId) => {
    setDeleteCustomerConfirm(customerId)
  }

  const showDeleteVehicleConfirm = (vehicleId) => {
    setDeleteVehicleConfirm(vehicleId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Branch Filter - Only for Super Admin */}
      {user.role.name === 'super_admin' && (
        <div ref={branchDropdownRef} className="relative w-fit">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#2563A8]/10 to-[#2563A8]/30 border border-[#2563A8]/50 shadow-sm hover:shadow-md hover:border-[#2563A8]/70 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#2563A8] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-[#2563A8]/50" />
            <span className="text-sm font-bold text-[#2563A8] flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-[#2563A8] transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[#2563A8]/50 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Dropdown options */}
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranch('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                    filterBranch === ''
                      ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                      : 'text-gray-700 hover:bg-[#2563A8]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                    All Branches
                  </div>
                </button>

                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setFilterBranch(String(branch.id))
                      localStorage.setItem('selectedBranchId', String(branch.id))
                      setBranchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                      filterBranch === String(branch.id)
                        ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                        : 'text-gray-700 hover:bg-[#2563A8]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                      {branch.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div>
        {/* Toolbar */}
        <div className="mb-5 flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search customers by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
            <span className="text-sm font-semibold text-gray-700">{customers.length}</span>
            <span className="text-sm text-gray-400">{customers.length !== 1 ? 'customers' : 'customer'}</span>
          </div>

          {canAddCustomers && (
            <button
              onClick={openAddCustomerModal}
              className="ml-auto inline-flex items-center gap-2 bg-[#2563A8] hover:bg-[#2563A8]/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            >
              <span className="flex items-center justify-center w-5 h-5 bg-white/25 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </span>
              Add Customer
            </button>
          )}
        </div>

        <CustomerTable
          user={user}
          customers={customers}
          onView={openViewCustomerModal}
          onEdit={openEditCustomerModal}
          onDelete={showDeleteCustomerConfirm}
          onAddVehicle={openAddVehicleModalForCustomer}
          onViewVehicle={openViewVehicleModal}
          onEditVehicle={openEditVehicleModal}
          onDeleteVehicle={showDeleteVehicleConfirm}
          canViewCustomers={canViewCustomers}
          canUpdateCustomers={canUpdateCustomers}
          canDeleteCustomers={canDeleteCustomers}
          canViewVehicles={canViewVehicles}
          canAddVehicles={canAddVehicles}
          canUpdateVehicles={canUpdateVehicles}
          canDeleteVehicles={canDeleteVehicles}
        />
      </div>

      {/* Modals */}
      <CustomerModal
        show={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSubmit={handleCustomerSubmit}
        formData={customerForm}
        setFormData={setCustomerForm}
        isEditing={!!editingCustomer}
        branches={branches}
        filterBranch={filterBranch}
      />

      <VehicleModal
        show={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSubmit={handleVehicleSubmit}
        formData={vehicleForm}
        setFormData={setVehicleForm}
        isEditing={!!editingVehicle}
        branches={branches}
        filterBranch={filterBranch}
      />

      {/* Customer View Modal */}
      {showCustomerViewModal && viewingCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCustomerViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">{viewingCustomer.name}</p>
              </div>
              <button onClick={() => setShowCustomerViewModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingCustomer.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{viewingCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</p>
                  <p className="text-sm font-medium text-gray-900">{viewingCustomer.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{viewingCustomer.customer_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City</p>
                  <p className="text-sm font-medium text-gray-900">{viewingCustomer.city || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Branch</p>
                  <p className="text-sm font-medium text-orange-600">{viewingCustomer.branch?.name || 'Not assigned'}</p>
                </div>
                {viewingCustomer.company_name && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company</p>
                    <p className="text-sm font-medium text-gray-900">{viewingCustomer.company_name}</p>
                  </div>
                )}
                {viewingCustomer.notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
                    <p className="text-sm font-medium text-gray-900">{viewingCustomer.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowCustomerViewModal(false)}
                className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold border border-red-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm bg-[#2563A8] hover:bg-[#2563A8]/90 text-white rounded-lg font-semibold border border-[#2563A8]/70 transition-colors"
              >
                Update Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle View Modal */}
      {showVehicleViewModal && viewingVehicle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVehicleViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Vehicle Details</h3>
                <p className="text-sm text-gray-500 mt-0.5 font-mono">{viewingVehicle.license_plate}</p>
              </div>
              <button onClick={() => setShowVehicleViewModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">License Plate</p>
                  <p className="text-sm font-mono font-bold bg-gray-100 px-2 py-1 rounded inline-block">{viewingVehicle.license_plate}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Make & Model</p>
                  <p className="text-sm font-medium text-gray-900">{viewingVehicle.make} {viewingVehicle.model}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</p>
                  <p className="text-sm font-medium text-gray-900">{viewingVehicle.year}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</p>
                  <p className="text-sm font-medium text-gray-900">{viewingVehicle.color || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fuel Type</p>
                  <p className="text-sm font-medium text-gray-900">{viewingVehicle.fuel_type || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Transmission</p>
                  <p className="text-sm font-medium text-gray-900">{viewingVehicle.transmission || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Odometer Reading</p>
                  <p className="text-sm font-medium text-gray-900">{viewingVehicle.odometer_reading ? `${viewingVehicle.odometer_reading.toLocaleString()} km` : 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">VIN</p>
                  <p className="text-sm font-medium text-gray-900 font-mono">{viewingVehicle.vin || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Customer</p>
                  <p className="text-sm font-medium text-gray-900">
                    {viewingVehicle.customer?.name || customers.find(c => c.id === viewingVehicle.customer_id)?.name || 'Not assigned'}
                  </p>
                </div>
                {viewingVehicle.notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
                    <p className="text-sm font-medium text-gray-900">{viewingVehicle.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setShowVehicleViewModal(false)} className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold border border-red-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteCustomerConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteCustomerConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 6H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Delete Customer</h3>
                <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this customer? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setDeleteCustomerConfirm(null)} className="flex-1 px-4 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteCustomer(deleteCustomerConfirm)} className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vehicle Confirmation Modal */}
      {deleteVehicleConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteVehicleConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Delete Vehicle</h3>
                <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this vehicle? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setDeleteVehicleConfirm(null)} className="flex-1 px-4 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteVehicle(deleteVehicleConfirm)} className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default CustomerManagement