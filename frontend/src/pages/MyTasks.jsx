import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function MyTasks({ user }) {
  const [tasks, setTasks] = useState([])
  const [activeTimer, setActiveTimer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRequestPartsModal, setShowRequestPartsModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [taskParts, setTaskParts] = useState({}) // Store parts by task ID

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
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      checkActiveTimer()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Fetch parts for all tasks
    tasks.forEach(task => {
      if (task.id && !taskParts[task.id]) {
        fetchTaskParts(task.id)
      }
    })
  }, [tasks])

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = user.role.name === 'super_admin' ? '/all-tasks' : '/my-tasks'
      const response = await axiosClient.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
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
      const response = await axiosClient.get('/my-tasks/active-timer', {
        headers: { Authorization: `Bearer ${token}` }
      })
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
      await axiosClient.post(`/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task started! Timer is now running.')
      fetchMyTasks()
      checkActiveTimer()
    } catch (error) {
      alert(error.response?.data?.message || 'Error starting task')
    }
  }

  const handlePauseTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('⏸️ Task paused!')
      fetchMyTasks()
      checkActiveTimer()
    } catch (error) {
      alert(error.response?.data?.message || 'Error pausing task')
    }
  }

  const handleMarkAsDone = async (taskId) => {
    if (!confirm('✅ Submit this task for approval?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/tasks/${taskId}/mark-done`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ Task submitted for approval! Total time: ${Math.floor(response.data.total_time_spent / 60)}h ${response.data.total_time_spent % 60}m`)
      fetchMyTasks()
      checkActiveTimer()
    } catch (error) {
      alert(error.response?.data?.message || 'Error completing task')
    }
  }

  const fetchTaskParts = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${tasks.find(t => t.id === taskId)?.job_card_id}/spare-parts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const parts = response.data.filter(p => p.task_id === taskId)
      setTaskParts(prev => ({
        ...prev,
        [taskId]: parts
      }))
    } catch (error) {
      console.error('Error fetching parts:', error)
    }
  }

  const handleConfirmDelivery = async (partId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/spare-parts/${partId}/confirm-delivery`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Parts delivery confirmed!')
      // Refresh tasks and parts
      fetchMyTasks()
      if (selectedTask) {
        fetchTaskParts(selectedTask.id)
      }
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
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Parts requested! Waiting for approval.')
      setShowRequestPartsModal(false)
      setPartsRequest({
        part_name: '',
        part_number: '',
        description: '',
        quantity: 1,
        unit_cost: '',
        selling_price: '',
      })
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting parts')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      assigned: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your tasks...</div>
  }

  // Filter tasks by employee name if super_admin
  const filteredTasks = user.role.name === 'super_admin' && employeeFilter.trim()
    ? tasks.filter(t => t.assigned_to_user?.name?.toLowerCase().includes(employeeFilter.toLowerCase()))
    : tasks

  // Separate tasks by status
  const activeTasks = filteredTasks.filter(t => t.status === 'in_progress')
  const assignedTasks = filteredTasks.filter(t => t.status === 'assigned')
  const awaitingApprovalTasks = filteredTasks.filter(t => t.status === 'awaiting_approval')
  const completedTasks = filteredTasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {user.role.name === 'super_admin' ? '👥 All Tasks' : '🔧 My Tasks'}
          </h2>
          <p className="text-gray-600 mt-1">
            {user.role.name === 'super_admin' ? 'All employee tasks' : 'Tasks assigned to you'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-4xl font-bold text-primary">{filteredTasks.length}</div>
        </div>
      </div>

      {/* Employee Filter (Super Admin Only) */}
      {user.role.name === 'super_admin' && (
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="🔍 Filter by employee name..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Active Timer Banner */}
      {activeTimer && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">⏱️</div>
              <div>
                <div className="text-2xl font-bold">Timer Running!</div>
                <div className="text-red-100">
                  {activeTimer.task.job_card.job_card_number} - {activeTimer.task.task_name}
                </div>
                <div className="text-red-100 font-mono text-lg mt-1">
                  ⏰ {getElapsedTime(activeTimer.timer.start_time)}
                </div>
              </div>
            </div>
            <button
              onClick={() => handlePauseTask(activeTimer.task.id)}
              className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-50 transition-colors"
            >
              ⏸️ PAUSE
            </button>
          </div>
        </div>
      )}

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Active Tasks ({activeTasks.length})
          </h3>
          
          {activeTasks.map(task => {
            const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0
            const isRunning = task.time_tracking?.some(t => !t.end_time)

            return (
              <div key={task.id} className="bg-white border-2 border-purple-300 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-800">{task.task_name}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(task.status)}`}>
                        🔧 IN PROGRESS
                      </span>
                    </div>
                    <div className="text-gray-600 mb-2">{task.description}</div>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="font-semibold text-primary">
                        📋 {task.job_card.job_card_number}
                      </span>
                      <span className="text-gray-600">
                        👤 {task.job_card.customer.name}
                      </span>
                      <span className="text-gray-600">
                        🚗 {task.job_card.vehicle.license_plate}
                      </span>
                      {user.role.name === 'super_admin' && task.assigned_to_user && (
                        <span className="text-blue-600 font-semibold">
                          👨‍🔧 {task.assigned_to_user.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">Time Spent</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {formatTime(totalTime)}
                    </div>
                  </div>
                </div>

                {/* Parts Status Section */}
                {taskParts[task.id] && taskParts[task.id].length > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                    <h5 className="font-bold text-orange-800 mb-3">📦 Requested Parts:</h5>
                    <div className="space-y-2">
                      {taskParts[task.id].map(part => (
                        <div key={part.id} className="flex justify-between items-center bg-white p-3 rounded border border-orange-100">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{part.part_name}</p>
                            <p className="text-sm text-gray-600">Qty: {part.quantity} | Status: <span className={`font-bold ${
                              part.overall_status === 'approved' ? 'text-green-600' :
                              part.overall_status === 'process' ? 'text-blue-600' :
                              part.overall_status === 'delivered' ? 'text-green-700' :
                              'text-yellow-600'
                            }`}>{part.overall_status.toUpperCase()}</span></p>
                          </div>
                          {part.overall_status === 'process' && (
                            <button
                              onClick={() => handleConfirmDelivery(part.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold text-sm ml-3"
                            >
                              ✅ Mark Delivered
                            </button>
                          )}
                          {part.overall_status === 'delivered' && (
                            <span className="text-green-700 font-bold ml-3">✅ Delivered to Employee</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  {!isRunning && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  {isRunning && (
                    <button
                      onClick={() => handlePauseTask(task.id)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      ⏸️ Pause
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTask(task)
                      fetchTaskParts(task.id)
                      setShowRequestPartsModal(true)
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    🔩 Request Parts
                  </button>
                  <button
                    onClick={() => handleMarkAsDone(task.id)}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                  >
                    ✅ Mark as Done
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Awaiting Approval Tasks (Employees Only) */}
      {awaitingApprovalTasks.length > 0 && user.role.name !== 'super_admin' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            Awaiting Approval ({awaitingApprovalTasks.length})
          </h3>
          
          {awaitingApprovalTasks.map(task => (
            <div key={task.id} className="bg-white border-2 border-orange-300 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold text-gray-800">{task.task_name}</h4>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold border-2 border-orange-300">
                      ⏳ AWAITING APPROVAL
                    </span>
                  </div>
                  <div className="text-gray-600 mb-2">{task.description}</div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="font-semibold text-primary">
                      📋 {task.job_card.job_card_number}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <div className="text-orange-800 font-semibold">
                  ⏳ Waiting for supervisor approval...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Overview - Pending Approvals Summary */}
      {user.role.name === 'super_admin' && awaitingApprovalTasks.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                <span className="text-3xl">⏳</span>
                Pending Approvals
              </h3>
              <p className="text-blue-700 mt-1">Tasks waiting for your review</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-blue-600">{awaitingApprovalTasks.length}</div>
              <p className="text-blue-700 font-semibold mt-2">tasks pending</p>
              <a href="/task-approval" className="text-blue-600 font-bold hover:underline mt-3 inline-block">
                Go to Task Approval →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Tasks (Not Started Yet) */}
      {assignedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Assigned Tasks ({assignedTasks.length})
          </h3>
          
          {assignedTasks.map(task => (
            <div key={task.id} className="bg-white border-2 border-gray-200 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold text-gray-800">{task.task_name}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getStatusColor(task.status)}`}>
                      📌 ASSIGNED
                    </span>
                  </div>
                  <div className="text-gray-600 mb-2">{task.description}</div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="font-semibold text-primary">
                      📋 {task.job_card.job_card_number}
                    </span>
                    <span className="text-gray-600">
                      👤 {task.job_card.customer.name}
                    </span>
                    <span className="text-gray-600">
                      🚗 {task.job_card.vehicle.license_plate}
                    </span>
                    {user.role.name === 'super_admin' && task.assigned_to_user && (
                      <span className="text-blue-600 font-semibold">
                        👨‍🔧 {task.assigned_to_user.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleStartTask(task.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  ▶️ Start Working
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Completed Tasks ({completedTasks.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedTasks.map(task => {
              const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0

              return (
                <div key={task.id} className="bg-white border-2 border-green-200 rounded-xl shadow-md p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">✅</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{task.task_name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        📋 {task.job_card.job_card_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        ⏱️ Time: {formatTime(totalTime)}
                      </div>
                      {user.role.name === 'super_admin' && task.assigned_to_user && (
                        <div className="text-sm text-blue-600 font-semibold mt-1">
                          👨‍🔧 {task.assigned_to_user.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Tasks */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-7xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Tasks Assigned</h3>
          <p className="text-gray-600">You don't have any tasks assigned to you yet.</p>
        </div>
      )}

      {/* Request Parts Modal */}
      {showRequestPartsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b bg-blue-50">
              <h3 className="text-2xl font-bold text-gray-800">🔩 Request Spare Parts</h3>
              <p className="text-gray-600 mt-1">For: {selectedTask?.task_name}</p>
            </div>

            <form onSubmit={handleRequestParts} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold mb-2">Part Name *</label>
                <input
                  type="text"
                  value={partsRequest.part_name}
                  onChange={(e) => setPartsRequest({...partsRequest, part_name: e.target.value})}
                  required
                  placeholder="e.g., Brake Pads Front"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Part Number</label>
                <input
                  type="text"
                  value={partsRequest.part_number}
                  onChange={(e) => setPartsRequest({...partsRequest, part_number: e.target.value})}
                  placeholder="e.g., BP-12345"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Description</label>
                <textarea
                  value={partsRequest.description}
                  onChange={(e) => setPartsRequest({...partsRequest, description: e.target.value})}
                  placeholder="Additional details..."
                  rows="2"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={partsRequest.quantity}
                    onChange={(e) => setPartsRequest({...partsRequest, quantity: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Unit Cost (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partsRequest.unit_cost}
                    onChange={(e) => setPartsRequest({...partsRequest, unit_cost: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Selling Price (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partsRequest.selling_price}
                    onChange={(e) => setPartsRequest({...partsRequest, selling_price: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowRequestPartsModal(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  🔩 Request Parts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTasks