import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axiosClient from '../api/axios'
import AccessRightsManagement from '../pages/AccessRightsManagement'
import BranchManagement from '../pages/BranchManagement'
import BranchOverview from '../pages/BranchOverview'
import TaskApproval from '../pages/TaskApproval'
import Settings from '../pages/Settings'

function Layout({ user, onLogout, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [usersMenuOpen, setUsersMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [selectedBranchId, setSelectedBranchId] = useState('all')
  const [logoUrl, setLogoUrl] = useState(() => 
    localStorage.getItem('appLogo') || 'https://placehold.co/240x64/1f2937/ffffff?text=LOGO'
  )
  const [showUserModal, setShowUserModal] = useState(false)
  const [viewingUserData, setViewingUserData] = useState(null)
  const [currentUser, setCurrentUser] = useState(user)

  // Fetch complete user data on component mount
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axiosClient.get('/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const completeUser = response.data.user
        setCurrentUser(completeUser)
      } catch (error) {
        console.error('Error fetching current user:', error)
        setCurrentUser(user)
      }
    }
    fetchCurrentUserData()
  }, [])

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

  const handleLogoChange = (newLogoUrl) => {
    setLogoUrl(newLogoUrl)
  }

  const handleViewUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      // Use /me endpoint to get current user's complete profile with all fields
      const response = await axiosClient.get('/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Extract user data - /me returns { user: {...} }
      const completeUserData = response.data.user || response.data.data || response.data
      console.log('Complete user data from /me:', completeUserData)
      setViewingUserData(completeUserData)
      setShowUserModal(true)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to user object if API fails
      setViewingUserData(user)
      setShowUserModal(true)
    }
  }

  const getRoleBadgeStyle = (roleName) => {
    const styles = {
      'super_admin': 'bg-purple-100 text-purple-800 border border-purple-300',
      'branch_admin': 'bg-blue-100 text-blue-800 border border-blue-300',
      'accountant': 'bg-orange-100 text-orange-800 border border-orange-300',
      'employee': 'bg-green-100 text-green-800 border border-green-300',
      'technician': 'bg-green-100 text-green-800 border border-green-300',
      'support_staff': 'bg-indigo-100 text-indigo-800 border border-indigo-300'
    }
    return styles[roleName] || 'bg-gray-100 text-gray-800 border border-gray-300'
  }

  const canViewUsers = ['super_admin', 'branch_admin'].includes(user.role.name) || 
                       ['view_all_users', 'view_branch_admins', 'view_accountants', 'view_technicians', 'view_support_staff'].some(p => user.permissions.includes(p))

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

  // NavItem: grey sidebar, white text, white bg + black text on hover/active
  const NavItem = ({ path, icon, label, badge, onClick, children: subItems }) => {
    const active = isActive(path)
    return (
      <button
        onClick={() => {
          if (onClick) {
            onClick()
          } else {
            navigate(path)
            setSidebarOpen(false)
          }
        }}
        className={`w-full text-left px-5 py-3 flex items-center justify-between gap-3 transition-all group border-l-[3px] ${
          active
            ? 'bg-white text-gray-900 border-primary'
            : 'text-white hover:bg-white hover:text-gray-900 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${active ? 'text-primary' : 'text-gray-300 group-hover:text-gray-700'}`}>
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
        onClick={() => {
          navigate(path)
          setSidebarOpen(false)
        }}
        className={`w-full text-left pl-12 pr-5 py-2.5 flex items-center gap-3 text-sm transition-all group border-l-[3px] ${
          active
            ? 'bg-white text-gray-900 font-semibold border-primary'
            : 'text-white hover:bg-white hover:text-gray-900 border-transparent'
        }`}
      >
        <span className={`${active ? 'text-primary' : 'text-gray-300 group-hover:text-gray-700'}`}>{icon}</span>
        {label}
      </button>
    )
  }

  const icons = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    customers: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    tasks: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    jobCards: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    approval: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    quotations: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    invoices: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    cash: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    access: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    branchOverview: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
    branch: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    reports: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    allUsers: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    branchAdmin: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    accountant: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    technician: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    support: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    logout: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    thirdPartyServices: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-20 sticky top-0">
        <div className="h-16 flex">
          {/* Logo Area - Full Sidebar Width (240px) */}
          <div className="hidden md:flex md:w-60 md:items-center md:justify-center md:border-r md:border-gray-200 flex-shrink-0 overflow-hidden px-0">
            <img
              src={logoUrl}
              alt="Company Logo"
              className="h-12 w-full object-cover"
            />
          </div>

          {/* Mobile Menu Button & Logo */}
          <div className="md:hidden flex items-center gap-3 px-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img
              src={logoUrl}
              alt="Company Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end px-4 sm:px-6 gap-4">
            <button
              onClick={handleViewUserProfile}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="View profile"
            >
              {currentUser?.profile_image ? (
                <img
                  src={`http://localhost:8000/storage/${currentUser.profile_image}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-primary/20"
                />
              ) : (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm text-primary">
                  {currentUser?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{currentUser?.name}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-gray-200 hover:border-red-200"
            >
              {icons.logout}
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 md:hidden z-30 top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — bg-gray-600 (dark grey), white text, white+black on hover/active */}
        <aside className={`${sidebarOpen ? 'fixed' : 'hidden'} md:flex md:fixed md:left-0 md:top-16 md:w-60 md:h-[calc(100vh-64px)] bg-gray-600 flex-col z-40 border-r border-gray-500 left-0 top-16 w-60`}
          style={{
            height: 'calc(100vh - 64px)'
          }}>

          {/* Mobile Close Button */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-500 flex-shrink-0">
            <h3 className="text-white font-semibold text-sm">Menu</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-gray-500 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 min-h-0 py-4 space-y-0.5 overflow-y-auto sidebar-scroll pr-3">
            <style>{`
              .sidebar-scroll {
                scrollbar-width: auto;
                scrollbar-color: #6B7280 #374151;
              }
              .sidebar-scroll::-webkit-scrollbar {
                width: 12px;
              }
              .sidebar-scroll::-webkit-scrollbar-track {
                background: #374151;
              }
              .sidebar-scroll::-webkit-scrollbar-thumb {
                background: #6B7280;
                border-radius: 6px;
              }
              .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                background: #9CA3AF;
              }
              .sidebar-scroll::-webkit-scrollbar-thumb:active {
                background: #D1D5DB;
              }
            `}</style>

            <NavItem path="/dashboard" icon={icons.dashboard} label="Dashboard" badge={pendingApprovalsCount} />

            {canViewUsers && (
              <div>
                <button
                  onClick={() => setUsersMenuOpen(!usersMenuOpen)}
                  className={`w-full text-left px-5 py-3 flex items-center justify-between gap-3 transition-all group border-l-[3px] ${
                    isActive('/users')
                      ? 'bg-white text-gray-900 border-primary'
                      : 'text-white hover:bg-white hover:text-gray-900 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive('/users') ? 'text-primary' : 'text-gray-300 group-hover:text-gray-700'}`}>
                      {icons.users}
                    </span>
                    <span className="text-sm font-medium">Users</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className={`w-3.5 h-3.5 transition-transform ${isActive('/users') ? 'text-gray-700' : 'text-gray-300 group-hover:text-gray-700'} ${usersMenuOpen ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {usersMenuOpen && (
                  <div className="bg-gray-700 py-1">
                    {/* All Users tab */}
                    {user.permissions.includes('view_all_users') && (
                      <SubNavItem path="/users" icon={icons.allUsers} label="All Users" />
                    )}
                    {/* Branch Admins tab */}
                    {user.permissions.includes('view_branch_admins') && (
                      <SubNavItem path="/users/branch_admin" icon={icons.branchAdmin} label="Branch Admins" />
                    )}
                    {/* Accountants tab */}
                    {user.permissions.includes('view_accountants') && (
                      <SubNavItem path="/users/accountant" icon={icons.accountant} label="Accountants" />
                    )}
                    {/* Technicians tab */}
                    {user.permissions.includes('view_technicians') && (
                      <SubNavItem path="/users/employee" icon={icons.technician} label="Technicians" />
                    )}
                    {/* Support Staff tab */}
                    {user.permissions.includes('view_support_staff') && (
                      <SubNavItem path="/users/support_staff" icon={icons.support} label="Support Staff" />
                    )}
                  </div>
                )}
              </div>
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_customers_vehicles_tab')) && (
              <NavItem path="/customers" icon={icons.customers} label="Customers & Vehicles" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_my_tasks_tab')) && (
              <NavItem path="/my-tasks" icon={icons.tasks} label="My Tasks" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_job_cards_tab')) && (
              <NavItem path="/job-cards" icon={icons.jobCards} label="Job Cards" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_task_approval_tab')) && (
              <NavItem path="/task-approval" icon={icons.approval} label="Task Approval" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_quotations_tab')) && (
              <NavItem path="/quotations" icon={icons.quotations} label="Quotations" />
            )}

            {['super_admin', 'branch_admin', 'accountant'].includes(user.role.name) && (
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Finance</p>
              </div>
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_invoices_tab')) && (
              <NavItem path="/invoices" icon={icons.invoices} label="Invoice Management" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_financial_reports_tab')) && (
              <NavItem path="/reports" icon={icons.reports} label="Financial Reports" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_petty_cash_tab')) && (
              <NavItem path="/petty-cash" icon={icons.cash} label="Petty Cash" />
            )}

            {(user.role.name === 'super_admin' || user.permissions.includes('view_third_party_services_tab')) && (
              <NavItem path="/third-party-services" icon={icons.thirdPartyServices} label="3rd Party Services" />
            )}

            {user.role.name === 'super_admin' && (
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Administration</p>
              </div>
            )}

            {user.role.name === 'super_admin' && (
              <NavItem path="/access-rights" icon={icons.access} label="Access Rights" />
            )}

            {user.role.name === 'super_admin' && (
              <NavItem path="/branch-management" icon={icons.branch} label="Branch Management" />
            )}

            {user.role.name === 'super_admin' && (
              <NavItem path="/branch-overview" icon={icons.branchOverview} label="Branch Overview" />
            )}

            {user.role.name === 'super_admin' && (
              <NavItem path="/settings" icon={icons.settings} label="Settings" />
            )}

           
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-500">
            <button
              onClick={handleViewUserProfile}
              className="w-full flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
              title="View profile"
            >
              {currentUser?.profile_image ? (
                <img
                  src={`http://localhost:8000/storage/${currentUser.profile_image}`}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-gray-400"
                />
              ) : (
                <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-xs text-white">
                  {currentUser?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser?.role?.display_name}</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full md:ml-60 flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto bg-gray-50">
          {React.cloneElement(children, { selectedBranchId, onLogoChange: handleLogoChange })}
        </main>
      </div>

      {/* View User Modal */}
      {showUserModal && viewingUserData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">User Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">{viewingUserData.name}</p>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-7 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Profile Photo Section */}
              {viewingUserData?.profile_image && (
                <div className="flex justify-center mb-4">
                  {console.log('Modal - Rendering profile image:', viewingUserData.profile_image, 'URL:', `/storage/${viewingUserData.profile_image}`)}
                  <div className="relative">
                    <img 
                      src={`http://localhost:8000/storage/${viewingUserData.profile_image}`}
                      alt={viewingUserData?.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.name}</p>
                </div>

                {/* First Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">First Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.first_name || 'Not provided'}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.email}</p>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.phone || 'Not provided'}</p>
                </div>

                {/* Employee Code */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Employee Code</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{viewingUserData.employee_code || 'Not assigned'}</p>
                </div>

                {/* Gender */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gender</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{viewingUserData.gender || 'Not provided'}</p>
                </div>

                {/* Date of Birth */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.date_of_birth ? new Date(viewingUserData.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                </div>

                {/* Join Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Join Date</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.join_date ? new Date(viewingUserData.join_date).toLocaleDateString() : 'Not provided'}</p>
                </div>

                {/* Left Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Left Date</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.left_date ? new Date(viewingUserData.left_date).toLocaleDateString() : 'Still employed'}</p>
                </div>

                {/* Role */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Role</p>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(viewingUserData.role?.name)}`}>
                      {viewingUserData.role?.display_name}
                    </span>
                  </div>
                </div>

                {/* Technician Type */}
                {viewingUserData.technician_type && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Technician Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {viewingUserData.technician_type === 'employee' ? 'Employee' : viewingUserData.technician_type === 'supervisor' ? 'Supervisor' : viewingUserData.technician_type}
                    </p>
                  </div>
                )}

                {/* Branch */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Branch</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.branch?.name || 'No branch assigned'}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      viewingUserData.is_active
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${viewingUserData.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {viewingUserData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Emergency Contact Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emergency Contact Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.emergency_contact_name || 'Not provided'}</p>
                </div>

                {/* Emergency Contact Number */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emergency Contact Number</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUserData.emergency_contact_no || 'Not provided'}</p>
                </div>

                {/* Special Notes */}
                {viewingUserData.special_notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Special Notes</p>
                    <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{viewingUserData.special_notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => setShowUserModal(false)} className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold border border-red-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout