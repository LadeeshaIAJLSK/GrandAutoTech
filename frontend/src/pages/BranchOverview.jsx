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
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">🏢 Multi-Branch Overview</h2>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Branches</div>
          <div className="text-5xl font-bold">{stats.total_branches}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Revenue</div>
          <div className="text-3xl font-bold">{formatCurrency(stats.overall.total_revenue)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Job Cards</div>
          <div className="text-5xl font-bold">{stats.overall.total_job_cards}</div>
        </div>
      </div>

      {/* Branch Comparison Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Branch Performance</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Branch</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Total Jobs</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Pending</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">In Progress</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Completed</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Revenue</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.branch_stats.map(branch => (
                <tr key={branch.branch_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{branch.branch_name}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-xl text-gray-800">{branch.total_job_cards}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                      {branch.pending}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                      {branch.in_progress}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                      {branch.completed}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-green-600 text-lg">
                      {formatCurrency(branch.total_revenue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(branch.outstanding)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Revenue Comparison</h3>
        <div className="space-y-4">
          {stats.branch_stats.map(branch => {
            const maxRevenue = Math.max(...stats.branch_stats.map(b => b.total_revenue))
            const percentage = maxRevenue > 0 ? (branch.total_revenue / maxRevenue * 100) : 0

            return (
              <div key={branch.branch_id}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-800">{branch.branch_name}</span>
                  <span className="font-bold text-primary">{formatCurrency(branch.total_revenue)}</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500 flex items-center justify-end px-3"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage > 20 && (
                      <span className="text-white font-bold text-sm">{percentage.toFixed(0)}%</span>
                    )}
                  </div>
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