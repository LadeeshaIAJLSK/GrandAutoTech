import { useState } from 'react'
import axiosClient from '../../api/axios'

function PaymentManagement({ jobCard, onUpdate, user, advancePaymentsRef }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAdvancePaymentModal, setShowAdvancePaymentModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showEditLaborModal, setShowEditLaborModal] = useState(false)
  const [showEditSparePartModal, setShowEditSparePartModal] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [editLaborForm, setEditLaborForm] = useState({
    labor_cost: jobCard?.labor_cost || 0,
    cost_price: 0,
    amount: 0,
    task_id: null,
  })
  const [editSparePartForm, setEditSparePartForm] = useState({
    cost_price: 0,
    selling_price: 0,
    part_id: null,
    part_status: null,
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'partial',
    payment_method: 'cash',
    reference_number: '',
    bank_name: '',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const [advancePaymentForm, setAdvancePaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    bank_name: '',
    payment_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const canAddPayments = user?.role?.name === 'super_admin' || user?.permissions?.includes('add_payments')
  const canDeletePayments = user?.role?.name === 'super_admin' || user?.permissions?.includes('delete_payments')
  const canViewInvoices = user?.role?.name === 'super_admin' || user?.permissions?.includes('view_invoices')
  const canEditLaborCost = user?.role?.name === 'super_admin' || user?.permissions?.includes('edit_labor_cost') || user?.permissions?.includes('edit_pricing')
  const canEditApprovedParts = user?.role?.name === 'super_admin' || user?.permissions?.includes('edit_approved_parts') || user?.permissions?.includes('edit_spare_parts')

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

  const handleRecordAdvancePayment = async (e) => {
    if (e) e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/payments', {
        ...advancePaymentForm,
        payment_type: 'advance',
        job_card_id: jobCard.id,
        invoice_id: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Advance payment recorded successfully!')
      setShowAdvancePaymentModal(false)
      setAdvancePaymentForm({
        amount: '',
        payment_method: 'cash',
        reference_number: '',
        bank_name: '',
        payment_date: new Date().toISOString().slice(0, 10),
        notes: '',
      })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording advance payment')
    }
  }

  const handleRecordPayment = async (e) => {
    if (e) e.preventDefault()
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
        bank_name: '',
        payment_date: new Date().toISOString().slice(0, 10),
        notes: '',
      })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording payment')
    }
  }

  const handleEditLaborCost = async (e) => {
    if (e) e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      if (editLaborForm.task_id) {
        // Update individual task cost and amount
        const updateData = {}
        if (editLaborForm.cost_price) updateData.cost_price = parseFloat(editLaborForm.cost_price)
        if (editLaborForm.amount) updateData.amount = parseFloat(editLaborForm.amount)
        
        await axiosClient.put(`/tasks/${editLaborForm.task_id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        // Update overall labor cost
        await axiosClient.put(`/job-cards/${jobCard.id}`, {
          labor_cost: parseFloat(editLaborForm.labor_cost),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      
      alert('✅ Cost updated successfully!')
      setShowEditLaborModal(false)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating cost')
    }
  }

  const handleEditSparePart = async (e) => {
    if (e) e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      // Add force flag for super admin to allow editing approved/rejected parts
      const updateData = {
        cost_price: parseFloat(editSparePartForm.cost_price),
        selling_price: parseFloat(editSparePartForm.selling_price),
      }
      
      if (user?.role?.name === 'super_admin') {
        updateData.force_update = true
      }
      
      await axiosClient.put(`/spare-parts/${editSparePartForm.part_id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Spare part prices updated successfully!')
      setShowEditSparePartModal(false)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating spare part prices')
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
      {/* Advance Payments Section */}
      <div ref={advancePaymentsRef} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-emerald-800">💳 Advance Payments</h3>
          {canAddPayments && (
            <button
              onClick={() => setShowAdvancePaymentModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              ➕ Add Advance Payment
            </button>
          )}
        </div>

        {/* Advance Payments List */}
        {payments.filter(p => p.payment_type === 'advance').length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No advance payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments
              .filter(p => p.payment_type === 'advance')
              .map((payment, index) => (
                <div key={index} className="bg-white rounded-lg p-4 flex justify-between items-center shadow-sm">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      {payment.payment_method === 'cash' && '💵'}
                      {payment.payment_method === 'card' && '💳'}
                      {payment.payment_method === 'bank_transfer' && '🏦'}
                      {payment.payment_method === 'cheque' && '📝'}
                      {payment.payment_method === 'mobile_payment' && '📱'}
                      {payment.payment_method === 'other' && '📋'}
                      {' '}{payment.payment_method}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(payment.payment_date).toLocaleDateString()} 
                      {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                      {payment.bank_name && ` • ${payment.bank_name}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(payment.amount)}</div>
                    <div className="text-xs text-gray-500">by {payment.received_by?.name || 'System'}</div>
                  </div>
                </div>
              ))}
            
            {payments.filter(p => p.payment_type === 'advance').length > 0 && (
              <div className="bg-emerald-100 rounded-lg p-4 mt-4 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-semibold">Total Advance Payments Received:</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(
                      payments
                        .filter(p => p.payment_type === 'advance')
                        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Services Pricing Management */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">💼 Services Pricing Management</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Service Details</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Cost Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobCard.tasks && jobCard.tasks.length > 0 ? (
                jobCard.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      <div className="font-semibold">{task.description || task.name}</div>
                      <div className="text-xs text-gray-500">{task.id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{task.assigned_to?.name || 'Unassigned'}</div>
                      <div className="text-xs text-gray-500">{task.assigned_to?.employee_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(task.cost_price || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(task.amount || task.cost_price || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canEditLaborCost && (
                        <button
                          onClick={() => {
                            setEditLaborForm({ 
                              labor_cost: 0,
                              cost_price: task.cost_price || 0,
                              amount: task.amount || task.cost_price || 0,
                              task_id: task.id 
                            })
                            setShowEditLaborModal(true)
                          }}
                          className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition"
                        >
                          ✏️ Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No services added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Services Cost */}
        {jobCard.tasks && jobCard.tasks.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total Services Cost:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(
                jobCard.tasks.reduce((sum, task) => sum + (parseFloat(task.amount || task.cost_price || 0)), 0)
              )}
            </span>
          </div>
        )}
      </div>

      {/* Spare Parts Pricing Management */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Spare Parts Pricing Management</h3>
        
        {/* Summary Boxes */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-orange-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {jobCard.spare_parts_requests?.filter(p => p.status === 'pending').length || 0}
            </div>
            <div className="text-sm text-orange-800 font-semibold">PENDING PRICING</div>
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {jobCard.spare_parts_requests?.filter(p => p.status === 'priced').length || 0}
            </div>
            <div className="text-sm text-green-800 font-semibold">PRICED PARTS</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-700">
              {jobCard.spare_parts_requests?.filter(p => p.status === 'approved').length || 0}
            </div>
            <div className="text-sm text-gray-800 font-semibold">APPROVED PARTS</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Part Details</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Task & Employee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Cost Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Selling Price</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 ? (
                jobCard.spare_parts_requests.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      <div className="font-semibold">{part.part_name || part.description}</div>
                      <div className="text-xs text-gray-500">Qty: {part.quantity}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="text-sm">{part.task?.description || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{part.task?.assigned_to?.name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        part.status === 'approved' ? 'bg-gray-100 text-gray-800' :
                        part.status === 'priced' ? 'bg-green-100 text-green-800' :
                        part.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {part.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(part.cost_price || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(part.selling_price || part.cost_price || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(canEditLaborCost || (canEditApprovedParts && ['approved', 'rejected'].includes(part.status))) && (
                        <button
                          onClick={() => {
                            setEditSparePartForm({ 
                              cost_price: part.cost_price || 0,
                              selling_price: part.selling_price || part.cost_price || 0,
                              part_id: part.id,
                              part_status: part.status
                            })
                            setShowEditSparePartModal(true)
                          }}
                          title={['approved', 'rejected'].includes(part.status) ? 'Edit approved/rejected part' : 'Edit spare part price'}
                          className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition"
                        >
                          ✏️ Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No spare parts added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Spare Parts Cost */}
        {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total Spare Parts Cost:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(
                jobCard.spare_parts_requests.reduce((sum, part) => sum + (parseFloat(part.selling_price || part.cost_price || 0)), 0)
              )}
            </span>
          </div>
        )}
      </div>

      {/* Additional Charges & Services */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">➕ Additional Charges & Services</h3>
        <p className="text-sm text-gray-600 mb-4">(Add any additional charges before finalizing)</p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <input
              type="text"
              placeholder="e.g., Labor, Inspection, Materials"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <button className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
          ➕ Add Charge
        </button>

        {/* Other Charges History */}
        {jobCard.other_charges > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🔄 Other Charges History
              <button className="ml-auto text-xs px-3 py-1 text-teal-600 hover:text-teal-700">Refresh</button>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600 font-semibold">Description</th>
                    <th className="px-4 py-2 text-right text-gray-600 font-semibold">Cost Price</th>
                    <th className="px-4 py-2 text-right text-gray-600 font-semibold">Selling Price</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-semibold">Added Date</th>
                    <th className="px-4 py-2 text-center text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-green-600">✓ Test Charge</div>
                      <div className="text-xs text-gray-500">Additional service charge</div>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(100)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(200)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Feb 13, 26, 10:51 AM</td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-red-600 hover:text-red-700 text-lg">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right text-gray-600">
              <span className="text-sm">Total (0 charges)</span>
              <div className="text-orange-600 font-semibold text-lg">{formatCurrency(0)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Pricing Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-700">Tasks & Services Pricing</span>
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
          {canAddPayments && (
            <button
              onClick={() => setShowAdvancePaymentModal(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              💰 Add Advance Payment
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-2xl font-bold text-gray-800">💳 Record Payment</h3>
              <p className="text-gray-600 mt-1">
                Balance Due: <span className="font-bold text-red-600">{formatCurrency(jobCard.balance_amount)}</span>
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="flex-1 overflow-y-auto p-6 space-y-4">
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

              {(['card', 'bank_transfer'].includes(paymentForm.payment_method)) && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Bank Name {paymentForm.payment_method === 'card' ? '(Card Issuing Bank)' : '(Transfer Bank)'} *
                  </label>
                  <input
                    type="text"
                    value={paymentForm.bank_name}
                    onChange={(e) => setPaymentForm({...paymentForm, bank_name: e.target.value})}
                    placeholder={paymentForm.payment_method === 'card' ? 'e.g., Sampath Bank, Commercial Bank' : 'e.g., Sampath Bank, Commercial Bank'}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              )}

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

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
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

      {/* Advance Payment Modal */}
      {showAdvancePaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b bg-emerald-50 flex-shrink-0">
              <h3 className="text-2xl font-bold text-emergent-800">💳 Add Advance Payment</h3>
              <p className="text-gray-600 mt-2">Job Card: <span className="font-bold text-gray-800">{jobCard.job_card_number}</span></p>
              {jobCard.customer && (
                <p className="text-gray-600">Customer: <span className="font-bold text-gray-800">{jobCard.customer.name}</span></p>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRecordAdvancePayment(); }} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Advance Amount (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={advancePaymentForm.amount}
                    onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, amount: e.target.value})}
                    required
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={advancePaymentForm.payment_date}
                    onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, payment_date: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Payment Method *</label>
                <select
                  value={advancePaymentForm.payment_method}
                  onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, payment_method: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option value="">Select payment method</option>
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="cheque">📝 Cheque</option>
                  <option value="mobile_payment">📱 Mobile Payment</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reference Number {['bank_transfer', 'cheque', 'mobile_payment'].includes(advancePaymentForm.payment_method) && '*'}
                </label>
                <input
                  type="text"
                  value={advancePaymentForm.reference_number}
                  onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, reference_number: e.target.value})}
                  placeholder="Transaction ID, Cheque #, etc."
                  required={['bank_transfer', 'cheque', 'mobile_payment'].includes(advancePaymentForm.payment_method)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              {(['card', 'bank_transfer'].includes(advancePaymentForm.payment_method)) && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Bank Name {advancePaymentForm.payment_method === 'card' ? '(Card Issuing Bank)' : '(Transfer Bank)'} *
                  </label>
                  <input
                    type="text"
                    value={advancePaymentForm.bank_name}
                    onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, bank_name: e.target.value})}
                    placeholder={advancePaymentForm.payment_method === 'card' ? 'e.g., Sampath Bank, Commercial Bank' : 'e.g., Sampath Bank, Commercial Bank'}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Notes</label>
                <textarea
                  value={advancePaymentForm.notes}
                  onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows="2"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              {advancePaymentForm.amount && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                  <div className="text-gray-700">
                    <span>Advance Amount to Record:</span>
                    <span className="text-2xl font-bold text-emerald-600 ml-2">
                      {formatCurrency(parseFloat(advancePaymentForm.amount || 0))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancePaymentModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  ✅ Record Advance Payment
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
                      <td className="px-4 py-3 text-gray-700">Tasks & Services Pricing</td>
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

      {/* Edit Labor Cost Modal */}
      {showEditLaborModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="bg-amber-50 border-b px-6 py-4 rounded-t-lg flex-shrink-0">
              {editLaborForm.task_id ? (
                <>
                  <h2 className="text-xl font-bold text-gray-800">Edit Service Cost</h2>
                  <p className="text-sm text-gray-600 mt-1">Job Card: {jobCard.job_card_number || 'N/A'}</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800">Edit Tasks & Services Pricing</h2>
                  <p className="text-sm text-gray-600 mt-1">Job Card: {jobCard.job_card_number || 'N/A'}</p>
                </>
              )}
            </div>

            <form onSubmit={handleEditLaborCost} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {editLaborForm.task_id ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cost Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editLaborForm.cost_price}
                        onChange={(e) => setEditLaborForm({ ...editLaborForm, cost_price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter cost price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editLaborForm.amount}
                        onChange={(e) => setEditLaborForm({ ...editLaborForm, amount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter amount"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Labor Cost <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editLaborForm.labor_cost}
                      onChange={(e) => setEditLaborForm({ ...editLaborForm, labor_cost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter labor cost"
                    />
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-4 rounded-b-lg bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditLaborModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition"
                >
                  💾 Update Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Spare Part Modal */}
      {showEditSparePartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className={`border-b px-6 py-4 rounded-t-lg flex-shrink-0 ${['approved', 'rejected'].includes(editSparePartForm.part_status) ? 'bg-red-50' : 'bg-orange-50'}`}>
              <h2 className="text-xl font-bold text-gray-800">Edit Spare Part Price</h2>
              <p className="text-sm text-gray-600 mt-1">Job Card: {jobCard.job_card_number || 'N/A'}</p>
              {['approved', 'rejected'].includes(editSparePartForm.part_status) && (
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ Note:</span> You are editing an {editSparePartForm.part_status} part. This action requires admin approval.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleEditSparePart} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cost Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editSparePartForm.cost_price}
                    onChange={(e) => setEditSparePartForm({ ...editSparePartForm, cost_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter cost price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editSparePartForm.selling_price}
                    onChange={(e) => setEditSparePartForm({ ...editSparePartForm, selling_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter selling price"
                  />
                </div>
              </div>

              <div className="border-t px-6 py-4 rounded-b-lg bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditSparePartModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                >
                  💾 Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentManagement