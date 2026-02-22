import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axiosClient from '../api/axios'
import AccessRightsManagement from '../pages/AccessRightsManagement'
import BranchManagement from '../pages/BranchManagement'
import BranchOverview from '../pages/BranchOverview'
import BranchSelector from './common/BranchSelector'

function Layout({ user, onLogout, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [usersMenuOpen, setUsersMenuOpen] = useState(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [selectedBranchId, setSelectedBranchId] = useState('all')

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

  const canViewUsers = user.permissions.includes('view_users')

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

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
            {user.role.name === 'super_admin' && (
              <BranchSelector 
                user={user} 
                onBranchChange={(branchId) => setSelectedBranchId(branchId)}
              />
            )}
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
              onClick={() => navigate('/dashboard')}
              className={`w-full text-left px-6 py-3 transition-colors flex items-center justify-between ${
                isActive('/dashboard') 
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
                    isActive('/users')
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
                      onClick={() => navigate('/users')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        location.pathname === '/users'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      📋 All Users
                    </button>

                    <button
                      onClick={() => navigate('/users/branch_admin')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        location.pathname === '/users/branch_admin'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      👔 Branch Admins
                    </button>

                    <button
                      onClick={() => navigate('/users/accountant')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        location.pathname === '/users/accountant'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      💼 Accountants
                    </button>

                    <button
                      onClick={() => navigate('/users/employee')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        location.pathname === '/users/employee'
                          ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                          : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                      }`}
                    >
                      🔧 Technicians
                    </button>

                    <button
                      onClick={() => navigate('/users/support_staff')}
                      className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                        location.pathname === '/users/support_staff'
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
              <button
                onClick={() => navigate('/customers')}
                className={`w-full text-left px-6 py-3 flex justify-between items-center transition-colors ${
                  isActive('/customers')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
              >
                <span>👥 Customers & Vehicles</span>
              </button>
            )}


            {/* My Tasks (Employee & Super Admin) */}
            {['employee', 'super_admin'].includes(user.role.name) && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/my-tasks')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/my-tasks')}
              >
                📝 My Tasks
              </button>
            )}

            {/* Job Cards Menu */}
            {user.permissions.includes('view_job_cards') && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/job-cards')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/job-cards')}
              >
                📋 Job Cards
              </button>
            )}

            {/* Quotations */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/quotations')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/quotations')}
              >
                📋 Quotations
              </button>
            )}

            {/* Financial Reports */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/reports')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/reports')}
              >
                💰 Financial Reports
              </button>
            )}

            {/* Petty Cash */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/petty-cash')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/petty-cash')}
              >
                💵 Petty Cash
              </button>
            )}

            {/* Access Rights (Super Admin Only) */}
            {user.role.name === 'super_admin' && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/access-rights')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/access-rights')}
              >
                🔐 Access Rights
              </button>
            )}

            {/* Branch Management (Super Admin Only) */}
            {user.role.name === 'super_admin' && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/branch-management')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/branch-management')}
              >
                🏢 Branch Management
              </button>
            )}

            {/* Branch Overview (Super Admin Only) */}
            {user.role.name === 'super_admin' && (
              <button
                className={`w-full text-left px-6 py-3 transition-colors ${
                  isActive('/branch-overview')
                    ? 'bg-primary text-white font-semibold'
                    : 'text-gray-300 hover:bg-sidebar-hover'
                }`}
                onClick={() => navigate('/branch-overview')}
              >
                🏢 Branch Overview
              </button>
            )}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {React.cloneElement(children, { selectedBranchId })}
        </div>
      </div>
    </div>
  )
}

export default Layout
