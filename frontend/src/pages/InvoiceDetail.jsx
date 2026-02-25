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
      
      // Fetch job card
      const jobCardResponse = await axiosClient.get(`/job-cards/${jobCardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobCard(jobCardResponse.data)

      // Fetch invoice
      const invoiceResponse = await axiosClient.get(`/job-cards/${jobCardId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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
    if (discountType === 'percentage') {
      return (invoice?.subtotal || 0) * (discountValue / 100)
    } else if (discountType === 'fixed') {
      return discountValue
    }
    return 0
  }

  const subtotalAfterDiscount = (invoice?.subtotal || 0) - calculateDiscount()
  const amountDue = subtotalAfterDiscount - (invoice?.advance_paid || 0)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const handlePayment = async () => {
    if (!paymentType) {
      alert('Please select a payment type')
      return
    }
    if (paidAmount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      
      await axiosClient.post('/payments', {
        invoice_id: invoice.id,
        amount: paidAmount,
        payment_type: paymentType,
        notes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

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
        <p className="text-gray-600 mb-4">Invoice not found</p>
        <button
          onClick={() => navigate('/invoices')}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Back to Invoices
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
          <p className="text-sm text-gray-400 mt-1">{jobCard.job_card_number}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/invoice-print/${jobCardId}`)}
            className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            🖨️ Print Invoice
          </button>
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            ← Back to List
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Info */}
        <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl border-2 border-cyan-300 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            👤 Customer Information
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Name:</p>
              <p className="text-gray-900 font-semibold">{jobCard.customer?.name}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Mobile:</p>
              <p className="text-gray-900 font-semibold">{jobCard.customer?.phone}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Email:</p>
              <p className="text-gray-900 font-semibold">{jobCard.customer?.email || '—'}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-gradient-to-br from-pink-100 to-orange-100 rounded-xl border-2 border-pink-300 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            🚗 Vehicle Information
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Plate:</p>
              <p className="text-gray-900 font-semibold">{jobCard.vehicle?.license_plate}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Model:</p>
              <p className="text-gray-900 font-semibold">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Year:</p>
              <p className="text-gray-900 font-semibold">{jobCard.vehicle?.year}</p>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-300 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            📋 Invoice Details
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Number:</p>
              <p className="text-gray-900 font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Date:</p>
              <p className="text-gray-900 font-semibold">{new Date(invoice.invoice_date).toLocaleDateString('en-LK')}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Status:</p>
              <p className="text-gray-900 font-semibold capitalize">{invoice.status}</p>
            </div>
          </div>
        </div>

        {/* Advance Payment */}
        <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl border-2 border-orange-300 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            💰 Advance Payment
          </h3>
          <div className="space-y-3">
            <div className="bg-green-500 text-white px-3 py-2 rounded-lg font-bold text-center">
              ✓ {formatCurrency(invoice.advance_paid)}
            </div>
            <p className="text-xs text-gray-700">This amount will be deducted from the final total</p>
          </div>
        </div>
      </div>

      {/* Invoice Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          ✕ Services
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg font-bold">
            <div>📋 DESCRIPTION</div>
            <div className="text-right">💰 PRICE</div>
          </div>

          {/* Services row */}
          <div className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-200">
            <div className="text-gray-800">Service Work</div>
            <div className="text-right text-gray-900 font-semibold">{formatCurrency(invoice.labor_charges)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-3 rounded-lg font-bold text-gray-800">
            <div>Services Total</div>
            <div className="text-right">{formatCurrency(invoice.labor_charges)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apply Discount */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-300 p-6">
          <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
            ✕ Apply Discount
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setDiscountType('none'); setDiscountValue(0) }}
                className={`px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors border-2 ${
                  discountType === 'none'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'
                }`}
              >
                ⭕No Discount
              </button>
              <button
                onClick={() => setDiscountType('percentage')}
                className={`px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors border-2 ${
                  discountType === 'percentage'
                    ? 'bg-white text-blue-600 border-blue-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ✕Percentage
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors border-2 ${
                  discountType === 'fixed'
                    ? 'bg-white text-green-600 border-green-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                $Fixed Amount
              </button>
            </div>

            {discountType !== 'none' && (
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            )}

            <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal After Discount:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotalAfterDiscount)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>Advance Deduction:</span>
                <span>- {formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between bg-blue-50 px-3 py-2 rounded font-bold text-blue-600">
                <span>Final Amount Due:</span>
                <span>{formatCurrency(Math.max(0, amountDue))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl border-2 border-cyan-300 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ✎ Payment Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">💰 Paid Amount (LKR)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏦 Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">💳 Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select Payment Type</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📝 Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes or comments..."
                maxLength="1000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none resize-none"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">0/1000 characters</p>
              <p className="text-xs text-gray-600 mt-2">You can use bullet points (+) and press Enter for new lines. The formatting will be preserved in the invoice.</p>
            </div>

            <button
              onClick={handlePayment}
              disabled={submitting}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-bold transition-all"
            >
              {submitting ? '⏳ Processing Payment...' : '✓ Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail
