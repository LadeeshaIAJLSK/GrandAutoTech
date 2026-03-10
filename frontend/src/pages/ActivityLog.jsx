import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'

function ActivityLog({ user }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [branches, setBranches] = useState([])
  const [filterBranch, setFilterBranch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterRiskLevel, setFilterRiskLevel] = useState('')
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
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
    const savedBranch = localStorage.getItem('selectedBranchId') || ''
    setFilterBranch(savedBranch)
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchActivities()
    fetchStats()
  }, [filterBranch, filterAction, filterRiskLevel, showSuspiciousOnly, searchText, currentPage])

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches/simple', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data)
      if (!filterBranch && response.data.length > 0) {
        setFilterBranch(String(response.data[0].id))
        localStorage.setItem('selectedBranchId', String(response.data[0].id))
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (filterBranch) params.append('branch_id', parseInt(filterBranch))
      if (filterAction) params.append('action', filterAction)
      if (filterRiskLevel) params.append('risk_level', filterRiskLevel)
      if (showSuspiciousOnly) params.append('suspicious', 'true')
      if (searchText) params.append('search', searchText)
      params.append('page', currentPage)
      params.append('per_page', 25)

      const response = await axiosClient.get(`/activities?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActivities(response.data.data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = filterBranch ? `?branch_id=${parseInt(filterBranch)}` : ''
      const response = await axiosClient.get(`/activities/statistics${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getRiskLevelColor = (level) => {
    const colors = {
      low: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
      medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
      high: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    }
    return colors[level] || colors.low
  }

  const getActionIcon = (action) => {
    const icons = {
      created: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
      updated: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v5h5a2 2 0 110 4h-5v5a2 2 0 11-4 0v-5H6a2 2 0 110-4h5V4z" /></svg>,
      deleted: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      approved: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
      rejected: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
      viewed: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      downloaded: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    }
    return icons[action] || icons.viewed
  }

  if (loading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading activity logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time tracking of all system activities and suspicious actions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition">
            <div className="text-gray-600 text-sm font-medium">Total Activities</div>
            <div className="text-3xl font-bold text-primary mt-2">{stats.total_activities}</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4 hover:shadow-md transition">
            <div className="text-red-700 text-sm font-medium">Suspicious</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.suspicious_activities}</div>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 shadow-sm p-4 hover:shadow-md transition">
            <div className="text-orange-700 text-sm font-medium">High Risk</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">{stats.high_risk_activities}</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 hover:shadow-md transition">
            <div className="text-blue-700 text-sm font-medium">Today</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.activities_today}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Branch Filter - Super Admin Only */}
          {user.role.name === 'super_admin' && (
            <div ref={branchDropdownRef} className="relative">
              <button
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="w-full flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-sm hover:shadow-md rounded-lg px-3 py-2 text-sm font-medium text-orange-900 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
              </button>

              {branchDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-[240px] bg-white border border-orange-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-2 border-b border-orange-100">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchBranch}
                      onChange={(e) => setSearchBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-orange-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setFilterBranch('')
                        setBranchDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm font-medium ${filterBranch === '' ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-orange-50'}`}
                    >
                      All Branches
                    </button>
                    {branches
                      .filter(b => b.name.toLowerCase().includes(searchBranch.toLowerCase()))
                      .map(branch => (
                        <button
                          key={branch.id}
                          onClick={() => {
                            setFilterBranch(String(branch.id))
                            setBranchDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm font-medium ${filterBranch === String(branch.id) ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-orange-50'}`}
                        >
                          {branch.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="viewed">Viewed</option>
            <option value="downloaded">Downloaded</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Suspicious Toggle */}
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showSuspiciousOnly}
              onChange={(e) => setShowSuspiciousOnly(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium text-gray-700">Suspicious Only</span>
          </label>

          {/* Search */}
          <input
            type="text"
            placeholder="Search activities..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {activities.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">No activities found</p>
            </div>
          ) : (
            activities.map((activity) => {
              const riskColors = getRiskLevelColor(activity.risk_level)
              return (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${riskColors.bg} text-primary`}>
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{activity.user?.name}</span>
                          <span className="text-sm text-gray-500">{activity.action}</span>
                          <span className="text-sm text-gray-500">{activity.model}</span>
                          {activity.is_suspicious && (
                            <span className="inline-block px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded">
                              🚨 SUSPICIOUS
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        {activity.risk_reason && (
                          <p className={`text-xs mt-1.5 ${riskColors.text}`}>⚠️ {activity.risk_reason}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">{activity.branch?.name}</span>
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${riskColors.badge}`}>
                            {activity.risk_level.charAt(0).toUpperCase() + activity.risk_level.slice(1)} Risk
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityLog
