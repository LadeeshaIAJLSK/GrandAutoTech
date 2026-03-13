import { useState, useEffect } from 'react'
import Notification from '../common/Notification'
import ConfirmDialog from '../common/ConfirmDialog'
import axiosClient from '../../api/axios'

function TaskManagement({ jobCard, onUpdate, user }) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [availableEmployees, setAvailableEmployees] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [activeTimer, setActiveTimer] = useState(null)
  const [timerUpdate, setTimerUpdate] = useState(0) // For live timer updates
  const [notification, setNotification] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState(null)

  const [taskForm, setTaskForm] = useState({
    task_name: '',
    description: '',
    category: 'mechanical',
    priority: 0,
  })

  const canAdd = user.role.name === 'super_admin' || user.permissions.includes('add_tasks')
  const canUpdate = user.role.name === 'super_admin' || user.permissions.includes('update_tasks')
  const canDelete = user.role.name === 'super_admin' || user.permissions.includes('delete_tasks')
  const canAssign = user.permissions.includes('assign_tasks') || ['super_admin', 'branch_admin'].includes(user.role.name)

  // Live timer update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showAssignModal && selectedTask) {
      fetchAvailableEmployees(selectedTask.id)
    }
  }, [showAssignModal, selectedTask])

  const fetchAvailableEmployees = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/employees/available?task_id=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAvailableEmployees(response.data)
    } catch (error) {
      console.error('Error:', error)
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error fetching available employees' })
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCard.id}/tasks`, taskForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', title: 'Success', message: 'Task added successfully!' })
      setShowAddTaskModal(false)
      setTaskForm({ task_name: '', description: '', category: 'mechanical', priority: 0 })
      setTimeout(() => onUpdate(), 2000)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error adding task' })
    }
  }

  const openAssignModal = (task) => {
    setSelectedTask(task)
    const assignedIds = task.assigned_employees?.map(e => e.id) || []
    setSelectedEmployees(assignedIds)
    setShowAssignModal(true)
  }

  const toggleEmployeeSelection = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId))
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId])
    }
  }

  const handleAssignEmployees = async () => {
    if (selectedEmployees.length === 0) {
      setNotification({ type: 'error', title: 'Validation Error', message: 'Please select at least one employee' })
      return
    }
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${selectedTask.id}/assign`, {
        employee_ids: selectedEmployees
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', title: 'Success', message: `${selectedEmployees.length} employee(s) assigned successfully!` })
      setShowAssignModal(false)
      setSelectedEmployees([])
      setTimeout(() => onUpdate(), 2000)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error assigning employees' })
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/start-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification({ type: 'success', title: 'Success', message: 'Timer started!' });
      setTimeout(() => onUpdate(), 2000);
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error starting timer' });
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/pause-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification({ type: 'success', title: 'Success', message: 'Timer paused!' });
      setTimeout(() => onUpdate(), 2000);
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error pausing timer' });
    }
  };

  const handleResumeTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/resume-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification({ type: 'success', title: 'Success', message: 'Timer resumed!' });
      setTimeout(() => onUpdate(), 2000);
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error resuming timer' });
    }
  };

  const handleStopTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(`/tasks/${taskId}/stop-timer`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification({ type: 'success', title: 'Success', message: 'Task completed!' });
      setTimeout(() => onUpdate(), 2000);
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error stopping timer' });
    }
  };

  const handleCompleteTask = async (taskId) => {
    const notes = prompt('Completion notes (optional):')
    if (notes === null) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/complete`, { completion_notes: notes }, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: 'Task completed!' })
      setTimeout(() => onUpdate(), 2000)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error completing task' })
    }
  }

  const handleDeleteTask = (taskId) => {
    setDeleteTaskId(taskId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTask = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/tasks/${deleteTaskId}`, { headers: { Authorization: `Bearer ${token}` } })
      setNotification({ type: 'success', title: 'Success', message: 'Task deleted successfully!' })
      setShowDeleteConfirm(false)
      setDeleteTaskId(null)
      setTimeout(() => onUpdate(), 2000)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error deleting task' })
      setShowDeleteConfirm(false)
      setDeleteTaskId(null)
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending:     'bg-yellow-50 text-yellow-700 border-yellow-200',
      assigned:    'bg-blue-50 text-blue-700 border-blue-200',
      in_progress: 'bg-purple-50 text-purple-700 border-purple-200',
      completed:   'bg-green-50 text-green-700 border-green-200',
    }
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getStatusDot = (status) => {
    const dots = {
      pending:     'bg-yellow-400',
      assigned:    'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed:   'bg-green-500',
    }
    return dots[status] || 'bg-gray-400'
  }

  const getPriorityStyle = (priority) => {
    if (priority === 2) return { label: 'Urgent', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' }
    if (priority === 1) return { label: 'High',   cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-400' }
    return { label: 'Normal', cls: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-500' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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

  const tasks = jobCard.tasks || []

  return (
    <div>
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Tasks
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </h3>
        {canAdd && (
          <div className="relative group">
            <button
              onClick={() => setShowAddTaskModal(true)}
              disabled={['completed', 'inspected'].includes(jobCard?.status)}
              title={['completed', 'inspected'].includes(jobCard?.status) ? 'Cannot add tasks. Job card is completed or under inspection.' : 'Add a new task'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                ['completed', 'inspected'].includes(jobCard?.status)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  : 'bg-primary hover:bg-primary-dark text-white hover:shadow-md hover:-translate-y-px'
              }`}
              style={!['completed', 'inspected'].includes(jobCard?.status) ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : {}}
            >
              <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </span>
              Add Task
            </button>
            {['completed', 'inspected'].includes(jobCard?.status) && (
              <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-red-600 text-white text-xs rounded-lg shadow-lg p-2 z-10">
                Cannot add tasks. Job card is {jobCard?.status === 'completed' ? 'completed' : 'under inspection'}.
              </div>
            )}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-400 font-medium text-sm">No tasks added yet</p>
          {canAdd && <p className="text-gray-300 text-xs mt-1">Add tasks to start working on this job card</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isAssigned = task.assigned_employees && task.assigned_employees.length > 0
            const hasActiveTimer = task.time_tracking?.some(t => !t.end_time)
            const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0
            const myAssignment = task.assigned_employees?.find(e => e.id === user.id)
            const priority = getPriorityStyle(task.priority)

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border shadow-sm p-5 ${
                  hasActiveTimer ? 'border-purple-300 ring-1 ring-purple-200' : 'border-gray-200'
                }`}
              >
                {/* Task Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-base">{task.task_name}</h4>

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(task.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(task.status)}`} />
                        {task.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>

                      {/* Priority badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priority.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>

                      {/* Active timer badge */}
                      {hasActiveTimer && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Timer Running
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1.5">{task.description}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {task.category}
                      </span>
                      {totalTime > 0 && (
                        <span className="text-xs font-semibold text-purple-600">
                          {getTotalElapsedTime(task)} tracked
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Employees */}
                {isAssigned && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned To</p>
                    <div className="flex flex-wrap gap-1.5">
                      {task.assigned_employees.map(emp => (
                        <span key={emp.id} className="px-2.5 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                          {emp.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  {canAssign && task.status !== 'completed' && (
                    <button
                      onClick={() => openAssignModal(task)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {isAssigned ? 'Reassign' : 'Assign Employees'}
                    </button>
                  )}

                  {myAssignment && task.status !== 'completed' && (
                    <>
                      {task.status === 'assigned' && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Start
                        </button>
                      )}

                      {hasActiveTimer && (
                        <button
                          onClick={() => handlePauseTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition-colors animate-pulse"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Pause
                        </button>
                      )}

                      {!hasActiveTimer && task.status === 'in_progress' && (
                        <button
                          onClick={() => handleResumeTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Resume
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Complete
                        </button>
                      )}
                    </>
                  )}

                  {canDelete && task.status !== 'completed' && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors ml-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
                <p className="text-sm text-gray-400 mt-0.5">Fill in the details for the new task</p>
              </div>
              <button onClick={() => setShowAddTaskModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="px-7 py-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Task Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm({...taskForm, task_name: e.target.value})}
                  required
                  placeholder="e.g., Replace Brake Pads"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Additional details about the task..."
                  rows="3"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Category <span className="text-red-400">*</span></label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="mechanical">Mechanical</option>
                    <option value="electrical">Electrical</option>
                    <option value="bodywork">Bodywork</option>
                    <option value="painting">Painting</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority <span className="text-red-400">*</span></label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: parseInt(e.target.value)})}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value={0}>Normal</option>
                    <option value={1}>High</option>
                    <option value={2}>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employees Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assign Employees</h3>
                <p className="text-sm text-gray-400 mt-0.5">{selectedTask?.task_name}</p>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedEmployees([]) }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-7 py-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select employees to assign</p>
              {availableEmployees.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No employees available</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableEmployees.map(employee => (
                    <label
                      key={employee.id}
                      className={`flex items-center gap-3.5 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedEmployees.includes(employee.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{employee.name}</p>
                          {employee.position && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              employee.technician_type === 'supervisor'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {employee.position}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{employee.email}</p>
                      </div>
                      {selectedEmployees.includes(employee.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <span className="text-sm text-gray-500">
                <span className="font-bold text-gray-800">{selectedEmployees.length}</span> selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedEmployees([]) }}
                  className="px-5 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignEmployees}
                  disabled={selectedEmployees.length === 0}
                  className="px-5 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0 hover:-translate-y-px"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                >
                  Assign {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={showDeleteConfirm}
        type="danger"
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={confirmDeleteTask}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteTaskId(null)
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default TaskManagement