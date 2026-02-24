import { useState, useEffect } from 'react'
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

  const [chargeForm, setChargeForm] = useState({
    description: '',
    cost_price: '',
    amount: '',
  })

  const canAddPayments = user?.role?.name === 'super_admin' || user?.permissions?.includes('add_payments')
  const canDeletePayments = user?.role?.name === 'super_admin' || user?.permissions?.includes('delete_payments')
  const canViewInvoices = user?.role?.name === 'super_admin' || user?.permissions?.includes('view_invoices')
  const canEditLaborCost = user?.role?.name === 'super_admin' || user?.permissions?.includes('edit_labor_cost') || user?.permissions?.includes('edit_pricing')
  const canEditApprovedParts = user?.role?.name === 'super_admin' || user?.permissions?.includes('edit_approved_parts') || user?.permissions?.includes('edit_spare_parts')

  // Debug logging for jobCard changes
  useEffect(() => {
    console.log('[DEBUG] JobCard Updated:')
    console.log('  - ID:', jobCard?.id)
    console.log('  - other_charges (total):', jobCard?.other_charges)
    console.log('  - otherCharges (array):', jobCard?.otherCharges)
    console.log('  - otherCharges length:', jobCard?.otherCharges?.length || 0)
    console.log('  - Full jobCard:', jobCard)
  }, [jobCard])

  const handleGenerateInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/job-cards/${jobCard.id}/invoice/generate`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Invoice generated successfully!')
      setInvoice(response.data.invoice)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating invoice')
    }
  }

  const handleViewInvoice = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${jobCard.id}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
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
      }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Advance payment recorded successfully!')
      setShowAdvancePaymentModal(false)
      setAdvancePaymentForm({ amount: '', payment_method: 'cash', reference_number: '', bank_name: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' })
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
      }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Payment recorded successfully!')
      setShowPaymentModal(false)
      setPaymentForm({ amount: '', payment_type: 'partial', payment_method: 'cash', reference_number: '', bank_name: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' })
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
        const updateData = {}
        if (editLaborForm.cost_price) updateData.cost_price = parseFloat(editLaborForm.cost_price)
        if (editLaborForm.amount) updateData.amount = parseFloat(editLaborForm.amount)
        await axiosClient.put(`/tasks/${editLaborForm.task_id}`, updateData, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        await axiosClient.put(`/job-cards/${jobCard.id}`, { labor_cost: parseFloat(editLaborForm.labor_cost) }, { headers: { Authorization: `Bearer ${token}` } })
      }
      alert('Cost updated successfully!')
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
      const updateData = {
        cost_price: parseFloat(editSparePartForm.cost_price),
        selling_price: parseFloat(editSparePartForm.selling_price),
      }
      if (user?.role?.name === 'super_admin') updateData.force_update = true
      await axiosClient.put(`/spare-parts/${editSparePartForm.part_id}`, updateData, { headers: { Authorization: `Bearer ${token}` } })
      alert('Spare part prices updated successfully!')
      setShowEditSparePartModal(false)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating spare part prices')
    }
  }

  const handleVoidPayment = async (paymentId) => {
    if (!confirm('Are you sure you want to void this payment?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/payments/${paymentId}`, { headers: { Authorization: `Bearer ${token}` } })
      alert('Payment voided successfully!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error voiding payment')
    }
  }

  const handleAddCharge = async () => {
    if (!chargeForm.description.trim()) {
      alert('Please enter charge description')
      return
    }
    if (!chargeForm.cost_price || !chargeForm.amount) {
      alert('Please enter both cost price and amount')
      return
    }
    try {
      const description = chargeForm.description.trim()
      const cost_price = parseFloat(chargeForm.cost_price)
      const amount = parseFloat(chargeForm.amount)
      
      console.log('[CHARGE] 1. Form validation passed')
      console.log('[CHARGE] 2. Payload:', { description, cost_price, amount })
      
      const response = await axiosClient.post(`/job-cards/${jobCard.id}/charges`, {
        description,
        cost_price,
        amount,
      })
      
      console.log('[CHARGE] 3. POST response status:', response.status)
      console.log('[CHARGE] 4. POST response data:', response.data)
      
      if (response.status !== 201) {
        console.warn('[CHARGE] WARNING: Unexpected status code', response.status)
      }
      
      alert('✅ Charge added successfully! Status: ' + response.status)
      setChargeForm({ description: '', cost_price: '', amount: '' })
      
      console.log('[CHARGE] 5. Calling onUpdate()...')
      await onUpdate()
      console.log('[CHARGE] 6. onUpdate() completed')
      
    } catch (error) {
      console.error('[CHARGE] FULL ERROR OBJECT:', error)
      console.error('[CHARGE] Response status:', error.response?.status)
      console.error('[CHARGE] Response data:', error.response?.data)
      console.error('[CHARGE] Error message:', error.message)
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message
      alert('❌ Error: ' + errorMsg)
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)

  const payments = jobCard.payments || []
  const hasInvoice = jobCard.status === 'invoiced' || jobCard.status === 'paid'

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  const ModalHeader = ({ title, subtitle, onClose, colorClass = 'bg-white' }) => (
    <div className={`flex justify-between items-start px-7 py-5 border-b border-gray-100 ${colorClass}`}>
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  const ModalFooter = ({ onCancel, submitLabel, submitClass = 'bg-primary hover:bg-primary-dark', disabled = false, isSubmit = true, onSubmit }) => (
    <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex-shrink-0">
      <button type="button" onClick={onCancel} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
      <button type={isSubmit ? 'submit' : 'button'} onClick={onSubmit} disabled={disabled}
        className={`px-5 py-2 text-sm text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${submitClass}`}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
        {submitLabel}
      </button>
    </div>
  )

  const PaymentMethodFields = (form, setForm) => (
    <>
      <div>
        <label className={labelCls}>Reference Number {['bank_transfer', 'cheque', 'mobile_payment'].includes(form.payment_method) && <span className="text-red-400">*</span>}</label>
        <input type="text" value={form.reference_number} onChange={(e) => setForm({...form, reference_number: e.target.value})}
          placeholder="Transaction ID, Cheque #, etc."
          required={['bank_transfer', 'cheque', 'mobile_payment'].includes(form.payment_method)}
          className={inputCls} />
      </div>
      {['card', 'bank_transfer'].includes(form.payment_method) && (
        <div>
          <label className={labelCls}>Bank Name {form.payment_method === 'card' ? '(Card Issuing Bank)' : '(Transfer Bank)'} <span className="text-red-400">*</span></label>
          <input type="text" value={form.bank_name} onChange={(e) => setForm({...form, bank_name: e.target.value})}
            placeholder="e.g., Sampath Bank, Commercial Bank" required className={inputCls} />
        </div>
      )}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
          placeholder="Any additional notes..." rows="2"
          className={`${inputCls} resize-none`} />
      </div>
    </>
  )

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'mobile_payment', label: 'Mobile Payment' },
    { value: 'other', label: 'Other' },
  ]

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      card: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      bank_transfer: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
      cheque: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      mobile_payment: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    }
    return icons[method] || <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
  }

  const SectionHeader = ({ icon, title }) => (
    <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
      <span className="text-primary">{icon}</span>
      {title}
    </h3>
  )

  return (
    <div className="space-y-5">

      {/* Advance Payments Section */}
      <div ref={advancePaymentsRef} className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
          <h3 className="text-base font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Advance Payments
          </h3>
          {canAddPayments && (
            <button onClick={() => setShowAdvancePaymentModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </span>
              Add Advance Payment
            </button>
          )}
        </div>

        <div className="p-5">
          {payments.filter(p => p.payment_type === 'advance').length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm text-gray-400">No advance payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.filter(p => p.payment_type === 'advance').map((payment, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{getPaymentMethodIcon(payment.payment_method)}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 capitalize">{payment.payment_method.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(payment.payment_date).toLocaleDateString()}
                        {payment.reference_number && ` · Ref: ${payment.reference_number}`}
                        {payment.bank_name && ` · ${payment.bank_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-400">by {payment.received_by?.name || 'System'}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mt-3">
                <span className="text-sm font-semibold text-emerald-800">Total Advance Payments Received</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(payments.filter(p => p.payment_type === 'advance').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services Pricing Management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader
            title="Services Pricing Management"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Details</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Price</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobCard.tasks && jobCard.tasks.length > 0 ? (
                jobCard.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{task.description || task.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{task.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{task.assigned_to?.name || <span className="text-gray-300">Unassigned</span>}</p>
                      <p className="text-xs text-gray-400">{task.assigned_to?.employee_id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        task.status === 'completed'  ? 'bg-green-50 text-green-700 border-green-200' :
                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-400'}`} />
                        {(task.status || 'pending').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600 text-sm">{formatCurrency(task.cost_price || 0)}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">{formatCurrency(task.amount || task.cost_price || 0)}</td>
                    <td className="px-5 py-4 text-center">
                      {canEditLaborCost && (
                        <button
                          onClick={() => { setEditLaborForm({ labor_cost: 0, cost_price: task.cost_price || 0, amount: task.amount || task.cost_price || 0, task_id: task.id }); setShowEditLaborModal(true) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-400">No services added yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {jobCard.tasks && jobCard.tasks.length > 0 && (
          <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-700">Total Services Cost</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(jobCard.tasks.reduce((sum, task) => sum + parseFloat(task.amount || task.cost_price || 0), 0))}</span>
          </div>
        )}
      </div>

      {/* Spare Parts Pricing Management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader
            title="Spare Parts Pricing Management"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
          />
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-3 gap-4 px-5 pt-4">
          {[
            { label: 'Pending Pricing', count: jobCard.spare_parts_requests?.filter(p => p.status === 'pending').length || 0, cls: 'bg-orange-50 border-orange-200 text-orange-600' },
            { label: 'Priced Parts', count: jobCard.spare_parts_requests?.filter(p => p.status === 'priced').length || 0, cls: 'bg-green-50 border-green-200 text-green-600' },
            { label: 'Approved Parts', count: jobCard.spare_parts_requests?.filter(p => p.status === 'approved').length || 0, cls: 'bg-blue-50 border-blue-200 text-blue-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border px-4 py-3 text-center ${s.cls}`}>
              <p className={`text-2xl font-bold`}>{s.count}</p>
              <p className="text-xs font-semibold uppercase tracking-wide mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Part Details</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task & Employee</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Price</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 ? (
                jobCard.spare_parts_requests.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{part.part_name || part.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {part.quantity}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{part.task?.description || <span className="text-gray-300">N/A</span>}</p>
                      <p className="text-xs text-gray-400">{part.task?.assigned_to?.name || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        part.status === 'approved' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                        part.status === 'priced'   ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${part.status === 'approved' ? 'bg-gray-400' : part.status === 'priced' ? 'bg-green-500' : 'bg-orange-400'}`} />
                        {(part.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600 text-sm">{formatCurrency(part.cost_price || 0)}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">{formatCurrency(part.selling_price || part.cost_price || 0)}</td>
                    <td className="px-5 py-4 text-center">
                      {(canEditLaborCost || (canEditApprovedParts && ['approved', 'rejected'].includes(part.status))) && (
                        <button
                          onClick={() => { setEditSparePartForm({ cost_price: part.cost_price || 0, selling_price: part.selling_price || part.cost_price || 0, part_id: part.id, part_status: part.status }); setShowEditSparePartModal(true) }}
                          title={['approved', 'rejected'].includes(part.status) ? 'Edit approved/rejected part' : 'Edit spare part price'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Price
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-400">No spare parts added yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 && (
          <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm font-semibold text-gray-700">Total Spare Parts Cost</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(jobCard.spare_parts_requests.reduce((sum, part) => sum + parseFloat(part.selling_price || part.cost_price || 0), 0))}</span>
          </div>
        )}
      </div>

      {/* Additional Charges */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <SectionHeader
          title="Additional Charges & Services"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
        />
        <p className="text-xs text-gray-400 -mt-2 mb-4">Add any additional charges before finalizing</p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Description</label>
            <input 
              type="text" 
              placeholder="e.g., Labor, Inspection, Materials" 
              value={chargeForm.description}
              onChange={(e) => setChargeForm({...chargeForm, description: e.target.value})}
              className={inputCls} 
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Cost Price</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={chargeForm.cost_price}
              onChange={(e) => setChargeForm({...chargeForm, cost_price: e.target.value})}
              className={inputCls} 
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Amount</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={chargeForm.amount}
              onChange={(e) => setChargeForm({...chargeForm, amount: e.target.value})}
              className={inputCls} 
            />
          </div>
        </div>

        <button 
          onClick={handleAddCharge}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Charge
        </button>

        {jobCard.otherCharges && jobCard.otherCharges.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Charges History</h4>
              <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">Refresh</button>
            </div>
            {jobCard.otherCharges && jobCard.otherCharges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Price</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pl-4">Added</th>
                      <th className="pb-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobCard.otherCharges.map((charge) => (
                      <tr key={charge.id} className="hover:bg-gray-50/70">
                        <td className="py-3">
                          <p className="text-green-600 font-medium text-sm">{charge.description}</p>
                        </td>
                        <td className="py-3 text-right text-gray-600">{formatCurrency(charge.cost_price)}</td>
                        <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(charge.amount)}</td>
                        <td className="py-3 text-xs text-gray-500 pl-4">{new Date(charge.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3 text-center">
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">No charges added yet</div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Total ({jobCard.otherCharges?.length || 0} charges)</span>
              <span className="font-semibold text-orange-600">{formatCurrency(jobCard.otherCharges?.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0) || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <SectionHeader
          title="Pricing Summary"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />

        <div className="space-y-2.5">
          {[
            { label: 'Tasks & Services Pricing', value: jobCard.labor_cost || 0 },
            { label: 'Parts Charges', value: jobCard.parts_cost || 0 },
            { label: 'Other Charges', value: jobCard.other_charges || 0 },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className="font-semibold text-gray-900 text-sm">{formatCurrency(row.value)}</span>
            </div>
          ))}

          {jobCard.discount > 0 && (
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <span className="text-sm text-red-500">Discount</span>
              <span className="font-semibold text-red-500 text-sm">− {formatCurrency(jobCard.discount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-3 border-y-2 border-gray-200">
            <span className="font-bold text-gray-800">Total Amount</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(jobCard.total_amount || 0)}</span>
          </div>

          {jobCard.advance_payment > 0 && (
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <span className="text-sm text-green-600">Payments Received</span>
              <span className="font-semibold text-green-600 text-sm">− {formatCurrency(jobCard.advance_payment)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-gray-800">Balance Due</span>
            <span className={`text-2xl font-bold ${jobCard.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(jobCard.balance_amount || 0)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-3">
          {!hasInvoice && canViewInvoices && (
            <button onClick={handleGenerateInvoice}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Generate Invoice
            </button>
          )}
          {hasInvoice && canViewInvoices && (
            <button onClick={handleViewInvoice}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View Invoice
            </button>
          )}
          {canAddPayments && jobCard.balance_amount > 0 && (
            <button onClick={() => setShowPaymentModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Record Payment
            </button>
          )}
          {canAddPayments && (
            <button onClick={() => setShowAdvancePaymentModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Add Advance Payment
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader
            title="Payment History"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No payments recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                  {['Payment #', 'Date', 'Amount', 'Method', 'Type', 'Received By', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-primary text-sm">{payment.payment_number}</td>
                    <td className="px-5 py-4 text-gray-600 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 capitalize">
                        {getPaymentMethodIcon(payment.payment_method)}
                        {payment.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {payment.payment_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm">{payment.received_by?.name}</td>
                    <td className="px-5 py-4">
                      {canDeletePayments && (
                        <button onClick={() => handleVoidPayment(payment.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Void
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <ModalHeader title="Record Payment" subtitle={`Balance Due: ${formatCurrency(jobCard.balance_amount)}`} onClose={() => setShowPaymentModal(false)} />
            <form onSubmit={handleRecordPayment} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Amount (LKR) <span className="text-red-400">*</span></label>
                    <input type="number" step="0.01" min="0.01" max={jobCard.balance_amount} value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required placeholder="Enter amount" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Payment Date <span className="text-red-400">*</span></label>
                    <input type="date" value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})} required className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Payment Type <span className="text-red-400">*</span></label>
                    <select value={paymentForm.payment_type} onChange={(e) => setPaymentForm({...paymentForm, payment_type: e.target.value})} className={inputCls}>
                      <option value="advance">Advance Payment</option>
                      <option value="partial">Partial Payment</option>
                      <option value="full">Full Payment</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Payment Method <span className="text-red-400">*</span></label>
                    <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} className={inputCls}>
                      {paymentMethodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                {PaymentMethodFields(paymentForm, setPaymentForm)}
                {paymentForm.amount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining Balance After Payment</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(jobCard.balance_amount - parseFloat(paymentForm.amount || 0))}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex-shrink-0">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg bg-green-600 hover:bg-green-700" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Payment Modal */}
      {showAdvancePaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <ModalHeader title="Add Advance Payment" subtitle={`${jobCard.job_card_number}${jobCard.customer ? ` · ${jobCard.customer.name}` : ''}`} onClose={() => setShowAdvancePaymentModal(false)} colorClass="bg-emerald-50/50" />
            <form onSubmit={handleRecordAdvancePayment} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Advance Amount (LKR) <span className="text-red-400">*</span></label>
                    <input type="number" step="0.01" min="0.01" value={advancePaymentForm.amount}
                      onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, amount: e.target.value})} required placeholder="Enter amount" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Payment Date <span className="text-red-400">*</span></label>
                    <input type="date" value={advancePaymentForm.payment_date}
                      onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, payment_date: e.target.value})} required className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Payment Method <span className="text-red-400">*</span></label>
                  <select value={advancePaymentForm.payment_method} onChange={(e) => setAdvancePaymentForm({...advancePaymentForm, payment_method: e.target.value})} className={inputCls}>
                    <option value="">Select payment method</option>
                    {paymentMethodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {PaymentMethodFields(advancePaymentForm, setAdvancePaymentForm)}
                {advancePaymentForm.amount && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-sm text-gray-600">Advance Amount to Record</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(advancePaymentForm.amount || 0))}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex-shrink-0">
                <button type="button" onClick={() => setShowAdvancePaymentModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg bg-emerald-600 hover:bg-emerald-700" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Record Advance Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ModalHeader title={`Invoice ${invoice.invoice_number}`} subtitle={`Generated on ${new Date(invoice.invoice_date).toLocaleDateString()}`} onClose={() => setShowInvoiceModal(false)} />
            <div className="px-8 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bill To</p>
                  <p className="font-semibold text-gray-900">{jobCard.customer?.name}</p>
                  <p className="text-sm text-gray-600">{jobCard.customer?.phone}</p>
                  <p className="text-sm text-gray-600">{jobCard.customer?.email}</p>
                  <p className="text-sm text-gray-600 mt-1">{jobCard.customer?.address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vehicle</p>
                  <p className="font-bold text-lg text-primary font-mono tracking-widest">{jobCard.vehicle?.license_plate}</p>
                  <p className="text-sm text-gray-700">{jobCard.vehicle?.make} {jobCard.vehicle?.model}</p>
                  <p className="text-sm text-gray-600">Year: {jobCard.vehicle?.year}</p>
                </div>
              </div>

              <div className="border-t pt-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { label: 'Tasks & Services Pricing', value: invoice.labor_charges },
                      { label: 'Parts Charges', value: invoice.parts_charges },
                      ...(invoice.other_charges > 0 ? [{ label: 'Other Charges', value: invoice.other_charges }] : []),
                    ].map(row => (
                      <tr key={row.label}>
                        <td className="px-4 py-3 text-gray-700">{row.label}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.value)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2">
                      <td className="px-4 py-3 font-bold text-gray-800">Subtotal</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    {invoice.discount_amount > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-red-500">Discount</td>
                        <td className="px-4 py-3 text-right text-red-500 font-semibold">− {formatCurrency(invoice.discount_amount)}</td>
                      </tr>
                    )}
                    <tr className="bg-blue-50">
                      <td className="px-4 py-4 font-bold text-gray-800 text-base">Total Amount</td>
                      <td className="px-4 py-4 text-right font-bold text-primary text-xl">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                    {invoice.advance_paid > 0 && (
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-green-700 font-semibold">Paid</td>
                        <td className="px-4 py-3 text-right text-green-700 font-semibold">− {formatCurrency(invoice.advance_paid)}</td>
                      </tr>
                    )}
                    <tr className="bg-yellow-50 border-t-2">
                      <td className="px-4 py-4 font-bold text-gray-800 text-base">Balance Due</td>
                      <td className="px-4 py-4 text-right font-bold text-red-600 text-xl">{formatCurrency(invoice.balance_due)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {invoice.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowInvoiceModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm">Close</button>
              <button onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Labor Cost Modal */}
      {showEditLaborModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col">
            <ModalHeader
              title={editLaborForm.task_id ? 'Edit Service Cost' : 'Edit Tasks & Services Pricing'}
              subtitle={`Job Card: ${jobCard.job_card_number || 'N/A'}`}
              onClose={() => setShowEditLaborModal(false)}
              colorClass="bg-amber-50/50"
            />
            <form onSubmit={handleEditLaborCost} className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
              {editLaborForm.task_id ? (
                <>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Cost Price <span className="text-red-400">*</span></label>
                    <input type="number" step="0.01" value={editLaborForm.cost_price}
                      onChange={(e) => setEditLaborForm({...editLaborForm, cost_price: e.target.value})}
                      placeholder="Enter cost price" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Amount <span className="text-red-400">*</span></label>
                    <input type="number" step="0.01" value={editLaborForm.amount}
                      onChange={(e) => setEditLaborForm({...editLaborForm, amount: e.target.value})}
                      placeholder="Enter amount" className={inputCls} />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className={labelCls}>Labor Cost <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" required value={editLaborForm.labor_cost}
                    onChange={(e) => setEditLaborForm({...editLaborForm, labor_cost: e.target.value})}
                    placeholder="Enter labor cost" className={inputCls} />
                </div>
              )}
            </form>
            <ModalFooter onCancel={() => setShowEditLaborModal(false)} submitLabel="Update Cost" submitClass="bg-amber-500 hover:bg-amber-600" />
          </div>
        </div>
      )}

      {/* Edit Spare Part Modal */}
      {showEditSparePartModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col">
            <ModalHeader
              title="Edit Spare Part Price"
              subtitle={`Job Card: ${jobCard.job_card_number || 'N/A'}`}
              onClose={() => setShowEditSparePartModal(false)}
              colorClass={['approved', 'rejected'].includes(editSparePartForm.part_status) ? 'bg-red-50/50' : 'bg-orange-50/50'}
            />
            <div className="px-7 py-5 space-y-4">
              {['approved', 'rejected'].includes(editSparePartForm.part_status) && (
                <div className="flex gap-2.5 p-3.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Note:</span> You are editing an <span className="font-semibold">{editSparePartForm.part_status}</span> part. This action requires admin approval.
                  </p>
                </div>
              )}
              <form id="editSparePartForm" onSubmit={handleEditSparePart} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Cost Price <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" required value={editSparePartForm.cost_price}
                    onChange={(e) => setEditSparePartForm({...editSparePartForm, cost_price: e.target.value})}
                    placeholder="Enter cost price" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Selling Price <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" required value={editSparePartForm.selling_price}
                    onChange={(e) => setEditSparePartForm({...editSparePartForm, selling_price: e.target.value})}
                    placeholder="Enter selling price" className={inputCls} />
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setShowEditSparePartModal(false)} className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm">Cancel</button>
              <button type="submit" form="editSparePartForm" className="px-5 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-md transition-all" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Update Price</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentManagement