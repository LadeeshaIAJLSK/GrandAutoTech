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
      if (response.data?.data) {
        setJobCard(response.data.data)
      } else {
        setJobCard(response.data)
      }
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      waiting_parts: 'bg-purple-100 text-purple-800 border-purple-300',
      waiting_customer: 'bg-orange-100 text-orange-800 border-orange-300',
      quality_check: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      invoiced: 'bg-teal-100 text-teal-800 border-teal-300',
      paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading job card...</div>
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Job card not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={onClose ? onClose : () => navigate('/job-cards')}
                className="text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-2"
              >
                ← Back to Job Cards
              </button>
              <h1 className="text-3xl font-bold text-gray-800">{jobCard.job_card_number}</h1>
              <p className="text-gray-600 mt-1">
                Created on {new Date(jobCard.created_at).toLocaleDateString()} by {jobCard.creator?.name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                🖨️ Print Job Card
              </button>
              <span className={`px-6 py-3 rounded-lg text-lg font-semibold border-2 ${getStatusColor(jobCard.status)}`}>
                {formatStatus(jobCard.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Buttons */}
      <div className="bg-white shadow-md sticky top-[88px] z-40 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => scrollToSection(overviewRef, 'overview')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'overview'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Overview
            </button>
            <button
              onClick={() => scrollToSection(tasksRef, 'tasks')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'tasks'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔧 Tasks ({jobCard.tasks?.length || 0})
            </button>
            <button
              onClick={() => scrollToSection(partsRef, 'parts')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'parts'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔩 Spare Parts ({jobCard.spare_parts_requests?.length || 0})
            </button>
            <button
              onClick={() => scrollToSection(advancePaymentsRef, 'advancePayments')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'advancePayments'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💳 Advance Payments
            </button>
            <button
              onClick={() => scrollToSection(pricingRef, 'pricing')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'pricing'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Pricing & Payments
            </button>
            <button
              onClick={() => scrollToSection(inspectionRef, 'inspection')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'inspection'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Inspection
            </button>
            <button
              onClick={() => scrollToSection(historyRef, 'history')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'history'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📜 History
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Overview Section */}
        <section ref={overviewRef} className="scroll-mt-40">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                👤 Customer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-semibold text-gray-800">{jobCard.customer?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-semibold text-gray-800">{jobCard.customer?.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-semibold text-gray-800">{jobCard.customer?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-semibold text-gray-800">{jobCard.customer?.address || '-'}</div>
                </div>
              </div>
            </div>

            {/* Vehicle Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🚗 Vehicle Information
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">License Plate</div>
                  <div className="font-bold text-xl text-primary">{jobCard.vehicle?.license_plate}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Make & Model</div>
                  <div className="font-semibold text-gray-800">
                    {jobCard.vehicle?.make} {jobCard.vehicle?.model} ({jobCard.vehicle?.year})
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Color</div>
                  <div className="font-semibold text-gray-800">{jobCard.vehicle?.color || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Current Mileage</div>
                  <div className="font-semibold text-gray-800">
                    {jobCard.current_mileage ? `${jobCard.current_mileage.toLocaleString()} km` : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complaint & Notes */}
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📝 Customer Complaint</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{jobCard.customer_complaint}</p>
          </div>

          {jobCard.initial_inspection_notes && (
            <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Initial Inspection Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{jobCard.initial_inspection_notes}</p>
            </div>
          )}

          {jobCard.recommendations && (
            <div className="bg-yellow-50 rounded-xl border-2 border-yellow-200 p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Recommendations</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{jobCard.recommendations}</p>
            </div>
          )}

          {/* Images */}
          {jobCard.images && jobCard.images.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📸 Vehicle Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {jobCard.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.image_url}
                      alt={image.description || 'Vehicle image'}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary transition-colors"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-semibold">
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
          <TaskManagement 
            jobCard={jobCard} 
            onUpdate={fetchJobCard}
            user={user}
          />
        </section>

        {/* Spare Parts Section */}
        <section ref={partsRef} className="scroll-mt-40">
          {/* Admin Approval Panel */}
          {['super_admin', 'branch_admin'].includes(user?.role?.name) && (
            <PartsApprovalPanel 
              jobCard={jobCard}
              user={user}
              onUpdate={fetchJobCard}
            />
          )}

          <SparePartsManagement 
            jobCard={jobCard} 
            onUpdate={fetchJobCard}
            user={user}
          />
        </section>

        {/* Pricing & Payments Section */}
        <section ref={pricingRef} className="scroll-mt-40">
          <PaymentManagement 
            jobCard={jobCard} 
            onUpdate={fetchJobCard}
            user={user}
            advancePaymentsRef={advancePaymentsRef}
          />
        </section>

        {/* Inspection Section */}
        <section ref={inspectionRef} className="scroll-mt-40">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Quality Inspection</h2>
          
          {jobCard.inspections && jobCard.inspections.length > 0 ? (
            <div className="space-y-4">
              {jobCard.inspections.map((inspection) => (
                <div key={inspection.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 capitalize">{inspection.inspection_type} Inspection</h3>
                      <p className="text-gray-600">
                        Inspected by {inspection.inspector?.name} on {new Date(inspection.inspected_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inspection.status === 'approved' ? '✅ Approved' :
                       inspection.status === 'rejected' ? '❌ Rejected' :
                       '⚠️ Needs Revision'}
                    </span>
                  </div>

                  {inspection.quality_rating && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-1">Quality Rating</div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-2xl ${i < inspection.quality_rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {inspection.notes && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Notes</div>
                      <p className="text-gray-700">{inspection.notes}</p>
                    </div>
                  )}

                  {inspection.issues_found && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-red-800 mb-1">Issues Found</div>
                      <p className="text-red-700">{inspection.issues_found}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-gray-400 text-lg">No inspections performed yet</div>
            </div>
          )}
        </section>

        {/* History/Timeline Section */}
        <section ref={historyRef} className="scroll-mt-40">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📜 Job Card History</h2>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-full bg-gray-300"></div>
                </div>
                <div className="pb-8">
                  <div className="font-semibold text-gray-800">Job Card Created</div>
                  <div className="text-sm text-gray-600">
                    {new Date(jobCard.created_at).toLocaleString()} by {jobCard.creator?.name}
                  </div>
                </div>
              </div>

              {jobCard.actual_completion_date && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-gray-300"></div>
                  </div>
                  <div className="pb-8">
                    <div className="font-semibold text-gray-800">Work Completed</div>
                    <div className="text-sm text-gray-600">
                      {new Date(jobCard.actual_completion_date).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {jobCard.delivered_date && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Vehicle Delivered</div>
                    <div className="text-sm text-gray-600">
                      {new Date(jobCard.delivered_date).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <JobCardPrint ref={printRef} jobCard={jobCard} />
    </div>
  )
}

export default JobCardDetail