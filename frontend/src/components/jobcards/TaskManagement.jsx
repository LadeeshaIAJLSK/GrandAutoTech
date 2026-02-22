import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function TaskManagement({ jobCard, onUpdate, user }) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [availableEmployees, setAvailableEmployees] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])

  const [taskForm, setTaskForm] = useState({
    task_name: '',
    description: '',
    category: 'mechanical',
    priority: 0,
    labor_hours: '',
    labor_rate_per_hour: '5000',
  })

  const canAdd = user.permissions.includes('add_tasks')
  const canUpdate = user.permissions.includes('update_tasks')
  const canDelete = user.permissions.includes('delete_tasks')
  const canAssign = user.permissions.includes('assign_tasks') || ['super_admin', 'branch_admin'].includes(user.role.name)

  useEffect(() => {
    if (showAssignModal) {
      fetchAvailableEmployees()
    }
  }, [showAssignModal])

  const fetchAvailableEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/employees/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAvailableEmployees(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCard.id}/tasks`, taskForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task added successfully!')
      setShowAddTaskModal(false)
      setTaskForm({
        task_name: '',
        description: '',
        category: 'mechanical',
        priority: 0,
        labor_hours: '',
        labor_rate_per_hour: '5000',
      })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding task')
    }
  }

  const openAssignModal = (task) => {
    setSelectedTask(task)
    // Pre-select already assigned employees
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
      alert('Please select at least one employee')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${selectedTask.id}/assign`, {
        employee_ids: selectedEmployees
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(`✅ ${selectedEmployees.length} employee(s) assigned successfully!`)
      setShowAssignModal(false)
      setSelectedEmployees([])
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning employees')
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task started! Timer is running.')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error starting task')
    }
  }

  const handleStopTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('⏸️ Task paused!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error stopping task')
    }
  }

  const handleCompleteTask = async (taskId) => {
    const notes = prompt('Completion notes (optional):')
    if (notes === null) return // User cancelled

    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/complete`, {
        completion_notes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task completed!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error completing task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('⚠️ Are you sure you want to delete this task?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task deleted!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting task')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityIcon = (priority) => {
    if (priority === 2) return '🔴'
    if (priority === 1) return '🟡'
    return '🟢'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const tasks = jobCard.tasks || []

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">🔧 Tasks ({tasks.length})</h3>
        {canAdd && (
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            ➕ Add Task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-gray-400 text-lg">No tasks added yet</div>
          {canAdd && (
            <p className="text-gray-500 text-sm mt-2">Add tasks to start working on this job card</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isAssigned = task.assigned_employees && task.assigned_employees.length > 0
            const hasActiveTimer = task.time_tracking?.some(t => !t.end_time)
            const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0
            const myAssignment = task.assigned_employees?.find(e => e.id === user.id)

            return (
              <div key={task.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPriorityIcon(task.priority)}</span>
                      <h4 className="text-xl font-bold text-gray-800">{task.task_name}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(task.status)}`}>
                        {task.status.toUpperCase().replace('_', ' ')}
                      </span>
                      {hasActiveTimer && (
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold animate-pulse">
                          ⏱️ TIMER RUNNING
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-semibold capitalize">📂 {task.category}</span>
                      {task.labor_hours && (
                        <span>⏱️ {task.labor_hours} hours</span>
                      )}
                      {task.labor_cost > 0 && (
                        <span className="font-bold text-primary">{formatCurrency(task.labor_cost)}</span>
                      )}
                      {totalTime > 0 && (
                        <span className="font-bold text-purple-600">
                          ⏰ Tracked: {Math.floor(totalTime / 60)}h {totalTime % 60}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Employees */}
                {isAssigned && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-semibold text-gray-700 mb-2">👥 Assigned To:</div>
                    <div className="flex flex-wrap gap-2">
                      {task.assigned_employees.map(emp => (
                        <span key={emp.id} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
                          {emp.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {/* Assign Button (Admin/Branch Admin) */}
                  {canAssign && task.status !== 'completed' && (
                    <button
                      onClick={() => openAssignModal(task)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      {isAssigned ? '👥 Reassign Employees' : '👥 Assign Employees'}
                    </button>
                  )}

                  {/* Employee Actions (Only if assigned to them) */}
                  {myAssignment && task.status !== 'completed' && (
                    <>
                      {!hasActiveTimer && task.status === 'assigned' && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          ▶️ Start
                        </button>
                      )}

                      {hasActiveTimer && (
                        <button
                          onClick={() => handleStopTask(task.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors animate-pulse"
                        >
                          ⏸️ Stop
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          ✅ Complete
                        </button>
                      )}
                    </>
                  )}

                  {/* Delete Button (Admin only, not completed) */}
                  {canDelete && task.status !== 'completed' && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      🗑️ Delete
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">➕ Add New Task</h3>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold mb-2">Task Name *</label>
                <input
                  type="text"
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm({...taskForm, task_name: e.target.value})}
                  required
                  placeholder="e.g., Replace Brake Pads"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Additional details about the task..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Category *</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="mechanical">🔧 Mechanical</option>
                    <option value="electrical">⚡ Electrical</option>
                    <option value="bodywork">🚗 Bodywork</option>
                    <option value="painting">🎨 Painting</option>
                    <option value="diagnostic">🔍 Diagnostic</option>
                    <option value="maintenance">🛠️ Maintenance</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Priority *</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value={0}>🟢 Normal</option>
                    <option value={1}>🟡 High</option>
                    <option value={2}>🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Labor Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskForm.labor_hours}
                    onChange={(e) => setTaskForm({...taskForm, labor_hours: e.target.value})}
                    placeholder="e.g., 2.5"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Rate per Hour (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taskForm.labor_rate_per_hour}
                    onChange={(e) => setTaskForm({...taskForm, labor_rate_per_hour: e.target.value})}
                    placeholder="5000"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {taskForm.labor_hours && taskForm.labor_rate_per_hour && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Estimated Labor Cost:</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(taskForm.labor_hours * taskForm.labor_rate_per_hour)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg font-semibold"
                >
                  ➕ Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employees Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b bg-blue-50">
              <h3 className="text-2xl font-bold text-gray-800">👥 Assign Employees</h3>
              <p className="text-gray-600 mt-1">Task: {selectedTask?.task_name}</p>
            </div>

            <div className="p-6">
              <p className="text-gray-700 font-semibold mb-4">
                Select employees to assign to this task:
              </p>

              {availableEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employees available
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableEmployees.map(employee => (
                    <label
                      key={employee.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedEmployees.includes(employee.id)
                          ? 'border-primary bg-primary bg-opacity-10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{employee.name}</div>
                        <div className="text-sm text-gray-600">{employee.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-gray-700">
                <span className="font-bold">{selectedEmployees.length}</span> employee(s) selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedEmployees([])
                  }}
                  className="px-6 py-2 bg-gray-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignEmployees}
                  disabled={selectedEmployees.length === 0}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-semibold disabled:bg-gray-400"
                >
                  ✅ Assign {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement