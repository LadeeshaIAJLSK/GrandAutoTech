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
      await axiosClient.post(`/spare-parts/${partId}/approve/admin`, { status, notes: '' }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`Admin ${status === 'approved' ? 'approved' : 'rejected'} this part!`)
      fetchPendingParts()
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  const handleCustomerApprove = async (partId, status) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/approve/customer`, { status, notes: '' }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`Customer ${status === 'approved' ? 'approved' : 'rejected'} this part!`)
      fetchPendingParts()
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing approval')
    }
  }

  if (!['super_admin', 'branch_admin'].includes(user.role.name)) return null
  if (loading) return null
  if (adminPendingParts.length === 0 && customerPendingParts.length === 0) return null

  const tableHead = (cols) => (
    <thead>
      <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
        {cols.map((c, i) => (
          <th key={i} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${c.right ? 'text-center' : 'text-left'}`}>
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  )

  const PartRow = ({ part, actions }) => (
    <tr className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
      <td className="px-4 py-3 font-bold text-gray-900 text-sm">{part.part_name}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {part.quantity}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{part.task_name || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{part.requested_by?.name || '—'}</td>
      {actions}
    </tr>
  )

  return (
    <div className="mt-5 flex gap-2.5">

      {/* Admin Approval Button */}
      {adminPendingParts.length > 0 && (
        <button
          onClick={() => setShowAdminModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </span>
          Admin Approval
          <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{adminPendingParts.length}</span>
        </button>
      )}

      {/* Customer Approval Button */}
      {customerPendingParts.length > 0 && (
        <button
          onClick={() => setShowCustomerModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </span>
          Customer Approval
          <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{customerPendingParts.length}</span>
        </button>
      )}

      {/* Admin Approval Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 bg-orange-50/60 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Admin Approval
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{jobCard.job_code || 'Job Card'}</p>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info banner */}
            <div className="mx-7 mt-5 flex items-center gap-2.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-semibold text-orange-800">
                {adminPendingParts.length} part{adminPendingParts.length !== 1 ? 's' : ''} pending your approval
              </p>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 px-7 py-5">
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  {tableHead([
                    { label: 'Part Name' }, { label: 'Qty' }, { label: 'Task' },
                    { label: 'Requested By' }, { label: 'Date' }, { label: 'Actions', right: true }
                  ])}
                  <tbody className="divide-y divide-gray-100">
                    {adminPendingParts.map(part => (
                      <PartRow key={part.id} part={part} actions={
                        <>
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(part.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => { handleAdminApprove(part.id, 'approved'); setShowAdminModal(false) }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Approve
                              </button>
                              <button
                                onClick={() => handleAdminApprove(part.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          </td>
                        </>
                      } />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Customer Approval Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 bg-green-50/60 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Customer Approval
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{jobCard.job_code || 'Job Card'}</p>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info banner */}
            <div className="mx-7 mt-5 flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-blue-800">
                {customerPendingParts.length} part{customerPendingParts.length !== 1 ? 's' : ''} approved by admin, awaiting customer approval
              </p>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1 px-7 py-5">
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  {tableHead([
                    { label: 'Part Name' }, { label: 'Qty' }, { label: 'Task' },
                    { label: 'Requested By' }, { label: 'Admin Approved' }, { label: 'Actions', right: true }
                  ])}
                  <tbody className="divide-y divide-gray-100">
                    {customerPendingParts.map(part => (
                      <PartRow key={part.id} part={part} actions={
                        <>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {new Date(part.updated_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => { handleCustomerApprove(part.id, 'approved'); setShowCustomerModal(false) }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Approve
                              </button>
                              <button
                                onClick={() => handleCustomerApprove(part.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          </td>
                        </>
                      } />
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
