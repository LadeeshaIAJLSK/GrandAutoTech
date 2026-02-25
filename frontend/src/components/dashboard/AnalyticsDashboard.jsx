import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'
import MiniCalendar from './MiniCalendar'

function AnalyticsDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [recentJobCards, setRecentJobCards] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [calendarJobCards, setCalendarJobCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch job card statistics
      const statsResponse = await axiosClient.get('/job-cards/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(statsResponse.data)

      // Fetch employee count
      try {
        const employeeResponse = await axiosClient.get('/users/count?role=employee', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setEmployeeCount(employeeResponse.data.count || 0)
      } catch (error) {
        // Fallback: count employees manually
        console.warn('Could not fetch employee count:', error)
      }

      // Fetch recent job cards
      const jobCardsResponse = await axiosClient.get('/job-cards', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecentJobCards(jobCardsResponse.data.data.slice(0, 5))
      setCalendarJobCards(jobCardsResponse.data.data)

      // Fetch pending approvals if employee/admin
      if (['employee', 'super_admin', 'branch_admin'].includes(user.role.name)) {
        const approvalsResponse = await axiosClient.get('/spare-parts/pending/approvals', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPendingApprovals(approvalsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      waiting_parts: 'bg-purple-500',
      waiting_customer: 'bg-orange-500',
      quality_check: 'bg-indigo-500',
      completed: 'bg-green-500',
      invoiced: 'bg-teal-500',
      paid: 'bg-emerald-500',
      cancelled: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-orange-600 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
        <p className="text-orange-100 text-lg">
          You're logged in as <strong>{user.role.display_name}</strong>
          {user.branch && ` at ${user.branch.name}`}
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pending Job Cards */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Pending Job Cards</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="text-5xl">⏳</div>
            </div>
          </div>

          {/* Active Job Cards */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Active Job Cards</p>
                <p className="text-4xl font-bold text-blue-600">{stats.in_progress}</p>
              </div>
              <div className="text-5xl">🔧</div>
            </div>
          </div>

          {/* Completed Job Cards */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Completed Job Cards</p>
                <p className="text-4xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="text-5xl">✅</div>
            </div>
          </div>

          {/* Employee Count */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Employee Count</p>
                <p className="text-4xl font-bold text-cyan-600">{employeeCount}</p>
              </div>
              <div className="text-5xl">👥</div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar with Job Card Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Job Card Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Waiting Parts', count: stats?.waiting_parts || 0, color: 'purple' },
              { label: 'Quality Check', count: stats?.quality_check || 0, color: 'indigo' },
              { label: 'Completed', count: stats?.completed || 0, color: 'green' },
              { label: 'Invoiced', count: stats?.invoiced || 0, color: 'teal' },
              { label: 'Paid', count: stats?.paid || 0, color: 'emerald' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-32 text-gray-700 font-semibold">{item.label}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`bg-${item.color}-500 h-full flex items-center justify-end px-3 text-white text-sm font-bold transition-all duration-500`}
                    style={{ width: `${stats?.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                  >
                    {item.count > 0 && item.count}
                  </div>
                </div>
                <div className="w-16 text-right text-gray-600 font-semibold">
                  {stats?.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Calendar Sidebar */}
        <div>
          <MiniCalendar jobCards={calendarJobCards} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Cards */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🕒 Recent Job Cards</h3>
          {recentJobCards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent job cards</div>
          ) : (
            <div className="space-y-3">
              {recentJobCards.map((jobCard) => (
                <div key={jobCard.id} className="border-2 border-gray-100 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-primary">{jobCard.job_card_number}</div>
                      <div className="text-sm text-gray-600">{jobCard.customer?.name}</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(jobCard.status)}`}></div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{jobCard.vehicle?.license_plate}</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(jobCard.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🔔 Pending Approvals 
              <span className="ml-2 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                {pendingApprovals.length}
              </span>
            </h3>
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((part) => (
                <div key={part.id} className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-800">{part.part_name}</div>
                      <div className="text-sm text-gray-600">
                        Job Card: {part.job_card?.job_card_number}
                      </div>
                    </div>
                    <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      PENDING
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Qty: {part.quantity}</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(part.total_cost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!pendingApprovals.length && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Jobs This Month</div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                </div>
                <div className="text-4xl">📅</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Completed Jobs</div>
                  <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
                </div>
                <div className="text-4xl">✅</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                  <div className="text-2xl font-bold text-purple-600">{stats?.in_progress || 0}</div>
                </div>
                <div className="text-4xl">🔧</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Your Permissions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔐 Your Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {user.permissions.slice(0, 12).map((permission, index) => (
            <span
              key={index}
              className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200"
            >
              ✓ {permission.replace(/_/g, ' ')}
            </span>
          ))}
          {user.permissions.length > 12 && (
            <span className="bg-gray-50 text-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-gray-200">
              +{user.permissions.length - 12} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard