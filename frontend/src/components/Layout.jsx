import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axiosClient from '../api/axios'
import AccessRightsManagement from '../pages/AccessRightsManagement'
import BranchManagement from '../pages/BranchManagement'
import BranchOverview from '../pages/BranchOverview'
import TaskApproval from '../pages/TaskApproval'

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

  const canViewUsers = user.permissions.includes('view_users') || ['super_admin', 'branch_admin'].includes(user.role.name)

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

  const NavItem = ({ path, icon, label, badge, onClick, children: subItems }) => {
    const active = isActive(path)
    return (
      <button
        onClick={onClick || (() => navigate(path))}
        className={`w-full text-left px-5 py-3 flex items-center justify-between gap-3 transition-all group ${
          active
            ? 'bg-primary/15 text-white border-l-[3px] border-primary'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-[3px] border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`}>
            {icon}
          </span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse min-w-[20px] text-center">
              {badge}
            </span>
          )}
          {subItems && (
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${usersMenuOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </button>
    )
  }

  const SubNavItem = ({ path, icon, label }) => {
    const active = location.pathname === path
    return (
      <button
        onClick={() => navigate(path)}
        className={`w-full text-left pl-12 pr-5 py-2.5 flex items-center gap-3 text-sm transition-all group ${
          active
            ? 'text-primary bg-primary/10 font-semibold'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
        }`}
      >
        <span className={`${active ? 'text-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>{icon}</span>
        {label}
      </button>
    )
  }

  // SVG Icons
  const icons = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    customers: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    tasks: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    jobCards: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    approval: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    quotations: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    invoices: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    cash: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    access: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    branch: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    activity: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    allUsers: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    branchAdmin: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    accountant: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    technician: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    support: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-20 sticky top-0">
        <div className="px-6 h-16 flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Grand Auto Tech</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-400 leading-tight">{user.role.display_name}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-gray-200 hover:border-red-200"
            >
              {icons.logout}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar - Fixed */}
        <aside className="fixed left-0 top-16 w-60 h-[calc(100vh-64px)] bg-sidebar flex flex-col z-40 border-r border-white/10">

          {/* Nav - Scrollable */}
          <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto sidebar-scroll">

            {/* Dashboard */}
            <NavItem
              path="/dashboard"
              icon={icons.dashboard}
              label="Dashboard"
              badge={pendingApprovalsCount}
            />

            {/* Users with Submenu */}
            {canViewUsers && (
              <div>
                <button
                  onClick={() => setUsersMenuOpen(!usersMenuOpen)}
                  className={`w-full text-left px-5 py-3 flex items-center justify-between gap-3 transition-all group border-l-[3px] ${
                    isActive('/users')
                      ? 'bg-primary/15 text-white border-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive('/users') ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`}>
                      {icons.users}
                    </span>
                    <span className="text-sm font-medium">Users</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform text-gray-500 ${usersMenuOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {usersMenuOpen && (
                  <div className="bg-black/10 py-1">
                    <SubNavItem path="/users" icon={icons.allUsers} label="All Users" />
                    <SubNavItem path="/users/branch_admin" icon={icons.branchAdmin} label="Branch Admins" />
                    <SubNavItem path="/users/accountant" icon={icons.accountant} label="Accountants" />
                    <SubNavItem path="/users/employee" icon={icons.technician} label="Technicians" />
                    <SubNavItem path="/users/support_staff" icon={icons.support} label="Support Staff" />
                  </div>
                )}
              </div>
            )}

            {/* Customers & Vehicles */}
            {(user.role.name === 'super_admin' || user.permissions.includes('view_customers') || user.permissions.includes('view_vehicles')) && (
              <NavItem path="/customers" icon={icons.customers} label="Customers & Vehicles" />
            )}

            {/* My Tasks */}
            {['employee', 'super_admin'].includes(user.role.name) && (
              <NavItem path="/my-tasks" icon={icons.tasks} label="My Tasks" />
            )}

            {/* Job Cards */}
            {(user.role.name === 'super_admin' || user.permissions.includes('view_job_cards')) && (
              <NavItem path="/job-cards" icon={icons.jobCards} label="Job Cards" />
            )}

            {/* Task Approval */}
            {['super_admin', 'branch_admin'].includes(user.role.name) && (
              <NavItem path="/task-approval" icon={icons.approval} label="Task Approval" />
            )}

            {/* Quotations */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <NavItem path="/quotations" icon={icons.quotations} label="Quotations" />
            )}

            {/* Divider for admin section */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Finance</p>
              </div>
            )}

            {/* Invoices */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <NavItem path="/invoices" icon={icons.invoices} label="Invoice Management" />
            )}

            {/* Financial Reports */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <NavItem path="/reports" icon={icons.reports} label="Financial Reports" />
            )}

            {/* Petty Cash */}
            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <NavItem path="/petty-cash" icon={icons.cash} label="Petty Cash" />
            )}

            {/* Admin section */}
            {user.role.name === 'super_admin' && (
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Administration</p>
              </div>
            )}

            {/* Access Rights */}
            {user.role.name === 'super_admin' && (
              <NavItem path="/access-rights" icon={icons.access} label="Access Rights" />
            )}

            {/* Branch Management */}
            {user.role.name === 'super_admin' && (
              <NavItem path="/branch-management" icon={icons.branch} label="Branch Management" />
            )}

            {/* Branch Overview */}
            {user.role.name === 'super_admin' && (
              <NavItem path="/branch-overview" icon={icons.branch} label="Branch Overview" />
            )}

            {/* Activity Log */}
            {user.role.name === 'super_admin' && (
              <NavItem path="/activity-log" icon={icons.activity} label="Activity Logs" />
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-300 truncate">{user.name}</p>
                <p className="text-xs text-gray-600 truncate">{user.role.display_name}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-60 flex-1 p-7 overflow-y-auto bg-gray-50">
          {React.cloneElement(children, { selectedBranchId })}
        </main>
      </div>
    </div>
  )
}

export default Layout
