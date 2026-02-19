import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'
import CustomerTable from '../components/customers/CustomerTable'
import VehicleTable from '../components/customers/VehicleTable'
import CustomerModal from '../components/customers/CustomerModal'
import VehicleModal from '../components/customers/VehicleModal'

function CustomerManagement({ user }) {
  const [activeTab, setActiveTab] = useState('customers')
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [search, setSearch] = useState('')

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
    notes: ''
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
    is_active: true
  })

  // Permissions
  const canAddCustomers = user.permissions.includes('add_customers')
  const canUpdateCustomers = user.permissions.includes('update_customers')
  const canDeleteCustomers = user.permissions.includes('delete_customers')
  const canAddVehicles = user.permissions.includes('add_vehicles')
  const canUpdateVehicles = user.permissions.includes('update_vehicles')
  const canDeleteVehicles = user.permissions.includes('delete_vehicles')

  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers()
    } else {
      fetchVehicles()
    }
  }, [search, activeTab])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search

      const response = await axiosClient.get('/customers', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomers(response.data.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search

      const response = await axiosClient.get('/vehicles', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setVehicles(response.data.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  // Customer Actions
  const openAddCustomerModal = () => {
    setEditingCustomer(null)
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
      notes: ''
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
      notes: customer.notes || ''
    })
    setShowCustomerModal(true)
  }

  const handleCustomerSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (editingCustomer) {
        await axiosClient.put(`/customers/${editingCustomer.id}`, customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ Customer updated successfully!')
      } else {
        await axiosClient.post('/customers', customerForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ Customer created successfully!')
      }
      
      setShowCustomerModal(false)
      fetchCustomers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving customer')
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('⚠️ Are you sure you want to delete this customer?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Customer deleted successfully!')
      fetchCustomers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting customer')
    }
  }

  // Vehicle Actions
  const openAddVehicleModal = () => {
    setEditingVehicle(null)
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
      is_active: true
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
      is_active: vehicle.is_active
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
        alert('✅ Vehicle updated successfully!')
      } else {
        await axiosClient.post('/vehicles', vehicleForm, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ Vehicle registered successfully!')
      }
      
      setShowVehicleModal(false)
      fetchVehicles()
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving vehicle')
    }
  }

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('⚠️ Are you sure you want to delete this vehicle?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Vehicle deleted successfully!')
      fetchVehicles()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting vehicle')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'customers'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👥 Customers
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'vehicles'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🚗 Vehicles
          </button>
        </div>

        {activeTab === 'customers' && canAddCustomers && (
          <button
            onClick={openAddCustomerModal}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ➕ Add Customer
          </button>
        )}

        {activeTab === 'vehicles' && canAddVehicles && (
          <button
            onClick={openAddVehicleModal}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ➕ Register Vehicle
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder={activeTab === 'customers' ? '🔍 Search customers by name, phone, email...' : '🔍 Search vehicles by license plate, make, model...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
        />
      </div>

      {/* Count */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg mb-5">
        <span className="text-primary text-xl font-bold">
          {activeTab === 'customers' ? customers.length : vehicles.length}
        </span>
        <span className="text-gray-600 ml-2">
          {activeTab === 'customers' 
            ? `customer${customers.length !== 1 ? 's' : ''} found`
            : `vehicle${vehicles.length !== 1 ? 's' : ''} found`
          }
        </span>
      </div>

      {/* Tables */}
      {activeTab === 'customers' ? (
        <CustomerTable
          customers={customers}
          onEdit={openEditCustomerModal}
          onDelete={handleDeleteCustomer}
          canUpdate={canUpdateCustomers}
          canDelete={canDeleteCustomers}
        />
      ) : (
        <VehicleTable
          vehicles={vehicles}
          onEdit={openEditVehicleModal}
          onDelete={handleDeleteVehicle}
          canUpdate={canUpdateVehicles}
          canDelete={canDeleteVehicles}
        />
      )}

      {/* Modals */}
      <CustomerModal
        show={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSubmit={handleCustomerSubmit}
        formData={customerForm}
        setFormData={setCustomerForm}
        isEditing={!!editingCustomer}
      />

      <VehicleModal
        show={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSubmit={handleVehicleSubmit}
        formData={vehicleForm}
        setFormData={setVehicleForm}
        isEditing={!!editingVehicle}
      />
    </div>
  )
}

export default CustomerManagement