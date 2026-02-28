import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function BranchOverview({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranchStats()
  }, [])

  const fetchBranchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Multi-Branch Overview
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Branches</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{stats.total_branches}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">{formatCurrency(stats.overall.total_revenue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Job Cards</p>
            <p className="text-2xl font-bold text-purple-600 mt-0.5">{stats.overall.total_job_cards}</p>
          </div>
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Branch Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                {['Branch', 'Total Jobs', 'Pending', 'In Progress', 'Completed', 'Revenue', 'Outstanding'].map((h, i) => (
                  <th key={i} className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 0 ? 'text-left' : i >= 5 ? 'text-right' : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.branch_stats.map(branch => (
                <tr key={branch.branch_id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-900">{branch.branch_name}</td>
                  <td className="px-5 py-4 text-center font-bold text-gray-800">{branch.total_job_cards}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      {branch.pending}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {branch.in_progress}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {branch.completed}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-green-600">{formatCurrency(branch.total_revenue)}</td>
                  <td className="px-5 py-4 text-right font-bold text-red-500">{formatCurrency(branch.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Revenue Comparison
        </h3>
        <div className="space-y-4">
          {stats.branch_stats.map(branch => {
            const maxRevenue = Math.max(...stats.branch_stats.map(b => b.total_revenue))
            const percentage = maxRevenue > 0 ? (branch.total_revenue / maxRevenue * 100) : 0

            return (
              <div key={branch.branch_id}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">{branch.branch_name}</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(branch.total_revenue)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default BranchOverview