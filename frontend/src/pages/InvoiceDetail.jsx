import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axios'

function InvoiceDetail({ user }) {
  const { jobCardId } = useParams()
  const navigate = useNavigate()
  const [jobCard, setJobCard] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [discountType, setDiscountType] = useState('none')
  const [discountValue, setDiscountValue] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [paymentType, setPaymentType] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      if (invoiceResponse.data) {
        setPaidAmount(invoiceResponse.data.advance_paid || 0)
        setPaymentStatus(invoiceResponse.data.status)
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error)
      alert('Error loading invoice details')
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscount = () => {
    if (discountType === 'percentage') return (invoice?.subtotal || 0) * (discountValue / 100)
    if (discountType === 'fixed') return discountValue
    return 0
  }

  const subtotalAfterDiscount = (invoice?.subtotal || 0) - calculateDiscount()
  const amountDue = subtotalAfterDiscount - (invoice?.advance_paid || 0)

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(amount || 0)

  const handlePayment = async () => {
    if (!paymentType) { alert('Please select a payment type'); return }
    if (paidAmount <= 0) { alert('Please enter a valid payment amount'); return }
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      await axiosClient.post('/payments', { invoice_id: invoice.id, amount: paidAmount, payment_type: paymentType, notes }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Payment recorded successfully!')
      fetchInvoiceData()
      setPaidAmount(0)
      setPaymentType('')
      setNotes('')
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording payment')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

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
        <button onClick={() => navigate('/invoices')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">Back to Invoices</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoice Details
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{jobCard.job_card_number}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/invoice-print/${jobCardId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Invoice
          </button>
          <button
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Customer
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Name',   value: jobCard.customer?.name },
              { label: 'Mobile', value: jobCard.customer?.phone },
              { label: 'Email',  value: jobCard.customer?.email || '—' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className="text-xs font-semibold text-gray-800 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Vehicle
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs text-gray-400">Plate</span>
              <span className="text-xs font-bold font-mono tracking-widest text-primary">{jobCard.vehicle?.license_plate}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs text-gray-400">Model</span>
              <span className="text-xs font-semibold text-gray-800 text-right">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs text-gray-400">Year</span>
              <span className="text-xs font-semibold text-gray-800">{jobCard.vehicle?.year}</span>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoice
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Number', value: invoice.invoice_number },
              { label: 'Date',   value: new Date(invoice.invoice_date).toLocaleDateString('en-LK') },
              { label: 'Status', value: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className="text-xs font-semibold text-gray-800 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advance Payment */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Advance Payment
          </h3>
          <div className="mt-1">
            <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-sm">{formatCurrency(invoice.advance_paid)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Deducted from final total</p>
          </div>
        </div>
      </div>

      {/* Services Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Services
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <div className="grid grid-cols-2 gap-4 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-50/60 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Price</span>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-100">
            <span className="text-sm text-gray-700">Service Work</span>
            <span className="text-sm font-semibold text-gray-900 text-right">{formatCurrency(invoice.labor_charges)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-gray-50/60">
            <span className="text-sm font-bold text-gray-700">Services Total</span>
            <span className="text-sm font-bold text-gray-900 text-right">{formatCurrency(invoice.labor_charges)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Apply Discount */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Apply Discount
          </h3>

          <div className="space-y-4">
            <div className="flex gap-2">
              {[
                { id: 'none',       label: 'No Discount' },
                { id: 'percentage', label: 'Percentage' },
                { id: 'fixed',      label: 'Fixed Amount' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setDiscountType(opt.id); if (opt.id === 'none') setDiscountValue(0) }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                    discountType === opt.id
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {discountType !== 'none' && (
              <div className="space-y-1.5">
                <label className={labelCls}>{discountType === 'percentage' ? 'Percentage (%)' : 'Amount (LKR)'}</label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                  className={inputCls}
                />
              </div>
            )}

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Original Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>After Discount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotalAfterDiscount)}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Advance Deduction</span>
                <span className="font-semibold">− {formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-bold text-gray-800">Final Amount Due</span>
                <span className="font-bold text-primary">{formatCurrency(Math.max(0, amountDue))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Record Payment
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Paid Amount (LKR)</label>
              <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} placeholder="0" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Payment Status</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Payment Type</label>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputCls}>
                <option value="">Select Payment Type</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes or comments..."
                maxLength="1000"
                rows="4"
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-gray-400">{notes.length}/1000 characters</p>
              <p className="text-xs text-gray-400">You can use bullet points (+) and press Enter for new lines.</p>
            </div>

            <button
              onClick={handlePayment}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px disabled:cursor-not-allowed disabled:translate-y-0"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Record Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail
