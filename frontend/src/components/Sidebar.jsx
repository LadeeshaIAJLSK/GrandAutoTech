import { useState } from 'react'

function Sidebar({ 
  currentPage, 
  setCurrentPage, 
  canViewUsers, 
  usersMenuOpen, 
  setUsersMenuOpen,
  handleRoleTabClick,
  handleAllUsersClick 
}) {
  return (
    <div className="w-64 bg-sidebar text-white">
      <nav className="py-5">
        {/* Dashboard */}
        <button
          onClick={() => {
            setCurrentPage('dashboard')
            setUsersMenuOpen(false)
          }}
          className={`w-full text-left px-6 py-3 transition-colors ${
            currentPage === 'dashboard' 
              ? 'bg-primary text-white font-semibold' 
              : 'text-gray-300 hover:bg-sidebar-hover'
          }`}
        >
          📊 Dashboard
        </button>

        {/* Petty Cash */}
        <button
          onClick={() => {
            setCurrentPage('petty-cash')
            setUsersMenuOpen(false)
          }}
          className={`w-full text-left px-6 py-3 transition-colors ${
            currentPage === 'petty-cash' 
              ? 'bg-primary text-white font-semibold' 
              : 'text-gray-300 hover:bg-sidebar-hover'
          }`}
        >
          💰 Petty Cash
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
                    currentPage === 'users' && !usersMenuOpen
                      ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                  }`}
                >
                  📋 All Users
                </button>

                <button
                  onClick={() => handleRoleTabClick('branch_admin', 'Branch Admins')}
                  className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                    currentPage === 'users'
                      ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                  }`}
                >
                  👔 Branch Admins
                </button>

                <button
                  onClick={() => handleRoleTabClick('accountant', 'Accountants')}
                  className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                    currentPage === 'users'
                      ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                  }`}
                >
                  💼 Accountants
                </button>

                <button
                  onClick={() => handleRoleTabClick('employee', 'Technicians')}
                  className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                    currentPage === 'users'
                      ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                  }`}
                >
                  🔧 Technicians
                </button>

                <button
                  onClick={() => handleRoleTabClick('support_staff', 'Support Staff')}
                  className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                    currentPage === 'users'
                      ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                  }`}
                >
                  📞 Support Staff
                </button>

                <button
                  onClick={() => handleRoleTabClick('customer', 'Customers')}
                  className={`w-full text-left px-6 py-3 pl-12 text-sm border-l-4 transition-all ${
                    currentPage === 'users'
                      ? 'border-primary bg-sidebar-hover text-primary font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-sidebar hover:text-gray-200'
                  }`}
                >
                  👤 Customers
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  )
}

export default Sidebar
