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
        params: {
          status: 'inspected',
          branch_id: selectedBranchId,
        }
      })
      
      let data = response.data.data || response.data || []
      data = Array.isArray(data) ? data : []

      // Fetch invoices for each job card
      const jobCardsWithInvoices = await Promise.all(
        data.map(async (jc) => {
          try {
            const invRes = await axiosClient.get(`/job-cards/${jc.id}/invoice`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            return { ...jc, invoice: invRes.data || null }
          } catch {
            return { ...jc, invoice: null }
          }
        })
      )

      // Apply filters
      let filtered = jobCardsWithInvoices
      if (search) {
        filtered = filtered.filter(jc => 
          jc.job_card_number?.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (customerFilter) {
        filtered = filtered.filter(jc =>
          jc.customer?.name?.toLowerCase().includes(customerFilter.toLowerCase())
        )
      }
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
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatus = (jobCard) => {
    if (!jobCard.invoice) {
      return { status: 'pending_invoice', label: 'PENDING INVOICE', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    }
    
    const invoice = jobCard.invoice
    if (invoice.status === 'paid') {
      return { status: 'paid', label: 'FULLY PAID', color: 'bg-green-100 text-green-800 border-green-300' }
    }
    if (invoice.status === 'partially_paid') {
      return { status: 'partially', label: 'PARTIALLY PAID', color: 'bg-orange-100 text-orange-800 border-orange-300' }
    }
    return { status: 'pending', label: 'PENDING', color: 'bg-red-100 text-red-700 border-red-300' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR', 
      minimumFractionDigits: 2 
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-LK', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Pagination
  const totalPages = Math.ceil(jobCards.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const paginatedData = jobCards.slice(startIndex, startIndex + resultsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading invoices...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">Invoice Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage invoices for inspected job cards with pricing information</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-l-4 border-l-teal-500 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Today's Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobCards.filter(jc => {
                  const invoiceDate = new Date(jc.invoice?.invoice_date).toLocaleDateString()
                  const today = new Date().toLocaleDateString()
                  return jc.invoice && invoiceDate === today
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-l-4 border-l-orange-500 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{jobCards.filter(jc => jc.invoice).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-l-4 border-l-purple-500 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  jobCards
                    .filter(jc => jc.invoice)
                    .reduce((sum, jc) => sum + parseFloat(jc.invoice.total_amount || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gray-800 text-white rounded-xl p-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-semibold">Invoice Management System</span>
        <p className="text-sm text-gray-300 ml-auto flex-1">Generate and manage invoices for completed job cards with pricing information. Advance payments are automatically deducted from total amounts.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters & Search
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Job Card Number</label>
            <input
              type="text"
              placeholder="Search by job card number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Customer Name</label>
            <input
              type="text"
              placeholder="Search by customer name..."
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Invoice Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="">All Statuses</option>
              <option value="pending_invoice">Pending Invoice</option>
              <option value="generated">Invoice Generated</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Results Per Page</label>
            <select
              value={resultsPerPage}
              onChange={(e) => {
                setResultsPerPage(parseInt(e.target.value))
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {paginatedData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + resultsPerPage, jobCards.length)} of {jobCards.length} results</p>
          <button
            onClick={() => {
              setSearch('')
              setCustomerFilter('')
              setStatusFilter('')
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Job Card</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Customer Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Vehicle Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Service Dates</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Payment Details</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No invoices found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((jobCard) => {
                  const paymentStatus = getPaymentStatus(jobCard)
                  const invoice = jobCard.invoice
                  const advancePaid = parseFloat(invoice?.advance_paid || jobCard.advance_payment || 0)
                  
                  return (
                    <tr key={jobCard.id} className="hover:bg-gray-50 transition-colors">
                      {/* Job Card */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-primary text-sm">{jobCard.job_card_number}</p>
                          <p className="text-xs text-gray-500">Created: {formatDate(jobCard.created_at)}</p>
                          {invoice ? (
                            <span className="inline-block px-2.5 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded text-xs font-semibold">
                              ✓ Invoice Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded text-xs font-semibold">
                              ⏳ Pending Invoice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 text-sm">{jobCard.customer?.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {jobCard.customer?.phone}
                          </p>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">{jobCard.vehicle?.license_plate}</p>
                          <p className="text-xs text-gray-600">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</p>
                          <p className="text-xs text-gray-500">Year: {jobCard.vehicle?.year}</p>
                        </div>
                      </td>

                      {/* Service Dates */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-gray-600">
                          <p><span className="font-semibold">In:</span> {formatDate(jobCard.created_at)}</p>
                          <p><span className="font-semibold">Out:</span> {formatDate(jobCard.estimated_completion_date)}</p>
                        </div>
                      </td>

                      {/* Payment Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {invoice ? (
                            <>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${paymentStatus.color}`}>
                                {paymentStatus.status === 'paid' ? '✓' : paymentStatus.status === 'partially' ? '◑' : '⏰'} {paymentStatus.label}
                              </span>
                              <p className="text-sm font-bold text-gray-900">
                                Total: <span className="text-gray-800">{formatCurrency(invoice.total_amount)}</span>
                              </p>
                              {parseFloat(invoice.balance_due) > 0 && (
                                <p className="text-sm font-semibold text-red-600">
                                  Due: {formatCurrency(invoice.balance_due)}
                                </p>
                              )}
                            </>
                          ) : (
                            advancePaid > 0 ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <p className="text-xs font-bold text-green-700">Advance Paid</p>
                                  <p className="text-sm font-black text-green-800">{formatCurrency(advancePaid)}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 text-xs font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                No Advance
                              </div>
                            )
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="space-y-2">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => navigate(`/invoice/${jobCard.id}`)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>

                            {!invoice ? (
                              <button
                                onClick={() => navigate(`/invoice/${jobCard.id}`)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate
                              </button>
                            ) : (
                              invoice.balance_due > 0 && (
                                <button
                                  onClick={() => navigate(`/invoice/${jobCard.id}`)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Pay Again
                                </button>
                              )
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/invoice-print/${jobCard.id}`)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum = i + 1
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i
              }
              if (pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              }
              return null
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceManagement
