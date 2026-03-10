import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function PettyCashManagement({ user }) {
  const [branches, setBranches] = useState([])
  const [filterBranch, setFilterBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [funds, setFunds] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedFund, setSelectedFund] = useState(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showReplenishModal, setShowReplenishModal] = useState(false)
  const [showEditFixedAmountModal, setShowEditFixedAmountModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [fundForm, setFundForm] = useState({
    fund_name: '',
    initial_amount: '',
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

  const [replenishForm, setReplenishForm] = useState({
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().slice(0, 10),
  })

  const [editFixedAmountForm, setEditFixedAmountForm] = useState({
    initial_amount: '',
  })

  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchBranches()
    fetchCategories()
    // Load saved branch filter from localStorage (for super admin only)
    // For non-super-admins, automatically set to their own branch
    if (user.role.name === 'super_admin') {
      const savedBranch = localStorage.getItem('selectedBranchId') || ''
      setFilterBranch(savedBranch)
    } else {
      // Non-super-admins always see their own branch
      setFilterBranch(String(user.branch_id || ''))
    }
  }, [])

  useEffect(() => {
    setSelectedFund(null)
    setTransactions([])
    setSummary(null)
    fetchFunds()
  }, [filterBranch])

  useEffect(() => {
    if (selectedFund) {
      fetchTransactions()
      fetchSummary()
    }
  }, [selectedFund])

  const fetchBranches = async () => {
    try {
      const response = await axiosClient.get('/branches')
      const branchesData = response.data.data || response.data
      setBranches(branchesData)
    } catch (error) { console.error('Error fetching branches:', error) }
  }

  const fetchFunds = async () => {
    setLoading(true)
    try {
      const params = {}
      // Only pass branch_id if a specific branch is selected (not empty/all)
      if (filterBranch && filterBranch !== 'all' && filterBranch !== '') {
        params.branch_id = filterBranch
      } else if (filterBranch === '') {
        // For "All Branches" - don't add any filter
        // Backend will return all branches
      }
      const response = await axiosClient.get('/petty-cash/funds', { params })
      const fundsData = response.data || []
      setFunds(fundsData)
      // Don't auto-select a fund - let user choose
      if (fundsData.length > 0 && !selectedFund) setSelectedFund(fundsData[0].id)
    } catch (error) { console.error('Error fetching funds:', error) }
    finally { setLoading(false) }
  }

  const fetchTransactions = async () => {
    if (!selectedFund) return
    try {
      const params = { fund_id: selectedFund }
      if (filterBranch && filterBranch !== 'all' && filterBranch !== '') {
        params.branch_id = filterBranch
      }
      const response = await axiosClient.get('/petty-cash/transactions', { params })
      const txData = response.data.data || response.data
      setTransactions(txData)
      setPendingCount(txData.filter(t => t.status === 'pending').length)
    } catch (error) { console.error('Error fetching transactions:', error) }
  }

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/petty-cash/categories')
      setCategories(response.data)
    } catch (error) { console.error('Error fetching categories:', error) }
  }

  const fetchSummary = async () => {
    if (!selectedFund) return
    try {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const endDate = new Date().toISOString().slice(0, 10)
      const params = { fund_id: selectedFund, start_date: startDate, end_date: endDate }
      if (filterBranch && filterBranch !== 'all' && filterBranch !== '') {
        params.branch_id = filterBranch
      }
      const response = await axiosClient.get('/petty-cash/summary', { params })
      setSummary(response.data)
    } catch (error) { console.error('Error fetching summary:', error) }
  }

  const handleCreateFund = async (e) => {
    e.preventDefault()
    if (!filterBranch) { alert('Please select a branch first'); return }
    try {
      await axiosClient.post('/petty-cash/funds', { ...fundForm, branch_id: filterBranch })
      alert('Fund created successfully!')
      setFundForm({ fund_name: '', initial_amount: '' })
      setShowFundModal(false)
      setSelectedFund(null)
      setTransactions([])
      fetchFunds()
    } catch (error) { alert('Error creating fund: ' + (error.response?.data?.message || error.message)) }
  }

  const handleRecordExpense = async (e) => {
    e.preventDefault()
    if (!selectedFund) { alert('Please select a fund first'); return }
    const formData = new FormData()
    formData.append('fund_id', selectedFund)
    formData.append('amount', expenseForm.amount)
    formData.append('category', expenseForm.category)
    formData.append('description', `How: ${expenseForm.how}\nWhy: ${expenseForm.why}`)
    formData.append('receipt_number', expenseForm.receipt_number)
    formData.append('transaction_date', expenseForm.transaction_date)
    if (expenseForm.receipt_image) formData.append('receipt_image', expenseForm.receipt_image)
    try {
      await axiosClient.post('/petty-cash/expense', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Expense recorded successfully!')
      setExpenseForm({ fund_id: '', amount: '', category: '', how: '', why: '', receipt_image: null, receipt_number: '', transaction_date: new Date().toISOString().slice(0, 10) })
      setShowExpenseModal(false)
      fetchTransactions()
      fetchFunds()
      fetchSummary()
    } catch (error) { alert('Error recording expense: ' + (error.response?.data?.message || error.message)) }
  }

  const approvePendingTransaction = async (transactionId) => {
    try {
      await axiosClient.post(`/petty-cash/transactions/${transactionId}/approve`)
      alert('Transaction approved!')
      fetchTransactions(); fetchFunds(); fetchSummary()
    } catch (error) { alert('Error approving transaction: ' + (error.response?.data?.message || error.message)) }
  }

  const rejectTransaction = async (transactionId) => {
    const reason = prompt('Please provide rejection reason:')
    if (!reason) return
    try {
      await axiosClient.post(`/petty-cash/transactions/${transactionId}/reject`, { rejection_reason: reason })
      alert('Transaction rejected!')
      fetchTransactions()
    } catch (error) { alert('Error rejecting transaction: ' + (error.response?.data?.message || error.message)) }
  }

  const handleReplenish = async (e) => {
    e.preventDefault()
    if (!selectedFund) { alert('Please select a fund first'); return }
    
    const fund = funds.find(f => f.id === selectedFund)
    const newBalance = parseFloat(fund.current_balance) + parseFloat(replenishForm.amount)
    
    // Validate that replenishment doesn't exceed fixed amount
    if (newBalance > parseFloat(fund.initial_amount)) {
      const availableToReplenish = parseFloat(fund.initial_amount) - parseFloat(fund.current_balance)
      alert(`Replenishment amount exceeds the fixed amount limit. You can only replenish up to ${formatCurrency(availableToReplenish)}. Consider editing the fixed amount if you need to replenish more.`)
      return
    }
    
    try {
      await axiosClient.post('/petty-cash/replenishment', { fund_id: selectedFund, ...replenishForm })
      alert('Fund replenished successfully!')
      setReplenishForm({ amount: '', description: '', transaction_date: new Date().toISOString().slice(0, 10) })
      setShowReplenishModal(false)
      fetchFunds()
      fetchTransactions()
      fetchSummary()
    } catch (error) { 
      const errorData = error.response?.data
      if (errorData?.error === 'REPLENISHMENT_EXCEEDS_LIMIT') {
        alert(`Cannot replenish: ${errorData.message}\nYou can replenish up to ${formatCurrency(errorData.max_allowed_amount)}. Edit the fixed amount if you need more.`)
      } else {
        alert('Error replenishing fund: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleEditFixedAmount = async (e) => {
    e.preventDefault()
    if (!selectedFund) { alert('Please select a fund first'); return }
    
    const fund = funds.find(f => f.id === selectedFund)
    const newAmount = parseFloat(editFixedAmountForm.initial_amount)
    
    // Validate that new fixed amount is not less than current balance
    if (newAmount < parseFloat(fund.current_balance)) {
      alert(`New fixed amount cannot be less than the current balance (${formatCurrency(fund.current_balance)})`)
      return
    }
    
    try {
      await axiosClient.put(`/petty-cash/funds/${selectedFund}/fixed-amount`, { initial_amount: newAmount })
      alert('Fixed amount updated successfully!')
      setEditFixedAmountForm({ initial_amount: '' })
      setShowEditFixedAmountModal(false)
      fetchFunds()
      fetchSummary()
    } catch (error) { 
      const errorData = error.response?.data
      if (errorData?.error === 'FIXED_AMOUNT_TOO_LOW') {
        alert(`Cannot update: ${errorData.message}\nMinimum allowed: ${formatCurrency(errorData.minimum_allowed)}`)
      } else {
        alert('Error updating fixed amount: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const getCurrentFund = () => funds.find(f => f.id === selectedFund)
  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)
  const fund = getCurrentFund()

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { key: 'expenses', label: 'Expenses', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />, badge: pendingCount },
    { key: 'summary', label: 'Summary', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
  ]

  return (
    <div className="space-y-5">

      {/* Branch Filter - Only for Super Admin */}
      {user.role.name === 'super_admin' && (
        <div className="relative w-fit">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-orange-300" />
            <span className="text-sm font-bold text-orange-900 flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-orange-600 transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-orange-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranch('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${filterBranch === '' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white' : 'text-gray-700 hover:bg-orange-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-orange-300'}`} />
                    All Branches
                  </div>
                </button>
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setFilterBranch(String(branch.id))
                      localStorage.setItem('selectedBranchId', String(branch.id))
                      setBranchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${filterBranch === String(branch.id) ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white' : 'text-gray-700 hover:bg-orange-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-orange-300'}`} />
                      {branch.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Petty Cash Management
        </h1>

        {(filterBranch && filterBranch !== '') && (
          <div className="flex gap-2">
            <button onClick={() => setShowFundModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </span>
              Create Fund
            </button>
            {selectedFund && (
              <button onClick={() => setShowExpenseModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </span>
                Record Expense
              </button>
            )}
            {selectedFund && (
              <button onClick={() => setShowReplenishModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Replenish Fund
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{tab.icon}</svg>
            {tab.label}
            {tab.badge > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading funds...</p>
            </div>
          ) : funds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-white border border-gray-200 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-bold text-gray-700">No petty cash funds yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Create Fund" above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funds.map(f => {
                const pct = Math.min(100, (parseFloat(f.current_balance) / parseFloat(f.initial_amount)) * 100)
                const needsReplenishment = parseFloat(f.current_balance) < parseFloat(f.replenishment_threshold)
                const isSelected = selectedFund === f.id
                return (
                  <div key={f.id} onClick={() => { setSelectedFund(f.id); setActiveTab('expenses') }}
                    className={`bg-white rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm">{f.fund_name}</h3>
                      <div className="flex items-center gap-2">
                        {needsReplenishment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Needs Replenishment
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Fixed Amount', value: formatCurrency(f.initial_amount), color: 'text-gray-800', editable: true, fundId: f.id },
                          { label: 'Current Balance', value: formatCurrency(f.current_balance), color: needsReplenishment ? 'text-red-600' : 'text-blue-600' },
                          { label: 'Can Spend', value: formatCurrency(f.current_balance), color: 'text-green-600' },
                        ].map(s => (
                          <div 
                            key={s.label} 
                            onClick={(e) => {
                              if (s.editable) {
                                e.stopPropagation()
                                setSelectedFund(s.fundId)
                                setEditFixedAmountForm({ initial_amount: f.initial_amount })
                                setShowEditFixedAmountModal(true)
                              }
                            }}
                            className={`bg-gray-50 rounded-lg p-3 text-center ${s.editable ? 'cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-200 transition-all group' : ''}`}>
                            <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                              {s.label}
                              {s.editable && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              )}
                            </p>
                            <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-gray-400">Balance remaining</span>
                          <span className="text-xs font-bold text-gray-700">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${
                            pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Custodian: <span className="font-semibold text-gray-600">{f.custodian?.name || 'N/A'}</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {!selectedFund ? (
            <div className="flex items-center gap-3 m-5 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-semibold text-yellow-800">Select a fund from Overview tab to view and record expenses</p>
            </div>
          ) : (
            <>
              {pendingCount > 0 && (
                <div className="mx-5 mt-5 flex items-center gap-2.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-orange-800">{pendingCount} expense{pendingCount !== 1 ? 's' : ''} pending approval</p>
                </div>
              )}

              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="font-bold text-gray-700">No expenses recorded yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Record Expense" above to add your first expense</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                      {['Transaction #','Date','Category','How','Why','Amount','Status',''].map((h, i) => (
                        <th key={i} className={`px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i >= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-primary text-xs">{tx.transaction_number}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-700 font-semibold capitalize">{tx.category}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">{tx.description.split('How: ')[1]?.split('\nWhy')[0] || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{tx.description.split('Why: ')[1] || 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">-{formatCurrency(tx.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            tx.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            tx.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === 'approved' ? 'bg-green-500' :
                              tx.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.receipt_image && (
                              <a href={`http://localhost:8000/storage/${tx.receipt_image}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Receipt
                              </a>
                            )}
                            {tx.status === 'pending' && (
                              <>
                                <button onClick={() => approvePendingTransaction(tx.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Approve
                                </button>
                                <button onClick={() => rejectTransaction(tx.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}

      {/* SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div>
          {!selectedFund ? (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-blue-800">Select a fund to view the summary report</p>
            </div>
          ) : !summary ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading summary...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Expenses (This Month)', value: formatCurrency(summary.total_expenses), color: 'text-red-600', accent: 'border-red-400',
                  iconColor: 'text-red-500', iconBg: 'bg-red-50',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /> },
                { label: 'Total Replenishments (This Month)', value: formatCurrency(summary.total_replenishments), color: 'text-green-600', accent: 'border-green-400',
                  iconColor: 'text-green-500', iconBg: 'bg-green-50',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                { label: 'Net Cash Flow', value: formatCurrency(summary.net_cash_flow),
                  color: parseFloat(summary.net_cash_flow) >= 0 ? 'text-blue-600' : 'text-red-600',
                  accent: parseFloat(summary.net_cash_flow) >= 0 ? 'border-blue-400' : 'border-red-400',
                  iconColor: parseFloat(summary.net_cash_flow) >= 0 ? 'text-blue-500' : 'text-red-500',
                  iconBg: parseFloat(summary.net_cash_flow) >= 0 ? 'bg-blue-50' : 'bg-red-50',
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
              ].map(s => (
                <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.accent} border-t border-r border-b border-gray-200 shadow-sm p-5 flex items-center gap-4`}>
                  <div className={`w-11 h-11 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center flex-shrink-0`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{s.icon}</svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-tight">{s.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create Petty Cash Fund</h2>
                <p className="text-sm text-gray-400 mt-0.5">Set up a new fund for this branch</p>
              </div>
              <button onClick={() => setShowFundModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateFund} className="px-7 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">Branch</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{branches.find(b => b.id === parseInt(filterBranch))?.name || '—'}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">Custodian</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{user?.name || 'Current User'}</p>
                </div>
              </div>
              <div>
                <label className={labelCls}>Fund Name <span className="text-red-400">*</span></label>
                <input type="text" value={fundForm.fund_name} onChange={e => setFundForm({...fundForm, fund_name: e.target.value})} placeholder="e.g., Main Office Petty Cash" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Fixed Amount (Initial Balance) <span className="text-red-400">*</span></label>
                <input type="number" step="0.01" value={fundForm.initial_amount} onChange={e => setFundForm({...fundForm, initial_amount: e.target.value})} placeholder="e.g., 10000.00" className={inputCls} required />
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowFundModal(false)} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Create Fund</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record New Expense</h2>
                <p className="text-sm text-gray-400 mt-0.5">Track where petty cash is being used</p>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordExpense} className="px-7 py-5 space-y-4">
              <div>
                <label className={labelCls}>Expense Category <span className="text-red-400">*</span></label>
                <input type="text" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} placeholder="e.g., Fuel, Supplies, Parts, Tools..." className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>How (Method) <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g., Purchased from supplier, Paid bill..." value={expenseForm.how} onChange={e => setExpenseForm({...expenseForm, how: e.target.value})} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Why (Reason) <span className="text-red-400">*</span></label>
                <textarea placeholder="e.g., For vehicle parts, For office supplies..." value={expenseForm.why} onChange={e => setExpenseForm({...expenseForm, why: e.target.value})} className={`${inputCls} resize-none`} rows="3" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Amount <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0.00" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Transaction Date</label>
                  <input type="date" value={expenseForm.transaction_date} onChange={e => setExpenseForm({...expenseForm, transaction_date: e.target.value})} className={inputCls} required />
                </div>
              </div>
              <div>
                <label className={labelCls}>Receipt / Bill Number</label>
                <input type="text" value={expenseForm.receipt_number} onChange={e => setExpenseForm({...expenseForm, receipt_number: e.target.value})} placeholder="e.g., INV-12345" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Upload Receipt</label>
                <input type="file" accept="image/*" onChange={e => setExpenseForm({...expenseForm, receipt_image: e.target.files?.[0] || null})} className={inputCls} />
                {expenseForm.receipt_image && (
                  <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {expenseForm.receipt_image.name}
                  </p>
                )}
              </div>

              {/* Balance preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fund Balance Preview</p>
                {[
                  { label: 'Fixed Amount', value: fund ? formatCurrency(fund.initial_amount) : '—', color: 'text-gray-800' },
                  { label: 'Current Balance', value: fund ? formatCurrency(fund.current_balance) : '—', color: 'text-gray-800' },
                  { label: 'Your Expense', value: expenseForm.amount ? formatCurrency(expenseForm.amount) : '—', color: 'text-red-600' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Remaining After</span>
                  <span className={`text-sm font-bold ${fund && parseFloat(fund.current_balance) >= parseFloat(expenseForm.amount || 0) ? 'text-green-600' : 'text-red-600'}`}>
                    {fund ? formatCurrency(Math.max(0, parseFloat(fund.current_balance) - parseFloat(expenseForm.amount || 0))) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replenish Fund Modal */}
      {showReplenishModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Replenish Fund</h2>
                <p className="text-sm text-gray-400 mt-0.5">Add funds to {fund?.fund_name || 'the fund'}</p>
              </div>
              <button onClick={() => setShowReplenishModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReplenish} className="px-7 py-5 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-xs text-orange-600 font-semibold">Fund Details</p>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Fund Name</span>
                    <span className="text-xs font-bold text-gray-800">{fund?.fund_name || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Current Balance</span>
                    <span className="text-xs font-bold text-blue-600">{fund ? formatCurrency(fund.current_balance) : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Fixed Amount (Limit)</span>
                    <span className="text-xs font-bold text-gray-800">{fund ? formatCurrency(fund.initial_amount) : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Can Replenish Up To</span>
                    <span className="text-xs font-bold text-green-600">{fund ? formatCurrency(Math.max(0, parseFloat(fund.initial_amount) - parseFloat(fund.current_balance))) : '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Replenishment Amount <span className="text-red-400">*</span></label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={replenishForm.amount} 
                  onChange={e => setReplenishForm({...replenishForm, amount: e.target.value})} 
                  max={fund ? Math.max(0, parseFloat(fund.initial_amount) - parseFloat(fund.current_balance)) : undefined}
                  placeholder="e.g., 5000.00" 
                  className={inputCls} 
                  required 
                />
                {fund && replenishForm.amount && parseFloat(replenishForm.amount) > parseFloat(fund.initial_amount) - parseFloat(fund.current_balance) && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Exceeds maximum replenishment amount
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Description/Reason <span className="text-red-400">*</span></label>
                <textarea placeholder="e.g., Monthly replenishment, Emergency fund top-up..." value={replenishForm.description} onChange={e => setReplenishForm({...replenishForm, description: e.target.value})} className={`${inputCls} resize-none`} rows="3" required />
              </div>

              <div>
                <label className={labelCls}>Replenishment Date</label>
                <input type="date" value={replenishForm.transaction_date} onChange={e => setReplenishForm({...replenishForm, transaction_date: e.target.value})} className={inputCls} required />
              </div>

              {/* Balance preview */}
              <div className={`rounded-xl p-4 space-y-2 ${fund && parseFloat(replenishForm.amount) > parseFloat(fund.initial_amount) - parseFloat(fund.current_balance) ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${fund && parseFloat(replenishForm.amount) > parseFloat(fund.initial_amount) - parseFloat(fund.current_balance) ? 'text-red-600' : 'text-green-600'}`}>Balance Preview</p>
                {[
                  { label: 'Current Balance', value: fund ? formatCurrency(fund.current_balance) : '—', color: 'text-blue-600' },
                  { label: 'Replenishment Amount', value: replenishForm.amount ? formatCurrency(replenishForm.amount) : '—', color: 'text-green-600' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{row.label}</span>
                    <span className={`text-xs font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
                <div className={`border-t pt-2 flex justify-between items-center ${fund && parseFloat(replenishForm.amount) > parseFloat(fund.initial_amount) - parseFloat(fund.current_balance) ? 'border-red-200' : 'border-green-200'}`}>
                  <span className="text-xs font-semibold text-gray-700">New Balance</span>
                  <span className={`text-sm font-bold ${fund && parseFloat(replenishForm.amount) + parseFloat(fund.current_balance) > parseFloat(fund.initial_amount) ? 'text-red-600' : 'text-green-600'}`}>
                    {fund ? formatCurrency(Math.min(parseFloat(fund.initial_amount), parseFloat(fund.current_balance) + parseFloat(replenishForm.amount || 0))) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditFixedAmountModal(true)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">
                  Edit Fixed Amount
                </button>
                <button type="button" onClick={() => setShowReplenishModal(false)} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={fund && parseFloat(replenishForm.amount) > parseFloat(fund.initial_amount) - parseFloat(fund.current_balance)}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" 
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  Replenish Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fixed Amount Modal */}
      {showEditFixedAmountModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Fixed Amount</h2>
                <p className="text-sm text-gray-400 mt-0.5">Update the maximum limit for {fund?.fund_name || 'the fund'}</p>
              </div>
              <button onClick={() => setShowEditFixedAmountModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditFixedAmount} className="px-7 py-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-600 font-semibold">Current Information</p>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Current Balance</span>
                    <span className="text-xs font-bold text-gray-800">{fund ? formatCurrency(fund.current_balance) : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Current Fixed Amount</span>
                    <span className="text-xs font-bold text-gray-800">{fund ? formatCurrency(fund.initial_amount) : '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>New Fixed Amount <span className="text-red-400">*</span></label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={editFixedAmountForm.initial_amount} 
                  onChange={e => setEditFixedAmountForm({...editFixedAmountForm, initial_amount: e.target.value})} 
                  min={fund ? parseFloat(fund.current_balance) : 0}
                  placeholder="e.g., 15000.00" 
                  className={inputCls} 
                  required 
                />
                {fund && editFixedAmountForm.initial_amount && parseFloat(editFixedAmountForm.initial_amount) < parseFloat(fund.current_balance) && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Must be at least {formatCurrency(fund.current_balance)}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Summary</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Change Amount</span>
                  <span className={`text-xs font-bold ${editFixedAmountForm.initial_amount && parseFloat(editFixedAmountForm.initial_amount) > (fund?.initial_amount || 0) ? 'text-green-600' : editFixedAmountForm.initial_amount && parseFloat(editFixedAmountForm.initial_amount) < (fund?.initial_amount || 0) ? 'text-red-600' : 'text-gray-600'}`}>
                    {editFixedAmountForm.initial_amount 
                      ? formatCurrency(parseFloat(editFixedAmountForm.initial_amount) - (fund?.initial_amount || 0)) 
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditFixedAmountModal(false)} className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={fund && editFixedAmountForm.initial_amount && parseFloat(editFixedAmountForm.initial_amount) < parseFloat(fund.current_balance)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" 
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  Update Fixed Amount
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