import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'
import ThirdPartyServiceTable from '../components/thirdPartyServices/ThirdPartyServiceTable'
import ThirdPartyServiceModal from '../components/thirdPartyServices/ThirdPartyServiceModal'
import Notification from '../components/common/Notification'

function ThirdPartyServiceManagement({ user }) {
  const [services, setServices] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('all')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [notification, setNotification] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const branchDropdownRef = useRef(null)

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axiosClient.get('/branches', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBranches(response.data.data || response.data)
      } catch (error) {
        console.error('Error fetching branches:', error)
        setNotification({ type: 'error', message: 'Failed to load branches' })
      }
    }
    fetchBranches()
  }, [])

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const response = await axiosClient.get('/third-party-services', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setServices(response.data.data || response.data)
      } catch (error) {
        console.error('Error fetching services:', error)
        setNotification({ type: 'error', message: 'Failed to load services' })
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Filter services by search and branch
  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.company_name.toLowerCase().includes(search.toLowerCase()) ||
      service.telephone_number.includes(search) ||
      service.email_address.toLowerCase().includes(search.toLowerCase())
    const matchesBranch = filterBranch === 'all' || !filterBranch || service.branch_id == filterBranch
    return matchesSearch && matchesBranch
  })

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service)
    } else {
      setEditingService(null)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingService(null)
  }

  const handleSaveService = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      if (editingService) {
        await axiosClient.put(`/third-party-services/${editingService.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotification({ type: 'success', message: 'Service provider updated successfully' })
      } else {
        await axiosClient.post('/third-party-services', formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotification({ type: 'success', message: 'Service provider created successfully' })
      }
      const response = await axiosClient.get('/third-party-services', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setServices(response.data.data || response.data)
      handleCloseModal()
    } catch (error) {
      console.error('Error saving service:', error)
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save service provider'
      })
    }
  }

  const handleDeleteService = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/third-party-services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', message: 'Service provider deleted successfully' })
      setServices(services.filter(s => s.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting service:', error)
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete service provider'
      })
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Third Party Service Providers</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage external service providers and their offerings</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md text-white bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:-translate-y-px active:translate-y-0"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          <span className="flex items-center justify-center w-5 h-5 bg-white/25 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </span>
          Add New Provider
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by company, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        {/* Branch Filter */}
        <div ref={branchDropdownRef} className="relative">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 rounded-xl px-4 py-2.5 transition-all duration-200 min-w-[200px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-4 bg-orange-300" />
            <span className="text-sm font-bold text-orange-900 flex-1 text-left">
              {filterBranch === 'all' || !filterBranch
                ? 'All Branches'
                : branches.find(b => b.id == filterBranch)?.name || 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-orange-600 transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[260px] bg-white border border-orange-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setFilterBranch('all'); setBranchDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all ${filterBranch === 'all' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white' : 'text-gray-700 hover:bg-orange-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${filterBranch === 'all' ? 'bg-white' : 'bg-orange-300'}`} />
                    All Branches
                  </div>
                </button>
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => { setFilterBranch(branch.id); setBranchDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all border-t border-orange-50 ${filterBranch == branch.id ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white' : 'text-gray-700 hover:bg-orange-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${filterBranch == branch.id ? 'bg-white' : 'bg-orange-300'}`} />
                      {branch.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Count badge */}
        <div className="ml-auto flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <span className="text-sm font-semibold text-gray-700">{filteredServices.length}</span>
          <span className="text-sm text-gray-400">{filteredServices.length === 1 ? 'provider' : 'providers'}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading providers...</span>
          </div>
        </div>
      ) : (
        <ThirdPartyServiceTable
          services={filteredServices}
          branches={branches}
          onEdit={handleOpenModal}
          onDelete={(id) => setDeleteConfirm(id)}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <ThirdPartyServiceModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveService}
          initialData={editingService}
          branches={branches}
          user={user}
          defaultBranchId={filterBranch !== 'all' && filterBranch ? filterBranch : ''}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Delete Provider</h3>
                <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this service provider? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteService(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">
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

export default ThirdPartyServiceManagement