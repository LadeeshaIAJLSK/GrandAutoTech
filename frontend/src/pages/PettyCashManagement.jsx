import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function PettyCashManagement({ user }) {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [funds, setFunds] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedFund, setSelectedFund] = useState(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [fundForm, setFundForm] = useState({
    fund_name: '',
    initial_amount: '',
    replenishment_threshold: '',
  })

  const [expenseForm, setExpenseForm] = useState({
    fund_id: '',
    amount: '',
    category: '',
    how: '',
    why: '',
    receipt_image: null,
    receipt_number: '',
    transaction_date: new Date().toISOString().slice(0, 10),
  })

  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)


  // Fetch branches on mount
  useEffect(() => {
    fetchBranches()
    fetchCategories()
  }, [])

  // Fetch funds when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchFunds()
      fetchSummary()
    }
  }, [selectedBranch])

  // Fetch transactions when fund changes
  useEffect(() => {
    if (selectedFund) {
      fetchTransactions()
    }
  }, [selectedFund])

  const fetchBranches = async () => {
    try {
      const response = await axiosClient.get('/branches')
      const branchesData = response.data.data || response.data
      setBranches(branchesData)
      
      // Auto-select user's branch if available
      if (user?.branch_id) {
        const userBranch = branchesData.find(b => b.id === user.branch_id)
        if (userBranch) {
          setSelectedBranch(userBranch.id)
        } else if (branchesData.length > 0) {
          setSelectedBranch(branchesData[0].id)
        }
      } else if (branchesData.length > 0) {
        setSelectedBranch(branchesData[0].id)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchFunds = async () => {
    if (!selectedBranch) return
    setLoading(true)
    try {
      const response = await axiosClient.get('/petty-cash/funds')
      const filteredFunds = response.data.filter(fund => fund.branch_id === selectedBranch)
      setFunds(filteredFunds)
      if (filteredFunds.length > 0 && !selectedFund) {
        setSelectedFund(filteredFunds[0].id)
      }
    } catch (error) {
      console.error('Error fetching funds:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!selectedFund) return
    try {
      const response = await axiosClient.get('/petty-cash/transactions', {
        params: { fund_id: selectedFund }
      })
      const txData = response.data.data || response.data
      setTransactions(txData)
      setPendingCount(txData.filter(t => t.status === 'pending').length)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/petty-cash/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSummary = async () => {
    if (!selectedFund) return
    try {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const endDate = new Date().toISOString().slice(0, 10)
      const response = await axiosClient.get('/petty-cash/summary', {
        params: { 
          fund_id: selectedFund,
          start_date: startDate,
          end_date: endDate
        }
      })
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleCreateFund = async (e) => {
    e.preventDefault()
    if (!selectedBranch) {
      alert('Please select a branch first')
      return
    }

    try {
      await axiosClient.post('/petty-cash/funds', {
        ...fundForm,
        branch_id: selectedBranch
      })
      alert('✅ Fund created successfully!')
      setFundForm({ fund_name: '', initial_amount: '', replenishment_threshold: '' })
      setShowFundModal(false)
      fetchFunds()
    } catch (error) {
      alert('❌ Error creating fund: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleRecordExpense = async (e) => {
    e.preventDefault()
    if (!selectedFund) {
      alert('Please select a fund first')
      return
    }

    const formData = new FormData()
    formData.append('fund_id', selectedFund)
    formData.append('amount', expenseForm.amount)
    formData.append('category', expenseForm.category)
    formData.append('description', `How: ${expenseForm.how}\nWhy: ${expenseForm.why}`)
    formData.append('receipt_number', expenseForm.receipt_number)
    formData.append('transaction_date', expenseForm.transaction_date)
    if (expenseForm.receipt_image) {
      formData.append('receipt_image', expenseForm.receipt_image)
    }

    try {
      await axiosClient.post('/petty-cash/expense', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('✅ Expense recorded successfully!')
      setExpenseForm({
        fund_id: '',
        amount: '',
        category: '',
        how: '',
        why: '',
        receipt_image: null,
        receipt_number: '',
        transaction_date: new Date().toISOString().slice(0, 10),
      })
      setShowExpenseModal(false)
      fetchTransactions()
      fetchFunds()
      fetchSummary()
    } catch (error) {
      alert('❌ Error recording expense: ' + (error.response?.data?.message || error.message))
    }
  }

  const approvePendingTransaction = async (transactionId) => {
    try {
      await axiosClient.post(`/petty-cash/transactions/${transactionId}/approve`)
      alert('✅ Transaction approved!')
      fetchTransactions()
      fetchFunds()
      fetchSummary()
    } catch (error) {
      alert('❌ Error approving transaction: ' + (error.response?.data?.message || error.message))
    }
  }

  const rejectTransaction = async (transactionId) => {
    const reason = prompt('Please provide rejection reason:')
    if (!reason) return

    try {
      await axiosClient.post(`/petty-cash/transactions/${transactionId}/reject`, {
        rejection_reason: reason
      })
      alert('✅ Transaction rejected!')
      fetchTransactions()
    } catch (error) {
      alert('❌ Error rejecting transaction: ' + (error.response?.data?.message || error.message))
    }
  }

  const getCurrentFund = () => {
    return funds.find(f => f.id === selectedFund)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const fund = getCurrentFund()


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">💰 Petty Cash Management</h1>
          <p className="text-gray-600 mt-2">Track expenses, manage funds, and monitor petty cash balances in real-time</p>
        </div>

        {/* Branch Filter - Above everything */}
        <div className="mb-8 bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
            📍 Select Branch
          </label>
          <select
            value={selectedBranch || ''}
            onChange={(e) => {
              setSelectedBranch(parseInt(e.target.value))
              setSelectedFund(null)
              setTransactions([])
            }}
            className="w-full md:w-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-gray-900"
          >
            <option value="">🔍 Choose a branch...</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedBranch ? (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 text-center">
            <p className="text-blue-800 font-semibold">👈 Please select a branch above to begin petty cash management</p>
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="mb-6 flex gap-4 flex-wrap">
              <button
                onClick={() => setShowFundModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md hover:shadow-lg"
              >
                ➕ Create New Fund
              </button>
              {selectedFund && (
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md hover:shadow-lg"
                >
                  💵 Record New Expense
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b-2 border-gray-200 bg-white rounded-t-lg p-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-3 border-blue-600 -mb-4'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'expenses'
                    ? 'text-blue-600 border-b-3 border-blue-600 -mb-4'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                💸 Expenses {pendingCount > 0 && <span className="ml-2 inline-block bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{pendingCount}</span>}
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-3 font-bold transition-all ${
                  activeTab === 'summary'
                    ? 'text-blue-600 border-b-3 border-blue-600 -mb-4'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📈 Summary
              </button>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Funds Grid */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500 text-lg">⏳ Loading funds...</div>
                ) : funds.length === 0 ? (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                    <p className="text-blue-800 font-semibold text-lg">No petty cash funds created yet.</p>
                    <p className="text-blue-600 mt-2">Click "Create New Fund" button above to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {funds.map(f => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setSelectedFund(f.id)
                          setActiveTab('expenses')
                        }}
                        className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedFund === f.id ? 'ring-3 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{f.fund_name}</h3>
                          {selectedFund === f.id && <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">Selected</span>}
                        </div>

                        <div className="space-y-4">
                          {/* Fixed Amount */}
                          <div className="border-b pb-3">
                            <p className="text-gray-600 text-sm font-semibold uppercase">Fixed Amount (Initial)</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">
                              {formatCurrency(f.initial_amount)}
                            </p>
                          </div>

                          {/* Current Balance */}
                          <div className="border-b pb-3">
                            <p className="text-gray-600 text-sm font-semibold uppercase">Current Balance</p>
                            <p className={`text-3xl font-bold mt-1 ${
                              parseFloat(f.current_balance) < parseFloat(f.replenishment_threshold)
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}>
                              {formatCurrency(f.current_balance)}
                            </p>
                          </div>

                          {/* Remaining Calculation */}
                          <div className="border-b pb-3">
                            <p className="text-gray-600 text-sm font-semibold uppercase">Remaining (can spend)</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              {formatCurrency(f.current_balance)}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full transition-all ${
                                  parseFloat(f.current_balance) / parseFloat(f.initial_amount) > 0.5
                                    ? 'bg-green-500'
                                    : parseFloat(f.current_balance) / parseFloat(f.initial_amount) > 0.25
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${(parseFloat(f.current_balance) / parseFloat(f.initial_amount)) * 100}%`
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-semibold">
                              {((parseFloat(f.current_balance) / parseFloat(f.initial_amount)) * 100).toFixed(1)}% of fixed amount remaining
                            </p>
                          </div>

                          {/* Custodian & Warning */}
                          <div className="mt-4 pt-3 border-t">
                            <p className="text-xs text-gray-500">Custodian: {f.custodian?.name || 'N/A'}</p>
                            {parseFloat(f.current_balance) < parseFloat(f.replenishment_threshold) && (
                              <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-xs text-red-600 font-semibold">⚠️ Needs Replenishment!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EXPENSES TAB */}
            {activeTab === 'expenses' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                {!selectedFund ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-semibold">👆 Select a fund from Overview tab to view and record expenses</p>
                  </div>
                ) : (
                  <>
                    {/* Pending Approvals Alert */}
                    {pendingCount > 0 && (
                      <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                        <p className="text-orange-800 font-bold">⏳ {pendingCount} expense(s) pending approval</p>
                      </div>
                    )}

                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600 text-lg font-semibold">📝 No expenses recorded yet</p>
                        <p className="text-gray-500 mt-2">Click "Record New Expense" button above to add your first expense</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transactions.map(transaction => (
                          <div
                            key={transaction.id}
                            className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow"
                          >
                            {/* Header Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Transaction #</p>
                                <p className="font-mono font-bold text-gray-900 text-lg">{transaction.transaction_number}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                                <p className="font-bold text-gray-900">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Category</p>
                                <p className="font-bold text-gray-900 capitalize">{transaction.category}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-bold">Amount</p>
                                <p className="text-2xl font-bold text-red-600">-{formatCurrency(transaction.amount)}</p>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-200">
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">How (Method)</p>
                                <p className="text-gray-700 text-sm">{transaction.description.split('How: ')[1]?.split('\nWhy')[0] || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Why (Reason)</p>
                                <p className="text-gray-700 text-sm">{transaction.description.split('Why: ')[1] || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Status & Receipt */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <span className={`inline-block px-4 py-2 rounded-full text-white text-sm font-bold ${
                                  transaction.status === 'approved' ? 'bg-green-500' :
                                  transaction.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}>
                                  {transaction.status === 'approved' ? '✓ APPROVED' :
                                   transaction.status === 'pending' ? '⏳ PENDING' :
                                   '✕ REJECTED'}
                                </span>
                                {transaction.receipt_image && (
                                  <a
                                    href={`/storage/${transaction.receipt_image}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                                  >
                                    📎 View Bill/Receipt
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {transaction.status === 'pending' && (
                              <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                  onClick={() => approvePendingTransaction(transaction.id)}
                                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition-colors"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => rejectTransaction(transaction.id)}
                                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 transition-colors"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {!selectedFund ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 text-center">
                    <p className="text-blue-800 font-semibold">Select a fund to view summary report</p>
                  </div>
                ) : !summary ? (
                  <div className="text-center py-8 text-gray-500">⏳ Loading summary...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-500">
                      <p className="text-gray-600 text-sm uppercase font-bold">📊 Total Expenses (This Month)</p>
                      <p className="text-4xl font-bold text-red-600 mt-3">
                        {formatCurrency(summary.total_expenses)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
                      <p className="text-gray-600 text-sm uppercase font-bold">💰 Total Replenishments (This Month)</p>
                      <p className="text-4xl font-bold text-green-600 mt-3">
                        {formatCurrency(summary.total_replenishments)}
                      </p>
                    </div>
                    <div className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${
                      parseFloat(summary.net_cash_flow) >= 0 ? 'border-blue-500' : 'border-red-500'
                    }`}>
                      <p className="text-gray-600 text-sm uppercase font-bold">📈 Net Cash Flow</p>
                      <p className={`text-4xl font-bold mt-3 ${
                        parseFloat(summary.net_cash_flow) >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(summary.net_cash_flow)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Create Petty Cash Fund</h2>
            <form onSubmit={handleCreateFund} className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">Branch</p>
                <p className="font-bold text-gray-900">{branches.find(b => b.id === selectedBranch)?.name || 'No branch selected'}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">Custodian (Fund Manager)</p>
                <p className="font-bold text-gray-900">{user?.name || 'Current User'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fund Name *
                </label>
                <input
                  type="text"
                  value={fundForm.fund_name}
                  onChange={(e) => setFundForm({...fundForm, fund_name: e.target.value})}
                  placeholder="e.g., Main Office Petty Cash"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fixed Amount (Initial Balance) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fundForm.initial_amount}
                  onChange={(e) => setFundForm({...fundForm, initial_amount: e.target.value})}
                  placeholder="e.g., 10000.00"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Replenishment Threshold (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fundForm.replenishment_threshold}
                  onChange={(e) => setFundForm({...fundForm, replenishment_threshold: e.target.value})}
                  placeholder="e.g., 2000.00"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold"
                >
                  Create Fund
                </button>
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">💵 Record New Expense</h2>
            <p className="text-gray-600 text-sm mb-4">Track where petty cash is being used</p>
            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Expense Type/Category *
                </label>
                <input
                  type="text"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  placeholder="e.g., Fuel, Supplies, Parts, Tools, Delivery, etc."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  How (Method) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Purchased from supplier, Paid bill, Paid service"
                  value={expenseForm.how}
                  onChange={(e) => setExpenseForm({...expenseForm, how: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Why (Reason) *
                </label>
                <textarea
                  placeholder="e.g., For vehicle parts, For office supplies, For maintenance work"
                  value={expenseForm.why}
                  onChange={(e) => setExpenseForm({...expenseForm, why: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  placeholder="e.g., 1000.00"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Receipt/Bill Number (optional)
                </label>
                <input
                  type="text"
                  value={expenseForm.receipt_number}
                  onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})}
                  placeholder="e.g., INV-12345"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Upload Bill/Receipt (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExpenseForm({...expenseForm, receipt_image: e.target.files?.[0] || null})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {expenseForm.receipt_image && (
                  <p className="text-sm text-green-600 mt-1 font-semibold">✓ {expenseForm.receipt_image.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={expenseForm.transaction_date}
                  onChange={(e) => setExpenseForm({...expenseForm, transaction_date: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Balance Info */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-bold text-blue-900 mb-2">💡 Fund Balance Summary:</p>
                <div className="space-y-1 text-blue-800">
                  <p>Fixed Amount: <span className="font-bold">{fund ? formatCurrency(fund.initial_amount) : '0.00'}</span></p>
                  <p>Current Balance: <span className="font-bold">{fund ? formatCurrency(fund.current_balance) : '0.00'}</span></p>
                  <p>Your Expense: <span className="font-bold">{expenseForm.amount ? formatCurrency(expenseForm.amount) : '0.00'}</span></p>
                  <hr className="border-blue-300 my-2" />
                  <p className={`font-bold ${
                    fund && parseFloat(fund.current_balance) >= parseFloat(expenseForm.amount || 0) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    Remaining After: {fund ? formatCurrency(Math.max(0, parseFloat(fund.current_balance) - parseFloat(expenseForm.amount || 0))) : '0.00'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold"
                >
                  Record Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-bold"
                >
                  Cancel
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