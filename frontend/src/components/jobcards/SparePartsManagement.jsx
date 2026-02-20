import { useState } from 'react'
import axiosClient from '../../api/axios'

function SparePartsManagement({ jobCard, onUpdate, user }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  const [approvalLevel, setApprovalLevel] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')

  const [partForm, setPartForm] = useState({
    task_id: '',
    part_name: '',
    part_number: '',
    description: '',
    quantity: 1,
    unit_cost: '',
    selling_price: '',
  })

  const canAdd = user.permissions.includes('add_spare_parts')
  const canUpdate = user.permissions.includes('update_spare_parts')
  const canDelete = user.permissions.includes('delete_spare_parts')
  const canApprove = user.permissions.includes('approve_spare_parts')

  const role = user.role.name

  const handleAddPart = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCard.id}/spare-parts`, partForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Spare part requested successfully!')
      setShowAddModal(false)
      setPartForm({
        task_id: '',
        part_name: '',
        part_number: '',
        description: '',
        quantity: 1,
        unit_cost: '',
        selling_price: '',
      })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting part')
    }
  }

  const openApprovalModal = (part, level) => {
    setSelectedPart(part)
    setApprovalLevel(level)
    setApprovalNotes('')
    setShowApprovalModal(true)
  }

  const handleApproval = async (status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${selectedPart.id}/approve/${approvalLevel}`, {
        status,
        notes: approvalNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ ${status === 'approved' ? 'Approved' : 'Rejected'} successfully!`)
      setShowApprovalModal(false)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  const handleStatusUpdate = async (partId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/spare-parts/${partId}/status`, {
        overall_status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ Status updated to ${newStatus}`)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status')
    }
  }

  const handleDeletePart = async (partId) => {
    if (!confirm('⚠️ Are you sure you want to delete this request?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/spare-parts/${partId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Spare part deleted!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting part')
    }
  }

  const getApprovalStatusColor = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-800'
    if (status === 'rejected') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getApprovalIcon = (status) => {
    if (status === 'approved') return '✅'
    if (status === 'rejected') return '❌'
    return '⏳'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const parts = jobCard.spare_parts_requests || []

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Spare Parts Requests ({parts.length})</h3>
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            ➕ Request Parts
          </button>
        )}
      </div>

      {parts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-gray-400 text-lg">No spare parts requested yet</div>
          {canAdd && (
            <p className="text-gray-500 text-sm mt-2">Request parts needed for repairs</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {parts.map((part) => {
            const canApproveEmployee = role === 'employee' && part.employee_status === 'pending'
            const canApproveAdmin = ['super_admin', 'branch_admin'].includes(role) && 
                                   part.employee_status === 'approved' && 
                                   part.admin_status === 'pending'
            const canApproveCustomer = role === 'customer' && 
                                      part.admin_status === 'approved' && 
                                      part.customer_status === 'pending'

            return (
              <div key={part.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800">{part.part_name}</h4>
                    {part.part_number && (
                      <p className="text-gray-600">Part #: {part.part_number}</p>
                    )}
                    {part.description && (
                      <p className="text-gray-600 mt-1">{part.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Quantity</div>
                    <div className="text-3xl font-bold text-gray-800">{part.quantity}</div>
                  </div>
                </div>

                {/* 3-Level Approval Status */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">LEVEL 1: Employee</div>
                    <div className={`px-3 py-2 rounded-full text-sm font-semibold ${getApprovalStatusColor(part.employee_status)}`}>
                      {getApprovalIcon(part.employee_status)} {part.employee_status.toUpperCase()}
                    </div>
                    {part.employee_approved_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(part.employee_approved_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">LEVEL 2: Admin</div>
                    <div className={`px-3 py-2 rounded-full text-sm font-semibold ${getApprovalStatusColor(part.admin_status)}`}>
                      {getApprovalIcon(part.admin_status)} {part.admin_status.toUpperCase()}
                    </div>
                    {part.admin_approved_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(part.admin_approved_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">LEVEL 3: Customer</div>
                    <div className={`px-3 py-2 rounded-full text-sm font-semibold ${getApprovalStatusColor(part.customer_status)}`}>
                      {getApprovalIcon(part.customer_status)} {part.customer_status.toUpperCase()}
                    </div>
                    {part.customer_approved_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(part.customer_approved_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Status */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Overall Status:</span>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold uppercase">
                      {part.overall_status}
                    </span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-600">Unit Cost</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(part.unit_cost)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Selling Price</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(part.selling_price)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="font-bold text-primary text-lg">{formatCurrency(part.total_cost)}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {canApproveEmployee && (
                    <button
                      onClick={() => openApprovalModal(part, 'employee')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                    >
                      ✅ Employee Approve/Reject
                    </button>
                  )}

                  {canApproveAdmin && (
                    <button
                      onClick={() => openApprovalModal(part, 'admin')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                    >
                      ✅ Admin Approve/Reject
                    </button>
                  )}

                  {canApproveCustomer && (
                    <button
                      onClick={() => openApprovalModal(part, 'customer')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                    >
                      ✅ Customer Approve/Reject
                    </button>
                  )}

                  {/* Status Updates (for approved parts) */}
                  {canUpdate && part.overall_status === 'approved' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(part.id, 'ordered')}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        📦 Mark as Ordered
                      </button>
                    </>
                  )}

                  {canUpdate && part.overall_status === 'ordered' && (
                    <button
                      onClick={() => handleStatusUpdate(part.id, 'received')}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                    >
                      ✅ Mark as Received
                    </button>
                  )}

                  {canUpdate && part.overall_status === 'received' && (
                    <button
                      onClick={() => handleStatusUpdate(part.id, 'installed')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                    >
                      🔧 Mark as Installed
                    </button>
                  )}

                  {canDelete && part.overall_status === 'pending' && (
                    <button
                      onClick={() => handleDeletePart(part.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                {/* Notes */}
                {(part.employee_notes || part.admin_notes || part.customer_notes) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="text-sm font-semibold text-gray-700">Notes:</div>
                    {part.employee_notes && (
                      <div className="text-sm bg-yellow-50 p-2 rounded">
                        <strong>Employee:</strong> {part.employee_notes}
                      </div>
                    )}
                    {part.admin_notes && (
                      <div className="text-sm bg-blue-50 p-2 rounded">
                        <strong>Admin:</strong> {part.admin_notes}
                      </div>
                    )}
                    {part.customer_notes && (
                      <div className="text-sm bg-purple-50 p-2 rounded">
                        <strong>Customer:</strong> {part.customer_notes}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Request Spare Part</h3>
            </div>

            <form onSubmit={handleAddPart} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Related Task (Optional)</label>
                <select
                  value={partForm.task_id}
                  onChange={(e) => setPartForm({...partForm, task_id: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value="">Not linked to specific task</option>
                  {jobCard.tasks?.map(task => (
                    <option key={task.id} value={task.id}>{task.task_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Part Name *</label>
                <input
                  type="text"
                  value={partForm.part_name}
                  onChange={(e) => setPartForm({...partForm, part_name: e.target.value})}
                  required
                  placeholder="e.g., Brake Pads Front"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Part Number</label>
                <input
                  type="text"
                  value={partForm.part_number}
                  onChange={(e) => setPartForm({...partForm, part_number: e.target.value})}
                  placeholder="e.g., BP-12345"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={partForm.description}
                  onChange={(e) => setPartForm({...partForm, description: e.target.value})}
                  placeholder="Additional details about the part..."
                  rows="2"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={partForm.quantity}
                    onChange={(e) => setPartForm({...partForm, quantity: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Unit Cost (LKR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={partForm.unit_cost}
                    onChange={(e) => setPartForm({...partForm, unit_cost: e.target.value})}
                    required
                    placeholder="3000"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={partForm.selling_price}
                    onChange={(e) => setPartForm({...partForm, selling_price: e.target.value})}
                    required
                    placeholder="4500"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {partForm.quantity && partForm.selling_price && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Amount:</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(partForm.quantity * partForm.selling_price)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold"
                >
                  Request Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800 capitalize">
                {approvalLevel} Approval
              </h3>
              <p className="text-gray-600 mt-1">{selectedPart?.part_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-bold">{selectedPart?.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-bold">{formatCurrency(selectedPart?.selling_price)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-bold text-primary text-lg">
                      {formatCurrency(selectedPart?.total_cost)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Notes (Optional)</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval('rejected')}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                ❌ Reject
              </button>
              <button
                onClick={() => handleApproval('approved')}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
              >
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SparePartsManagement