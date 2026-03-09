import { useState } from 'react'
import axiosClient from '../../api/axios'

function SparePartsManagement({ jobCard, onUpdate, user }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showHavePartModal, setShowHavePartModal] = useState(false)
  const [showReceivedCostModal, setShowReceivedCostModal] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [approvalLevel, setApprovalLevel] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [receivedCost, setReceivedCost] = useState('')

  const [partForm, setPartForm] = useState({
    task_id: '',
    part_name: '',
    part_number: '',
    description: '',
  })

  const canAdd = user.role.name === 'super_admin' || user.permissions.includes('add_spare_parts')
  const canUpdate = user.role.name === 'super_admin' || user.permissions.includes('update_spare_parts')
  const canDelete = user.role.name === 'super_admin' || user.permissions.includes('delete_spare_parts')
  const canApprove = user.permissions.includes('approve_spare_parts')
  const role = user.role.name

  // Check if user is assigned to a task
  const isAssignedToTask = (taskId) => {
    if (!taskId) return false
    
    // First check if task is in jobCard.tasks
    const task = jobCard.tasks?.find(t => t.id === taskId)
    if (task && task.assignedEmployees) {
      return task.assignedEmployees.some(emp => emp.id === user.id)
    }
    
    // Also check in spare parts requests for the task with assignedEmployees
    const part = jobCard.spare_parts_requests?.find(p => p.task_id === taskId)
    if (part && part.task && part.task.assignedEmployees) {
      return part.task.assignedEmployees.some(emp => emp.id === user.id)
    }
    
    return false
  }

  // Can mark as delivered if: has permission OR is assigned to task
  const canMarkAsDelivered = (part) => {
    return canUpdate || isAssignedToTask(part.task_id)
  }

  const handleAddPart = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCard.id}/spare-parts`, partForm, { headers: { Authorization: `Bearer ${token}` } })
      alert('Spare part requested successfully!')
      setShowAddModal(false)
      setPartForm({ task_id: '', part_name: '', part_number: '', description: '' })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting part')
    }
  }

  const openApprovalModal = (part, level) => {
    setSelectedPart(part); setApprovalLevel(level); setApprovalNotes(''); setShowApprovalModal(true)
  }

  const handleApproval = async (status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${selectedPart.id}/approve/${approvalLevel}`, { status, notes: approvalNotes }, { headers: { Authorization: `Bearer ${token}` } })
      alert(`${status === 'approved' ? 'Approved' : 'Rejected'} successfully!`)
      setShowApprovalModal(false); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  const handleAdminApproveDirectly = async (partId, status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/approve/admin`, { status, notes: '' }, { headers: { Authorization: `Bearer ${token}` } })
      alert(`Part ${status === 'approved' ? 'approved' : 'rejected'} by Admin!`)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  const handleCustomerApproveDirectly = async (partId, status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/approve/customer`, { status, notes: '' }, { headers: { Authorization: `Bearer ${token}` } })
      alert(`Part ${status === 'approved' ? 'approved' : 'rejected'} by Customer!`)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  const handleStatusUpdate = async (partId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/spare-parts/${partId}/status`, { overall_status: newStatus }, { headers: { Authorization: `Bearer ${token}` } })
      alert(`Status updated to ${newStatus}`); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status')
    }
  }

  const handleDeletePart = async (partId) => {
    if (!confirm('Are you sure you want to delete this request?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/spare-parts/${partId}`, { headers: { Authorization: `Bearer ${token}` } })
      alert('Spare part deleted!'); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting part')
    }
  }

  const handleMarkAsDelivered = async (partId) => {
    if (!confirm('Confirm that parts have been handed over to employee?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Parts delivery confirmed!'); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error confirming delivery')
    }
  }

  const openHavePartModal = (part) => { setSelectedPart(part); setShowHavePartModal(true) }

  const handleMarkAsOrdered = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/spare-parts/${selectedPart.id}/status`, { overall_status: 'ordered' }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Part marked as ordered'); setShowHavePartModal(false); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking as ordered')
    }
  }

  const handleHaveIt = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/spare-parts/${selectedPart.id}/status`, { overall_status: 'process' }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Part marked as available!'); setShowHavePartModal(false); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking as available')
    }
  }

  const openReceivedCostModal = (part) => { setSelectedPart(part); setReceivedCost(''); setShowReceivedCostModal(true) }

  const handleMarkAsReceived = async () => {
    if (!receivedCost || receivedCost <= 0) { alert('Please enter the actual cost'); return }
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/spare-parts/${selectedPart.id}/status`, { overall_status: 'process', actual_cost: receivedCost }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Part received from supplier and available!'); setShowReceivedCostModal(false); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking as received')
    }
  }

  const handleMarkAsDeliveredDirect = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${selectedPart.id}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Parts marked as delivered!'); setShowHavePartModal(false); onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking as delivered')
    }
  }

  const getApprovalStyle = (status) => {
    if (status === 'approved') return { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' }
    if (status === 'rejected') return { cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' }
    return { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' }
  }

  const getOverallStatusStyle = (status) => {
    const map = {
      pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved:  'bg-green-50 text-green-700 border-green-200',
      rejected:  'bg-red-50 text-red-600 border-red-200',
      ordered:   'bg-blue-50 text-blue-700 border-blue-200',
      process:   'bg-indigo-50 text-indigo-700 border-indigo-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
    return map[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)

  const parts = jobCard.spare_parts_requests || []

  const ModalWrapper = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )

  const ModalHeader = ({ title, subtitle, onClose }) => (
    <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  return (
    <div>
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          Spare Parts
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{parts.length}</span>
        </h3>
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            Request Parts
          </button>
        )}
      </div>

      {parts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <p className="text-gray-400 font-medium text-sm">No spare parts requested yet</p>
          {canAdd && <p className="text-gray-300 text-xs mt-1">Request parts needed for repairs</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {parts.map((part) => {
            const canApproveAdmin = (user.role.name === 'super_admin' || user.permissions.includes('approve_spare_parts')) && part.admin_status === 'pending'
            const canApproveCustomer = (user.role.name === 'super_admin' || user.permissions.includes('approve_spare_parts')) && part.customer_status === 'pending' && part.admin_status === 'approved'
            const adminStyle = getApprovalStyle(part.admin_status)
            const customerStyle = getApprovalStyle(part.customer_status)

            return (
              <div key={part.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                {/* Part Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-bold text-gray-900">{part.part_name}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${getOverallStatusStyle(part.overall_status)}`}>
                        {part.overall_status}
                      </span>
                    </div>
                    {part.part_number && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">#{part.part_number}</p>
                    )}
                    {part.description && (
                      <p className="text-sm text-gray-500 mt-1">{part.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Qty</p>
                    <p className="text-2xl font-bold text-gray-800">{part.quantity}</p>
                  </div>
                </div>

                {/* Approval Status Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Level 1 · Admin</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${adminStyle.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${adminStyle.dot}`} />
                      {part.admin_status.charAt(0).toUpperCase() + part.admin_status.slice(1)}
                    </span>
                    {part.admin_approved_at && (
                      <p className="text-xs text-gray-400 mt-1">{new Date(part.admin_approved_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Level 2 · Customer</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${customerStyle.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${customerStyle.dot}`} />
                      {part.customer_status.charAt(0).toUpperCase() + part.customer_status.slice(1)}
                    </span>
                    {part.customer_approved_at && (
                      <p className="text-xs text-gray-400 mt-1">{new Date(part.customer_approved_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* Pricing Row - Only for Admins */}
                {(canUpdate || user.role.name === 'super_admin' || user.permissions.includes('update_spare_parts')) && (
                  <div className="grid grid-cols-3 gap-3 mb-4 pt-3 border-t border-gray-100">
                    {[
                      { label: 'Unit Cost', value: formatCurrency(part.unit_cost) },
                      { label: 'Selling Price', value: formatCurrency(part.selling_price) },
                      { label: 'Total', value: formatCurrency(part.total_cost), highlight: true },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{f.label}</p>
                        <p className={`font-bold text-sm mt-0.5 ${f.highlight ? 'text-primary text-base' : 'text-gray-800'}`}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dev debug */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-400 mb-3 font-mono bg-gray-50 px-2 py-1 rounded">
                    admin: {part.admin_status} · customer: {part.customer_status} · overall: {part.overall_status}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {canApproveAdmin && (
                    <>
                      <button onClick={() => handleAdminApproveDirectly(part.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Admin Approve
                      </button>
                      <button onClick={() => handleAdminApproveDirectly(part.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Admin Reject
                      </button>
                    </>
                  )}

                  {canApproveCustomer && (
                    <>
                      <button onClick={() => handleCustomerApproveDirectly(part.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Customer Approve
                      </button>
                      <button onClick={() => handleCustomerApproveDirectly(part.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Customer Reject
                      </button>
                    </>
                  )}

                  {!canApproveAdmin && !canApproveCustomer && part.overall_status === 'approved' && (
                    <button onClick={() => openHavePartModal(part)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      In Stock or Order?
                    </button>
                  )}

                  {canUpdate && part.overall_status === 'ordered' && (
                    <button onClick={() => openReceivedCostModal(part)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Mark as Received
                    </button>
                  )}

                  {part.overall_status === 'process' && canMarkAsDelivered(part) && (
                    <button onClick={() => handleMarkAsDelivered(part.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Delivered
                    </button>
                  )}

                  {part.overall_status === 'delivered' && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Delivered to Employee
                    </span>
                  )}

                  {canDelete && part.overall_status === 'pending' && (
                    <button onClick={() => handleDeletePart(part.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors ml-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>

                {/* Notes */}
                {(part.employee_notes || part.admin_notes || part.customer_notes) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
                    {part.employee_notes && (
                      <div className="text-xs bg-yellow-50 border border-yellow-100 px-3 py-2 rounded-lg">
                        <span className="font-semibold text-yellow-700">Employee:</span>
                        <span className="text-yellow-800 ml-1">{part.employee_notes}</span>
                      </div>
                    )}
                    {part.admin_notes && (
                      <div className="text-xs bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                        <span className="font-semibold text-blue-700">Admin:</span>
                        <span className="text-blue-800 ml-1">{part.admin_notes}</span>
                      </div>
                    )}
                    {part.customer_notes && (
                      <div className="text-xs bg-purple-50 border border-purple-100 px-3 py-2 rounded-lg">
                        <span className="font-semibold text-purple-700">Customer:</span>
                        <span className="text-purple-800 ml-1">{part.customer_notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ModalHeader title="Request Spare Part" subtitle="Fill in the part details below" onClose={() => setShowAddModal(false)} />
            <form onSubmit={handleAddPart} className="px-7 py-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Related Task</label>
                <select value={partForm.task_id} onChange={(e) => setPartForm({...partForm, task_id: e.target.value})}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all">
                  <option value="">Not linked to specific task</option>
                  {jobCard.tasks?.map(task => <option key={task.id} value={task.id}>{task.task_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Part Name <span className="text-red-400">*</span></label>
                <input type="text" value={partForm.part_name} onChange={(e) => setPartForm({...partForm, part_name: e.target.value})} required placeholder="e.g., Brake Pads Front"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Part Number</label>
                <input type="text" value={partForm.part_number} onChange={(e) => setPartForm({...partForm, part_number: e.target.value})} placeholder="e.g., BP-12345"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <textarea value={partForm.description} onChange={(e) => setPartForm({...partForm, description: e.target.value})} placeholder="Additional details..." rows="2" 
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Request Part</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <ModalHeader title={`${approvalLevel.charAt(0).toUpperCase() + approvalLevel.slice(1)} Approval`} subtitle={selectedPart?.part_name} onClose={() => setShowApprovalModal(false)} />
            <div className="px-7 py-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Quantity</span><p className="font-bold text-gray-800">{selectedPart?.quantity}</p></div>
                <div><span className="text-gray-500">Price</span><p className="font-bold text-gray-800">{formatCurrency(selectedPart?.selling_price)}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Total</span><p className="font-bold text-primary text-base">{formatCurrency(selectedPart?.total_cost)}</p></div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes (Optional)</label>
                <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} placeholder="Add your notes here..." rows="3"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setShowApprovalModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm">Cancel</button>
              <button onClick={() => handleApproval('rejected')} className="px-5 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors shadow-sm">Reject</button>
              <button onClick={() => handleApproval('approved')} className="px-5 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors shadow-sm">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* In Stock or Order Modal */}
      {showHavePartModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <ModalHeader title="Part Availability" subtitle={selectedPart?.part_name} onClose={() => setShowHavePartModal(false)} />
            <div className="px-7 py-5">
              <p className="text-sm text-gray-600 mb-4">Is this part available in stock, or does it need to be ordered?</p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-sm text-gray-700"><span className="font-semibold">Quantity needed:</span> {selectedPart?.quantity} units</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setShowHavePartModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm">Cancel</button>
              <button onClick={handleMarkAsOrdered} className="inline-flex items-center gap-1.5 px-5 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Need to Order
              </button>
              <button onClick={handleHaveIt} className="inline-flex items-center gap-1.5 px-5 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                In Stock — Deliver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Received Cost Modal */}
      {showReceivedCostModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <ModalHeader title="Part Received" subtitle={selectedPart?.part_name} onClose={() => setShowReceivedCostModal(false)} />
            <div className="px-7 py-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-gray-700"><span className="font-semibold">Quantity:</span> {selectedPart?.quantity} units</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Actual Cost Paid (Per Unit) <span className="text-red-400">*</span></label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">LKR</span>
                  <input type="number" value={receivedCost} onChange={(e) => setReceivedCost(e.target.value)} placeholder="Enter amount" step="0.01" min="0"
                    className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                </div>
                {receivedCost > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Total: <span className="font-semibold text-gray-700">LKR {(receivedCost * selectedPart?.quantity).toFixed(2)}</span></p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100">
              <button onClick={() => setShowReceivedCostModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm">Cancel</button>
              <button onClick={handleMarkAsReceived} className="inline-flex items-center gap-1.5 px-5 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Mark as Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SparePartsManagement