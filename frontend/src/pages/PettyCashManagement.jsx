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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">💵 Petty Cash Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            ➖ Record Expense
          </button>
          <button
            onClick={() => setShowReplenishModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            ➕ Add Money
          </button>
        </div>
      </div>

      {/* Fund Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {funds.map(fund => (
          <div
            key={fund.id}
            onClick={() => setSelectedFund(fund)}
            className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all ${
              selectedFund?.id === fund.id ? 'ring-4 ring-primary' : ''
            }`}
          >
            <h3 className="font-bold text-lg mb-2">{fund.fund_name}</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {formatCurrency(fund.current_balance)}
            </div>
            <div className="text-sm text-gray-600">
              Custodian: {fund.custodian?.name}
            </div>
            {fund.current_balance < fund.replenishment_threshold && (
              <div className="mt-3 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                ⚠️ Needs Replenishment
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(summary.total_expenses)}
            </div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-1">Total Replenishments</div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(summary.total_replenishments)}
            </div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="text-sm text-gray-600 mb-1">Net Cash Flow</div>
            <div className={`text-3xl font-bold ${summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.net_cash_flow)}
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingCount > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏳</span>
            <div>
              <div className="font-bold text-gray-800">
                {pendingCount} Transaction{pendingCount > 1 ? 's' : ''} Pending Approval
              </div>
              <div className="text-sm text-gray-600">Review and approve/reject below</div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Transaction #</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-primary">{tx.transaction_number}</td>
                <td className="px-6 py-4">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    tx.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {tx.type === 'expense' ? '➖ Expense' : '➕ Replenishment'}
                  </span>
                </td>
                <td className="px-6 py-4 capitalize">{tx.category}</td>
                <td className="px-6 py-4">{tx.description}</td>
                <td className={`px-6 py-4 text-right font-bold ${
                  tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    tx.status === 'approved' ? 'bg-green-100 text-green-800' :
                    tx.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tx.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {tx.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(tx.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReject(tx.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b bg-red-50">
              <h3 className="text-2xl font-bold text-gray-800">➖ Record Expense</h3>
            </div>

            <form onSubmit={handleRecordExpense} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold mb-2">Fund *</label>
                <select
                  value={expenseForm.fund_id}
                  onChange={(e) => setExpenseForm({...expenseForm, fund_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 border-2 rounded-lg"
                >
                  <option value="">Select Fund</option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.fund_name} - Balance: {formatCurrency(f.current_balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Amount (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Date *</label>
                  <input
                    type="date"
                    value={expenseForm.transaction_date}
                    onChange={(e) => setExpenseForm({...expenseForm, transaction_date: e.target.value})}
                    required
                    className="w-full px-4 py-2 border-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  required
                  className="w-full px-4 py-2 border-2 rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Description *</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Receipt Number</label>
                <input
                  type="text"
                  value={expenseForm.receipt_number}
                  onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})}
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replenishment Modal */}
      {showReplenishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b bg-green-50">
              <h3 className="text-2xl font-bold text-gray-800">➕ Add Money to Fund</h3>
            </div>

            <form onSubmit={handleRecordReplenishment} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold mb-2">Fund *</label>
                <select
                  value={replenishForm.fund_id}
                  onChange={(e) => setReplenishForm({...replenishForm, fund_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 border-2 rounded-lg"
                >
                  <option value="">Select Fund</option>
                  {funds.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.fund_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Amount (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={replenishForm.amount}
                  onChange={(e) => setReplenishForm({...replenishForm, amount: e.target.value})}
                  required
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Description *</label>
                <textarea
                  value={replenishForm.description}
                  onChange={(e) => setReplenishForm({...replenishForm, description: e.target.value})}
                  required
                  rows="2"
                  placeholder="e.g., Monthly replenishment from main account"
                  className="w-full px-4 py-2 border-2 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowReplenishModal(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg"
                >
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PettyCashManagement