import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axios'

function InvoicePrint({ user }) {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [jobCard, setJobCard] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoiceData()
  }, [jobCardId])

  const fetchInvoiceData = async () => {
    try {
      const token = localStorage.getItem('token')
      const jobCardResponse = await axiosClient.get(`/job-cards/${jobCardId}`, { headers: { Authorization: `Bearer ${token}` } })
      setJobCard(jobCardResponse.data)
      const invoiceResponse = await axiosClient.get(`/job-cards/${jobCardId}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
      setInvoice(invoiceResponse.data)
    } catch (error) {
      console.error('Error fetching invoice data:', error)
      alert('Error loading invoice')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading invoice...</span>
        </div>
      </div>
    )
  }

  if (!jobCard || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500 mb-4">Invoice not found</p>
        <button onClick={() => navigate('/invoices')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
          Back to Invoices
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-5 flex gap-2.5 justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoice
        </button>
      </div>

      {/* Invoice Paper */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-10 py-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 bg-white/15 rounded-lg">
                <span className="text-sm font-black text-white tracking-tight">GAT</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Grand Auto Tech</h1>
            </div>
            <p className="text-sm text-gray-300 mt-2">No. 1/B/2, Horana Road, Kahathudwa, Polgasowita.</p>
            <p className="text-sm text-gray-300">Tel: 011 2705013 · WhatsApp: 0712124500</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Invoice</p>
            <p className="text-2xl font-bold font-mono">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(invoice.invoice_date).toLocaleDateString('en-LK')}</p>
          </div>
        </div>

        {/* Divider accent */}
        <div className="h-1 bg-gradient-to-r from-primary via-blue-400 to-primary" />

        {/* Bill To & Vehicle Details */}
        <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
          <div className="px-10 py-7 border-r border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Bill To
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Name</span><span className="font-semibold text-gray-900">{jobCard.customer?.name}</span></div>
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Mobile</span><span>{jobCard.customer?.phone}</span></div>
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Email</span><span>{jobCard.customer?.email || '—'}</span></div>
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Address</span><span>{jobCard.customer?.address || '—'}</span></div>
            </div>
          </div>

          <div className="px-10 py-7">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Vehicle Details
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Plate</span><span className="font-bold font-mono tracking-widest text-primary">{jobCard.vehicle?.license_plate}</span></div>
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Model</span><span>{jobCard.vehicle?.make} {jobCard.vehicle?.model}</span></div>
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Year</span><span>{jobCard.vehicle?.year}</span></div>
              <div className="flex gap-2"><span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">Job Card</span><span className="font-semibold">{jobCard.job_card_number}</span></div>
            </div>
          </div>
        </div>

        {/* Service Details Table */}
        <div className="px-10 py-7">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Service Details</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y-2 border-gray-800 bg-gray-900">
                <th className="text-left py-2.5 px-3 text-xs font-bold text-white uppercase tracking-wider">Description</th>
                <th className="text-left py-2.5 px-3 text-xs font-bold text-white uppercase tracking-wider">Type</th>
                <th className="text-center py-2.5 px-3 text-xs font-bold text-white uppercase tracking-wider">Qty</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-white uppercase tracking-wider">Unit Price</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-white uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3 text-gray-700">Service Work</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">Services</span>
                </td>
                <td className="py-3 px-3 text-center text-gray-600">1</td>
                <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(invoice.labor_charges)}</td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(invoice.labor_charges)}</td>
              </tr>
              {invoice.parts_charges > 0 && (
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-700">Spare Parts</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold">Spare Parts</span>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-600">1</td>
                  <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(invoice.parts_charges)}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(invoice.parts_charges)}</td>
                </tr>
              )}
              {invoice.other_charges > 0 && (
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-700">Other Charges</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-semibold">Other</span>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-600">1</td>
                  <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(invoice.other_charges)}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(invoice.other_charges)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment History & Summary */}
        <div className="grid grid-cols-2 gap-0 border-t border-gray-100">

          {/* Payment History */}
          <div className="px-10 py-7 border-r border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Payment History
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 font-semibold text-gray-500">Date & Time</th>
                  <th className="text-left pb-2 font-semibold text-gray-500">Type</th>
                  <th className="text-left pb-2 font-semibold text-gray-500">Method</th>
                  <th className="text-right pb-2 font-semibold text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.advance_paid > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-600">{formatDate(invoice.invoice_date)}</td>
                    <td className="py-2 text-gray-600">Advance</td>
                    <td className="py-2 text-gray-600">Cash</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatCurrency(invoice.advance_paid)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-gray-200 text-sm">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Total Payments Made</span>
                <span>{formatCurrency(invoice.advance_paid)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{invoice.advance_paid > 0 ? '1 transaction(s)' : 'No transactions'}</p>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="px-10 py-7 bg-gray-900">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Invoice Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Services Amount</span>
                <span className="font-semibold text-white">{formatCurrency(invoice.labor_charges)}</span>
              </div>
              {invoice.other_charges > 0 && (
                <div className="flex justify-between text-orange-400">
                  <span>Other Charges</span>
                  <span className="font-semibold">{formatCurrency(invoice.other_charges)}</span>
                </div>
              )}
              {invoice.parts_charges > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Parts Amount</span>
                  <span className="font-semibold">{formatCurrency(invoice.parts_charges)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300 border-t border-gray-700 pt-2">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-red-600 px-3 py-2 rounded-lg mt-1">
                <span className="text-white font-semibold text-sm">Amount Due</span>
                <span className="font-black text-white text-lg">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-400 pt-1">
                <span>Paid Amount</span>
                <span className="font-semibold">{formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="flex justify-between text-gray-300 border-t border-gray-700 pt-2">
                <span>Balance Due</span>
                <span className="font-bold text-white">{formatCurrency(invoice.balance_due)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-5 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-500">Thank you for your business!</p>
          <p className="text-xs text-gray-400 mt-0.5">This is a computer-generated invoice. No signature required.</p>
        </div>

      </div>
    </div>
  )
}

export default InvoicePrint