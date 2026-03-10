import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axios'

function InvoiceManagement({ user, selectedBranchId }) {
  const navigate = useNavigate()
  const [jobCards, setJobCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [resultsPerPage, setResultsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchInvoiceData()
  }, [search, customerFilter, statusFilter, selectedBranchId])

  const fetchInvoiceData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/job-cards', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'inspected', branch_id: selectedBranchId }
      })
      let data = response.data.data || response.data || []
      data = Array.isArray(data) ? data : []
      const jobCardsWithInvoices = await Promise.all(
        data.map(async (jc) => {
          try {
            const invRes = await axiosClient.get(`/job-cards/${jc.id}/invoice`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            return { ...jc, invoice: invRes.data || null }
          } catch { return { ...jc, invoice: null } }
        })
      )
      let filtered = jobCardsWithInvoices
      if (search) filtered = filtered.filter(jc => jc.job_card_number?.toLowerCase().includes(search.toLowerCase()))
      if (customerFilter) filtered = filtered.filter(jc => jc.customer?.name?.toLowerCase().includes(customerFilter.toLowerCase()))
      if (statusFilter) {
        filtered = filtered.filter(jc => {
          if (statusFilter === 'pending_invoice') return !jc.invoice
          if (statusFilter === 'generated') return jc.invoice && ['sent', 'partially_paid'].includes(jc.invoice.status)
          if (statusFilter === 'paid') return jc.invoice && jc.invoice.status === 'paid'
          return true
        })
      }
      setJobCards(filtered)
    } catch (error) {
      console.error('Error fetching invoice data:', error)
      setJobCards([])
    } finally { setLoading(false) }
  }

  const getPaymentStatus = (jobCard) => {
    if (!jobCard.invoice) return { status: 'pending_invoice', label: 'PENDING INVOICE', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
    const invoice = jobCard.invoice
    if (invoice.status === 'paid') return { status: 'paid', label: 'FULLY PAID', color: 'bg-green-50 text-green-700 border-green-200' }
    if (invoice.status === 'partially_paid') return { status: 'partially', label: 'PARTIALLY PAID', color: 'bg-orange-50 text-orange-700 border-orange-200' }
    return { status: 'pending', label: 'PENDING', color: 'bg-red-50 text-red-600 border-red-200' }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(amount || 0)
  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const totalPages = Math.ceil(jobCards.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const paginatedData = jobCards.slice(startIndex, startIndex + resultsPerPage)

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading invoices...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Invoice Management
        </h1>
        <p className="text-xs text-gray-400">Generate &amp; manage invoices for completed job cards</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Today's Invoices",
            accent: 'border-teal-400', iconBg: 'bg-teal-50', iconColor: 'text-teal-600',
            value: jobCards.filter(jc => { const d = new Date(jc.invoice?.invoice_date).toLocaleDateString(); return jc.invoice && d === new Date().toLocaleDateString() }).length,
            valueColor: 'text-gray-900',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          },
          {
            label: 'This Month',
            accent: 'border-orange-400', iconBg: 'bg-orange-50', iconColor: 'text-orange-600',
            value: jobCards.filter(jc => jc.invoice).length,
            valueColor: 'text-gray-900',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          },
          {
            label: 'Total Revenue',
            accent: 'border-purple-400', iconBg: 'bg-purple-50', iconColor: 'text-purple-600',
            value: formatCurrency(jobCards.filter(jc => jc.invoice).reduce((s, jc) => s + parseFloat(jc.invoice.total_amount || 0), 0)),
            valueColor: 'text-purple-600',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-xl border-l-4 ${c.accent} border border-gray-200 shadow-sm p-5 flex items-center gap-4`}>
            <div className={`w-11 h-11 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{c.icon}</svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${c.valueColor}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500">Generate and manage invoices for completed job cards with pricing information. Advance payments are automatically deducted from total amounts.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters &amp; Search
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Job Card Number</label>
            <input type="text" placeholder="Search job card..." value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Customer Name</label>
            <input type="text" placeholder="Search customer..." value={customerFilter}
              onChange={e => { setCustomerFilter(e.target.value); setCurrentPage(1) }} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Invoice Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }} className={inputCls}>
              <option value="">All Statuses</option>
              <option value="pending_invoice">Pending Invoice</option>
              <option value="generated">Invoice Generated</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Results Per Page</label>
            <select value={resultsPerPage} onChange={e => { setResultsPerPage(parseInt(e.target.value)); setCurrentPage(1) }} className={inputCls}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{paginatedData.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + resultsPerPage, jobCards.length)}</span> of <span className="font-semibold text-gray-600">{jobCards.length}</span> results
          </p>
          <button onClick={() => { setSearch(''); setCustomerFilter(''); setStatusFilter(''); setCurrentPage(1) }}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold transition-colors">
            Clear All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                {['Job Card', 'Customer', 'Vehicle', 'Service Dates', 'Payment', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-500">No invoices found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : paginatedData.map((jobCard) => {
                const paymentStatus = getPaymentStatus(jobCard)
                const invoice = jobCard.invoice
                const advancePaid = parseFloat(invoice?.advance_paid || jobCard.advance_payment || 0)

                return (
                  <tr key={jobCard.id} className="hover:bg-gray-50/70 transition-colors">

                    {/* Job Card */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary text-sm font-mono">{jobCard.job_card_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(jobCard.created_at)}</p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${invoice ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${invoice ? 'bg-green-500' : 'bg-yellow-400'}`} />
                        {invoice ? 'Generated' : 'Pending'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 text-sm">{jobCard.customer?.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {jobCard.customer?.phone}
                      </p>
                    </td>

                    {/* Vehicle */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">{jobCard.vehicle?.license_plate}</span>
                      <p className="text-xs text-gray-600 mt-1">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</p>
                      <p className="text-xs text-gray-400">{jobCard.vehicle?.year}</p>
                    </td>

                    {/* Service Dates */}
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="font-semibold text-gray-400 uppercase text-[10px]">In</span>
                          <span className="text-gray-700 font-medium">{formatDate(jobCard.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span className="font-semibold text-gray-400 uppercase text-[10px]">Out</span>
                          <span className="text-gray-700 font-medium">{formatDate(jobCard.estimated_completion_date)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-4">
                      {invoice ? (
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${paymentStatus.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${paymentStatus.status === 'paid' ? 'bg-green-500' : paymentStatus.status === 'partially' ? 'bg-orange-400' : 'bg-red-400'}`} />
                            {paymentStatus.label}
                          </span>
                          <p className="text-xs font-bold text-gray-800">Total: {formatCurrency(invoice.total_amount)}</p>
                          {parseFloat(invoice.balance_due) > 0 && (
                            <p className="text-xs font-semibold text-red-600">Due: {formatCurrency(invoice.balance_due)}</p>
                          )}
                        </div>
                      ) : advancePaid > 0 ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-xs font-bold text-green-700">Advance Paid</p>
                            <p className="text-sm font-black text-green-800">{formatCurrency(advancePaid)}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-xs font-semibold">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          No Advance
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 items-end">
                        <div className="flex gap-1.5">
                          <button onClick={() => navigate(`/invoice/${jobCard.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>

                          {!invoice ? (
                            <button onClick={() => navigate(`/invoice/${jobCard.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Generate
                            </button>
                          ) : invoice.balance_due > 0 && (
                            <button onClick={() => navigate(`/invoice/${jobCard.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Pay Again
                            </button>
                          )}
                        </div>

                        <button onClick={() => navigate(`/invoice-print/${jobCard.id}`)}
                          className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3.5">
          <p className="text-xs text-gray-400">
            Page <span className="font-semibold text-gray-600">{currentPage}</span> of <span className="font-semibold text-gray-600">{totalPages}</span>
          </p>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum = i + 1
              if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i
              if (pageNum <= totalPages) return (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum ? 'bg-primary text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {pageNum}
                </button>
              )
              return null
            })}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceManagement
