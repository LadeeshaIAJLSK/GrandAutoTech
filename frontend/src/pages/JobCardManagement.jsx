import { useState, useEffect } from 'react'
import JobCardDetail from './JobCardDetail'  // ADD THIS
import JobCardCreateWizard from '../components/jobcards/JobCardCreateWizard'  // ADD THIS
import axiosClient from '../api/axios'

function JobCardManagement({ user }) {
  const [jobCards, setJobCards] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedJobCardId, setSelectedJobCardId] = useState(null) // ADD THIS
  const [showCreateWizard, setShowCreateWizard] = useState(false) // ADD THIS

  const canAdd = user.permissions.includes('add_job_cards')
  const canUpdate = user.permissions.includes('update_job_cards')
  const canDelete = user.permissions.includes('delete_job_cards')

  useEffect(() => {
    fetchJobCards()
    fetchStatistics()
  }, [search, statusFilter])

  const fetchJobCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const response = await axiosClient.get('/job-cards', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobCards(response.data.data)
    } catch (error) {
      console.error('Error fetching job cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/job-cards/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatistics(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_parts: 'bg-purple-100 text-purple-800',
      waiting_customer: 'bg-orange-100 text-orange-800',
      quality_check: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      invoiced: 'bg-teal-100 text-teal-800',
      paid: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      in_progress: '🔧',
      waiting_parts: '📦',
      waiting_customer: '⏰',
      quality_check: '✓',
      completed: '✅',
      invoiced: '📄',
      paid: '💰',
      cancelled: '❌',
    }
    return icons[status] || '📋'
  }

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const handleDelete = async (jobCardId) => {
    if (!confirm('⚠️ Are you sure you want to delete this job card?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/job-cards/${jobCardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Job card deleted successfully!')
      fetchJobCards()
      fetchStatistics()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting job card')
    }
  }

  if (selectedJobCardId) {
    return (
      <JobCardDetail 
        jobCardId={selectedJobCardId} 
        onClose={() => setSelectedJobCardId(null)}
        user={user}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading job cards...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Total Job Cards</div>
            <div className="text-3xl font-bold text-gray-800">{statistics.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">{statistics.pending}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-3xl font-bold text-purple-600">{statistics.in_progress}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.total_revenue)}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">📋 Job Cards</h2>
        {canAdd && (
          <button
            onClick={() => setShowCreateWizard(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ➕ Create Job Card
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-5">
        <input
          type="text"
          placeholder="🔍 Search by job card #, customer, license plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none min-w-[200px]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_parts">Waiting Parts</option>
          <option value="waiting_customer">Waiting Customer</option>
          <option value="quality_check">Quality Check</option>
          <option value="completed">Completed</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Count */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg mb-5">
        <span className="text-primary text-xl font-bold">{jobCards.length}</span>
        <span className="text-gray-600 ml-2">job card{jobCards.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Job Cards Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Job Card #</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Created</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobCards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg">📭 No job cards found</div>
                    <p className="text-gray-500 text-sm mt-2">
                      {canAdd ? 'Create your first job card to get started' : 'No job cards available'}
                    </p>
                  </td>
                </tr>
              ) : (
                jobCards.map(jobCard => (
                  <tr key={jobCard.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">{jobCard.job_card_number}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(jobCard.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{jobCard.customer?.name}</div>
                      <div className="text-sm text-gray-500">{jobCard.customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {jobCard.vehicle?.license_plate}
                      </div>
                      <div className="text-sm text-gray-500">
                        {jobCard.vehicle?.make} {jobCard.vehicle?.model} ({jobCard.vehicle?.year})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(jobCard.status)}`}>
                        {getStatusIcon(jobCard.status)} {formatStatus(jobCard.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">
                        {formatCurrency(jobCard.total_amount)}
                      </div>
                      {jobCard.balance_amount > 0 && (
                        <div className="text-sm text-red-600">
                          Balance: {formatCurrency(jobCard.balance_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="text-sm">{jobCard.creator?.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(jobCard.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedJobCardId(jobCard.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          👁️ View
                        </button>
                        {canUpdate && jobCard.status !== 'paid' && jobCard.status !== 'cancelled' && (
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {canDelete && (jobCard.status === 'pending' || jobCard.status === 'cancelled') && (
                          <button
                            onClick={() => handleDelete(jobCard.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <JobCardCreateWizard
        show={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSuccess={(jobCard) => {
          setShowCreateWizard(false)
          fetchJobCards()
          fetchStatistics()
        }}
      />
    </div>
  )
}

export default JobCardManagement