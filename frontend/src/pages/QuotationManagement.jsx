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
      const response = await axiosClient.get('/quotations', { params, headers: { Authorization: `Bearer ${token}` } })
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

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/quotations', formData, { headers: { Authorization: `Bearer ${token}` } })
      alert('Quotation created successfully!')
      setShowCreateModal(false)
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating quotation')
    }
  }

  const handleSendToCustomer = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/quotations/${id}/send`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Quotation sent to customer!')
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending quotation')
    }
  }

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/quotations/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Quotation approved!')
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving quotation')
    }
  }

  const handleConvertToJobCard = async (id) => {
    if (!confirm('Convert this quotation to a job card?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/quotations/${id}/convert`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert(`Converted to Job Card: ${response.data.job_card.job_card_number}`)
      fetchQuotations()
    } catch (error) {
      alert(error.response?.data?.message || 'Error converting quotation')
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

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)

  const calculateTotal = () => {
    const labor = parseFloat(formData.labor_cost) || 0
    const parts = parseFloat(formData.parts_cost) || 0
    const other = parseFloat(formData.other_charges) || 0
    const discount = parseFloat(formData.discount) || 0
    return labor + parts + other - discount
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

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

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Quotations
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </span>
          Create Quotation
        </button>
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
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
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
                      <td className="px-5 py-4 font-bold text-primary">{quot.quotation_number}</td>
                      <td className="px-5 py-4 text-gray-700">{quot.customer?.name}</td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 tracking-wider">
                          {quot.vehicle?.license_plate}
                        </span>
                      </td>
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
                          {quot.status === 'draft' && (
                            <button
                              onClick={() => handleSendToCustomer(quot.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Send
                            </button>
                          )}
                          {quot.status === 'sent' && (
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
                          {quot.job_card_id && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Converted to JC
                            </span>
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
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
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
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Customer Complaint</label>
                <textarea value={formData.customer_complaint} onChange={(e) => setFormData({...formData, customer_complaint: e.target.value})} rows="3" className={`${inputCls} resize-none`} />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Inspection Notes</label>
                <textarea value={formData.inspection_notes} onChange={(e) => setFormData({...formData, inspection_notes: e.target.value})} rows="3" className={`${inputCls} resize-none`} />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Recommended Work</label>
                <textarea value={formData.recommended_work} onChange={(e) => setFormData({...formData, recommended_work: e.target.value})} rows="2" className={`${inputCls} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Labor Cost (LKR)', key: 'labor_cost', required: true },
                  { label: 'Parts Cost (LKR)', key: 'parts_cost', required: true },
                  { label: 'Other Charges (LKR)', key: 'other_charges', required: false },
                  { label: 'Discount (LKR)', key: 'discount', required: false },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className={labelCls}>{f.label} {f.required && <span className="text-red-400">*</span>}</label>
                    <input type="number" step="0.01" value={formData[f.key]}
                      onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                      required={f.required} className={inputCls} />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(calculateTotal())}</span>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Valid Until</label>
                <input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} className={inputCls} />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
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