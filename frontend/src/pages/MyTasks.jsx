import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'

function MyTasks({ user, selectedBranchId, onBranchChange }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestPartsModal, setShowRequestPartsModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [taskParts, setTaskParts] = useState({})
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [timerUpdate, setTimerUpdate] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [branches, setBranches] = useState([])
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [branchSearchInput, setBranchSearchInput] = useState('')
  const branchDropdownRef = useRef(null)
  const [filterBranchId, setFilterBranchId] = useState(localStorage.getItem('selectedBranchId') || '')

  const [partsRequest, setPartsRequest] = useState({
    part_name: '',
    part_number: '',
    description: '',
    quantity: '',
  })
  const [expandedPartsTask, setExpandedPartsTask] = useState(null)

  useEffect(() => {
    fetchMyTasks()
  }, [filterBranchId])

  // Fetch branches for super admin
  useEffect(() => {
    if (user.role.name === 'super_admin') {
      const token = localStorage.getItem('token')
      axiosClient.get('/branches', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setBranches(res.data.data || res.data))
        .catch(err => console.error('Error fetching branches:', err))
    }
  }, [user.role.name])

  useEffect(() => {
    const handleClick = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Live timer update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Handle responsive breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    tasks.forEach(task => {
      if (task.id && !taskParts[task.id]) fetchTaskParts(task.id)
    })
  }, [tasks])

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = user.role.name === 'super_admin' ? '/all-tasks' : '/my-tasks'
      const params = filterBranchId ? { branch_id: filterBranchId } : {}
      const response = await axiosClient.get(endpoint, { 
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      setTasks(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsDone = async (taskId) => {
    // Check if there are any requested spare parts
    const task = tasks.find(t => t.id === taskId)
    const parts = taskParts[taskId] || []
    
    // If there are requested parts, check if all are delivered
    if (parts.length > 0) {
      const undeliveredParts = parts.filter(p => p.overall_status !== 'delivered')
      if (undeliveredParts.length > 0) {
        alert(`❌ Cannot mark task as done!\n\nYou have ${undeliveredParts.length} spare part(s) that are not yet delivered:\n\n${undeliveredParts.map(p => `• ${p.part_name}`).join('\n')}\n\nPlease mark all spare parts as delivered first.`)
        return
      }
    }

    if (!confirm('Submit this task for approval?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/tasks/${taskId}/mark-done`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert(`Task submitted for approval! Total time: ${Math.floor(response.data.total_time_spent / 60)}h ${response.data.total_time_spent % 60}m`)
      fetchMyTasks()
    } catch (error) {
      // Handle backend validation errors about undelivered parts
      if (error.response?.data?.undelivered_parts && error.response?.data?.undelivered_parts.length > 0) {
        const partsList = error.response.data.undelivered_parts.join('\n• ')
        alert(`❌ Cannot mark task as done!\n\nThe following spare parts are not yet delivered:\n• ${partsList}\n\nPlease mark all spare parts as delivered first.`)
      } else {
        alert(error.response?.data?.message || 'Error completing task')
      }
    }
  }

  const fetchTaskParts = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${tasks.find(t => t.id === taskId)?.job_card_id}/spare-parts`, { headers: { Authorization: `Bearer ${token}` } })
      const parts = response.data.filter(p => p.task_id === taskId)
      setTaskParts(prev => ({ ...prev, [taskId]: parts }))
    } catch (error) {
      console.error('Error fetching parts:', error)
    }
  }

  const handleConfirmDelivery = async (partId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/confirm-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Parts delivery confirmed!')
      fetchMyTasks()
      if (selectedTask) fetchTaskParts(selectedTask.id)
    } catch (error) {
      alert(error.response?.data?.message || 'Error confirming delivery')
    }
  }

  const handleRequestParts = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${selectedTask.job_card_id}/spare-parts`, {
        ...partsRequest,
        task_id: selectedTask.id
      }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Parts requested! Waiting for approval.')
      setShowRequestPartsModal(false)
      setPartsRequest({ part_name: '', part_number: '', description: '' })
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting parts')
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getElapsedTime = (startTime) => {
    if (!startTime) return '0h 0m'; // Fallback for missing start_time

    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;

    if (diffMs < 0) return '0h 0m'; // Fallback for future start_time

    const diffMins = Math.floor(diffMs / 60000);
    return formatTime(diffMins);
  }

  const getTotalElapsedTime = (task) => {
    if (!task.time_tracking || task.time_tracking.length === 0) return '0h 0m'
    
    // Sum all completed durations
    let totalMinutes = task.time_tracking
      .filter(t => t.end_time)
      .reduce((sum, t) => sum + (t.duration_minutes || 0), 0)
    
    // Add elapsed time from active timer if any
    const activeTimer = task.time_tracking.find(t => !t.end_time)
    if (activeTimer) {
      const elapsedMinutes = Math.floor((new Date() - new Date(activeTimer.start_time)) / 60000)
      totalMinutes += elapsedMinutes
    }
    
    return formatTime(totalMinutes)
  }

  const getStatusStyle = (status) => {
    const s = {
      pending:           { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dot: 'bg-yellow-400',  label: 'Pending' },
      assigned:          { cls: 'bg-blue-50 text-blue-700 border-blue-200',        dot: 'bg-blue-500',    label: 'Assigned' },
      in_progress:       { cls: 'bg-purple-50 text-purple-700 border-purple-200',  dot: 'bg-purple-500',  label: 'In Progress' },
      awaiting_approval: { cls: 'bg-orange-50 text-orange-700 border-orange-200',  dot: 'bg-orange-400',  label: 'Awaiting Approval' },
      completed:         { cls: 'bg-green-50 text-green-700 border-green-200',     dot: 'bg-green-500',   label: 'Completed' },
    }
    return s[status] || { cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', label: status }
  }

  const formatJobCardStatus = (status) => {
    const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading tasks...</p>
      </div>
    )
  }

  const employeeFilteredTasks = user.role.name === 'super_admin' && employeeFilter.trim()
    ? tasks.filter(t => t.assigned_to_user?.name?.toLowerCase().includes(employeeFilter.toLowerCase()))
    : tasks

  const activeTasks          = employeeFilteredTasks.filter(t => t.status === 'in_progress')
  const assignedTasks        = employeeFilteredTasks.filter(t => t.status === 'assigned')
  const awaitingApprovalTasks = employeeFilteredTasks.filter(t => t.status === 'awaiting_approval')
  const completedTasks       = employeeFilteredTasks.filter(t => t.status === 'completed')
  const pendingTasks         = employeeFilteredTasks.filter(t => t.status === 'pending')

  let filteredTasks = []
  switch(taskStatusFilter) {
    case 'active':    filteredTasks = activeTasks; break
    case 'assigned':  filteredTasks = assignedTasks; break
    case 'pending':   filteredTasks = pendingTasks; break
    case 'awaiting':  filteredTasks = awaitingApprovalTasks; break
    case 'completed': filteredTasks = completedTasks; break
    default:          filteredTasks = employeeFilteredTasks
  }

  const filterCounts = {
    all: employeeFilteredTasks.length,
    active: activeTasks.length,
    assigned: assignedTasks.length,
    pending: pendingTasks.length,
    awaiting: awaitingApprovalTasks.length,
    completed: completedTasks.length,
  }

  const groupedByJobCard = filteredTasks.reduce((acc, task) => {
    const jobCardId = task.job_card?.id
    if (!jobCardId) return acc
    if (!acc[jobCardId]) acc[jobCardId] = { jobCard: task.job_card, tasks: [] }
    acc[jobCardId].tasks.push(task)
    return acc
  }, {})

  const jobCardGroups = Object.values(groupedByJobCard)

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

  const filterTabs = [
    { id: 'all',      label: 'All',              icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { id: 'active',   label: 'Active',           icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'assigned', label: 'Assigned',         icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'pending',  label: 'Pending',          icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'awaiting', label: 'Awaiting Approval',icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'completed',label: 'Completed',        icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> },
  ]

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/start-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Timer started!');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Error starting timer');
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/pause-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Timer paused!');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Error pausing timer');
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/resume-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Timer resumed!');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Error resuming timer');
    }
  };

  const handleStopTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/stop-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Task completed!');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Error stopping timer');
    }
  };

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
              {filterBranchId ? branches.find(b => b.id === parseInt(filterBranchId))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-[#2563A8] transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[#2563A8]/50 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="p-3 border-b border-orange-100 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={branchSearchInput}
                  onChange={(e) => setBranchSearchInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#2563A8]/30 rounded-lg focus:border-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]/20 transition-all"
                />
              </div>

              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranchId('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                    setBranchSearchInput('')
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                    filterBranchId === ''
                      ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                      : 'text-gray-700 hover:bg-[#2563A8]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranchId === '' ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                    All Branches
                  </div>
                </button>

                {branches
                  .filter(b => b.name.toLowerCase().includes(branchSearchInput.toLowerCase()))
                  .map(branch => (
                    <button
                      key={branch.id}
                      onClick={() => {
                        setFilterBranchId(String(branch.id))
                        localStorage.setItem('selectedBranchId', String(branch.id))
                        setBranchDropdownOpen(false)
                        setBranchSearchInput('')
                      }}
                      className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                        filterBranchId === String(branch.id)
                          ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                          : 'text-gray-700 hover:bg-[#2563A8]/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${filterBranchId === String(branch.id) ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                        {branch.name}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {user.role.name === 'super_admin' ? 'All Tasks' : 'My Tasks'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {user.role.name === 'super_admin' ? 'All employee tasks' : 'Tasks assigned to you'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <span className="text-sm font-bold text-gray-700">{filteredTasks.length}</span>
          <span className="text-xs text-gray-400">tasks</span>
        </div>
      </div>

      {/* Employee Filter (Super Admin Only) */}
      {user.role.name === 'super_admin' && (
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by employee name..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      )}

      {/* Status Filter Tabs - Responsive */}
      <div className="flex flex-wrap gap-1 sm:gap-1.5 bg-white border border-gray-200 rounded-xl p-2 shadow-sm overflow-x-auto">
        {filterTabs.map(f => (
          <button
            key={f.id}
            onClick={() => setTaskStatusFilter(f.id)}
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              taskStatusFilter === f.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.icon}
            <span className="hidden sm:inline">{f.label}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              taskStatusFilter === f.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {filterCounts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Task Groups */}
      {jobCardGroups.length > 0 ? (
        <div className="space-y-4">
          {jobCardGroups.map(group => (
            <div key={group.jobCard.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Job Card Header - Responsive */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-sm">{group.jobCard.job_card_number}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-blue-200 text-xs mt-0.5 gap-0.5">
                      <span className="truncate">{group.jobCard.customer?.name}</span>
                      <span className="font-mono font-semibold tracking-wide truncate">{group.jobCard.vehicle?.license_plate}</span>
                      {group.jobCard.branch?.name && <span className="hidden lg:inline">{group.jobCard.branch.name}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-100 bg-white/15 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                  {formatJobCardStatus(group.jobCard.status)}
                </span>
              </div>

              {/* Tasks - single column list */}
              <div className="p-4 space-y-2.5">
                {group.tasks.map(task => {
                  const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0
                  const isRunning = task.time_tracking?.some(t => !t.end_time) || false
                  const st = getStatusStyle(task.status)

                  return (
                    <div
                      key={task.id}
                      className={`rounded-lg border p-4 transition-all ${
                        isRunning
                          ? 'border-purple-300 bg-purple-50 ring-1 ring-purple-200'
                          : 'border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-sm">{task.task_name}</h4>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${isRunning ? 'animate-pulse' : ''}`} />
                              {st.label}
                            </span>
                          </div>
                          {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                        </div>

                        {/* Time — compact, inline */}
                        {(totalTime > 0 || isRunning) && (
                          <div className="flex items-center gap-1.5 flex-shrink-0 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {getTotalElapsedTime(task)}
                          </div>
                        )}
                      </div>

                      {/* Assigned employees */}
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {task.assigned_employees && task.assigned_employees.length > 0
                          ? <span className="font-medium text-gray-700">{task.assigned_employees.map(e => e.name).join(', ')}</span>
                          : <span className="italic text-gray-400">Unassigned</span>
                        }
                      </div>

                      {/* Action Buttons - Responsive */}
                      <div className="flex flex-wrap gap-2 pt-2.5 border-t border-gray-200">
                        {task.status === 'assigned' && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Start</span>
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            {isRunning ? (
                              <button
                                onClick={() => handlePauseTask(task.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">Pause</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResumeTask(task.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">Resume</span>
                              </button>
                            )}
                            {(() => {
                              const parts = taskParts[task.id] || []
                              const hasUndeliveredParts = parts.length > 0 && parts.some(p => p.overall_status !== 'delivered')
                              return (
                                <button
                                  onClick={() => handleMarkAsDone(task.id)}
                                  disabled={hasUndeliveredParts}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                                    hasUndeliveredParts
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                      : 'bg-primary hover:bg-primary-dark text-white'
                                  }`}
                                  title={hasUndeliveredParts ? 'Mark all spare parts as delivered first' : ''}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="hidden sm:inline">Complete</span>
                                  {hasUndeliveredParts && <span className="ml-1 text-xs">⚠</span>}
                                </button>
                              )
                            })()}
                          </>
                        )}
                        {(() => {
                          const canRequestParts = task.status === 'assigned' || task.status === 'in_progress'
                          return (
                            <button
                              onClick={() => {
                                if (!canRequestParts) {
                                  alert('Cannot request parts for this task. Only tasks that are assigned or in progress can request parts.')
                                  return
                                }
                                setSelectedTask(task)
                                fetchTaskParts(task.id)
                                setShowRequestPartsModal(true)
                              }}
                              disabled={!canRequestParts}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                canRequestParts
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                              } ${isMobile ? '' : 'ml-auto'}`}
                              title={!canRequestParts ? 'Cannot request parts once task is submitted or completed' : ''}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                              <span className="hidden sm:inline">Parts</span>
                            </button>
                          )
                        })()}
                      </div>

                      {/* Spare Parts Section - Collapsible */}
                      {taskParts[task.id] && taskParts[task.id].length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => setExpandedPartsTask(expandedPartsTask === task.id ? null : task.id)}
                            className="w-full flex items-center justify-between gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Requested Parts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">{taskParts[task.id].length}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-blue-700 transition-transform ${expandedPartsTask === task.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                          </button>

                          {/* Expandable Parts List */}
                          {expandedPartsTask === task.id && (
                            <div className="mt-2 space-y-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                              {taskParts[task.id].map(part => (
                                <div key={part.id} className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-xs">{part.part_name}</p>
                                    {part.part_number && <p className="text-xs text-gray-500">#{part.part_number}</p>}
                                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                      part.overall_status === 'process' ? 'bg-purple-100 text-purple-700' :
                                      part.overall_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      part.overall_status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {part.overall_status?.replace('_', ' ') || 'pending'}
                                    </span>
                                  </div>
                                  {part.overall_status === 'process' && (
                                    <button
                                      onClick={() => handleConfirmDelivery(part.id)}
                                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Mark as Delivered
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="font-bold text-gray-800 mb-1">No Tasks Found</h3>
          <p className="text-sm text-gray-400">No tasks match the selected filter.</p>
        </div>
      )}

      {/* Request Parts Modal - Responsive */}
      {showRequestPartsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start px-4 sm:px-7 py-4 sm:py-5 border-b border-gray-100 bg-blue-50/50">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900">Request Spare Parts</h3>
                <p className="text-sm text-gray-400 mt-0.5 truncate">For: {selectedTask?.task_name}</p>
              </div>
              <button onClick={() => setShowRequestPartsModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRequestParts} className="px-4 sm:px-7 py-5 sm:py-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Part Name <span className="text-red-400">*</span></label>
                <input type="text" value={partsRequest.part_name} onChange={(e) => setPartsRequest({...partsRequest, part_name: e.target.value})} required placeholder="e.g., Brake Pads Front" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Part Number</label>
                  <input type="text" value={partsRequest.part_number} onChange={(e) => setPartsRequest({...partsRequest, part_number: e.target.value})} placeholder="e.g., BP-12345" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Quantity <span className="text-red-400">*</span></label>
                  <input type="number" value={partsRequest.quantity} onChange={(e) => setPartsRequest({...partsRequest, quantity: e.target.value})} required placeholder="e.g., 4" min="1" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Description</label>
                <textarea value={partsRequest.description} onChange={(e) => setPartsRequest({...partsRequest, description: e.target.value})} placeholder="Additional details..." rows="2" className={`${inputCls} resize-none`} />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowRequestPartsModal(false)} className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors order-2 sm:order-1">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px order-1 sm:order-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Request Parts</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTasks