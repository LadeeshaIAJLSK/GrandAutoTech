
import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'
import UserManagement from './UserManagement'
import CustomerManagement from './CustomerManagement'
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard'  
import JobCardManagement from './JobCardManagement'

function Dashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [currentRoleFilter, setCurrentRoleFilter] = useState(null)
  const [usersMenuOpen, setUsersMenuOpen] = useState(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post('/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      onLogout()
    }
  }

  const canViewUsers = user.role.name === 'super_admin' || user.permissions.includes('view_users')

  const handleRoleTabClick = (roleName, roleDisplayName) => {
    setCurrentPage('users')
    setCurrentRoleFilter({ name: roleName, displayName: roleDisplayName })
    setUsersMenuOpen(true)
  }

  const handleAllUsersClick = () => {
    setCurrentPage('users')
    setCurrentRoleFilter(null)
    setUsersMenuOpen(true)
  }

  useEffect(() => {
    if (['employee', 'super_admin', 'branch_admin'].includes(user.role.name)) {
      fetchPendingApprovalsCount()
    }
  }, [])

  const fetchPendingApprovalsCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/spare-parts/pending/approvals', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPendingApprovalsCount(response.data.length)
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-8 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">🚗 Grand Auto Tech</h1>
          <div className="flex items-center gap-5">
            <span className="font-semibold text-gray-700">👤 {user.name}</span>
            <span className="text-sm text-gray-500">({user.role.display_name})</span>
            <button
              onClick={handleLogout}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-sidebar text-white">
          <nav className="py-5">
            {/* Dashboard */}
            <button
              onClick={() => {
                setCurrentPage('dashboard')
                setUsersMenuOpen(false)
              }}
              className={`w-full text-left px-6 py-3 transition-colors flex items-center justify-between ${
                currentPage === 'dashboard' 
                  ? 'bg-primary text-white font-semibold' 
                  : 'text-gray-300 hover:bg-sidebar-hover'
              }`}
            >
              <span>📊 Dashboard</span>
              {pendingApprovalsCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* Users with Submenu */}
            {canViewUsers && (
              <div>
                <button
                  onClick={() => setUsersMenuOpen(!usersMenuOpen)}
                  className={`w-full text-left px-6 py-3 flex justify-between items-center transition-colors ${
                    currentPage === 'users'
                      ? 'bg-primary text-white font-semibold'
                      : 'text-gray-300 hover:bg-sidebar-hover'
                  }`}
                >
                  <span>👥 Users</span>
                  <span className={`text-xs transition-transform ${usersMenuOpen ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>

                {/* Submenu */}
                {usersMenuOpen && (
                  <div className="bg-sidebar-dark">
                    <button
                      onClick={handleAllUsersClick}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        currentPage === 'users' && !currentRoleFilter
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      📋 All Users
                    </button>

                    <button
                      onClick={() => handleRoleTabClick('branch_admin', 'Branch Admins')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        currentRoleFilter?.name === 'branch_admin'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      👔 Branch Admins
                    </button>

                    <button
                      onClick={() => handleRoleTabClick('accountant', 'Accountants')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        currentRoleFilter?.name === 'accountant'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      💼 Accountants
                    </button>

                    <button
                      onClick={() => handleRoleTabClick('employee', 'Technicians')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        currentRoleFilter?.name === 'employee'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      🔧 Technicians
                    </button>

                    <button
                      onClick={() => handleRoleTabClick('support_staff', 'Support Staff')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        currentRoleFilter?.name === 'support_staff'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      📞 Support Staff
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Customers & Vehicles Menu */}
            {(user.permissions.includes('view_customers') || user.permissions.includes('view_vehicles')) && (
              <div>
                <button
                  onClick={() => setCurrentPage('customers')}
                  className={`w-full text-left px-6 py-3 flex justify-between items-center transition-colors ${
                    currentPage === 'customers' || currentPage === 'vehicles'
                      ? 'bg-primary text-white font-semibold'
                      : 'text-gray-300 hover:bg-sidebar-hover'
                  }`}
                >
                  <span>👥 Customers & Vehicles</span>
                </button>
              </div>
            )}

            {/* Job Cards Menu */}
            {user.permissions.includes('view_job_cards') && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  currentPage === 'job-cards'
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => setCurrentPage('job-cards')}
              >
                📋 Job Cards
              </button>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <AnalyticsDashboard user={user} />
          )}

          {currentPage === 'users' && (
            <UserManagement user={user} roleFilter={currentRoleFilter} />
          )}

          {currentPage === 'customers' && (
            <CustomerManagement user={user} />
          )}

          {currentPage === 'job-cards' && (
            <JobCardManagement user={user} />
          )}

          {currentPage === 'quotations' && (
            <QuotationManagement user={user} />
          )}

          {currentPage === 'reports' && (
            <FinancialReports user={user} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard