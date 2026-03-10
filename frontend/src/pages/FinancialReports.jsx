import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function FinancialReports({ user }) {
  const [financialData, setFinancialData] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [bankBreakdown, setBankBreakdown] = useState([])
  const [paymentTransactions, setPaymentTransactions] = useState([])
  const [outstandingDues, setOutstandingDues] = useState(null)
  const [loading, setLoading] = useState(true)

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [periodFilter, setPeriodFilter] = useState('month')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedBank, setSelectedBank] = useState('')

  const bankOptions = [
    'Commercial Bank of Ceylon',
    'Hatton National Bank',
    'Sampath Bank',
    'People\'s Bank',
    'Bank of Ceylon',
    'National Savings Bank',
    'SANASA Development Bank',
    'Regional Development Bank',
    'Sri Lanka Savings Bank',
    'HDFC Bank of Sri Lanka'
  ]

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate])

  const getPeriodDates = () => {
    const today = new Date()
    let start, end = today.toISOString().slice(0, 10)
    
    switch(periodFilter) {
      case 'daily':
        start = end
        break
      case 'week':
        start = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().slice(0, 10)
        break
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
        break
      case 'year':
        start = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10)
        break
      default:
        return { startDate, endDate }
    }
    return { startDate: start, endDate: end }
  }

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token')
      const dates = getPeriodDates()
      const params = { start_date: dates.startDate, end_date: dates.endDate }
      
      const [financial, methods, dues, banks, transactions] = await Promise.all([
        axiosClient.get('/reports/financial-summary', { params, headers: { Authorization: `Bearer ${token}` } }),
        axiosClient.get('/reports/payment-methods', { params, headers: { Authorization: `Bearer ${token}` } }),
        axiosClient.get('/reports/outstanding-dues', { headers: { Authorization: `Bearer ${token}` } }),
        axiosClient.get('/reports/bank-breakdown', { params, headers: { Authorization: `Bearer ${token}` } }),
        axiosClient.get('/reports/payment-transactions', { params, headers: { Authorization: `Bearer ${token}` } })
      ])
      setFinancialData(financial.data)
      setPaymentMethods(methods.data)
      setOutstandingDues(dues.data)
      setBankBreakdown(banks.data || [])
      setPaymentTransactions(transactions.data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount)
  const formatDate = (date) => new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })

  const downloadTransactionDetails = () => {
    const filteredTransactions = paymentTransactions
      .filter(t => !selectedPaymentMethod || t.payment_method === selectedPaymentMethod)
      .filter(t => !selectedBank || t.bank_name === selectedBank)

    if (filteredTransactions.length === 0) {
      alert('No transactions to download. Try adjusting your filters.')
      return
    }

    // Create CSV header
    const headers = ['Job Card Number', 'Customer Name', 'Payment Method', 'Bank Name', 'Reference Number', 'Payment Date', 'Amount (LKR)']
    
    // Create CSV rows
    const rows = filteredTransactions.map(t => [
      t.job_card_number,
      t.customer_name,
      t.payment_method.replace('_', ' '),
      t.bank_name || 'N/A',
      t.reference_number || 'N/A',
      formatDate(t.payment_date),
      t.amount
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const fileName = `payment_transactions_${selectedPaymentMethod ? selectedPaymentMethod.replace('_', '_') : 'all'}_${selectedBank ? selectedBank.replace(/\s+/g, '_') : 'all_banks'}_${new Date().toISOString().slice(0, 10)}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalCost = financialData?.total_cost || 0
  const totalRevenue = financialData?.total_revenue || 0
  const totalProfit = totalRevenue - totalCost

  const getMethodIcon = (method) => {
    const icons = {
      cash: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      card: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      bank_transfer: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
      cheque: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      mobile_payment: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    }
    return icons[method] || <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Financial Reports
        </h2>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Report Period
        </h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'week', label: 'Weekly' },
              { value: 'month', label: 'Monthly' },
              { value: 'year', label: 'Yearly' }
            ].map(period => (
              <button key={period.value}
                onClick={() => setPeriodFilter(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  periodFilter === period.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {period.label}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPeriodFilter('custom') }}
                className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPeriodFilter('custom') }}
                className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Cost</p>
            <p className="text-xl font-bold text-orange-600 mt-0.5">{formatCurrency(totalCost)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Profit</p>
            <p className={`text-xl font-bold mt-0.5 ${totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Outstanding Due</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">{formatCurrency(outstandingDues?.total_outstanding || 0)}</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Revenue by Payment Method
        </h3>
        <div className="space-y-5">
          {paymentMethods.map((method) => {
            const percentage = totalRevenue > 0
              ? (method.total_amount / totalRevenue * 100).toFixed(1)
              : 0

            return (
              <div key={method.payment_method} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getMethodIcon(method.payment_method)}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {method.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(method.total_amount)}</p>
                    <p className="text-xs text-gray-400">{method.count} transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{percentage}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bank-wise Breakdown */}
      {bankBreakdown && bankBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Bank-wise Revenue Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bank Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Count</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bankBreakdown.map(bank => {
                  const percentage = totalRevenue > 0 ? (bank.total_amount / totalRevenue * 100).toFixed(1) : 0
                  return (
                    <tr key={bank.bank_name} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-700">{bank.bank_name || 'Not Specified'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatCurrency(bank.total_amount)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{bank.count}</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-medium">{percentage}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Payment Transaction Details
        </h3>
        <div className="space-y-3 mb-4">
          <div className="flex gap-3 items-end">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all">
              <option value="">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="mobile_payment">Mobile Payment</option>
            </select>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all">
              <option value="">All Banks</option>
              {bankOptions.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            <button
              onClick={downloadTransactionDetails}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors active:scale-95 whitespace-nowrap shadow-lg hover:shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nature/Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bank/Ref</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentTransactions
                .filter(t => !selectedPaymentMethod || t.payment_method === selectedPaymentMethod)
                .filter(t => !selectedBank || t.bank_name === selectedBank)
                .map((transaction, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-700 text-xs">{transaction.job_card_number}</td>
                    <td className="px-4 py-3 text-gray-700">{transaction.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {getMethodIcon(transaction.payment_method)}
                        {transaction.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{transaction.bank_name || transaction.reference_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(transaction.payment_date)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(transaction.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {paymentTransactions.filter(t => !selectedPaymentMethod || t.payment_method === selectedPaymentMethod).filter(t => !selectedBank || t.bank_name === selectedBank).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found for the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Outstanding Dues Table */}
      {outstandingDues && outstandingDues.job_cards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Outstanding Dues
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {outstandingDues.count} job cards
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Card</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outstandingDues.job_cards.map(jc => (
                  <tr key={jc.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-primary">{jc.job_card_number}</td>
                    <td className="px-5 py-4 text-gray-700">{jc.customer?.name}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded tracking-widest">
                        {jc.vehicle?.license_plate}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">{formatCurrency(jc.total_amount)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-green-600">{formatCurrency(jc.advance_payment)}</td>
                    <td className="px-5 py-4 text-right font-bold text-red-600">{formatCurrency(jc.balance_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialReports