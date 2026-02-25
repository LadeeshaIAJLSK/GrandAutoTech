import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function MyTasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [activeTimer, setActiveTimer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRequestPartsModal, setShowRequestPartsModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [taskParts, setTaskParts] = useState({})
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')

  const [partsRequest, setPartsRequest] = useState({
    part_name: '',
    part_number: '',
    description: '',
    quantity: 1,
    unit_cost: '',
    selling_price: '',
  })

  useEffect(() => {
    fetchMyTasks()
    checkActiveTimer()
    const interval = setInterval(() => { checkActiveTimer() }, 30000)
    return () => clearInterval(interval)
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
      const response = await axiosClient.get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      setTasks(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkActiveTimer = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/my-tasks/active-timer', { headers: { Authorization: `Bearer ${token}` } })
      if (response.data.has_active_timer) {
        setActiveTimer(response.data)
      } else {
        setActiveTimer(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Task started! Timer is now running.')
      fetchMyTasks()
      checkActiveTimer()
    } catch (error) {
      alert(error.response?.data?.message || 'Error starting task')
    }
  }

  const handlePauseTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/stop`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert('Task paused!')
      fetchMyTasks()
      checkActiveTimer()
    } catch (error) {
      alert(error.response?.data?.message || 'Error pausing task')
    }
  }

  const handleMarkAsDone = async (taskId) => {
    if (!confirm('Submit this task for approval?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/tasks/${taskId}/mark-done`, {}, { headers: { Authorization: `Bearer ${token}` } })
      alert(`Task submitted for approval! Total time: ${Math.floor(response.data.total_time_spent / 60)}h ${response.data.total_time_spent % 60}m`)
      fetchMyTasks()
      checkActiveTimer()
    } catch (error) {
      alert(error.response?.data?.message || 'Error completing task')
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
      setPartsRequest({ part_name: '', part_number: '', description: '', quantity: 1, unit_cost: '', selling_price: '' })
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
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now - start
    const diffMins = Math.floor(diffMs / 60000)
    return formatTime(diffMins)
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

  return (
    <div className="space-y-5">

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

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
        {filterTabs.map(f => (
          <button
            key={f.id}
            onClick={() => setTaskStatusFilter(f.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              taskStatusFilter === f.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.icon}
            {f.label}
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
              {/* Job Card Header */}
              <div className="flex justify-between items-center px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{group.jobCard.job_card_number}</p>
                    <div className="flex items-center gap-3 text-blue-200 text-xs mt-0.5">
                      <span>{group.jobCard.customer?.name}</span>
                      <span className="font-mono font-semibold tracking-wide">{group.jobCard.vehicle?.license_plate}</span>
                      {group.jobCard.branch?.name && <span>{group.jobCard.branch.name}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-100 bg-white/15 px-2.5 py-1 rounded-full">
                  {formatJobCardStatus(group.jobCard.status)}
                </span>
              </div>

              {/* Tasks - single column list */}
              <div className="p-4 space-y-2.5">
                {group.tasks.map(task => {
                  const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0
                  const isRunning = activeTimer?.task?.id === task.id
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
                            {isRunning ? getElapsedTime(activeTimer.timer.start_time) : formatTime(totalTime)}
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

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2.5 border-t border-gray-200">
                        {task.status === 'assigned' && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Start
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handlePauseTask(task.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Pause
                            </button>
                            <button
                              onClick={() => handleMarkAsDone(task.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Complete
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            fetchTaskParts(task.id)
                            setShowRequestPartsModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors ml-auto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                          Parts
                        </button>
                      </div>
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

      {/* Request Parts Modal */}
      {showRequestPartsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 bg-blue-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Request Spare Parts</h3>
                <p className="text-sm text-gray-400 mt-0.5">For: {selectedTask?.task_name}</p>
              </div>
              <button onClick={() => setShowRequestPartsModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRequestParts} className="px-7 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Part Name <span className="text-red-400">*</span></label>
                <input type="text" value={partsRequest.part_name} onChange={(e) => setPartsRequest({...partsRequest, part_name: e.target.value})} required placeholder="e.g., Brake Pads Front" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Part Number</label>
                <input type="text" value={partsRequest.part_number} onChange={(e) => setPartsRequest({...partsRequest, part_number: e.target.value})} placeholder="e.g., BP-12345" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Description</label>
                <textarea value={partsRequest.description} onChange={(e) => setPartsRequest({...partsRequest, description: e.target.value})} placeholder="Additional details..." rows="2" className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>Quantity <span className="text-red-400">*</span></label>
                  <input type="number" min="1" value={partsRequest.quantity} onChange={(e) => setPartsRequest({...partsRequest, quantity: e.target.value})} required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Unit Cost (LKR) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={partsRequest.unit_cost} onChange={(e) => setPartsRequest({...partsRequest, unit_cost: e.target.value})} required className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Selling Price (LKR) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={partsRequest.selling_price} onChange={(e) => setPartsRequest({...partsRequest, selling_price: e.target.value})} required className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowRequestPartsModal(false)} className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Request Parts</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTasks