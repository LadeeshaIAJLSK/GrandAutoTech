import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import TaskManagement from '../components/jobcards/TaskManagement'
import SparePartsManagement from '../components/jobcards/SparePartsManagement'
import PaymentManagement from '../components/jobcards/PaymentManagement'
import JobCardPrint from '../components/jobcards/JobCardPrint'
import PartsApprovalPanel from '../components/jobcards/PartsApprovalPanel'
import axiosClient from '../api/axios'

function JobCardDetail({ jobCardId, onClose, user } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const actualJobCardId = jobCardId || params.id
  
  const [jobCard, setJobCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [inspectedTasks, setInspectedTasks] = useState({})
  const [markingInspected, setMarkingInspected] = useState(false)

  // Refs for sections
  const overviewRef = useRef(null)
  const tasksRef = useRef(null)
  const partsRef = useRef(null)
  const advancePaymentsRef = useRef(null)
  const pricingRef = useRef(null)
  const inspectionRef = useRef(null)
  const historyRef = useRef(null)
  const printRef = useRef()

  useEffect(() => {
    fetchJobCard()
  }, [actualJobCardId])

  const fetchJobCard = async () => {
    try {
      setLoading(true)
      const response = await axiosClient.get(`/job-cards/${actualJobCardId}`)
      console.log('[FETCH] Raw API Response:', response.data)
      console.log('[FETCH] Response has .success?', response.data?.success)
      console.log('[FETCH] Response has .data?', !!response.data?.data)
      console.log('[FETCH] Response otherChargesCount:', response.data?.otherChargesCount)
      console.log('[FETCH] Response DEBUG_otherCharges:', response.data?.DEBUG_otherCharges)
      
      let jobCardData = response.data
      
      // Handle wrapped response (success: true, data: {...})
      if (response.data?.success && response.data?.data) {
        jobCardData = response.data.data
        console.log('[FETCH] Extracted jobCard from .data wrapper')
      }
      // Handle legacy response.data.data format
      else if (response.data?.data && typeof response.data.data === 'object' && response.data.data.id) {
        jobCardData = response.data.data
        console.log('[FETCH] Extracted jobCard from legacy .data.data wrapper')
      }
      
      console.log('[FETCH] Final jobCard data:', jobCardData)
      console.log('[FETCH] jobCard.otherCharges:', jobCardData?.otherCharges)
      console.log('[FETCH] jobCard.other_charges (total):', jobCardData?.other_charges)
      
      setJobCard(jobCardData)
    } catch (error) {
      console.error('Error fetching job card:', error)
      alert('Error loading job card: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: jobCard?.job_card_number,
  })

  const scrollToSection = (ref, section) => {
    setActiveSection(section)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      pending: 'bg-yellow-400', in_progress: 'bg-blue-500',
      completed: 'bg-orange-500', inspected: 'bg-indigo-500',
    }
    return dots[status] || 'bg-gray-400'
  }

  const formatStatus = (status) => status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(amount)

  const handleTaskInspectionChange = (taskId) => {
    setInspectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const handleCheckAllTasks = () => {
    const allChecked = jobCard.tasks?.length > 0 && 
      jobCard.tasks.every(task => inspectedTasks[task.id])
    
    if (allChecked) {
      setInspectedTasks({})
    } else {
      const newInspected = {}
      jobCard.tasks?.forEach(task => {
        newInspected[task.id] = true
      })
      setInspectedTasks(newInspected)
    }
  }

  const validatePricingBeforeInspection = () => {
    // Check spare parts pricing - only if spare parts exist
    if (jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0) {
      for (const sparePart of jobCard.spare_parts_requests) {
        // Only validate if pricing fields are set
        if ((sparePart.cost_price !== null && sparePart.cost_price !== undefined) || 
            (sparePart.amount !== null && sparePart.amount !== undefined)) {
          if (!sparePart.cost_price || sparePart.cost_price === 0) {
            return {
              valid: false,
              message: `Spare part "${sparePart.part_name}" has zero cost price. Please enter a valid cost price.`
            }
          }
          if (!sparePart.amount || sparePart.amount === 0) {
            return {
              valid: false,
              message: `Spare part "${sparePart.part_name}" has zero selling price. Please enter a valid selling price.`
            }
          }
        }
      }
    }

    // Check task/service pricing - only for tasks that have pricing set
    if (jobCard.tasks && jobCard.tasks.length > 0) {
      for (const task of jobCard.tasks) {
        // Only validate if task has cost or amount assigned (not all tasks need pricing)
        if ((task.cost !== null && task.cost !== undefined && task.cost > 0) || 
            (task.amount !== null && task.amount !== undefined && task.amount > 0)) {
          if (!task.cost || task.cost === 0) {
            return {
              valid: false,
              message: `Task "${task.task_name}" has invalid cost. Please enter a valid cost price.`
            }
          }
          if (!task.amount || task.amount === 0) {
            return {
              valid: false,
              message: `Task "${task.task_name}" has invalid amount. Please enter a valid amount.`
            }
          }
        }
      }
    }

    return { valid: true }
  }

  const handleMarkAsInspected = async () => {
    const validation = validatePricingBeforeInspection()
    if (!validation.valid) {
      alert(validation.message)
      return
    }

    try {
      setMarkingInspected(true)
      const token = localStorage.getItem('token')
      await axiosClient.post(`/job-cards/${jobCard.id}/mark-inspected`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Job card marked as inspected successfully!')
      fetchJobCard()
      setInspectedTasks({})
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking job card as inspected')
    } finally {
      setMarkingInspected(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading job card...</p>
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm font-semibold text-red-500">Job card not found</div>
      </div>
    )
  }

  const navItems = [
    { key: 'overview',        ref: overviewRef,        label: 'Overview',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: 'tasks',           ref: tasksRef,           label: `Tasks (${jobCard.tasks?.length || 0})`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { key: 'parts',           ref: partsRef,           label: `Spare Parts (${jobCard.spare_parts_requests?.length || 0})`,
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg> },
    { key: 'advancePayments', ref: advancePaymentsRef, label: 'Advance Payments',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { key: 'pricing',         ref: pricingRef,         label: 'Pricing & Payments',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'inspection',      ref: inspectionRef,      label: 'Inspection',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'history',         ref: historyRef,         label: 'History',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={onClose ? onClose : () => navigate('/job-cards')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 group transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Job Cards
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{jobCard.job_card_number}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusStyle(jobCard.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(jobCard.status)}`} />
                  {formatStatus(jobCard.status)}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Created {new Date(jobCard.created_at).toLocaleDateString()} by {jobCard.creator?.name}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Job Card
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Nav */}
      <div className="bg-white shadow-sm sticky top-[88px] z-40 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.ref, item.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSection === item.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Overview Section */}
        <section ref={overviewRef} className="scroll-mt-40">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Information
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Name', value: jobCard.customer?.name },
                  { label: 'Phone', value: jobCard.customer?.phone },
                  { label: 'Email', value: jobCard.customer?.email || '—' },
                  { label: 'Address', value: jobCard.customer?.address || '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-4">
                    <span className="text-xs text-gray-400 uppercase tracking-wide flex-shrink-0">{row.label}</span>
                    <span className="font-semibold text-gray-800 text-sm text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Vehicle Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wide flex-shrink-0">License Plate</span>
                  <span className="font-bold text-primary text-sm font-mono tracking-widest">{jobCard.vehicle?.license_plate}</span>
                </div>
                {[
                  { label: 'Make & Model', value: `${jobCard.vehicle?.make} ${jobCard.vehicle?.model} (${jobCard.vehicle?.year})` },
                  { label: 'Color', value: jobCard.vehicle?.color || '—' },
                  { label: 'Mileage', value: jobCard.current_mileage ? `${jobCard.current_mileage.toLocaleString()} km` : '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-4">
                    <span className="text-xs text-gray-400 uppercase tracking-wide flex-shrink-0">{row.label}</span>
                    <span className="font-semibold text-gray-800 text-sm text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Complaint */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Customer Complaint
            </h3>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{jobCard.customer_complaint}</p>
          </div>

          {jobCard.initial_inspection_notes && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mt-4">
              <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Initial Inspection Notes
              </h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{jobCard.initial_inspection_notes}</p>
            </div>
          )}

          {jobCard.recommendations && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mt-4">
              <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recommendations
              </h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{jobCard.recommendations}</p>
            </div>
          )}

          {/* Images */}
          {jobCard.images && jobCard.images.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Vehicle Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {jobCard.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.image_url}
                      alt={image.description || 'Vehicle image'}
                      className="w-full h-36 object-cover rounded-lg border border-gray-200 group-hover:border-primary transition-colors"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-semibold">
                      {image.image_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Tasks Section */}
        <section ref={tasksRef} className="scroll-mt-40">
          <TaskManagement jobCard={jobCard} onUpdate={fetchJobCard} user={user} />
        </section>

        {/* Spare Parts Section */}
        <section ref={partsRef} className="scroll-mt-40">
          {['super_admin', 'branch_admin'].includes(user?.role?.name) && (
            <PartsApprovalPanel jobCard={jobCard} user={user} onUpdate={fetchJobCard} />
          )}
          <SparePartsManagement jobCard={jobCard} onUpdate={fetchJobCard} user={user} />
        </section>

        {/* Pricing & Payments Section */}
        <section ref={pricingRef} className="scroll-mt-40">
          <PaymentManagement jobCard={jobCard} onUpdate={fetchJobCard} user={user} advancePaymentsRef={advancePaymentsRef} />
        </section>

        {/* Inspection Section */}
        <section ref={inspectionRef} className="scroll-mt-40">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quality Inspection
          </h2>

          {/* Task Inspection Section - Only show when completed */}
          {jobCard.status === 'completed' && jobCard.tasks && jobCard.tasks.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mark Job Card as Inspected</h3>
                  <p className="text-sm text-gray-600">Review and approve all task-related actions for this job card.</p>
                </div>
              </div>

              {/* Check All Checkbox */}
              <div className="bg-white rounded-lg p-4 mb-4 border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={jobCard.tasks?.length > 0 && jobCard.tasks.every(task => inspectedTasks[task.id])}
                    onChange={handleCheckAllTasks}
                    className="w-5 h-5 rounded border-2 border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900">
                    {jobCard.tasks?.every(task => inspectedTasks[task.id]) ? 'Uncheck All' : 'Check All Tasks'}
                  </span>
                </label>
              </div>

              {/* Task List with Checkboxes */}
              <div className="space-y-2 mb-5 max-h-96 overflow-y-auto">
                {jobCard.tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!inspectedTasks[task.id]}
                        onChange={() => handleTaskInspectionChange(task.id)}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{task.task_name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{task.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                            {task.category || 'general'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            ✓ Completed
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Mark as Inspected Button */}
              {(() => {
                const pricingValidation = validatePricingBeforeInspection()
                const tasksChecked = jobCard.tasks?.length > 0 && jobCard.tasks.every(task => inspectedTasks[task.id])
                
                // Determine specific disabled reason
                let disabledReason = null
                let buttonText = 'Mark All as Inspected'
                
                if (markingInspected) {
                  buttonText = 'Marking as Inspected...'
                } else if (!pricingValidation.valid) {
                  // Check if it's spare parts or tasks pricing issue
                  if (pricingValidation.message.includes('Spare')) {
                    disabledReason = 'Fix Spare Parts Pricing'
                    buttonText = 'Fix Spare Parts Pricing'
                  } else if (pricingValidation.message.includes('Task') || pricingValidation.message.includes('Service')) {
                    disabledReason = 'Fix Services Pricing'
                    buttonText = 'Fix Services Pricing'
                  } else {
                    disabledReason = 'Fix Pricing Issues'
                    buttonText = 'Fix Pricing Issues'
                  }
                } else if (!tasksChecked) {
                  disabledReason = 'Check all tasks to proceed'
                  buttonText = 'Check All Tasks to Proceed'
                }
                
                const isDisabled = markingInspected || disabledReason !== null
                
                return (
                  <div>
                    <button
                      onClick={handleMarkAsInspected}
                      disabled={isDisabled}
                      title={disabledReason || 'Mark job card as inspected and complete the inspection process'}
                      className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        isDisabled
                          ? 'bg-gray-300 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {markingInspected ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Marking as Inspected...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {buttonText}
                        </>
                      )}
                    </button>
                    
                    {/* Validation Messages */}
                    {!pricingValidation.valid && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Pricing Issue</p>
                        <p className="text-sm text-red-700">{pricingValidation.message}</p>
                      </div>
                    )}
                    
                    {!tasksChecked && pricingValidation.valid && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Tasks Not Reviewed</p>
                        <p className="text-sm text-yellow-700">Please check all tasks above before proceeding with inspection.</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {jobCard.inspections && jobCard.inspections.length > 0 ? (
            <div className="space-y-3">
              {jobCard.inspections.map((inspection) => (
                <div key={inspection.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 capitalize">{inspection.inspection_type} Inspection</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inspection.inspector?.name} · {new Date(inspection.inspected_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      inspection.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      inspection.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inspection.status === 'approved' ? 'bg-green-500' :
                        inspection.status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      {inspection.status === 'approved' ? 'Approved' :
                       inspection.status === 'rejected' ? 'Rejected' : 'Needs Revision'}
                    </span>
                  </div>

                  {inspection.quality_rating && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Quality Rating</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${i < inspection.quality_rating ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  )}

                  {inspection.notes && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{inspection.notes}</p>
                    </div>
                  )}

                  {inspection.issues_found && (
                    <div className="flex gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg mt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-0.5">Issues Found</p>
                        <p className="text-sm text-red-700">{inspection.issues_found}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">No inspections performed yet</p>
            </div>
          )}
        </section>

        {/* History Section */}
        <section ref={historyRef} className="scroll-mt-40">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Job Card History
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="space-y-0">
              {[
                { dot: 'bg-green-500', title: 'Job Card Created', date: jobCard.created_at, by: jobCard.creator?.name, show: true },
                { dot: 'bg-blue-500', title: 'Work Completed', date: jobCard.actual_completion_date, show: !!jobCard.actual_completion_date },
                { dot: 'bg-purple-500', title: 'Vehicle Delivered', date: jobCard.delivered_date, show: !!jobCard.delivered_date },
              ].filter(e => e.show).map((event, i, arr) => (
                <div key={event.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${event.dot}`} />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className={`${i < arr.length - 1 ? 'pb-5' : ''}`}>
                    <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(event.date).toLocaleString()}
                      {event.by && ` · ${event.by}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <JobCardPrint ref={printRef} jobCard={jobCard} />
    </div>
  )
}

export default JobCardDetail