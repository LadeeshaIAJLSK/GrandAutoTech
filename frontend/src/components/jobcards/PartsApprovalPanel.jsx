import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function PartsApprovalPanel({ jobCard, user, onUpdate }) {
  const [adminPendingParts, setAdminPendingParts] = useState([])
  const [customerPendingParts, setCustomerPendingParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  useEffect(() => {
    if (['super_admin', 'branch_admin'].includes(user.role.name)) {
      fetchPendingParts()
    }
  }, [jobCard.id])

  const fetchPendingParts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${jobCard.id}/spare-parts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Separate parts by approval stage
      const adminPending = response.data.filter(p => p.admin_status === 'pending')
      const customerPending = response.data.filter(p => p.admin_status === 'approved' && p.customer_status === 'pending')
      
      setAdminPendingParts(adminPending)
      setCustomerPendingParts(customerPending)
    } catch (error) {
      console.error('Error fetching parts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminApprove = async (partId, status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/approve/admin`, {
        status: status,
        notes: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ Admin ${status === 'approved' ? 'APPROVED' : 'REJECTED'} this part!`)
      fetchPendingParts()
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  const handleCustomerApprove = async (partId, status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/approve/customer`, {
        status: status,
        notes: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ Customer ${status === 'approved' ? 'APPROVED' : 'REJECTED'} this part!`)
      fetchPendingParts()
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  if (!['super_admin', 'branch_admin'].includes(user.role.name)) {
    return null
  }

  if (loading) {
    return <div>Loading parts...</div>
  }

  if (adminPendingParts.length === 0 && customerPendingParts.length === 0) {
    return null
  }

  return (
    <div className="mt-6 flex gap-4">
      {/* ADMIN APPROVAL BUTTON */}
      {adminPendingParts.length > 0 && (
        <button
          onClick={() => setShowAdminModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
        >
          👤 Admin Approval ({adminPendingParts.length})
        </button>
      )}

      {/* CUSTOMER APPROVAL BUTTON */}
      {customerPendingParts.length > 0 && (
        <button
          onClick={() => setShowCustomerModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
        >
          👥 Customer Approval ({customerPendingParts.length})
        </button>
      )}

      {/* ADMIN APPROVAL MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white p-6 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-bold">👤 Admin Approval - {jobCard.job_code || 'Job Card'}</h2>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-2xl font-bold hover:text-orange-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-6 rounded">
                <p className="text-orange-800 font-semibold">
                  ⚠️ {adminPendingParts.length} part{adminPendingParts.length !== 1 ? 's' : ''} pending your approval as admin.
                </p>
              </div>

              {/* Parts Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="p-3 text-left font-bold text-gray-700">Part Name</th>
                      <th className="p-3 text-left font-bold text-gray-700">Qty</th>
                      <th className="p-3 text-left font-bold text-gray-700">Task</th>
                      <th className="p-3 text-left font-bold text-gray-700">Employee</th>
                      <th className="p-3 text-left font-bold text-gray-700">Requested</th>
                      <th className="p-3 text-center font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPendingParts.map(part => (
                      <tr key={part.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-800">{part.part_name}</td>
                        <td className="p-3 text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                            {part.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-sm">{part.task_name || '-'}</td>
                        <td className="p-3 text-gray-600">{part.requested_by?.name || '-'}</td>
                        <td className="p-3 text-gray-600 text-sm">{new Date(part.created_at).toLocaleDateString()}</td>
                        <td className="p-3 flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              handleAdminApprove(part.id, 'approved')
                              setShowAdminModal(false)
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleAdminApprove(part.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER APPROVAL MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-green-500 text-white p-6 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-bold">👥 Customer Approval - {jobCard.job_code || 'Job Card'}</h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-2xl font-bold hover:text-green-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6 rounded">
                <p className="text-green-800 font-semibold">
                  ℹ️ {customerPendingParts.length} part{customerPendingParts.length !== 1 ? 's' : ''} approved by admin, awaiting customer approval.
                </p>
              </div>

              {/* Parts Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="p-3 text-left font-bold text-gray-700">Part Name</th>
                      <th className="p-3 text-left font-bold text-gray-700">Qty</th>
                      <th className="p-3 text-left font-bold text-gray-700">Task</th>
                      <th className="p-3 text-left font-bold text-gray-700">Employee</th>
                      <th className="p-3 text-left font-bold text-gray-700">Admin Approved</th>
                      <th className="p-3 text-center font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPendingParts.map(part => (
                      <tr key={part.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-800">{part.part_name}</td>
                        <td className="p-3 text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                            {part.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-sm">{part.task_name || '-'}</td>
                        <td className="p-3 text-gray-600">{part.requested_by?.name || '-'}</td>
                        <td className="p-3">
                          <span className="text-green-600 font-bold">✅ {new Date(part.updated_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3 flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              handleCustomerApprove(part.id, 'approved')
                              setShowCustomerModal(false)
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleCustomerApprove(part.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
                          >
                            ❌ Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartsApprovalPanel
