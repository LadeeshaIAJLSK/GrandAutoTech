import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'
import QuotationPrint from '../components/QuotationPrint'
import Notification from '../components/common/Notification'
import ConfirmDialog from '../components/common/ConfirmDialog'

function QuotationManagement({ user }) {
  const [quotations, setQuotations] = useState([])
  const [branches, setBranches] = useState([])
  const [filterBranch, setFilterBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isDetailModalEditMode, setIsDetailModalEditMode] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [currentQuotation, setCurrentQuotation] = useState(null)
  const [quotationItems, setQuotationItems] = useState([])
  const [editingItemId, setEditingItemId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null)
  const [deleteConfirmQuotation, setDeleteConfirmQuotation] = useState(null)
  
  const categories = ['Mechanical', 'Electrical', 'Bodywork', 'Painting', 'Diagnostic', 'Maintenance', 'Other']

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    insurance_company: '',
    branch_id: '',
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  }) 

  const [newItem, setNewItem] = useState({
    item_type: 'task',
    task_id: '',
    description: '',
    category: '',
    quantity_or_hours: '',
    unit_price: '',
    notes: '',
  })

  useEffect(() => {
    fetchBranches()
    // Load saved branch filter from localStorage (for super admin only)
    // For non-super-admins, automatically set to their own branch
    if (user.role.name === 'super_admin') {
      const savedBranch = localStorage.getItem('selectedBranchId') || ''
      setFilterBranch(savedBranch)
    } else {
      // Non-super-admins always see their own branch
      setFilterBranch(String(user.branch_id || ''))
    }
  }, [])

  useEffect(() => {
    fetchQuotations()
    fetchCustomers()
  }, [search, statusFilter, filterBranch])

  const fetchBranches = async () => {
    try {
      const response = await axiosClient.get('/branches')
      const branchesData = response.data.data || response.data
      setBranches(branchesData)
    } catch (error) { console.error('Error fetching branches:', error) }
  }

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (filterBranch) params.branch_id = filterBranch
      const response = await axiosClient.get('/quotations', { params, headers: { Authorization: `Bearer ${token}` } })
      setQuotations(response.data.data || [])
    } catch (error) {
      console.error('Error fetching quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/customers', { headers: { Authorization: `Bearer ${token}` } })
      setCustomers(response.data.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchVehicles = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/vehicles/customer/${customerId}`, { headers: { Authorization: `Bearer ${token}` } })
      setVehicles(response.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchQuotationDetail = async (id, editMode = false) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/quotations/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setCurrentQuotation(response.data)
      setQuotationItems(response.data.items || [])
      setIsDetailModalEditMode(editMode)
      setShowDetailModal(true)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error fetching quotation' })
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const dataToSubmit = {
        ...formData,
        branch_id: filterBranch || user.branch_id
      }
      const response = await axiosClient.post('/quotations', dataToSubmit, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: 'Quotation created successfully!' })
      setShowCreateModal(false)
      setFormData({
        customer_id: '',
        vehicle_id: '',
        insurance_company: '',
        branch_id: '',
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: '',
      }) 
      fetchQuotations()
      // Open detail modal for new quotation
      fetchQuotationDetail(response.data.quotation.id, true)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error creating quotation' })
    }
  }

  const handleAddItem = async () => {
    if (!newItem.description || !newItem.quantity_or_hours || !newItem.unit_price) {
      setNotification({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields' })
      return
    }

    if (newItem.item_type === 'task' && !newItem.category) {
      setNotification({ type: 'error', title: 'Validation Error', message: 'Please select a category for task items' })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(
        `/quotations/${currentQuotation.id}/items`,
        newItem,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setQuotationItems([...quotationItems, response.data.item])
      setNewItem({
        item_type: 'task',
        task_id: '',
        description: '',
        category: '',
        quantity_or_hours: '',
        unit_price: '',
        notes: '',
      })
      fetchQuotationDetail(currentQuotation.id, isDetailModalEditMode)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error adding item' })
    }
  }

  const handleUpdateItem = async (itemId) => {
    const item = quotationItems.find(i => i.id === itemId)
    try {
      const token = localStorage.getItem('token')
      await axiosClient.put(
        `/quotations/${currentQuotation.id}/items/${itemId}`,
        item,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEditingItemId(null)
      fetchQuotationDetail(currentQuotation.id, isDetailModalEditMode)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error updating item' })
    }
  }

  const handleDeleteItem = async (itemId) => {
    setDeleteConfirmItem(itemId)
  }

  const confirmDeleteItem = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(
        `/quotations/${currentQuotation.id}/items/${deleteConfirmItem}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNotification({ type: 'success', title: 'Success', message: 'Item deleted successfully!' })
      setDeleteConfirmItem(null)
      setQuotationItems(quotationItems.filter(i => i.id !== deleteConfirmItem))
      fetchQuotationDetail(currentQuotation.id, isDetailModalEditMode)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error deleting item' })
      setDeleteConfirmItem(null)
    }
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.put(`/quotations/${currentQuotation.id}`, currentQuotation, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: 'Quotation saved!' })
      fetchQuotationDetail(currentQuotation.id, isDetailModalEditMode)
      fetchQuotations()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error saving quotation' })
    }
  }

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/quotations/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: 'Quotation approved!' })
      fetchQuotations()
      if (currentQuotation?.id === id) fetchQuotationDetail(id, false)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error approving quotation' })
    }
  }

  const handleConvertToJobCard = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/quotations/${id}/convert`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: `Converted to Job Card: ${response.data.job_card.job_card_number}` })
      setShowDetailModal(false)
      fetchQuotations()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error converting quotation' })
    }
  }

  const handleDeleteQuotation = (id) => {
    setDeleteConfirmQuotation(id)
  }

  const confirmDeleteQuotation = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.put(`/quotations/${deleteConfirmQuotation}`, { status: 'cancelled' }, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: 'Quotation cancelled successfully!' })
      setDeleteConfirmQuotation(null)
      setShowDetailModal(false)
      fetchQuotations()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error cancelling quotation' })
      setDeleteConfirmQuotation(null)
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      draft:     { cls: 'bg-gray-50 text-gray-600 border-gray-200',    dot: 'bg-gray-400' },
      sent:      { cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
      approved:  { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
      rejected:  { cls: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-400' },
      converted: { cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
      expired:   { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
    }
    return styles[status] || { cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
  }

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(num)
  }

  const calculatePriceByType = () => {
    if (!quotationItems || quotationItems.length === 0) {
      return { task: 0, spare_part: 0, other_charges: 0, subtotal: 0 }
    }
    
    let task = 0, spare_part = 0, other_charges = 0
    
    quotationItems.forEach(item => {
      const amount = parseFloat(item.amount) || (parseFloat(item.quantity_or_hours) || 0) * (parseFloat(item.unit_price) || 0)
      if (item.item_type === 'task') task += amount
      else if (item.item_type === 'spare_part') spare_part += amount
      else if (item.item_type === 'other_charges') other_charges += amount
    })
    
    return { task, spare_part, other_charges, subtotal: task + spare_part + other_charges }
  }

  const calculateCurrentTotal = () => {
    const prices = calculatePriceByType()
    return prices.subtotal
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  // Permission checks for quotations
  const canViewQuotationsTab = user.role.name === 'super_admin' || user.permissions.includes('view_quotations_tab')
  const canCreateQuotations = user.role.name === 'super_admin' || user.permissions.includes('create_quotations')
  const canViewQuotationDetails = user.role.name === 'super_admin' || user.permissions.includes('view_quotations_details')
  const canEditQuotations = user.role.name === 'super_admin' || user.permissions.includes('edit_quotations')
  const canDeleteQuotations = user.role.name === 'super_admin' || user.permissions.includes('delete_quotations')
  const canApproveQuotations = user.role.name === 'super_admin' || user.permissions.includes('approve_quotations')
  const canAddQuotationItems = user.role.name === 'super_admin' || user.permissions.includes('add_quotation_items')
  const canEditQuotationItems = user.role.name === 'super_admin' || user.permissions.includes('edit_quotation_items')
  const canDeleteQuotationItems = user.role.name === 'super_admin' || user.permissions.includes('delete_quotation_items')
  const canPrintQuotations = user.role.name === 'super_admin' || user.permissions.includes('print_quotations')

  // Block access if user doesn't have view_quotations_tab permission
  if (!canViewQuotationsTab) {
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading quotations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Branch Filter - Only for Super Admin */}
      {user.role.name === 'super_admin' && (
        <div className="relative w-fit">
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
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranch('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${filterBranch === '' ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white' : 'text-gray-700 hover:bg-[#2563A8]/10'}`}
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
                      className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${filterBranch === String(branch.id) ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white' : 'text-gray-700 hover:bg-[#2563A8]/10'}`}
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

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Quotations
        </h2>
        {canCreateQuotations && (
          <button
            onClick={() => {
              setFormData({
                customer_id: '',
                vehicle_id: '',
                insurance_company: '',
                branch_id: '',
                valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                notes: '',
              })
              setShowCreateModal(true)
            }}
            className="inline-flex items-center gap-2 bg-[#2563A8] hover:bg-[#2563A8] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <span className="flex items-center justify-center w-4 h-4 bg-[#2563A8] rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            Create Quotation
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search quotations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quotation #</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Insurance Company</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">No quotations found</p>
                  </td>
                </tr>
              ) : (
                quotations.map(quot => {
                  const statusStyle = getStatusStyle(quot.status)
                  return (
                    <tr key={quot.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-primary cursor-pointer hover:underline" onClick={() => fetchQuotationDetail(quot.id, false)}>
                        {quot.quotation_number}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{quot.customer?.name}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 tracking-wider">
                          {quot.vehicle?.license_plate}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{quot.insurance_company || '—'}</td>
                      <td className="px-5 py-4 font-bold text-gray-900">{formatCurrency(quot.total_amount)}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">
                        {quot.valid_until ? new Date(quot.valid_until).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {quot.status.charAt(0).toUpperCase() + quot.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {canViewQuotationDetails && (
                            <button
                              onClick={() => fetchQuotationDetail(quot.id, false)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                          )}
                          {canEditQuotations && (quot.status === 'draft' || quot.status === 'approved') && (
                            <button
                              onClick={() => fetchQuotationDetail(quot.id, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {quot.status === 'draft' ? 'Edit' : 'Edit Details'}
                            </button>
                          )}
                          {canPrintQuotations && (
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token')
                                try {
                                  const response = await axiosClient.get(`/quotations/${quot.id}`, { headers: { Authorization: `Bearer ${token}` } })
                                  setCurrentQuotation(response.data)
                                  setQuotationItems(response.data.items || [])
                                  setShowPrintPreview(true)
                                  
                                } catch (error) {
                                  setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error fetching quotation' })
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                              title="Print Quotation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4H9m6 0h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
                              </svg>
                              Print
                            </button>
                          )}
                          {canApproveQuotations && quot.status === 'draft' && (
                            <button
                              onClick={() => handleApprove(quot.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Approve
                            </button>
                          )}
                          {quot.status === 'approved' && !quot.job_card_id && (
                            <button
                              onClick={() => handleConvertToJobCard(quot.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Convert to Job Card
                            </button>
                          )}
                          {canDeleteQuotations && quot.status === 'draft' && (
                            <button
                              onClick={() => handleDeleteQuotation(quot.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Quotation</h3>
                <p className="text-sm text-gray-400 mt-0.5">Fill in the details to create a new quotation</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-7 py-6 space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Branch <span className="text-red-400">*</span></label>
                  <div className={`${inputCls} flex items-center bg-gray-100 cursor-not-allowed`}>
                    <span className="text-gray-700 font-semibold">
                      {branches.find(b => String(b.id) === filterBranch)?.name || 'Select Branch'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => { setFormData({...formData, customer_id: e.target.value, vehicle_id: ''}); fetchVehicles(e.target.value) }}
                    required className={inputCls}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Vehicle <span className="text-red-400">*</span></label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                  required className={inputCls}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Insurance Company</label>
                <input type="text" value={formData.insurance_company} onChange={(e) => setFormData({...formData, insurance_company: e.target.value})} placeholder="e.g., ABC Insurance Co." className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Valid Until</label>
                <input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="2" className={`${inputCls} resize-none`} />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 text-sm bg-[#2563A8] hover:bg-[#2563A8] text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal with Items Management */}
      {showDetailModal && currentQuotation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quotation #{currentQuotation.quotation_number}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{currentQuotation.customer?.name} - {currentQuotation.vehicle?.license_plate}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-6 space-y-6">
              {/* Quotation Header Info */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Customer</p>
                  <p className="text-sm text-gray-900 font-bold mt-1">{currentQuotation.customer?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Vehicle</p>
                  <p className="text-sm text-gray-900 font-bold mt-1">{currentQuotation.vehicle?.license_plate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Valid Until</p>
                  <p className="text-sm text-gray-900 font-bold mt-1">{currentQuotation.valid_until ? new Date(currentQuotation.valid_until).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <p className="text-sm text-gray-900 font-bold mt-1 capitalize">{currentQuotation.status}</p>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase">Quotation Items</h4>

                {/* Items Table */}
                {quotationItems.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty/Hours</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {quotationItems.map((item) => {
                          const amount = item.amount || (parseFloat(item.quantity_or_hours) || 0) * (parseFloat(item.unit_price) || 0)
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-semibold">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                  item.item_type === 'task' ? 'bg-blue-100 text-blue-700' : 
                                  item.item_type === 'spare_part' ? 'bg-orange-100 text-orange-700' : 
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {item.item_type === 'task' ? 'Task' : item.item_type === 'spare_part' ? 'Part' : 'Other Charge'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{item.description}</td>
                              <td className="px-4 py-3 text-gray-700 capitalize">{item.category || '—'}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                {Number(item.quantity_or_hours) % 1 === 0
                                  ? Number(item.quantity_or_hours)
                                  : parseFloat(item.quantity_or_hours)
                              }</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(item.unit_price)}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-bold">{formatCurrency(amount)}</td>
                              <td className="px-4 py-3 text-center">
                                {isDetailModalEditMode && canDeleteQuotationItems && (
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="inline-flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-500">No items added yet</p>
                  </div>
                )}

                {/* Add Item Form */}
                {isDetailModalEditMode && canAddQuotationItems && currentQuotation.status !== 'converted' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                    <h5 className="text-sm font-bold text-gray-700">Add Item</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Type</label>
                        <select
                          value={newItem.item_type}
                          onChange={(e) => setNewItem({...newItem, item_type: e.target.value, category: ''})}
                          className="w-full px-3 py-2 text-sm border border-white rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="task">Task (Hours)</option>
                          <option value="spare_part">Spare Part (Qty)</option>
                          <option value="other_charges">Other Charges</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Description <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={newItem.description}
                          onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                          placeholder="e.g., Brake service"
                          className="w-full px-3 py-2 text-sm border border-white rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      {newItem.item_type === 'task' && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600">Category <span className="text-red-500">*</span></label>
                          <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-white rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Qty/Hours <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="0.01"
                          value={newItem.quantity_or_hours}
                          onChange={(e) => setNewItem({...newItem, quantity_or_hours: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm border border-white rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Unit Price (LKR) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="0.01"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({...newItem, unit_price: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm border border-white rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-gray-600">Notes</label>
                        <textarea
                          value={newItem.notes}
                          onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                          placeholder="Additional details..."
                          rows="2"
                          className="w-full px-3 py-2 text-sm border border-white rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="col-span-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                {calculatePriceByType().task > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Task Price:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(calculatePriceByType().task)}</span>
                  </div>
                )}
                {calculatePriceByType().spare_part > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Spare Part Price:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(calculatePriceByType().spare_part)}</span>
                  </div>
                )}
                {calculatePriceByType().other_charges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Other Charges:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(calculatePriceByType().other_charges)}</span>
                  </div>
                )}
                <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Sub Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(calculateCurrentTotal())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-5 border-t border-gray-100">
                {isDetailModalEditMode && canEditQuotations && currentQuotation.status === 'draft' && (
                  <button
                    onClick={() => handleSave()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94m-6.75-6.75L17.81 9.94m0 0a2.25 2.25 0 10 3.182 3.182L9.75 21M5.25 7.5H21" />
                    </svg>
                    Save
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <QuotationPrint 
        showPrintPreview={showPrintPreview}
        setShowPrintPreview={setShowPrintPreview}
        currentQuotation={currentQuotation}
        quotationItems={quotationItems}
        calculatePriceByType={calculatePriceByType}
        calculateCurrentTotal={calculateCurrentTotal}
        formatCurrency={formatCurrency}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        show={deleteConfirmItem ? true : false}
        type="danger"
        title="Delete Item"
        message="Are you sure you want to delete this quotation item? This action cannot be undone."
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteConfirmItem(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Quotation Confirmation Dialog */}
      <ConfirmDialog
        show={deleteConfirmQuotation ? true : false}
        type="danger"
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        onConfirm={confirmDeleteQuotation}
        onCancel={() => setDeleteConfirmQuotation(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default QuotationManagement
