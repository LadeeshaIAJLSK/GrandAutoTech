import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axios'

function InvoiceDetail({ user }) {
  const { jobCardId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [jobCard, setJobCard] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })

  // Discount
  const [discountType, setDiscountType] = useState('none')
  const [discountValue, setDiscountValue] = useState('')

  // Payment
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentType, setPaymentType] = useState('partial')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => { fetchAll() }, [jobCardId])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const jcRes = await axiosClient.get(`/job-cards/${jobCardId}`, { headers })
      const jc = jcRes.data.data || jcRes.data
      setJobCard(jc)

      try {
        const invRes = await axiosClient.get(`/job-cards/${jobCardId}/invoice`, { headers })
        if (invRes.data) setInvoice(invRes.data)
        else setInvoice(null)
      } catch {
        setInvoice(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Calculations ─────────────────────────────────────────────────────────

  const servicesTotal = () => {
    if (!jobCard?.tasks) return 0
    return jobCard.tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  }

  const partsTotal = () => {
    if (!jobCard?.sparePartsRequests) return 0
    return jobCard.sparePartsRequests.reduce(
      (sum, p) => sum + parseFloat(p.selling_price || 0), 0
    )
  }

  const otherTotal = () => {
    if (!jobCard?.otherCharges) return 0
    return jobCard.otherCharges.reduce(
      (sum, c) => sum + parseFloat(c.amount || 0), 0
    )
  }

  const calcSubtotal = () => servicesTotal() + partsTotal() + otherTotal()

  const calcDiscount = () => {
    const sub = calcSubtotal()
    if (discountType === 'percentage') {
      return (sub * parseFloat(discountValue || 0)) / 100
    }
    if (discountType === 'fixed') {
      return Math.min(parseFloat(discountValue || 0), sub)
    }
    return 0
  }

  const calcTotal = () => Math.max(0, calcSubtotal() - calcDiscount())

  const advancePaid = () => {
    // After invoice is generated, use invoice.advance_paid (set at generation time)
    if (invoice) return parseFloat(invoice.advance_paid || 0)
    // Before invoice, use job card's advance_payment field
    return parseFloat(jobCard?.advance_payment || 0)
  }

  const calcBalanceDue = () => {
    if (invoice) return parseFloat(invoice.balance_due || 0)
    return Math.max(0, calcTotal() - advancePaid())
  }

  const fmt = (n) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency', currency: 'LKR', minimumFractionDigits: 2
    }).format(n || 0)

  const fmtDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const res = await axiosClient.post(
        `/job-cards/${jobCardId}/invoice/generate`,
        { discount_amount: calcDiscount() },
        { headers }
      )
      setInvoice(res.data)
      setMessage({ text: 'Invoice generated successfully!', type: 'success' })
      fetchAll()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error generating invoice', type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateDiscount = async () => {
    if (!invoice) return
    try {
      const res = await axiosClient.put(
        `/invoices/${invoice.id}`,
        { discount_amount: calcDiscount() },
        { headers }
      )
      setInvoice(res.data)
      setMessage({ text: 'Discount applied!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err) {
      setMessage({ text: 'Error applying discount', type: 'error' })
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return
    
    // Auto-determine payment type: full if amount covers balance, otherwise partial
    const amount = parseFloat(paymentAmount)
    const balance = calcBalanceDue()
    const type = amount >= balance ? 'full' : 'partial'
    
    try {
      setSubmittingPayment(true)
      await axiosClient.post(
        '/payments',
        {
          job_card_id: jobCardId,
          invoice_id: invoice?.id,
          amount: amount,
          payment_method: paymentMethod,
          payment_type: type,
          payment_date: paymentDate,
          reference_number: referenceNumber || null,
          notes: null,
        },
        { headers }
      )
      setMessage({ text: 'Payment recorded successfully!', type: 'success' })
      setPaymentAmount('')
      setReferenceNumber('')
      setPaymentType('partial')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
      fetchAll()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error recording payment', type: 'error' })
    } finally {
      setSubmittingPayment(false)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading invoice details...</span>
        </div>
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-4">Job card not found</p>
        <button onClick={() => navigate('/invoices')} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          ← Back to Invoices
        </button>
      </div>
    )
  }

  const tasks = (jobCard.tasks || []).filter(t => t.status === 'completed')
  const parts = jobCard.sparePartsRequests || []
  const charges = jobCard.otherCharges || []
  const hasAdvance = advancePaid() > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 text-white py-12 px-8 text-center rounded-b-3xl shadow-xl mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1">
          {invoice ? 'Invoice' : 'Generate Invoice'}
        </h1>
        <p className="text-purple-200 text-base">Job Card: {jobCard.job_card_number}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        {/* Alert */}
        {message.text && (
          <div className={`px-5 py-3 rounded-xl font-semibold text-sm border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'bg-red-50 text-red-700 border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer */}
          <div className="rounded-2xl p-5 shadow-md" style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/60 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">Customer Information</span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex justify-between"><span className="font-bold">Name:</span><span>{jobCard.customer?.name}</span></div>
              <div className="flex justify-between"><span className="font-bold">Mobile:</span><span>{jobCard.customer?.phone}</span></div>
              <div className="flex justify-between"><span className="font-bold">Email:</span><span className="truncate max-w-[110px] text-right text-xs">{jobCard.customer?.email || '—'}</span></div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="rounded-2xl p-5 shadow-md" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/60 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l3.333-.833M13 16l-2-5H5l-1 5m9 0h3m0 0a2 2 0 104 0M16 16h4" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">Vehicle Information</span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex justify-between"><span className="font-bold">Plate:</span><span className="font-mono">{jobCard.vehicle?.license_plate}</span></div>
              <div className="flex justify-between"><span className="font-bold">Model:</span><span>{jobCard.vehicle?.model}</span></div>
              <div className="flex justify-between"><span className="font-bold">Year:</span><span>{jobCard.vehicle?.year}</span></div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="rounded-2xl p-5 shadow-md" style={{ background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/60 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">Invoice Details</span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex justify-between"><span className="font-bold">Number:</span><span className="text-xs">{invoice?.invoice_number || '—'}</span></div>
              <div className="flex justify-between"><span className="font-bold">Date:</span><span className="text-xs">{fmtDate(invoice?.invoice_date || new Date())}</span></div>
              <div className="flex justify-between"><span className="font-bold">Status:</span><span className="capitalize font-semibold">{invoice?.status || 'Draft'}</span></div>
            </div>
          </div>

          {/* Advance Payment */}
          <div className="rounded-2xl p-5 shadow-md" style={{ background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/60 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">Advance Payment</span>
            </div>
            <div className="text-sm text-gray-700 flex items-center gap-2">
              <span className="font-bold">Amount:</span>
              {hasAdvance ? (
                <span className="font-bold text-green-700">{fmt(advancePaid())}</span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white/70 text-gray-500 px-3 py-1 rounded-lg text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  No advance payment
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Breakdown */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="py-8 text-center border-b border-gray-100">
            <h2 className="text-3xl font-black text-gray-900">Invoice Breakdown</h2>
            <div className="w-16 h-1 bg-purple-500 rounded mx-auto mt-2" />
          </div>

          <div className="p-6 space-y-8">
            {/* Services / Tasks */}
            {tasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-lg font-bold text-purple-700">Services</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="grid grid-cols-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      Description
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold uppercase justify-end">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Price
                    </div>
                  </div>
                  {tasks.map((task, i) => (
                    <div key={task.id} className={`grid grid-cols-2 px-5 py-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <span className="text-sm text-gray-800">{task.task_name}</span>
                      <span className="text-sm text-purple-600 font-medium text-right">{fmt(task.amount)}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <span className="text-sm font-bold text-gray-700">Services Total</span>
                    <span className="text-sm font-bold text-purple-700 text-right">{fmt(servicesTotal())}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Spare Parts */}
            {parts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-lg font-bold text-blue-700">Spare Parts</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="grid grid-cols-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-3">
                    <div className="text-xs font-bold uppercase">Part Name</div>
                    <div className="text-xs font-bold uppercase text-center">Qty</div>
                    <div className="text-xs font-bold uppercase text-right">Price</div>
                  </div>
                  {parts.map((part, i) => (
                    <div key={part.id} className={`grid grid-cols-3 px-5 py-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <span className="text-sm text-gray-800">{part.part_name}</span>
                      <span className="text-sm text-gray-500 text-center">{part.quantity}</span>
                      <span className="text-sm text-blue-600 font-medium text-right">{fmt(part.selling_price)}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 px-5 py-3 bg-blue-50">
                    <span className="text-sm font-bold text-gray-700 col-span-2">Parts Total</span>
                    <span className="text-sm font-bold text-blue-700 text-right">{fmt(partsTotal())}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Charges */}
            {charges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-bold text-orange-700">Other Charges</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="grid grid-cols-2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-5 py-3">
                    <div className="text-xs font-bold uppercase">Description</div>
                    <div className="text-xs font-bold uppercase text-right">Amount</div>
                  </div>
                  {charges.map((charge, i) => (
                    <div key={charge.id} className={`grid grid-cols-2 px-5 py-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <span className="text-sm text-gray-800">{charge.description}</span>
                      <span className="text-sm text-orange-600 font-medium text-right">{fmt(charge.amount)}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 px-5 py-3 bg-orange-50">
                    <span className="text-sm font-bold text-gray-700">Other Charges Total</span>
                    <span className="text-sm font-bold text-orange-700 text-right">{fmt(otherTotal())}</span>
                  </div>
                </div>
              </div>
            )}

            {tasks.length === 0 && parts.length === 0 && charges.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No completed tasks or charges found for this job card</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="rounded-2xl shadow-md overflow-hidden" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
          <div className="py-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M15 7h.01M3 7h2m0 0V5a1 1 0 011-1h12a1 1 0 011 1v2m-14 0h14m0 0v11a1 1 0 01-1 1H5a1 1 0 01-1-1V7" />
              </svg>
              <h3 className="text-2xl font-black text-gray-800">Invoice Summary</h3>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow">
              {tasks.length > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-gray-100">
                  <span className="text-gray-600">Services Total:</span>
                  <span className="font-semibold text-gray-900">{fmt(servicesTotal())}</span>
                </div>
              )}
              {parts.length > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-gray-100">
                  <span className="text-gray-600">Parts Total:</span>
                  <span className="font-semibold text-gray-900">{fmt(partsTotal())}</span>
                </div>
              )}
              {charges.length > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-gray-100">
                  <span className="text-gray-600">Other Charges:</span>
                  <span className="font-semibold text-gray-900">{fmt(otherTotal())}</span>
                </div>
              )}
              <div className="flex justify-between px-6 py-3 border-b border-gray-100">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">{fmt(calcSubtotal())}</span>
              </div>
              {calcDiscount() > 0 && (
                <div className="flex justify-between px-6 py-3 border-b border-gray-100 text-green-600">
                  <span>Discount{discountType === 'percentage' ? ` (${discountValue}%)` : ''}:</span>
                  <span className="font-semibold">-{fmt(calcDiscount())}</span>
                </div>
              )}
              {hasAdvance && (
                <div className="flex justify-between px-6 py-3 border-b border-gray-100 text-blue-600">
                  <span>Advance Paid:</span>
                  <span className="font-semibold">-{fmt(advancePaid())}</span>
                </div>
              )}
              <div className="flex justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01" />
                  </svg>
                  <span className="font-bold text-lg">Amount Due:</span>
                </div>
                <span className="font-black text-xl">{fmt(calcBalanceDue())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Discount */}
        <div className="rounded-2xl shadow-md overflow-hidden" style={{ background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)' }}>
          <div className="px-6 pt-6 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-xl font-bold text-orange-800">Apply Discount</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => { setDiscountType('none'); setDiscountValue('') }}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  discountType === 'none'
                    ? 'border-orange-400 bg-orange-100 text-orange-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No Discount
              </button>
              <button
                onClick={() => setDiscountType('percentage')}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  discountType === 'percentage'
                    ? 'border-orange-400 bg-orange-100 text-orange-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                }`}
              >
                <span className="font-bold text-base">%</span>
                Percentage
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  discountType === 'fixed'
                    ? 'border-orange-400 bg-orange-100 text-orange-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                }`}
              >
                <span className="font-bold text-base">Rs</span>
                Fixed Amount
              </button>
            </div>

            {discountType !== 'none' && (
              <div className="mb-4">
                <input
                  type="number"
                  min="0"
                  step={discountType === 'percentage' ? '0.1' : '1'}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'Enter % e.g. 10' : 'Enter amount e.g. 5000'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-sm"
                />
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-inner space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Original Subtotal:</span>
                <span className="font-semibold">{fmt(calcSubtotal())}</span>
              </div>
              {calcDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">-{fmt(calcDiscount())}</span>
                </div>
              )}
              {hasAdvance && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Advance Deducted:</span>
                  <span className="font-semibold">-{fmt(advancePaid())}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl mt-2">
                <span className="font-bold">Final Amount Due:</span>
                <span className="font-black">{fmt(calcBalanceDue())}</span>
              </div>
            </div>

            {invoice && discountType !== 'none' && parseFloat(discountValue) > 0 && (
              <button
                onClick={handleUpdateDiscount}
                className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
              >
                Update Discount on Invoice
              </button>
            )}
          </div>
        </div>

        {/* Generate Invoice Button */}
        {!invoice && (
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg rounded-2xl shadow-xl disabled:opacity-60 transition-all hover:scale-105 active:scale-95"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Invoice
                </>
              )}
            </button>
          </div>
        )}

        {/* Record Payment */}
        {invoice && calcBalanceDue() > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Record Payment
            </h3>
            <p className="text-sm text-red-600 font-semibold bg-red-50 px-4 py-2 rounded-lg mb-4">
              Outstanding Balance: {fmt(calcBalanceDue())}
            </p>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Amount</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="mobile_payment">Mobile Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="e.g., Cheque #, Transaction ID..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPayment || !paymentAmount}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                {submittingPayment ? 'Recording...' : 'Record Payment'}
              </button>
            </form>
          </div>
        )}

        {/* Fully Paid Badge */}
        {invoice && calcBalanceDue() <= 0 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-100 border-2 border-green-300 text-green-700 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-black text-lg">Fully Paid</p>
                <p className="text-sm text-green-600">This invoice has been fully settled</p>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <button onClick={() => navigate('/invoices')} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors">
            ← Back to Invoices
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail
