import { useState, useEffect, useRef } from 'react'
import axiosClient from '../../api/axios'
import MiniCalendar from './MiniCalendar'

function AnalyticsDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [recentJobCards, setRecentJobCards] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [calendarJobCards, setCalendarJobCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState([])
  const [filterBranch, setFilterBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [searchBranch, setSearchBranch] = useState('')
  const branchDropdownRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    // Load saved branch filter from localStorage
    const savedBranch = localStorage.getItem('selectedBranchId') || ''
    setFilterBranch(savedBranch)
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [filterBranch])

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches/simple', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data)
      // Set default branch if not already set
      if (!filterBranch && response.data.length > 0) {
        setFilterBranch(String(response.data[0].id))
        localStorage.setItem('selectedBranchId', String(response.data[0].id))
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = filterBranch ? `?branch_id=${parseInt(filterBranch)}` : ''
      
      const statsResponse = await axiosClient.get(`/job-cards/statistics${params}`, { headers: { Authorization: `Bearer ${token}` } })
      setStats(statsResponse.data)
      setEmployeeCount(5)
      
      const jobCardsResponse = await axiosClient.get(`/job-cards${params}`, { headers: { Authorization: `Bearer ${token}` } })
      setRecentJobCards(jobCardsResponse.data.data.slice(0, 5))
      setCalendarJobCards(jobCardsResponse.data.data)
      
      if (['employee', 'super_admin', 'branch_admin'].includes(user.role.name)) {
        const approvalsResponse = await axiosClient.get(`/spare-parts/pending/approvals${params}`, { headers: { Authorization: `Bearer ${token}` } })
        setPendingApprovals(approvalsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(amount)

  const getStatusDot = (status) => {
    const colors = {
      pending: 'bg-yellow-400', in_progress: 'bg-blue-500',
      completed: 'bg-green-500', inspected: 'bg-indigo-500',
      invoiced: 'bg-teal-500', paid: 'bg-emerald-500', cancelled: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending', in_progress: 'In Progress',
      completed: 'Completed', inspected: 'Inspected',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-yellow-50', iconColor: 'text-yellow-500',
      valColor: 'text-yellow-600', accent: 'border-yellow-400',
    },
    {
      label: 'In Progress',
      value: stats?.in_progress ?? 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
      valColor: 'text-blue-600', accent: 'border-blue-400',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      iconBg: 'bg-green-50', iconColor: 'text-green-500',
      valColor: 'text-green-600', accent: 'border-green-400',
    },
    {
      label: 'Employees',
      value: employeeCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      iconBg: 'bg-cyan-50', iconColor: 'text-cyan-500',
      valColor: 'text-cyan-600', accent: 'border-cyan-400',
    },
  ]

  return (
    <div className="space-y-5">

      {/* Branch Filter Dropdown */}
      {user.role.name === 'super_admin' && (
        <div ref={branchDropdownRef} className="relative w-fit">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-orange-300" />
            <span className="text-sm font-bold text-orange-900 flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-orange-600 transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-orange-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Search in dropdown */}
              <div className="p-3 border-b border-orange-100 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={searchBranch}
                  onChange={(e) => setSearchBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              {/* Dropdown options */}
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranch('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                    filterBranch === ''
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-orange-300'}`} />
                    All Branches
                  </div>
                </button>

                {branches
                  .filter(branch => branch.name.toLowerCase().includes(searchBranch.toLowerCase()))
                  .map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => {
                        setFilterBranch(String(branch.id))
                        localStorage.setItem('selectedBranchId', String(branch.id))
                        setBranchDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                        filterBranch === String(branch.id)
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
                          : 'text-gray-700 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-orange-300'}`} />
                        {branch.name}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="relative overflow-hidden bg-[#2563A8] rounded-2xl shadow-lg px-8 py-7">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 right-20 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            Logged in as <span className="font-semibold text-white">{user.role.display_name}</span>
            {user.branch && <span> · {user.branch.name}</span>}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(s => (
            <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.accent} border-t border-r border-b border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow`}>
              <div className={`w-11 h-11 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl font-bold mt-0.5 ${s.valColor}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Job Card Status
        </h3>
        <div className="space-y-2.5">
          {[
            { label: 'Completed',      count: stats?.completed      || 0, cls: 'bg-green-500'  },
            { label: 'Inspected',     count: stats?.inspected      || 0, cls: 'bg-indigo-500' },

          ].map(item => {
            const pct = stats?.total > 0 ? (item.count / stats.total) * 100 : 0
            return (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-24 text-xs font-semibold text-gray-600 flex-shrink-0">{item.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`${item.cls} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 w-14 justify-end flex-shrink-0">
                  <span className="text-xs font-bold text-gray-700">{item.count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="w-full">
        <MiniCalendar jobCards={calendarJobCards} />
      </div>

      {/* Recent Job Cards + Approvals / Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Job Cards */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Job Cards
          </h3>
          {recentJobCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-400">No recent job cards</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobCards.map(jobCard => (
                <div key={jobCard.id} className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-gray-50/60 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(jobCard.status)}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{jobCard.job_card_number}</p>
                      <p className="text-xs text-gray-400 truncate">{jobCard.customer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs font-semibold text-gray-500 font-mono">{jobCard.vehicle?.license_plate}</p>
                    <p className="text-xs font-bold text-gray-800">{formatCurrency(jobCard.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Pending Approvals
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {pendingApprovals.length}
              </span>
            </h3>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 5).map(part => (
                <div key={part.id} className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-orange-100 bg-orange-50/50">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{part.part_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{part.job_card?.job_card_number} · Qty: {part.quantity}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Pending
                    </span>
                    <p className="text-xs font-bold text-primary">{formatCurrency(part.total_cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Quick Stats fallback */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Quick Stats
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Total Jobs',     value: stats?.total      || 0, iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   valColor: 'text-blue-600',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
                { label: 'Completed',      value: stats?.completed   || 0, iconBg: 'bg-green-50',  iconColor: 'text-green-500',  valColor: 'text-green-600',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> },
                { label: 'Active Jobs',    value: stats?.in_progress || 0, iconBg: 'bg-purple-50', iconColor: 'text-purple-500', valColor: 'text-purple-600',
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.iconBg} ${s.iconColor} flex items-center justify-center`}>{s.icon}</div>
                    <span className="text-sm text-gray-600 font-medium">{s.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${s.valColor}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Your Permissions
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {user.permissions.slice(0, 12).map((permission, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {permission.replace(/_/g, ' ')}
            </span>
          ))}
          {user.permissions.length > 12 && (
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-xs font-medium">
              +{user.permissions.length - 12} more
            </span>
          )}
        </div>
      </div>

    </div>
  )
}

export default AnalyticsDashboard