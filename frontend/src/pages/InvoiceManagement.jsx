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
      const response = await axiosClient.get('/job-cards/statistics', { headers: { Authorization: `Bearer ${token}` } })
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

      const response = await axiosClient.get('/job-cards', { params, headers: { Authorization: `Bearer ${token}` } })
      const jobCardsData = response.data.data || response.data
      const allJobCards = Array.isArray(jobCardsData) ? jobCardsData : []

      const invoicePromises = allJobCards
        .filter(jc => jc.status === 'completed' || jc.status === 'invoiced' || jc.status === 'paid')
        .map(async (jobCard) => {
          try {
            const invoiceResponse = await axiosClient.get(`/job-cards/${jobCard.id}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
            return { ...jobCard, invoice: invoiceResponse.data || null }
          } catch (error) {
            return { ...jobCard, invoice: null }
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
    if (jobCard.invoice) return jobCard.invoice.status
    return jobCard.status === 'completed' ? 'pending_invoice' : null
  }

  const getInvoiceStatusStyle = (status) => {
    const styles = {
      pending_invoice: { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: 'Pending Invoice' },
      sent:            { cls: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500',   label: 'Invoice Generated' },
      partial:         { cls: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-400',  label: 'Partial Payment' },
      pending:         { cls: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-400',    label: 'Pending Payment' },
      paid:            { cls: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500',  label: 'Fully Paid' },
    }
    return styles[status] || { cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', label: 'Unknown' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(amount || 0)
  }

  const handleGenerateInvoice = async (jobCardId) => {
    if (!confirm('Generate invoice for this job card?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCardId}/invoice/generate`, {}, { headers: { Authorization: `Bearer ${token}` } })
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

  const timeTabs = [
    { id: 'all_time',   label: 'All Time',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { id: 'today',      label: 'Today',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: 'this_week',  label: 'This Week',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: 'this_month', label: 'This Month',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { id: 'this_year',  label: 'This Year',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  ]

  return (
    <div className="space-y-5">

      {/* Stats Cards */}
      {statistics && (
        <div className="grid grid-cols-3 gap-4">
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

      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoice Management
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 max-w-xl">Generate and manage invoices for completed job cards. Advance payments are automatically deducted from total amounts.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <span className="text-sm font-bold text-gray-700">{invoices.length}</span>
          <span className="text-xs text-gray-400">invoices</span>
        </div>
      </div>

      {/* Time Filter Tabs */}
      <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
        {timeTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTimeFilter(t.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              timeFilter === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by job card #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all min-w-[180px]"
        >
          <option value="">All Statuses</option>
          <option value="pending_invoice">Pending Invoice</option>
          <option value="sent">Invoice Generated</option>
          <option value="pending">Pending Payment</option>
          <option value="partial">Partial Payment</option>
          <option value="paid">Fully Paid</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 px-1">Showing {invoices.length} of {invoices.length} results</p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Card</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">No invoices found</p>
                  </td>
                </tr>
              ) : (
                invoices.map(item => {
                  const status = getInvoiceStatus(item)
                  const st = getInvoiceStatusStyle(status)
                  const invoiceDate = item.invoice?.invoice_date
                    ? new Date(item.invoice.invoice_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'
                  const dueDate = item.invoice?.due_date
                    ? new Date(item.invoice.due_date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">

                      {/* Job Card */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-primary text-sm">{item.job_card_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Created: {new Date(item.created_at).toLocaleDateString('en-LK')}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{item.customer?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {item.customer?.phone}
                        </p>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded tracking-widest">
                          {item.vehicle?.license_plate}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{item.vehicle?.make} {item.vehicle?.model} · {item.vehicle?.year}</p>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-xs text-gray-500 space-y-0.5">
                        <p>In: <span className="text-gray-700">{invoiceDate}</span></p>
                        <p>Out: <span className="text-gray-700">{dueDate}</span></p>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.cls} mb-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        <p className={`text-sm font-bold mt-1 ${status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                          {item.invoice ? formatCurrency(item.invoice.total_amount) : formatCurrency(item.total_amount || 0)}
                        </p>
                        {item.invoice?.advance_paid > 0 && (
                          <p className="text-xs text-green-600 mt-0.5">Advance: {formatCurrency(item.invoice.advance_paid)}</p>
                        )}
                        {item.invoice?.balance_due > 0 && (
                          <p className="text-xs text-red-500 mt-0.5">Due: {formatCurrency(item.invoice.balance_due)}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 justify-end flex-wrap">
                          <button
                            onClick={() => navigate(`/invoice/${item.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          {!item.invoice && (
                            <button
                              onClick={() => handleGenerateInvoice(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Generate
                            </button>
                          )}
                          {item.invoice && (
                            <button
                              onClick={() => navigate(`/invoice-print/${item.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>
                          )}
                          {item.invoice && item.invoice.balance_due > 0 && (
                            <button
                              onClick={() => navigate(`/invoice/${item.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Pay
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