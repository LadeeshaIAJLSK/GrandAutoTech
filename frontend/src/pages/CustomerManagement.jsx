import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'
import CustomerTable from '../components/customers/CustomerTable'
import CustomerModal from '../components/customers/CustomerModal'
import VehicleModal from '../components/customers/VehicleModal'

function CustomerManagement({ user }) {
  const [customers, setCustomers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
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
    mileage: '',
    fuel_type: '',
    transmission: '',
    notes: '',
    is_active: true,
    branch_id: ''
  })

  // Permissions
  const canAddCustomers = user.permissions.includes('add_customers')
  const canUpdateCustomers = user.permissions.includes('update_customers')
  const canDeleteCustomers = user.permissions.includes('delete_customers')
  const canAddVehicles = user.permissions.includes('add_vehicles')
  const canUpdateVehicles = user.permissions.includes('update_vehicles')
  const canDeleteVehicles = user.permissions.includes('delete_vehicles')

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
        alert('Customer updated successfully!')
      } else {
        const response = await axiosClient.post('/customers', customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Customer created response:', response.data)
        alert('Customer created successfully!')
      }

      setShowCustomerModal(false)
      fetchCustomers()
    } catch (error) {
      console.error('Error saving customer:', error.response?.data)
      alert(error.response?.data?.message || 'Error saving customer')
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Customer deleted successfully!')
      fetchCustomers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting customer')
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
      mileage: '',
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
      mileage: '',
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
      mileage: vehicle.mileage || '',
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
        alert('Vehicle updated successfully!')
      } else {
        await axiosClient.post('/vehicles', vehicleForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('Vehicle registered successfully!')
      }

      setShowVehicleModal(false)
      fetchCustomers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving vehicle')
    }
  }

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Vehicle deleted successfully!')
      fetchCustomers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting vehicle')
    }
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
            className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-blue-300" />
            <span className="text-sm font-bold text-blue-900 flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-blue-600 transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-blue-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
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
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-blue-300'}`} />
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
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-blue-300'}`} />
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
              className="ml-auto inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0"
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
          onEdit={openEditCustomerModal}
          onDelete={handleDeleteCustomer}
          onAddVehicle={openAddVehicleModalForCustomer}
          onEditVehicle={openEditVehicleModal}
          onDeleteVehicle={handleDeleteVehicle}
          canUpdate={canUpdateCustomers}
          canDelete={canDeleteCustomers}
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
    </div>
  )
}

export default CustomerManagement