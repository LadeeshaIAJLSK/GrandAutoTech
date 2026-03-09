import { useState } from 'react'

function Sidebar({ 
  currentPage, 
  setCurrentPage, 
  canViewUsers, 
  usersMenuOpen, 
  setUsersMenuOpen,
  handleRoleTabClick,
  handleAllUsersClick,
  isOpen = true,
  setIsOpen = () => {}
}) {
  const [localUsersOpen, setLocalUsersOpen] = useState(usersMenuOpen)

  const handleNavClick = (callback) => {
    callback()
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`fixed md:relative left-0 top-0 w-64 h-screen md:h-auto bg-sidebar text-white transform transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <nav className="py-5 h-screen overflow-y-auto">
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
    </>
  )
}

export default Sidebar
