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
      
      const jobCardResponse = await axiosClient.get(`/job-cards/${jobCardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobCard(jobCardResponse.data)

      const invoiceResponse = await axiosClient.get(`/job-cards/${jobCardId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      })
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
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-6 flex gap-3 justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-white border-2 border-gray-800 text-gray-800 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          🖨️ Print Invoice
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
        >
          ← Back to Invoice
        </button>
      </div>

      {/* Invoice Paper */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold">GAT</span>
              <h1 className="text-2xl font-bold">Grand Auto Tech</h1>
            </div>
            <p className="text-sm text-gray-300">No. 1/B/2, Horana Road, Kahathudwa, Polgasowita.</p>
            <p className="text-sm text-gray-300">Tel: 011 2705013, Whatsapp 0712124500</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">INVOICE</p>
            <p className="text-2xl font-bold">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(invoice.invoice_date).toLocaleDateString('en-LK')}</p>
          </div>
        </div>

        {/* Bill To & Vehicle Details */}
        <div className="grid grid-cols-2 gap-8 p-8 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              👤 Bill To
            </h3>
            <div className="text-sm space-y-1 text-gray-700">
              <div><span className="font-semibold">Name:</span> {jobCard.customer?.name}</div>
              <div><span className="font-semibold">Mobile:</span> {jobCard.customer?.phone}</div>
              <div><span className="font-semibold">Email:</span> {jobCard.customer?.email || '—'}</div>
              <div><span className="font-semibold">Address:</span> {jobCard.customer?.address || '—'}</div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              🚗 Vehicle Details
            </h3>
            <div className="text-sm space-y-1 text-gray-700">
              <div><span className="font-semibold">Plate:</span> {jobCard.vehicle?.license_plate}</div>
              <div><span className="font-semibold">Model:</span> {jobCard.vehicle?.make} {jobCard.vehicle?.model}</div>
              <div><span className="font-semibold">Year:</span> {jobCard.vehicle?.year}</div>
              <div><span className="font-semibold">Job Card:</span> {jobCard.job_card_number}</div>
            </div>
          </div>
        </div>

        {/* Service Details Table */}
        <div className="p-8">
          <h3 className="font-bold text-gray-800 mb-4 uppercase tracking-wider">SERVICE DETAILS</h3>
          
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-t-2 border-b-2 border-gray-800 bg-gray-50">
                <th className="text-left py-2 px-2 font-bold text-gray-800">DESCRIPTION</th>
                <th className="text-left py-2 px-2 font-bold text-gray-800">TYPE</th>
                <th className="text-center py-2 px-2 font-bold text-gray-800">QTY</th>
                <th className="text-right py-2 px-2 font-bold text-gray-800">UNIT PRICE</th>
                <th className="text-right py-2 px-2 font-bold text-gray-800">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {/* Service items */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-700">Service Work</td>
                <td className="py-2 px-2 text-blue-600 font-semibold">SERVICES (Dent work)</td>
                <td className="py-2 px-2 text-center text-gray-700">1</td>
                <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(invoice.labor_charges)}</td>
                <td className="py-2 px-2 text-right font-semibold text-gray-800">{formatCurrency(invoice.labor_charges)}</td>
              </tr>

              {/* Parts */}
              {invoice.parts_charges > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-2 text-gray-700">Spare Parts</td>
                  <td className="py-2 px-2 text-green-600 font-semibold">SPARE PARTS</td>
                  <td className="py-2 px-2 text-center text-gray-700">1</td>
                  <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(invoice.parts_charges)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-gray-800">{formatCurrency(invoice.parts_charges)}</td>
                </tr>
              )}

              {/* Other charges */}
              {invoice.other_charges > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-2 text-gray-700">Other Charges</td>
                  <td className="py-2 px-2 text-orange-600 font-semibold">OTHER CHARGES</td>
                  <td className="py-2 px-2 text-center text-gray-700">1</td>
                  <td className="py-2 px-2 text-right text-gray-700">{formatCurrency(invoice.other_charges)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-gray-800">{formatCurrency(invoice.other_charges)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment History & Summary */}
        <div className="grid grid-cols-2 gap-8 p-8 border-t border-gray-200">
          {/* Payment History */}
          <div>
            <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2">
              ⏱️ Payment History
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Method</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {invoice.advance_paid > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-700">{formatDate(invoice.invoice_date)}</td>
                    <td className="py-2 text-gray-700">ADVANCE</td>
                    <td className="py-2 text-gray-700">CASH</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatCurrency(invoice.advance_paid)}</td>
                    <td className="py-2 text-gray-600">Advance Payment</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-4 pt-2 border-t border-gray-300 text-sm">
              <div className="flex justify-between font-bold text-gray-800 mb-1">
                <span>Total Payments Made:</span>
                <span>{formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="text-xs text-gray-600">{invoice.advance_paid > 0 ? '1 transaction(s)' : 'No transactions'}</div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-gray-900 text-white p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-4">📊 INVOICE SUMMARY</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>✕ Services Amount:</span>
                <span className="font-semibold">{formatCurrency(invoice.labor_charges)}</span>
              </div>
              {invoice.other_charges > 0 && (
                <div className="flex justify-between text-orange-400">
                  <span>🔸 Other Charges:</span>
                  <span className="font-semibold">{formatCurrency(invoice.other_charges)}</span>
                </div>
              )}
              {invoice.parts_charges > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>⚙️ Parts Amount:</span>
                  <span className="font-semibold">{formatCurrency(invoice.parts_charges)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span>📋 Subtotal:</span>
                <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>🏷️ Discount:</span>
                  <span className="font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-red-600 pt-2 bg-red-600 px-2 py-1 rounded">
                <span>💰 AMOUNT DUE:</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-400 pt-1">
                <span>✓ Paid Amount:</span>
                <span className="font-semibold">{formatCurrency(invoice.advance_paid)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span>🔵 Balance Due:</span>
                <span className="font-semibold">{formatCurrency(invoice.balance_due)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-8 py-6 text-center border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Thank you for your business!</p>
          <p className="text-xs text-gray-500">This is a computer-generated invoice. No signature required.</p>
        </div>
      </div>
    </div>
  )
}

export default InvoicePrint
