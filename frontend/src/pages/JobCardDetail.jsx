import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import TaskManagement from '../components/jobcards/TaskManagement'
import SparePartsManagement from '../components/jobcards/SparePartsManagement'
import PaymentManagement from '../components/jobcards/PaymentManagement'
import JobCardPrint from '../components/jobcards/JobCardPrint'
import PartsApprovalPanel from '../components/jobcards/PartsApprovalPanel'
import Notification from '../components/common/Notification'
import axiosClient from '../api/axios'

function JobCardDetail({ jobCardId, onClose, user } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const actualJobCardId = jobCardId || params.id
  
  const [jobCard, setJobCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [savingPrices, setSavingPrices] = useState(false)
  const [pricingStatus, setPricingStatus] = useState({
    savedServices: false,
    savedSpareParts: false,
    savedCharges: false
  })
  const [notification, setNotification] = useState(null)

  // Refs for sections
  const overviewRef = useRef(null)
  const tasksRef = useRef(null)
  const partsRef = useRef(null)
  const advancePaymentsRef = useRef(null)
  const pricingRef = useRef(null)
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
      console.log('[FETCH] jobCard.images:', jobCardData?.images)
      console.log('[FETCH] Images count:', jobCardData?.images?.length || 0)
      
      setJobCard(jobCardData)
    } catch (error) {
      console.error('Error fetching job card:', error)
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || error.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
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

  // Check if there are any records in pricing sections
  const hasPricingRecords = () => {
    const hasServices = jobCard.tasks?.some(task => task.amount > 0) || false
    const hasParts = jobCard.spare_parts_requests?.length > 0 || false
    const hasCharges = jobCard.otherCharges?.length > 0 || false
    return hasServices || hasParts || hasCharges
  }

  // Check if all pricing sections with records have been saved
  const allPricingSectionsSaved = () => {
    const hasServices = jobCard.tasks?.some(task => task.amount > 0) || false
    const hasParts = jobCard.spare_parts_requests?.length > 0 || false
    const hasCharges = jobCard.otherCharges?.length > 0 || false

    // If section has records, it must be saved
    if (hasServices && !pricingStatus.savedServices) return false
    if (hasParts && !pricingStatus.savedSpareParts) return false
    if (hasCharges && !pricingStatus.savedCharges) return false

    // At least one section with records must exist
    return hasServices || hasParts || hasCharges
  }

  // Get list of unsaved sections
  const getUnsavedSections = () => {
    const unsaved = []
    if ((jobCard.tasks?.some(task => task.amount > 0) || false) && !pricingStatus.savedServices) {
      unsaved.push('Services Pricing')
    }
    if ((jobCard.spare_parts_requests?.length > 0 || false) && !pricingStatus.savedSpareParts) {
      unsaved.push('Spare Parts Pricing')
    }
    if ((jobCard.otherCharges?.length > 0 || false) && !pricingStatus.savedCharges) {
      unsaved.push('Additional Charges')
    }
    return unsaved
  }

  // Validate all pricing before marking as inspected
  const validateAllPricing = () => {
    const errors = []
    
    // Check tasks with amounts
    jobCard.tasks?.forEach(task => {
      if (task.amount && task.amount > 0 && (!task.cost_price || task.cost_price === 0)) {
        errors.push(`Task "${task.task_name}" has no cost price set`)
      }
    })

    // Check spare parts
    jobCard.spare_parts_requests?.forEach(part => {
      if (part.overall_status === 'delivered' || part.overall_status === 'installed') {
        if (!part.unit_cost || part.unit_cost === 0) {
          errors.push(`Spare part "${part.part_name}" has no unit cost set`)
        }
        if (!part.selling_price || part.selling_price === 0) {
          errors.push(`Spare part "${part.part_name}" has no selling price set`)
        }
      }
    })

    // Check other charges
    jobCard.otherCharges?.forEach((charge, idx) => {
      if (!charge.amount || charge.amount === 0) {
        errors.push(`Charge "${charge.description}" has no amount set`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handleSavePrices = async () => {
    // Check if all pricing sections with records are saved
    if (!allPricingSectionsSaved()) {
      const unsaved = getUnsavedSections()
      setNotification({ 
        type: 'error', 
        title: 'Unsaved Sections', 
        message: `Please save pricing for the following sections before proceeding: ${unsaved.join(', ')}`
      })
      return
    }

    try {
      setSavingPrices(true)
      await axiosClient.post(`/job-cards/${jobCard.id}/mark-inspected`, {})
      setNotification({ type: 'success', title: 'Success', message: 'Prices saved and job card marked as inspected!' })
      fetchJobCard()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error saving prices' })
    } finally {
      setSavingPrices(false)
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
    { key: 'history',         ref: historyRef,         label: 'History',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg mb-4">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={onClose ? onClose : () => navigate('/job-cards')}
                className="inline-flex items-center gap-1.5 text-sm text-white font-bold bg-yellow-500 rounded-lg px-4 py-2 hover:bg-yellow-800 mb-2 group transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back 
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
              className="inline-flex items-center gap-2 bg-[#2563A8] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative">

        {/* Right Side Navigation */}
        <div className="fixed right-6 top-32 flex flex-col gap-2 z-40">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => scrollToSection(item.ref, item.key)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110 ${
                activeSection === item.key
                  ? 'bg-yellow-500 text-white'
                  : 'bg-[#2563A8] text-white hover:opacity-90'
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>

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
                  { label: 'Odometer Reading', value: jobCard.odometer_reading ? `${jobCard.odometer_reading.toLocaleString()} km` : '—' },
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

         

          {/* Images */}
          {/* Images Section */}
          <section>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Vehicle Images
              </h3>
              {jobCard?.images && Array.isArray(jobCard.images) && jobCard.images.length > 0 ? (
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
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No images captured yet</p>
                  <p className="text-gray-400 text-sm">Images will appear once they are added during service</p>
                </div>
              )}
            </div>
          </section>
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
          <PaymentManagement jobCard={jobCard} onUpdate={fetchJobCard} user={user} advancePaymentsRef={advancePaymentsRef} onPricingStatusChange={setPricingStatus} />
        </section>

        {/* Save Prices Section - Only show when job card is completed */}
        {jobCard.status === 'completed' && (
          <section className="scroll-mt-40">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Save Prices & Mark as Inspected</h3>
                  <p className="text-sm text-gray-600">Review all prices for services, spare parts, and additional charges before completing.</p>
                </div>
              </div>

              {(() => {
                const hasPricing = hasPricingRecords()
                const allSaved = allPricingSectionsSaved()
                const unsaved = getUnsavedSections()
                
                return (
                  <div>
                    <button
                      onClick={handleSavePrices}
                      disabled={savingPrices || !allSaved}
                      className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        savingPrices || !allSaved
                          ? 'bg-gray-300 cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {savingPrices ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving Prices...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Prices & Mark as Inspected
                        </>
                      )}
                    </button>
                    
                    {/* Unsaved Sections Feedback */}
                    {hasPricing && !allSaved && unsaved.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">❌ Unsaved Sections</p>
                        <p className="text-sm text-red-700 mb-2">Please save pricing for the following sections before completing:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {unsaved.map((section, idx) => (
                            <li key={idx}>• {section}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasPricing && allSaved && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">✅ All Prices Saved</p>
                        <p className="text-sm text-green-700 mt-1">All pricing sections have been saved. Ready to mark as inspected.</p>
                      </div>
                    )}

                    {!hasPricing && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">No Records Found</p>
                        <p className="text-sm text-blue-700 mt-1">No services, spare parts, or additional charges were recorded. No pricing needed.</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </section>
        )}

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

      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default JobCardDetail