import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function TaskApproval({ user }) {
  const [jobCardsWithTasks, setJobCardsWithTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchAwaitingTasks()
  }, [])

  const fetchAwaitingTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/tasks/awaiting-approval', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobCardsWithTasks(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTask = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.post(`/tasks/${selectedTask.id}/approve`, {
        approval_notes: approvalNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('✅ Task approved!')

      // Check if all tasks in job card are completed
      if (response.data.all_tasks_completed) {
        const confirmJobCard = confirm(
          `🎉 ALL tasks for ${response.data.job_card.job_card_number} are now approved!\n\n` +
          `Do you want to mark the entire job card as COMPLETED?`
        )

        if (confirmJobCard) {
          await handleApproveJobCard(response.data.job_card.id)
        }
      }

      setShowApprovalModal(false)
      setApprovalNotes('')
      fetchAwaitingTasks()
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving task')
    }
  }

  const handleRejectTask = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${selectedTask.id}/reject`, {
        rejection_reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('❌ Task rejected and sent back to employee')
      setShowApprovalModal(false)
      setRejectionReason('')
      fetchAwaitingTasks()
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting task')
    }
  }

  const handleApproveJobCard = async (jobCardId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCardId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('🎉 Job card marked as COMPLETED!')
      fetchAwaitingTasks()
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving job card')
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">✅ Task Approval</h2>
          <p className="text-gray-600 mt-1">Review and approve completed tasks</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Tasks Awaiting</div>
          <div className="text-4xl font-bold text-orange-600">
            {jobCardsWithTasks.reduce((sum, jc) => sum + jc.awaiting_count, 0)}
          </div>
        </div>
      </div>

      {jobCardsWithTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-7xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No tasks awaiting approval</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobCardsWithTasks.map((item) => (
            <div key={item.job_card.id} className="bg-white rounded-xl shadow-lg border-2 border-orange-300 overflow-hidden">
              {/* Job Card Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      📋 {item.job_card.job_card_number}
                    </h3>
                    <div className="space-y-1">
                      <div>👤 {item.job_card.customer.name}</div>
                      <div>🚗 {item.job_card.vehicle.license_plate} - {item.job_card.vehicle.make} {item.job_card.vehicle.model}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-lg">
                      {item.awaiting_count} / {item.all_tasks_count} Tasks
                    </div>
                    <div className="text-orange-100 text-sm mt-2">
                      Awaiting Approval
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-6 space-y-4">
                {item.tasks.map((task) => {
                  const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0

                  return (
                    <div key={task.id} className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{task.task_name}</h4>
                          {task.description && (
                            <p className="text-gray-600 mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-semibold capitalize bg-white px-3 py-1 rounded-full">
                              📂 {task.category}
                            </span>
                            <span className="font-semibold bg-white px-3 py-1 rounded-full">
                              ⏱️ {formatTime(totalTime)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600">Completed By</div>
                          <div className="font-bold text-gray-800">
                            {task.assigned_employees?.map(e => e.name).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Rejection History */}
                      {task.rejection_reason && (
                        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                          <div className="font-semibold text-red-800 mb-2">⚠️ Previous Rejection:</div>
                          <div className="text-gray-700">{task.rejection_reason}</div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-orange-300">
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setApprovalNotes('')
                            setRejectionReason('')
                            setShowApprovalModal(true)
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                        >
                          ✅ Approve Task
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setApprovalNotes('')
                            setRejectionReason('')
                            setShowApprovalModal(true)
                          }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                        >
                          ❌ Reject Task
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b bg-orange-50">
              <h3 className="text-2xl font-bold text-gray-800">Review Task</h3>
              <p className="text-gray-600 mt-1">{selectedTask?.task_name}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Approval Section */}
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                <h4 className="text-lg font-bold text-green-800 mb-3">✅ Approve Task</h4>
                <div>
                  <label className="block font-semibold mb-2">Approval Notes (Optional)</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Great work! Quality is excellent..."
                    rows="3"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleApproveTask}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  ✅ APPROVE TASK
                </button>
              </div>

              {/* Rejection Section */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <h4 className="text-lg font-bold text-red-800 mb-3">❌ Reject Task</h4>
                <div>
                  <label className="block font-semibold mb-2">Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="What needs to be fixed? Be specific..."
                    rows="3"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleRejectTask}
                  className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  ❌ REJECT & SEND BACK
                </button>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskApproval