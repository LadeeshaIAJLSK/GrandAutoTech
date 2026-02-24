import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function TaskApproval({ user }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingTasks()
  }, [])

  const fetchPendingTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/all-tasks', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filter only awaiting_approval tasks
      const pendingTasks = response.data.filter(t => t.status === 'awaiting_approval')
      setTasks(pendingTasks)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTask = async (taskId) => {
    if (!confirm('✅ Approve this task?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Task approved successfully!')
      fetchPendingTasks()
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving task')
    }
  }

  const handleRejectTask = async (taskId) => {
    if (!confirm('❌ Reject this task?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('❌ Task rejected!')
      fetchPendingTasks()
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting task')
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tasks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">✔️ Task Approval</h2>
          <p className="text-gray-600 mt-1">Review and approve completed tasks</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Tasks Awaiting</div>
          <div className="text-4xl font-bold text-primary">{tasks.length}</div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-7xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No tasks awaiting approval</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0

            return (
              <div key={task.id} className="bg-white border-2 border-blue-300 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-800">{task.task_name}</h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold border-2 border-blue-300">
                        ⏳ PENDING APPROVAL
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
                      {task.assigned_to_user && (
                        <span className="text-blue-600 font-semibold">
                          👨‍🔧 {task.assigned_to_user.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">Time Spent</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatTime(totalTime)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-blue-800 font-semibold mb-4">
                    Review & Approve Task
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveTask(task.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleRejectTask(task.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TaskApproval