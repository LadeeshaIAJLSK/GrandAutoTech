import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import JobCardCreateWizard from '../components/jobcards/JobCardCreateWizard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import axiosClient from '../api/axios'
import { createPortal } from 'react-dom'
import Notification from '../components/common/Notification'

function JobCardManagement({ user, selectedBranchId }) {
  const navigate = useNavigate()
  const [jobCards, setJobCards] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [editingJobCard, setEditingJobCard] = useState(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [branches, setBranches] = useState([])
  const [filterBranch, setFilterBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [pendingPartsCounts, setPendingPartsCounts] = useState({})
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [notification, setNotification] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const buttonRefs = useRef({})
  const branchDropdownRef = useRef(null)

  const canAdd = user.role.name === 'super_admin' || user.permissions.includes('add_job_cards')
  const canUpdate = user.role.name === 'super_admin' || user.permissions.includes('update_job_cards')
  const canDelete = user.role.name === 'super_admin' || user.permissions.includes('delete_job_cards')

  useEffect(() => {
    // Load saved branch filter from localStorage (for super admin only)
    // For non-super-admins, automatically set to their own branch
    if (user.role.name === 'super_admin') {
      const savedBranch = localStorage.getItem('selectedBranchId') || ''
      setFilterBranch(savedBranch)
    } else {
      // Non-super-admins always see their own branch
      setFilterBranch(String(user.branch_id || ''))
    }
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchJobCards()
    fetchStatistics()
  }, [search, statusFilter, filterBranch])

  useEffect(() => {
    const handleClick = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClick)

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  const fetchPendingPartsCounts = async (cards) => {
    if (!['super_admin', 'branch_admin'].includes(user?.role?.name)) return
    if (cards.length === 0) return
    try {
      const token = localStorage.getItem('token')
      const counts = {}
      const cardsToCheck = cards.slice(0, 5)
      for (const card of cardsToCheck) {
        try {
          const response = await axiosClient.get(`/job-cards/${card.id}/spare-parts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const pendingCount = response.data.filter(p => p.admin_status === 'pending').length
          if (pendingCount > 0) counts[card.id] = pendingCount
        } catch (error) {
          console.error(`Error fetching parts for job card ${card.id}:`, error)
        }
      }
      setPendingPartsCounts(counts)
    } catch (error) {
      console.error('Error fetching pending parts counts:', error)
    }
  }

  const fetchJobCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (filterBranch) params.branch_id = filterBranch
      const response = await axiosClient.get('/job-cards', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      const jobCardsData = response.data.data || response.data
      setJobCards(Array.isArray(jobCardsData) ? jobCardsData : [])
      if (['super_admin', 'branch_admin'].includes(user?.role?.name)) {
        setTimeout(() => {
          fetchPendingPartsCounts(Array.isArray(jobCardsData) ? jobCardsData : [])
        }, 500)
      }
    } catch (error) {
      console.error('Error fetching job cards:', error)
      setNotification({ type: 'error', title: 'Loading Failed', message: error.response?.data?.message || error.message })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/job-cards/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatistics(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches/simple', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending:          'bg-yellow-50 text-yellow-700 border-yellow-200',
      in_progress:      'bg-blue-50 text-blue-700 border-blue-200',
      completed:        'bg-orange-50 text-orange-700 border-orange-200',
      inspected:        'bg-indigo-50 text-indigo-700 border-indigo-200',
    }
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getStatusDot = (status) => {
    const dots = {
      pending:          'bg-yellow-400',
      in_progress:      'bg-blue-500',
      completed:        'bg-orange-500',
      inspected:        'bg-indigo-500',
    }
    return dots[status] || 'bg-gray-400'
  }

  const formatStatus = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const handleDelete = async (jobCardId) => {
    setDeleteConfirm(jobCardId)
  }

  const confirmDelete = async (jobCardId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/job-cards/${jobCardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDeleteConfirm(null)
      setNotification({ type: 'success', title: 'Deleted Successfully', message: 'Job card has been deleted successfully!' })
      fetchJobCards()
      fetchStatistics()
    } catch (error) {
      setDeleteConfirm(null)
      setNotification({ type: 'error', title: 'Deletion Failed', message: error.response?.data?.message || 'Error deleting job card' })
    }
  }

  const handleStatusChange = async (jobCardId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/job-cards/${jobCardId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', title: 'Status Updated', message: `Status updated to ${formatStatus(newStatus)}` })
      fetchJobCards()
      fetchStatistics()
    } catch (error) {
      setNotification({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || 'Error updating status' })
    }
  }

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    if (openMenuId === id) { 
      setOpenMenuId(null)
      return 
    }
    
    const btn = buttonRefs.current[id]
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const menuHeight = 160 // approximate height of menu
      const spaceBelow = window.innerHeight - rect.bottom
      
      // Calculate position to keep menu visible
      let topPos = rect.bottom + 8
      let bottomPos = undefined
      
      if (spaceBelow < menuHeight + 20) {
        // Not enough space below, position above
        topPos = undefined
        bottomPos = window.innerHeight - rect.top + 8
      }
      
      // Right align the menu with slight offset
      const rightPos = window.innerWidth - rect.right
      
      setMenuPos({ 
        top: topPos, 
        bottom: bottomPos, 
        right: rightPos
      })
    }
    setOpenMenuId(id)
  }

  const handleEditJobCard = async (jobCard) => {
    try {
      setLoadingEdit(true)
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${jobCard.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('=== EDIT FETCH RAW RESPONSE ===')
      console.log('Full response:', response.data)
      console.log('Response.data.data:', response.data?.data)
      console.log('Response.data.images:', response.data?.images)
      
      const fullJobCard = response.data.data || response.data
      console.log('=== EXTRACTED JOB CARD ===')
      console.log('Full job card:', fullJobCard)
      console.log('Job card images:', fullJobCard?.images)
      console.log('Images array length:', fullJobCard?.images?.length || 0)
      
      setEditingJobCard(fullJobCard)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error fetching job card:', error)
      setNotification({ type: 'error', title: 'Loading Failed', message: 'Error loading job card for editing' })
    } finally {
      setLoadingEdit(false)
    }
  }

  const DropdownMenu = ({ jobCard }) => {
    return createPortal(
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[180px]"
        style={{ 
          position: 'fixed',
          top: menuPos.top !== undefined ? `${menuPos.top}px` : 'auto',
          bottom: menuPos.bottom !== undefined ? `${menuPos.bottom}px` : 'auto',
          right: menuPos.right !== undefined ? `${menuPos.right}px` : 'auto',
          left: 'auto'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { navigate(`/job-cards/${jobCard.id}`); setOpenMenuId(null) }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-medium">View</span>
        </button>
        {canUpdate && (
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
            onClick={() => { handleEditJobCard(jobCard) }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-medium">Edit</span>
          </button>
        )}
        {canDelete && (jobCard.status === 'pending' || jobCard.status === 'cancelled') && (
          <button
            onClick={() => { handleDelete(jobCard.id); setOpenMenuId(null) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-medium">Delete</span>
          </button>
        )}
      </div>,
      document.body
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading job cards...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Branch Filter - Only for Super Admin */}
      {user.role.name === 'super_admin' && (
        <div ref={branchDropdownRef} className="relative w-fit">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#2563A8]/10 to-[#2563A8]/30 border border-[#2563A8]/50 shadow-sm hover:shadow-md hover:border-[#2563A8]/70 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#2563A8] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-[#2563A8]/30" />
            <span className="text-sm font-bold text-[#2563A8] flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-[#2563A8] transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[#2563A8]/50 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranch('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${filterBranch === '' ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white' : 'text-gray-700 hover:bg-[#2563A8]/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                    All Branches
                  </div>
                </button>
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setFilterBranch(String(branch.id))
                      localStorage.setItem('selectedBranchId', String(branch.id))
                      setBranchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${filterBranch === String(branch.id) ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white' : 'text-gray-700 hover:bg-[#2563A8]/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                      {branch.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.in_progress}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Revenue</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(statistics.total_revenue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Job Cards</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage and track all service jobs</p>
        </div>
        {canAdd && (
          <button
            onClick={() => {
              const initialBranchId = user.role.name === 'super_admin' 
                ? (filterBranch || user.branch?.id || '')
                : (user.branch?.id || '')
              setShowCreateWizard({ initialBranchId })
            }}
            className="inline-flex items-center gap-2 bg-[#2563A8] hover:bg-[#1E4E7E] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <span className="flex items-center justify-center w-5 h-5 bg-white/25 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            Create Job Card
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-row gap-3 items-center">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search job cards by name phone email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all min-w-[180px] shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="inspected">Inspected</option>
        </select>

        <div className="ml-auto flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <span className="text-sm font-semibold text-gray-700">{jobCards.length}</span>
          <span className="text-sm text-gray-400">{jobCards.length !== 1 ? 'job cards' : 'job card'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100" style={{ backgroundColor: '#2563A8' }}>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider" style={{ width: '18%' }}>Job Card</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider" style={{ width: '19%' }}>Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider" style={{ width: '17%' }}>Vehicle</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider" style={{ width: '8%' }}>Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider" style={{ width: '30%' }}>Dates</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-white uppercase tracking-wider" style={{ width: '8%' }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobCards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-400 font-medium">No job cards found</p>
                      <p className="text-gray-300 text-xs">
                        {canAdd ? 'Create your first job card to get started' : 'No job cards available'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                jobCards.map(jobCard => (
                  <tr
                    key={jobCard.id}
                    className={`transition-colors ${
                      pendingPartsCounts[jobCard.id]
                        ? 'bg-red-50/60 border-l-[3px] border-red-400 hover:bg-red-50'
                        : 'hover:bg-gray-50/70'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {pendingPartsCounts[jobCard.id] > 0 && (
                          <span
                            title={`${pendingPartsCounts[jobCard.id]} parts pending approval`}
                            className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-primary text-sm">{jobCard.job_card_number}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(jobCard.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{jobCard.customer?.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{jobCard.customer?.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-700 text-xs tracking-widest font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md inline-block">
                        {jobCard.vehicle?.license_plate}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {jobCard.vehicle?.make} {jobCard.vehicle?.model} · {jobCard.vehicle?.year}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {canUpdate && jobCard.status !== 'cancelled' ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyle(jobCard.status)}`}>
                          {jobCard.status}
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyle(jobCard.status)}`}>
                          {jobCard.status}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">
                          <span className="text-gray-600 font-bold">Created:</span> {new Date(jobCard.created_at).toLocaleDateString()} | <span className="text-gray-600 font-bold">Expected:</span> {jobCard.estimated_completion_date ? new Date(jobCard.estimated_completion_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right relative">
                      <button
                        ref={el => buttonRefs.current[jobCard.id] = el}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleMenu(e, jobCard.id)
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150"
                        type="button"
                        aria-label="Actions menu"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuId === jobCard.id && <DropdownMenu jobCard={jobCard} />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateWizard && createPortal(
        <JobCardCreateWizard
          show={typeof showCreateWizard === 'object' ? true : showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
          onSuccess={(jobCard) => {
            setShowCreateWizard(false)
            setNotification({ type: 'success', title: 'Created Successfully', message: 'Job card has been created successfully!' })
            fetchJobCards()
            fetchStatistics()
          }}
          user={user}
          branches={branches}
          initialBranchId={typeof showCreateWizard === 'object' ? showCreateWizard.initialBranchId : ''}
        />,
        document.body
      )}

      {editingJobCard && createPortal(
        <JobCardCreateWizard
          show={true}
          onClose={() => setEditingJobCard(null)}
          onSuccess={() => {
            setEditingJobCard(null)
            setNotification({ type: 'success', title: 'Updated Successfully', message: 'Job card has been updated successfully!' })
            fetchJobCards()
            fetchStatistics()
          }}
          user={user}
          branches={branches}
          jobCard={editingJobCard}
        />,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={deleteConfirm ? true : false}
        type="danger"
        title="Delete Job Card"
        message="Are you sure you want to delete this job card? This action cannot be undone."
        onConfirm={() => confirmDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default JobCardManagement