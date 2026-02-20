import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function QuotationManagement({ user }) {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])

  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    customer_complaint: '',
    inspection_notes: '',
    recommended_work: '',
    labor_cost: '',
    parts_cost: '',
    other_charges: '0',
    discount: '0',
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: '',
  })

  useEffect(() => {
    fetchQuotations()
    fetchCustomers()
  }, [search, statusFilter])

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const response = await axiosClient.get('/quotations', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuotations(response.data.data)
    } catch (error) {
      console.error('Error fetching quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/customers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCustomers(response.data.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchVehicles = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/vehicles/customer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVehicles(response.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/quotations', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Quotation created successfully!')
      setShowCreateModal(false)
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating quotation')
    }
  }

  const handleSendToCustomer = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/quotations/${id}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Quotation sent to customer!')
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending quotation')
    }
  }

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/quotations/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Quotation approved!')
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving quotation')
    }
  }

  const handleConvertToJobCard = async (id) => {
    if (!confirm('Convert this quotation to a job card?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/quotations/${id}/convert`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ Converted to Job Card: ${response.data.job_card.job_card_number}`)
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error converting quotation')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-purple-100 text-purple-800',
      expired: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const calculateTotal = () => {
    const labor = parseFloat(formData.labor_cost) || 0
    const parts = parseFloat(formData.parts_cost) || 0
    const other = parseFloat(formData.other_charges) || 0
    const discount = parseFloat(formData.discount) || 0
    return labor + parts + other - discount
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">📋 Quotations</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold"
        >
          ➕ Create Quotation
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-5">
        <input
          type="text"
          placeholder="🔍 Search quotations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Quotation #</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Valid Until</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No quotations found
                </td>
              </tr>
            ) : (
              quotations.map(quot => (
                <tr key={quot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-primary">{quot.quotation_number}</td>
                  <td className="px-6 py-4">{quot.customer?.name}</td>
                  <td className="px-6 py-4">{quot.vehicle?.license_plate}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(quot.total_amount)}</td>
                  <td className="px-6 py-4">
                    {quot.valid_until ? new Date(quot.valid_until).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(quot.status)}`}>
                      {quot.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {quot.status === 'draft' && (
                        <button
                          onClick={() => handleSendToCustomer(quot.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          📤 Send
                        </button>
                      )}
                      {quot.status === 'sent' && (
                        <button
                          onClick={() => handleApprove(quot.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          ✅ Approve
                        </button>
                      )}
                      {quot.status === 'approved' && !quot.job_card_id && (
                        <button
                          onClick={() => handleConvertToJobCard(quot.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                        >
                          🔄 Convert to Job Card
                        </button>
                      )}
                      {quot.job_card_id && (
                        <span className="text-sm text-gray-600">
                          Converted to JC
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold">Create Quotation</h3>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => {
                      setFormData({...formData, customer_id: e.target.value, vehicle_id: ''})
                      fetchVehicles(e.target.value)
                    }}
                    required
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Vehicle *</label>
                  <select
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.license_plate}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Customer Complaint</label>
                <textarea
                  value={formData.customer_complaint}
                  onChange={(e) => setFormData({...formData, customer_complaint: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Inspection Notes</label>
                <textarea
                  value={formData.inspection_notes}
                  onChange={(e) => setFormData({...formData, inspection_notes: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Recommended Work</label>
                <textarea
                  value={formData.recommended_work}
                  onChange={(e) => setFormData({...formData, recommended_work: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Labor Cost (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({...formData, labor_cost: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Parts Cost (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.parts_cost}
                    onChange={(e) => setFormData({...formData, parts_cost: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Other Charges (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.other_charges}
                    onChange={(e) => setFormData({...formData, other_charges: e.target.value})}
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Discount (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-primary bg-opacity-10 p-4 rounded-lg">
                <div className="text-lg font-bold">Total: {formatCurrency(calculateTotal())}</div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Valid Until</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuotationManagement