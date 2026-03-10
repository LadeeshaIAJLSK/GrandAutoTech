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

  const [discountType, setDiscountType] = useState('none')
  const [discountValue, setDiscountValue] = useState('')

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentType, setPaymentType] = useState('partial')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [bankName, setBankName] = useState('')
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
      } catch { setInvoice(null) }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const servicesTotal = () => {
    if (!jobCard?.tasks) return 0
    return jobCard.tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
  }
  const partsTotal = () => {
    if (!jobCard?.sparePartsRequests) return 0
    return jobCard.sparePartsRequests.reduce((sum, p) => sum + parseFloat(p.selling_price || 0), 0)
  }
  const otherTotal = () => {
    if (!jobCard?.otherCharges) return 0
    return jobCard.otherCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  }
  const calcSubtotal = () => servicesTotal() + partsTotal() + otherTotal()
  const calcDiscount = () => {
    const sub = calcSubtotal()
    if (discountType === 'percentage') return (sub * parseFloat(discountValue || 0)) / 100
    if (discountType === 'fixed') return Math.min(parseFloat(discountValue || 0), sub)
    return 0
  }
  const calcTotal = () => Math.max(0, calcSubtotal() - calcDiscount())
  const advancePaid = () => {
    if (invoice) return parseFloat(invoice.advance_paid || 0)
    return parseFloat(jobCard?.advance_payment || 0)
  }
  const calcBalanceDue = () => {
    if (invoice) return parseFloat(invoice.balance_due || 0)
    return Math.max(0, calcTotal() - advancePaid())
  }
  const fmt = (n) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(n || 0)
  const fmtDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const res = await axiosClient.post(`/job-cards/${jobCardId}/invoice/generate`, { discount_amount: calcDiscount() }, { headers })
      setInvoice(res.data)
      setMessage({ text: 'Invoice generated successfully!', type: 'success' })
      fetchAll()
    } catch (err) { setMessage({ text: err.response?.data?.message || 'Error generating invoice', type: 'error' }) }
    finally { setGenerating(false) }
  }

  const handleUpdateDiscount = async () => {
    if (!invoice) return
    try {
      const res = await axiosClient.put(`/invoices/${invoice.id}`, { discount_amount: calcDiscount() }, { headers })
      setInvoice(res.data)
      setMessage({ text: 'Discount applied!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err) { setMessage({ text: 'Error applying discount', type: 'error' }) }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return
    const amount = parseFloat(paymentAmount)
    const balance = calcBalanceDue()
    const type = amount >= balance ? 'full' : 'partial'
    try {
      setSubmittingPayment(true)
      await axiosClient.post('/payments', {
        job_card_id: jobCardId, invoice_id: invoice?.id, amount,
        payment_method: paymentMethod, payment_type: type,
        payment_date: paymentDate, reference_number: referenceNumber || null, bank_name: bankName || null, notes: null,
      }, { headers })
      setMessage({ text: 'Payment recorded successfully!', type: 'success' })
      setPaymentAmount(''); setReferenceNumber(''); setBankName(''); setPaymentType('partial')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
      fetchAll()
    } catch (err) { setMessage({ text: err.response?.data?.message || 'Error recording payment', type: 'error' }) }
    finally { setSubmittingPayment(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading invoice details...</span>
      </div>
    </div>
  )

  if (!jobCard) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Job card not found</p>
      <button onClick={() => navigate('/invoices')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
        Back to Invoices
      </button>
    </div>
  )

  const tasks = (jobCard.tasks || []).filter(t => t.status === 'completed')
  const parts = jobCard.sparePartsRequests || []
  const charges = jobCard.otherCharges || []
  const hasAdvance = advancePaid() > 0

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  const bankOptions = [
    { value: '', label: 'Select a Bank' },
    { value: 'Commercial Bank of Ceylon', label: 'Commercial Bank of Ceylon' },
    { value: 'Hatton National Bank', label: 'Hatton National Bank' },
    { value: 'Sampath Bank', label: 'Sampath Bank' },
    { value: "People's Bank", label: "People's Bank" },
    { value: 'Bank of Ceylon', label: 'Bank of Ceylon' },
    { value: 'National Savings Bank', label: 'National Savings Bank' },
    { value: 'SANASA Development Bank', label: 'SANASA Development Bank' },
    { value: 'Regional Development Bank', label: 'Regional Development Bank' },
    { value: 'Sri Lanka Savings Bank', label: 'Sri Lanka Savings Bank' },
    { value: 'HDFC Bank of Sri Lanka', label: 'HDFC Bank of Sri Lanka' },
  ]

  const SectionTable = ({ accentFrom, accentTo, headers: ths, rows, footerLabel, footerValue }) => (
    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      <div className={`grid px-5 py-3 bg-gradient-to-r ${accentFrom} ${accentTo} text-white`}
        style={{ gridTemplateColumns: `repeat(${ths.length}, minmax(0, 1fr))` }}>
        {ths.map((h, i) => (
          <div key={h} className={`text-xs font-semibold uppercase tracking-wider ${i === ths.length - 1 ? 'text-right' : i > 0 ? 'text-center' : ''}`}>{h}</div>
        ))}
      </div>
      {rows}
      <div className={`grid px-5 py-3 bg-gray-50 border-t border-gray-100`}
        style={{ gridTemplateColumns: `repeat(${ths.length}, minmax(0, 1fr))` }}>
        <span className={`text-sm font-bold text-gray-700 ${ths.length > 2 ? 'col-span-' + (ths.length - 1) : ''}`}>{footerLabel}</span>
        <span className="text-sm font-bold text-gray-800 text-right">{footerValue}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {invoice ? 'Invoice' : 'Generate Invoice'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{jobCard.job_card_number}</p>
        </div>
        <button onClick={() => navigate('/invoices')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold shadow-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>
      </div>

      {/* Alert */}
      {message.text && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {message.type === 'success'
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            }
          </svg>
          {message.text}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Customer', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-blue-400',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
            rows: [
              { label: 'Name', value: jobCard.customer?.name },
              { label: 'Mobile', value: jobCard.customer?.phone },
              { label: 'Email', value: jobCard.customer?.email || '—' },
            ]
          },
          {
            label: 'Vehicle', iconBg: 'bg-orange-50', iconColor: 'text-orange-600', accent: 'border-orange-400',
            icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l3.333-.833M13 16l-2-5H5l-1 5m9 0h3m0 0a2 2 0 104 0M16 16h4" /></>,
            rows: [
              { label: 'Plate', value: <span className="font-mono font-bold">{jobCard.vehicle?.license_plate}</span> },
              { label: 'Model', value: jobCard.vehicle?.model },
              { label: 'Year', value: jobCard.vehicle?.year },
            ]
          },
          {
            label: 'Invoice Details', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', accent: 'border-purple-400',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
            rows: [
              { label: 'Number', value: invoice?.invoice_number || '—' },
              { label: 'Date', value: fmtDate(invoice?.invoice_date || new Date()) },
              { label: 'Status', value: <span className="capitalize font-semibold">{invoice?.status || 'Draft'}</span> },
            ]
          },
          {
            label: 'Advance Payment', iconBg: 'bg-green-50', iconColor: 'text-green-600', accent: 'border-green-400',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
            rows: [
              { label: 'Amount', value: hasAdvance ? <span className="font-bold text-green-700">{fmt(advancePaid())}</span> : <span className="text-gray-400 text-xs">No advance payment</span> },
            ]
          },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl border-l-4 ${card.accent} border border-gray-200 shadow-sm p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{card.icon}</svg>
              </div>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{card.label}</span>
            </div>
            <div className="space-y-1.5">
              {card.rows.map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">{row.label}</span>
                  <span className="text-xs text-gray-800 text-right max-w-[120px] truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Invoice Breakdown</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Services */}
          {tasks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Services
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="grid grid-cols-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Description</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-right">Price</span>
                </div>
                {tasks.map((task, i) => (
                  <div key={task.id} className={`grid grid-cols-2 px-5 py-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <span className="text-sm text-gray-700">{task.task_name}</span>
                    <span className="text-sm font-semibold text-purple-600 text-right">{fmt(task.amount)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 px-5 py-3 bg-purple-50 border-t border-purple-100">
                  <span className="text-sm font-bold text-gray-700">Services Total</span>
                  <span className="text-sm font-bold text-purple-700 text-right">{fmt(servicesTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Parts */}
          {parts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Spare Parts
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="grid grid-cols-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Part Name</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-center">Qty</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-right">Price</span>
                </div>
                {parts.map((part, i) => (
                  <div key={part.id} className={`grid grid-cols-3 px-5 py-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <span className="text-sm text-gray-700">{part.part_name}</span>
                    <span className="text-sm text-gray-500 text-center">{part.quantity}</span>
                    <span className="text-sm font-semibold text-blue-600 text-right">{fmt(part.selling_price)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-3 px-5 py-3 bg-blue-50 border-t border-blue-100">
                  <span className="text-sm font-bold text-gray-700 col-span-2">Parts Total</span>
                  <span className="text-sm font-bold text-blue-700 text-right">{fmt(partsTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Other Charges */}
          {charges.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Other Charges
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="grid grid-cols-2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Description</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-right">Amount</span>
                </div>
                {charges.map((charge, i) => (
                  <div key={charge.id} className={`grid grid-cols-2 px-5 py-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <span className="text-sm text-gray-700">{charge.description}</span>
                    <span className="text-sm font-semibold text-orange-600 text-right">{fmt(charge.amount)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 px-5 py-3 bg-orange-50 border-t border-orange-100">
                  <span className="text-sm font-bold text-gray-700">Other Charges Total</span>
                  <span className="text-sm font-bold text-orange-700 text-right">{fmt(otherTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {tasks.length === 0 && parts.length === 0 && charges.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-400">No completed tasks or charges found for this job card</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M15 7h.01M3 7h2m0 0V5a1 1 0 011-1h12a1 1 0 011 1v2m-14 0h14m0 0v11a1 1 0 01-1 1H5a1 1 0 01-1-1V7" />
          </svg>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Invoice Summary</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {tasks.length > 0 && <div className="flex justify-between px-6 py-3 text-sm"><span className="text-gray-500">Services Total</span><span className="font-semibold text-gray-800">{fmt(servicesTotal())}</span></div>}
          {parts.length > 0 && <div className="flex justify-between px-6 py-3 text-sm"><span className="text-gray-500">Parts Total</span><span className="font-semibold text-gray-800">{fmt(partsTotal())}</span></div>}
          {charges.length > 0 && <div className="flex justify-between px-6 py-3 text-sm"><span className="text-gray-500">Other Charges</span><span className="font-semibold text-gray-800">{fmt(otherTotal())}</span></div>}
          <div className="flex justify-between px-6 py-3 text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-800">{fmt(calcSubtotal())}</span></div>
          {calcDiscount() > 0 && <div className="flex justify-between px-6 py-3 text-sm text-green-600"><span>Discount{discountType === 'percentage' ? ` (${discountValue}%)` : ''}</span><span className="font-semibold">-{fmt(calcDiscount())}</span></div>}
          {hasAdvance && <div className="flex justify-between px-6 py-3 text-sm text-blue-600"><span>Advance Paid</span><span className="font-semibold">-{fmt(advancePaid())}</span></div>}
          <div className="flex justify-between px-6 py-4 bg-gray-900 text-white">
            <span className="font-bold text-sm">Amount Due</span>
            <span className="font-black text-lg">{fmt(calcBalanceDue())}</span>
          </div>
        </div>
      </div>

      {/* Apply Discount */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Apply Discount</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'none', label: 'No Discount', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> },
              { key: 'percentage', label: 'Percentage', badge: '%' },
              { key: 'fixed', label: 'Fixed Amount', badge: 'Rs' },
            ].map(opt => (
              <button key={opt.key} onClick={() => { setDiscountType(opt.key); if (opt.key === 'none') setDiscountValue('') }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                  discountType === opt.key ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/30'
                }`}>
                {opt.icon ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{opt.icon}</svg>
                ) : (
                  <span className="font-black text-base">{opt.badge}</span>
                )}
                {opt.label}
              </button>
            ))}
          </div>

          {discountType !== 'none' && (
            <input type="number" min="0" step={discountType === 'percentage' ? '0.1' : '1'}
              value={discountValue} onChange={e => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? 'Enter % e.g. 10' : 'Enter amount e.g. 5000'}
              className={inputCls} />
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Original Subtotal</span><span className="font-semibold text-gray-800">{fmt(calcSubtotal())}</span></div>
            {calcDiscount() > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount Applied</span><span className="font-semibold">-{fmt(calcDiscount())}</span></div>}
            {hasAdvance && <div className="flex justify-between text-sm text-blue-600"><span>Advance Deducted</span><span className="font-semibold">-{fmt(advancePaid())}</span></div>}
            <div className="flex justify-between pt-2 mt-1 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-700">Final Amount Due</span>
              <span className="text-sm font-black text-gray-900">{fmt(calcBalanceDue())}</span>
            </div>
          </div>

          {invoice && discountType !== 'none' && parseFloat(discountValue) > 0 && (
            <button onClick={handleUpdateDiscount}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-colors">
              Update Discount on Invoice
            </button>
          )}
        </div>
      </div>

      {/* Generate Invoice Button */}
      {!invoice && (
        <div className="flex justify-center">
          <button onClick={handleGenerate} disabled={generating}
            className="inline-flex items-center gap-3 px-10 py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 transition-all hover:-translate-y-px active:translate-y-0"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {generating ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Record Payment</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Outstanding: {fmt(calcBalanceDue())}
            </span>
          </div>
          <form onSubmit={handlePayment} className="p-6 space-y-4">
            <div>
              <label className={labelCls}>Amount</label>
              <input type="number" min="0.01" step="0.01" value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="mobile_payment">Mobile Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Date</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Reference Number (Optional)</label>
              <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                placeholder="e.g., Cheque #, Transaction ID..." className={inputCls} />
            </div>
            {['card', 'bank_transfer'].includes(paymentMethod) && (
              <div>
                <label className={labelCls}>Bank Name {['bank_transfer', 'card'].includes(paymentMethod) && <span className="text-red-400">*</span>}</label>
                <select value={bankName} onChange={(e) => setBankName(e.target.value)}
                  required className={inputCls}>
                  {bankOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" disabled={submittingPayment || !paymentAmount}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors shadow-sm">
              {submittingPayment ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Fully Paid */}
      {invoice && calcBalanceDue() <= 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-50 border border-green-200 text-green-700 rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-base">Fully Paid</p>
              <p className="text-xs text-green-500">This invoice has been fully settled</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default InvoiceDetail
