import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function PettyCashManagement({ user }) {
  const [funds, setFunds] = useState([])
  const [selectedFund, setSelectedFund] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showReplenishModal, setShowReplenishModal] = useState(false)
  const [showCreateFundModal, setShowCreateFundModal] = useState(false)

  const [expenseForm, setExpenseForm] = useState({
    fund_id: '',
    amount: '',
    category: '',
    description: '',
    receipt_number: '',
    transaction_date: new Date().toISOString().slice(0, 10),
  })

  const [replenishForm, setReplenishForm] = useState({
    fund_id: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    fetchFunds()
    fetchCategories()
    fetchTransactions()
  }, [])

  useEffect(() => {
    if (selectedFund) {
      fetchSummary()
    }
  }, [selectedFund])

  const fetchFunds = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/petty-cash/funds', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFunds(response.data)
      if (response.data.length > 0 && !selectedFund) {
        setSelectedFund(response.data[0])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = selectedFund ? { fund_id: selectedFund.id } : {}
      const response = await axiosClient.get('/petty-cash/transactions', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setTransactions(response.data.data)
      setPendingCount(response.data.data.filter(t => t.status === 'pending').length)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/petty-cash/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCategories(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/petty-cash/summary', {
        params: { fund_id: selectedFund?.id },
        headers: { Authorization: `Bearer ${token}` }
      })
      setSummary(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleRecordExpense = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/petty-cash/expense', expenseForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Expense recorded successfully!')
      setShowExpenseModal(false)
      fetchFunds()
      fetchTransactions()
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording expense')
    }
  }

  const handleRecordReplenishment = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/petty-cash/replenishment', replenishForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Replenishment recorded!')
      setShowReplenishModal(false)
      fetchFunds()
      fetchTransactions()
    } catch (error) {
      alert(error.response?.data?.message || 'Error')
    }
  }

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/petty-cash/transactions/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Approved!')
      fetchFunds()
      fetchTransactions()
    } catch (error) {
      alert(error.response?.data?.message || 'Error')
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/petty-cash/transactions/${id}/reject`, {
        rejection_reason: reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('❌ Rejected')
      fetchTransactions()
    } catch (error) {
      alert(error.response?.data?.message || 'Error')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Petty Cash Management
        </h2>
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            Record Expense
          </button>
          <button
            onClick={() => setShowReplenishModal(true)}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            Add Money
          </button>
        </div>
      </div>

      {/* Fund Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {funds.map(fund => (
          <div
            key={fund.id}
            onClick={() => setSelectedFund(fund)}
            className={`bg-white rounded-xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
              selectedFund?.id === fund.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900 text-sm">{fund.fund_name}</h3>
              {selectedFund?.id === fund.id && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-2xl font-bold text-primary mb-1">{formatCurrency(fund.current_balance)}</p>
            <p className="text-xs text-gray-400">Custodian: {fund.custodian?.name}</p>
            {fund.current_balance < fund.replenishment_threshold && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Needs Replenishment
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_expenses)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Total Replenishments</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_replenishments)}</p>
          </div>
          <div className={`rounded-xl border p-5 ${summary.net_cash_flow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${summary.net_cash_flow >= 0 ? 'text-blue-400' : 'text-red-400'}`}>Net Cash Flow</p>
            <p className={`text-2xl font-bold ${summary.net_cash_flow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(summary.net_cash_flow)}</p>
          </div>
        </div>
      )}

      {/* Pending Approvals Banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-orange-800">
              {pendingCount} Transaction{pendingCount > 1 ? 's' : ''} Pending Approval
            </p>
            <p className="text-xs text-orange-600 mt-0.5">Review and approve or reject below</p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                {['Transaction #', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-sm text-gray-400">No transactions found</td>
                </tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-primary">{tx.transaction_number}</td>
                  <td className="px-5 py-4 text-gray-500">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      tx.type === 'expense'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {tx.type === 'expense'
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                      }
                      {tx.type === 'expense' ? 'Expense' : 'Replenishment'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 capitalize">{tx.category}</td>
                  <td className="px-5 py-4 text-gray-600 max-w-[180px] truncate">{tx.description}</td>
                  <td className={`px-5 py-4 text-right font-bold ${tx.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'expense' ? '−' : '+'} {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      tx.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      tx.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === 'approved' ? 'bg-green-500' :
                        tx.status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {tx.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleApprove(tx.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(tx.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 bg-red-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Record Expense</h3>
                <p className="text-sm text-gray-400 mt-0.5">Log a petty cash expenditure</p>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordExpense} className="px-7 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Fund <span className="text-red-400">*</span></label>
                <select value={expenseForm.fund_id} onChange={(e) => setExpenseForm({...expenseForm, fund_id: e.target.value})} required className={inputCls}>
                  <option value="">Select Fund</option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>{f.fund_name} — Balance: {formatCurrency(f.current_balance)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Amount (LKR) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Date <span className="text-red-400">*</span></label>
                  <input type="date" value={expenseForm.transaction_date} onChange={(e) => setExpenseForm({...expenseForm, transaction_date: e.target.value})} required className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Category <span className="text-red-400">*</span></label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} required className={inputCls}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Description <span className="text-red-400">*</span></label>
                <textarea value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} required rows="3" className={`${inputCls} resize-none`} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Receipt Number</label>
                <input type="text" value={expenseForm.receipt_number} onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replenishment Modal */}
      {showReplenishModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 bg-green-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Money to Fund</h3>
                <p className="text-sm text-gray-400 mt-0.5">Record a petty cash replenishment</p>
              </div>
              <button onClick={() => setShowReplenishModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordReplenishment} className="px-7 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Fund <span className="text-red-400">*</span></label>
                <select value={replenishForm.fund_id} onChange={(e) => setReplenishForm({...replenishForm, fund_id: e.target.value})} required className={inputCls}>
                  <option value="">Select Fund</option>
                  {funds.map(f => <option key={f.id} value={f.id}>{f.fund_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Amount (LKR) <span className="text-red-400">*</span></label>
                <input type="number" step="0.01" value={replenishForm.amount} onChange={(e) => setReplenishForm({...replenishForm, amount: e.target.value})} required className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Description <span className="text-red-400">*</span></label>
                <textarea value={replenishForm.description} onChange={(e) => setReplenishForm({...replenishForm, description: e.target.value})} required rows="2" placeholder="e.g., Monthly replenishment from main account" className={`${inputCls} resize-none`} />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowReplenishModal(false)} className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Add Money</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default PettyCashManagement