import { useState } from 'react'
import axiosClient from '../../api/axios'

function TaskManagement({ jobCard, onUpdate, user }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [employees, setEmployees] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])

  const [taskForm, setTaskForm] = useState({
    task_name: '',
    description: '',
    category: 'mechanical',
    labor_hours: '',
    labor_rate_per_hour: '5000',
    priority: 0,
  })

  const canAdd = user.permissions.includes('add_tasks')
  const canUpdate = user.permissions.includes('update_tasks')
  const canDelete = user.permissions.includes('delete_tasks')

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/employees/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEmployees(response.data)
    } catch (error) {
      console.error('Error fetching employees:', error)
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
      setShowAddModal(false)
      setTaskForm({
        task_name: '',
        description: '',
        category: 'mechanical',
        labor_hours: '',
        labor_rate_per_hour: '5000',
        priority: 0,
      })
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding task')
    }
  }

  const openAssignModal = async (task) => {
    setSelectedTask(task)
    setSelectedEmployees(task.assigned_employees?.map(e => e.id) || [])
    await fetchEmployees()
    setShowAssignModal(true)
  }

  const handleAssignEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${selectedTask.id}/assign`, {
        employee_ids: selectedEmployees
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task assigned successfully!')
      setShowAssignModal(false)
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning task')
    }
  }

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task started!')
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
      alert('✅ Task stopped!')
      onUpdate()
    } catch (error) {
      alert(error.response?.data?.message || 'Error stopping task')
    }
  }

  const handleCompleteTask = async (taskId) => {
    const notes = prompt('Completion notes (optional):')
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
      pending: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const tasks = jobCard.tasks || []

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Tasks ({tasks.length})</h3>
        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
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
            <p className="text-gray-500 text-sm mt-2">Add tasks to start tracking work</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isAssignedToMe = task.assigned_employees?.some(e => e.id === user.id)
            const hasActiveTimer = task.time_tracking?.some(t => t.user_id === user.id && !t.end_time)

            return (
              <div key={task.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800">{task.task_name}</h4>
                        {task.description && (
                          <p className="text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                      {task.priority === 2 && <span className="text-2xl" title="Urgent">🔴</span>}
                      {task.priority === 1 && <span className="text-2xl" title="High Priority">🟡</span>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(task.status)}`}>
                    {formatStatus(task.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Category</div>
                    <div className="font-semibold text-gray-800 capitalize">{task.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Labor Hours</div>
                    <div className="font-semibold text-gray-800">{task.labor_hours || '-'} hrs</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Rate/Hour</div>
                    <div className="font-semibold text-gray-800">
                      LKR {task.labor_rate_per_hour?.toLocaleString() || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Labor Cost</div>
                    <div className="font-bold text-primary">
                      LKR {task.labor_cost?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>

                {/* Assigned Employees */}
                {task.assigned_employees && task.assigned_employees.length > 0 && (
                  <div className="mb-4 pb-4 border-t pt-4">
                    <div className="text-sm text-gray-600 mb-2">Assigned to:</div>
                    <div className="flex flex-wrap gap-2">
                      {task.assigned_employees.map((employee) => (
                        <span key={employee.id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          👤 {employee.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Tracking Info */}
                {task.time_tracking && task.time_tracking.length > 0 && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Time Spent:</div>
                    <div className="font-bold text-gray-800">
                      {Math.floor(task.actual_duration_minutes / 60)}h {task.actual_duration_minutes % 60}m
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {canUpdate && task.status !== 'completed' && (
                    <button
                      onClick={() => openAssignModal(task)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                    >
                      👥 Assign
                    </button>
                  )}

                  {isAssignedToMe && task.status !== 'completed' && (
                    <>
                      {!hasActiveTimer ? (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          ▶️ Start
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStopTask(task.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition-colors text-sm animate-pulse"
                        >
                          ⏸️ Stop
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                        >
                          ✅ Complete
                        </button>
                      )}
                    </>
                  )}

                  {canDelete && task.status !== 'completed' && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Add New Task</h3>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Task Name *</label>
                <input
                  type="text"
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm({...taskForm, task_name: e.target.value})}
                  required
                  placeholder="e.g., Replace Timing Belt"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Describe the work to be done..."
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
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

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value={0}>🟢 Normal</option>
                    <option value={1}>🟡 High</option>
                    <option value={2}>🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Labor Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskForm.labor_hours}
                    onChange={(e) => setTaskForm({...taskForm, labor_hours: e.target.value})}
                    placeholder="3.5"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Rate per Hour (LKR)</label>
                  <input
                    type="number"
                    value={taskForm.labor_rate_per_hour}
                    onChange={(e) => setTaskForm({...taskForm, labor_rate_per_hour: e.target.value})}
                    placeholder="5000"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Assign Employees</h3>
              <p className="text-gray-600 mt-1">Select employees to work on this task</p>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {employees.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No employees available</div>
              ) : (
                employees.map(employee => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id])
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id))
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <div>
                      <div className="font-semibold text-gray-800">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.employee_code}</div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignEmployees}
                disabled={selectedEmployees.length === 0}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Assign ({selectedEmployees.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskManagement