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
      const jc = jobCardResponse.data.data || jobCardResponse.data
      setJobCard(jc)
      const invoiceResponse = await axiosClient.get(`/job-cards/${jobCardId}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
      setInvoice(invoiceResponse.data)
    } catch (error) {
      console.error('Error fetching invoice data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (amount) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(amount || 0)

  const fmtDate = (date) =>
    new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })

  const formatCategory = (cat) => {
    if (!cat) return null
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
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

  const tasks = (jobCard.tasks || []).filter(t => t.status === 'completed')
  const parts = jobCard.sparePartsRequests || []
  const charges = jobCard.otherCharges || []
  const paidAmount = parseFloat(invoice.total_amount || 0) - parseFloat(invoice.balance_due || 0)

  const paymentBadge = () => {
    if (invoice.status === 'paid') return { label: 'FULLY PAID', cls: 'border-green-500 text-green-600 bg-green-50' }
    if (invoice.status === 'partially_paid') return { label: 'PARTIALLY PAID', cls: 'border-orange-500 text-orange-600 bg-orange-50' }
    return { label: 'PAYMENT PENDING', cls: 'border-red-500 text-red-600 bg-red-50' }
  }
  const badge = paymentBadge()

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }

          /* Hide everything — no phantom height from wrappers */
          body * { visibility: hidden; }

          /* Show only the invoice and its children */
          #invoice-paper,
          #invoice-paper * { visibility: visible; }

          /* Snap invoice to page origin, no extra height */
          #invoice-paper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            box-shadow: none !important;
            background: white !important;
          }

          /* Kill all height/padding on every ancestor that could add blank pages */
          html, body {
            height: auto !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <div className="bg-gray-200 py-8">

        {/* Action Buttons */}
        <div className="max-w-4xl mx-auto mb-5 flex gap-3 justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold transition-colors shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Invoice
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-400 rounded-lg text-sm font-semibold transition-colors shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </button>
        </div>

        {/* Invoice Paper — this is the ONLY thing that prints */}
        <div id="invoice-paper" className="max-w-4xl mx-auto bg-white shadow-xl">

          {/* Header */}
          <div className="bg-gray-800 text-white px-8 py-6 flex justify-between items-center">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-white tracking-tight">GAT</span>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">Grand Auto Tech</h1>
                <p className="text-xs text-gray-300 mt-1">No. 1/B/2, Horana Road, Kahathudwa, Polgasowita.</p>
                <p className="text-xs text-gray-300">Tel: 011 2705013 &nbsp;·&nbsp; WhatsApp: 0712124500</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Invoice</p>
              <p className="text-xl font-black font-mono mt-0.5">{invoice.invoice_number}</p>
              <p className="text-xs text-gray-400 mt-1">{fmtDate(invoice.invoice_date)}</p>
            </div>
          </div>

          {/* Bill To + Vehicle Details */}
          <div className="grid grid-cols-2 border border-gray-300 mx-6 mt-5 rounded text-sm">
            <div className="px-5 py-4 border-r border-gray-300">
              <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Bill To
              </p>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs w-20">Name</td><td className="font-semibold text-gray-900">{jobCard.customer?.name}</td></tr>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs">Mobile</td><td className="text-gray-700">{jobCard.customer?.phone}</td></tr>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs">Email</td><td className="text-gray-700 text-xs">{jobCard.customer?.email || '—'}</td></tr>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs">Address</td><td className="text-gray-700">{jobCard.customer?.address || '—'}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10" />
                </svg>
                Vehicle Details
              </p>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs w-20">Plate</td><td className="font-bold font-mono text-primary">{jobCard.vehicle?.license_plate}</td></tr>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs">Model</td><td className="text-gray-700">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</td></tr>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs">Year</td><td className="text-gray-700">{jobCard.vehicle?.year}</td></tr>
                  <tr><td className="text-gray-500 pr-3 py-0.5 text-xs">Job Card</td><td className="font-semibold text-gray-900">{jobCard.job_card_number}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Details */}
          <div className="px-6 mt-6">
            <h2 className="text-center text-sm font-black uppercase tracking-widest text-gray-800 mb-3">Service Details</h2>
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left py-2.5 px-4 text-xs font-bold uppercase tracking-wide">Description</th>
                  <th className="text-center py-2.5 px-3 text-xs font-bold uppercase tracking-wide w-12">Qty</th>
                  <th className="text-right py-2.5 px-4 text-xs font-bold uppercase tracking-wide w-36">Unit Price</th>
                  <th className="text-right py-2.5 px-4 text-xs font-bold uppercase tracking-wide w-36">Total</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => (
                  <tr key={`task-${task.id}`} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-2.5 px-4 text-gray-800">
                      {task.task_name} - SERVICES{task.category ? ` (${formatCategory(task.category)})` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600">1</td>
                    <td className="py-2.5 px-4 text-right text-gray-700">{fmt(task.amount)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmt(task.amount)}</td>
                  </tr>
                ))}
                {parts.map((part, i) => (
                  <tr key={`part-${part.id}`} className={`border-b border-gray-200 ${(tasks.length + i) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-2.5 px-4 text-gray-800">{part.part_name} - SPARE PARTS</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">1</td>
                    <td className="py-2.5 px-4 text-right text-gray-700">{fmt(part.selling_price)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmt(part.selling_price)}</td>
                  </tr>
                ))}
                {charges.map((charge, i) => (
                  <tr key={`charge-${charge.id}`} className={`border-b border-gray-200 ${(tasks.length + parts.length + i) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-2.5 px-4 text-gray-800">{charge.description} - OTHER CHARGE</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">1</td>
                    <td className="py-2.5 px-4 text-right text-gray-700">{fmt(charge.amount)}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmt(charge.amount)}</td>
                  </tr>
                ))}
                {tasks.length === 0 && parts.length === 0 && charges.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400 text-sm">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="px-6 mt-5 flex justify-end">
            <table className="text-sm border border-gray-300 w-80">
              <tbody>
                {invoice.labor_charges > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-gray-600">Services Amount:</td>
                    <td className="py-2 px-4 text-right font-semibold text-gray-800">{fmt(invoice.labor_charges)}</td>
                  </tr>
                )}
                {invoice.parts_charges > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-gray-600">Parts Amount:</td>
                    <td className="py-2 px-4 text-right font-semibold text-gray-800">{fmt(invoice.parts_charges)}</td>
                  </tr>
                )}
                {invoice.other_charges > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-gray-600">Other Charges:</td>
                    <td className="py-2 px-4 text-right font-semibold text-gray-800">{fmt(invoice.other_charges)}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-300 bg-gray-50">
                  <td className="py-2 px-4 font-bold text-gray-800">Subtotal:</td>
                  <td className="py-2 px-4 text-right font-bold text-gray-900">{fmt(invoice.subtotal)}</td>
                </tr>
                {invoice.discount_amount > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-gray-600">Discount:</td>
                    <td className="py-2 px-4 text-right font-semibold text-green-700">-{fmt(invoice.discount_amount)}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-300 bg-gray-900">
                  <td className="py-2.5 px-4 font-black text-white uppercase text-xs tracking-wide">Amount Due:</td>
                  <td className="py-2.5 px-4 text-right font-black text-white">{fmt(invoice.total_amount)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-4 text-gray-600">Paid Amount:</td>
                  <td className="py-2 px-4 text-right font-semibold text-gray-800">{fmt(paidAmount)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-bold text-gray-800">Balance Due:</td>
                  <td className="py-2 px-4 text-right font-bold text-gray-900">{fmt(invoice.balance_due)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status Badge */}
          <div className="flex justify-center mt-6 mb-2">
            <div className={`inline-flex items-center gap-2 px-8 py-2.5 border-2 rounded font-black text-sm uppercase tracking-widest ${badge.cls}`}>
              {invoice.status === 'paid'
                ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              }
              {badge.label}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-800 text-center py-5 mt-5">
            <p className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Thank you for choosing our services!
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">Your trust drives our commitment to excellence</p>
          </div>

        </div>
      </div>
    </>
  )
}

export default InvoicePrint