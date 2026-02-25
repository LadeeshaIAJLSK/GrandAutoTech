import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axios'

function InvoiceManagement({ user, selectedBranchId }) {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('all_time')

  useEffect(() => {
    fetchInvoices()
    fetchStatistics()
  }, [search, statusFilter, timeFilter, selectedBranchId])

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

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (selectedBranchId) params.branch_id = selectedBranchId

      const response = await axiosClient.get('/job-cards', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })

      const jobCardsData = response.data.data || response.data
      const allJobCards = Array.isArray(jobCardsData) ? jobCardsData : []

      // Filter by completed status and fetch invoices
      const invoicePromises = allJobCards
        .filter(jc => jc.status === 'completed' || jc.status === 'invoiced' || jc.status === 'paid')
        .map(async (jobCard) => {
          try {
            const invoiceResponse = await axiosClient.get(`/job-cards/${jobCard.id}/invoice`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            return {
              ...jobCard,
              invoice: invoiceResponse.data || null
            }
          } catch (error) {
            return {
              ...jobCard,
              invoice: null
            }
          }
        })

      const invoicesWithData = await Promise.all(invoicePromises)
      setInvoices(invoicesWithData)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInvoiceStatus = (jobCard) => {
    if (jobCard.invoice) {
      return jobCard.invoice.status
    }
    return jobCard.status === 'completed' ? 'pending_invoice' : null
  }

  const getInvoiceStatusBadge = (status) => {
    const badges = {
      pending_invoice: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: '🟠 Pending Invoice' },
      sent: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: '📄 Invoice Generated' },
      partial: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: '⚠️ PARTIAL' },
      pending: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: '🔴 PENDING' },
      paid: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: '✅ FULLY PAID' }
    }
    return badges[status] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', label: 'Unknown' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const handleGenerateInvoice = async (jobCardId) => {
    if (!confirm('Generate invoice for this job card?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCardId}/invoice/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Invoice generated successfully!')
      fetchInvoices()
      fetchStatistics()
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating invoice')
    }
  }

  const handlePrintInvoice = (jobCardId) => {
    window.open(`/invoice/${jobCardId}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading invoices...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Today's Invoices</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">This Month</p>
              <p className="text-2xl font-bold text-orange-600">{invoices.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Revenue</p>
              <p className="text-lg font-bold text-purple-600">Rs. 889,670.50</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Invoice Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Generate and manage invoices for completed job cards with pricing information. Advance payments are automatically deducted from total amounts.</p>
        </div>
      </div>

      {/* Time Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setTimeFilter('all_time')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
            timeFilter === 'all_time'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          📋 All Time
        </button>
        <button
          onClick={() => setTimeFilter('today')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
            timeFilter === 'today'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          📅 Today
        </button>
        <button
          onClick={() => setTimeFilter('this_week')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
            timeFilter === 'this_week'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          📆 This Week
        </button>
        <button
          onClick={() => setTimeFilter('this_month')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
            timeFilter === 'this_month'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          📅 This Month
        </button>
        <button
          onClick={() => setTimeFilter('this_year')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all ${
            timeFilter === 'this_year'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          📅 This Year
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by job card #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all min-w-[180px] shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending_invoice">Pending Invoice</option>
          <option value="sent">Invoice Generated</option>
          <option value="pending">Pending Payment</option>
          <option value="partial">Partial Payment</option>
          <option value="paid">Fully Paid</option>
        </select>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-sm text-gray-600">Showing 1 to {invoices.length} of {invoices.length} results</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Card</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Details</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle Details</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Dates</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Details</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-400 font-medium">No invoices found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map(item => {
                  const status = getInvoiceStatus(item)
                  const badgeStyle = getInvoiceStatusBadge(status)
                  const invoiceDate = item.invoice?.invoice_date ? new Date(item.invoice.invoice_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
                  const dueDate = item.invoice?.due_date ? new Date(item.invoice.due_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-bold text-primary text-sm">{item.job_card_number}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Created: {new Date(item.created_at).toLocaleDateString('en-LK')}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{item.customer?.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">📱 {item.customer?.phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-700 text-xs tracking-widest font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md inline-block">
                          {item.vehicle?.license_plate}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {item.vehicle?.make} {item.vehicle?.model} · {item.vehicle?.year}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="text-gray-700">In: {invoiceDate}</div>
                        <div className="text-gray-700">Out: {dueDate}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {badgeStyle.label}
                          </span>
                          <div className={`text-sm font-semibold ${status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                            {item.invoice ? formatCurrency(item.invoice.total_amount) : formatCurrency(item.total_amount || 0)}
                          </div>
                          {item.invoice?.advance_paid > 0 && (
                            <div className="text-xs text-green-600">
                              Advance: {formatCurrency(item.invoice.advance_paid)}
                            </div>
                          )}
                          {item.invoice?.balance_due > 0 && (
                            <div className="text-xs text-red-600">
                              Due: {formatCurrency(item.invoice.balance_due)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => navigate(`/invoice/${item.id}`)}
                            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            👁️ View
                          </button>
                          {!item.invoice && (
                            <button
                              onClick={() => handleGenerateInvoice(item.id)}
                              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              📄 Generate
                            </button>
                          )}
                          {item.invoice && (
                            <button
                              onClick={() => navigate(`/invoice-print/${item.id}`)}
                              className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              🖨️ Print
                            </button>
                          )}
                          {item.invoice && item.invoice.balance_due > 0 && (
                            <button
                              onClick={() => navigate(`/invoice/${item.id}`)}
                              className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              💰 Pay
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
    </div>
  )
}

export default InvoiceManagement
