import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axios'

function TaskApproval({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [jobCards, setJobCards] = useState([])
  const [jobCardTasks, setJobCardTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [inspectionLoading, setInspectionLoading] = useState({})
  const [activeTab, setActiveTab] = useState('tasks')
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(user?.branch_id || '')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const branchDropdownRef = useRef(null)

  useEffect(() => {
    fetchBranches()
    fetchPendingTasks()
    fetchCompleteJobCards()
  }, [selectedBranch])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data.data || response.data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchPendingTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (selectedBranch) {
        params.branch_id = selectedBranch
      }
      const response = await axiosClient.get('/all-tasks', {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      let pendingTasks = response.data.filter(t => t.status === 'awaiting_approval')
      setTasks(pendingTasks)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompleteJobCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/job-cards', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const allJobCards = response.data.data || response.data

      const completeCards = []
      const tasksMap = {}
      
      for (const jobCard of allJobCards) {
        
        if (['inspected'].includes(jobCard.status)) {
          continue
        }

        try {
          const tasksResponse = await axiosClient.get(`/job-cards/${jobCard.id}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const jobCardTasksList = tasksResponse.data || []
          
          tasksMap[jobCard.id] = jobCardTasksList

          const allTasksApproved = jobCardTasksList.length > 0 && jobCardTasksList.every(task => 
            task.status === 'approved' || task.status === 'completed' || task.status === 'cancelled'
          )

          const noAwaitingApproval = !jobCardTasksList.some(task => task.status === 'awaiting_approval')

          if (allTasksApproved && noAwaitingApproval && jobCardTasksList.length > 0) {
            completeCards.push(jobCard)
          }
        } catch (error) {
          console.error(`Error fetching tasks for job card ${jobCard.id}:`, error)
        }
      }

      setJobCardTasks(tasksMap)
      setJobCards(completeCards)
    } catch (error) {
      console.error('Error fetching job cards:', error)
    }
  }

  const handleApproveTask = async (taskId) => {
    if (!confirm('Approve this task?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Task approved successfully!')
      fetchPendingTasks()
      fetchCompleteJobCards()
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving task')
    }
  }

  const handleRejectTask = async (taskId) => {
    if (!confirm('Reject this task?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.post(`/tasks/${taskId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Task rejected!')
      fetchPendingTasks()
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting task')
    }
  }

  const handleMarkInspectionCompleted = async (jobCardId) => {
    if (!confirm('Mark this inspection as completed?')) return
    try {
      setInspectionLoading(prev => ({ ...prev, [jobCardId]: true }))
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCardId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Job card marked as completed! ')
      setTimeout(() => { navigate('/invoices') }, 1000)
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking inspection completed')
      setInspectionLoading(prev => ({ ...prev, [jobCardId]: false }))
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Branch Filter */}
      {!user?.branch_id ? (
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
              {selectedBranch ? branches.find(b => b.id === parseInt(selectedBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-[#2563A8] transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[#2563A8]/50 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Dropdown options */}
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedBranch('')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                    selectedBranch === ''
                      ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                      : 'text-gray-700 hover:bg-[#2563A8]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedBranch === '' ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                    All Branches
                  </div>
                </button>

                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranch(String(branch.id))
                      setBranchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                      selectedBranch === String(branch.id)
                        ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                        : 'text-gray-700 hover:bg-[#2563A8]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${selectedBranch === String(branch.id) ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
                      <div>
                        <p className="font-bold">{branch.name}</p>
                        {branch.city && <p className="text-xs opacity-75">{branch.city}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${ 
            activeTab === 'tasks' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Task Approval
            {tasks.length > 0 && <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">{tasks.length}</span>}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'completed' 
              ? 'border-amber-500 text-amber-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Work Completed
            {jobCards.length > 0 && <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">{jobCards.length}</span>}
          </span>
        </button>
      </div>

      {/* Task Approval Tab */}
      {activeTab === 'tasks' && (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
           
            <p className="text-sm text-gray-400 mt-0.5">Review and approve completed tasks</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
            <span className="text-sm font-bold text-gray-700">{tasks.length}</span>
            <span className="text-xs text-gray-400">awaiting</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-bold text-gray-800 mb-1">No Pending Tasks</h3>
            <p className="text-sm text-gray-400">No tasks awaiting approval</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const totalTime = task.time_tracking?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0

              return (
                <div key={task.id} className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h4 className="font-bold text-gray-900">{task.task_name}</h4>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Pending Approval
                        </span>
                      </div>
                      {task.description && <p className="text-sm text-gray-500 mb-2">{task.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          {task.job_card.job_card_number}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {task.job_card.customer.name}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono tracking-wide">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          {task.job_card.vehicle.license_plate}
                        </span>
                        {task.assigned_to_user && (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {task.assigned_to_user.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Time Spent</p>
                      <p className="text-2xl font-bold text-blue-600">{formatTime(totalTime)}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Review & Approve Task</p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleApproveTask(task.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectTask(task.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      )}

      {/* Work Completed Tab */}
      {activeTab === 'completed' && (
      <div className="space-y-4">

        {jobCards.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-bold text-gray-800 mb-1">All Done!</h3>
            <p className="text-sm text-gray-400">No job cards pending inspection</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobCards.map(jobCard => (
              <div key={jobCard.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h4 className="font-bold text-gray-900">{jobCard.job_card_number}</h4>
                      
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="font-semibold text-gray-700">{jobCard.customer?.name}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono font-semibold tracking-wide text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        {jobCard.vehicle?.license_plate}
                      </span>
                      <span className="text-gray-400">{jobCard.vehicle?.make} {jobCard.vehicle?.model} · {jobCard.vehicle?.year}</span>
                    </div>
                    {jobCard.description && <p className="text-sm text-gray-500 mt-1.5">{jobCard.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</p>
                    <p className="text-xl font-bold text-amber-600">
                      {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(jobCard.total_amount || 0)}
                    </p>
                  </div>
                </div>

                {/* Related Tasks */}
                {jobCardTasks[jobCard.id] && jobCardTasks[jobCard.id].length > 0 && (
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                      Related Tasks ({jobCardTasks[jobCard.id].length})
                    </p>
                    <div className="space-y-1.5">
                      {jobCardTasks[jobCard.id].map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3.5 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{task.task_name}</p>
                            {task.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>}
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 flex-shrink-0 ml-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Completed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  
                  <button
                    onClick={() => handleMarkInspectionCompleted(jobCard.id)}
                    disabled={inspectionLoading[jobCard.id]}
                    className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                  >
                    {inspectionLoading[jobCard.id] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Mark as JobCard Completed
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

    </div>
  )
}

export default TaskApproval