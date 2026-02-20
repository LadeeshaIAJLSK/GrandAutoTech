import { useState } from 'react'
import axiosClient from '../../api/axios'

function PaymentManagement({ jobCard, onUpdate, user }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoice, setInvoice] = useState(null)

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'partial',
    payment_method: 'cash',
    reference_number: '',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const canAddPayments = user.permissions.includes('add_payments')
  const canDeletePayments = user.permissions.includes('delete_payments')
  const canViewInvoices = user.permissions.includes('view_invoices')

  const handleGenerateInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/job-cards/${jobCard.id}/invoice/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Invoice generated successfully!')
      setInvoice(response.data.invoice)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating invoice')
    }
  }

  const handleViewInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${jobCard.id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInvoice(response.data)
      setShowInvoiceModal(true)
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/payments', {
        ...paymentForm,
        job_card_id: jobCard.id,
        invoice_id: invoice?.id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Payment recorded successfully!')
      setShowPaymentModal(false)
      setPaymentForm({
        amount: '',
        payment_type: 'partial',
        payment_method: 'cash',
        reference_number: '',
        payment_date: new Date().toISOString().slice(0, 10),
        notes: '',
      })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording payment')
    }
  }

  const handleVoidPayment = async (paymentId) => {
    if (!confirm('⚠️ Are you sure you want to void this payment?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Payment voided successfully!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error voiding payment')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const payments = jobCard.payments || []
  const hasInvoice = jobCard.status === 'invoiced' || jobCard.status === 'paid'

  return (
    <div className="space-y-6">
      {/* Pricing Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Pricing Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-700">Labor Charges</span>
            <span className="font-semibold text-gray-900">{formatCurrency(jobCard.labor_cost || 0)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-700">Parts Charges</span>
            <span className="font-semibold text-gray-900">{formatCurrency(jobCard.parts_cost || 0)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-700">Other Charges</span>
            <span className="font-semibold text-gray-900">{formatCurrency(jobCard.other_charges || 0)}</span>
          </div>
          {jobCard.discount > 0 && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-red-600">Discount</span>
              <span className="font-semibold text-red-600">- {formatCurrency(jobCard.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pb-3 border-b-2 border-gray-300">
            <span className="text-lg font-bold text-gray-800">Total Amount</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(jobCard.total_amount || 0)}</span>
          </div>
          {jobCard.advance_payment > 0 && (
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-green-600">Payments Received</span>
              <span className="font-semibold text-green-600">- {formatCurrency(jobCard.advance_payment)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-gray-800">Balance Due</span>
            <span className={`text-2xl font-bold ${jobCard.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(jobCard.balance_amount || 0)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t flex gap-3">
          {!hasInvoice && canViewInvoices && (
            <button
              onClick={handleGenerateInvoice}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              📄 Generate Invoice
            </button>
          )}
          {hasInvoice && canViewInvoices && (
            <button
              onClick={handleViewInvoice}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              👁️ View Invoice
            </button>
          )}
          {canAddPayments && jobCard.balance_amount > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              💳 Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💳 Payment History</h3>
        
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payments recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Received By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-primary">{payment.payment_number}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-gray-700 capitalize">
                      {payment.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                        {payment.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{payment.received_by?.name}</td>
                    <td className="px-4 py-3">
                      {canDeletePayments && (
                        <button
                          onClick={() => handleVoidPayment(payment.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          🗑️ Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">💳 Record Payment</h3>
              <p className="text-gray-600 mt-1">
                Balance Due: <span className="font-bold text-red-600">{formatCurrency(jobCard.balance_amount)}</span>
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Amount (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={jobCard.balance_amount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    required
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Payment Type *</label>
                  <select
                    value={paymentForm.payment_type}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="advance">Advance Payment</option>
                    <option value="partial">Partial Payment</option>
                    <option value="full">Full Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Payment Method *</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="cheque">📝 Cheque</option>
                    <option value="mobile_payment">📱 Mobile Payment</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reference Number {['bank_transfer', 'cheque', 'mobile_payment'].includes(paymentForm.payment_method) && '*'}
                </label>
                <input
                  type="text"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({...paymentForm, reference_number: e.target.value})}
                  placeholder="Transaction ID, Cheque #, etc."
                  required={['bank_transfer', 'cheque', 'mobile_payment'].includes(paymentForm.payment_method)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows="2"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              {paymentForm.amount && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Remaining Balance After Payment:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(jobCard.balance_amount - parseFloat(paymentForm.amount || 0))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  💰 Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Invoice {invoice.invoice_number}</h3>
                <p className="text-gray-600">Generated on {new Date(invoice.invoice_date).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✖️
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">Bill To:</h4>
                  <div className="text-gray-700">
                    <div className="font-semibold">{jobCard.customer?.name}</div>
                    <div>{jobCard.customer?.phone}</div>
                    <div>{jobCard.customer?.email}</div>
                    <div className="mt-2">{jobCard.customer?.address}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">Vehicle:</h4>
                  <div className="text-gray-700">
                    <div className="font-bold text-lg text-primary">{jobCard.vehicle?.license_plate}</div>
                    <div>{jobCard.vehicle?.make} {jobCard.vehicle?.model}</div>
                    <div>Year: {jobCard.vehicle?.year}</div>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border-t pt-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3 text-gray-700">Labor Charges</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(invoice.labor_charges)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-700">Parts Charges</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(invoice.parts_charges)}</td>
                    </tr>
                    {invoice.other_charges > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-gray-700">Other Charges</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(invoice.other_charges)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2">
                      <td className="px-4 py-3 font-bold text-gray-800">Subtotal</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    {invoice.discount_amount > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-red-600">Discount</td>
                        <td className="px-4 py-3 text-right text-red-600 font-semibold">
                          - {formatCurrency(invoice.discount_amount)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 bg-blue-50">
                      <td className="px-4 py-4 font-bold text-gray-800 text-lg">Total Amount</td>
                      <td className="px-4 py-4 text-right font-bold text-primary text-2xl">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                    {invoice.advance_paid > 0 && (
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-green-700 font-semibold">Paid</td>
                        <td className="px-4 py-3 text-right text-green-700 font-semibold">
                          - {formatCurrency(invoice.advance_paid)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-yellow-50 border-t-2">
                      <td className="px-4 py-4 font-bold text-gray-800 text-lg">Balance Due</td>
                      <td className="px-4 py-4 text-right font-bold text-red-600 text-2xl">
                        {formatCurrency(invoice.balance_due)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {invoice.notes && (
                <div className="border-t pt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Notes:</div>
                  <div className="text-gray-600">{invoice.notes}</div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                🖨️ Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentManagement