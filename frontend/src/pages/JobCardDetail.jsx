import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'

function JobCardDetail({ jobCardId, onClose, user }) {
  const [jobCard, setJobCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  // Refs for sections
  const overviewRef = useRef(null)
  const tasksRef = useRef(null)
  const partsRef = useRef(null)
  const pricingRef = useRef(null)
  const paymentsRef = useRef(null)
  const inspectionRef = useRef(null)
  const historyRef = useRef(null)

  useEffect(() => {
    fetchJobCard()
  }, [jobCardId])

  const fetchJobCard = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get(`/job-cards/${jobCardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setJobCard(response.data)
    } catch (error) {
      console.error('Error fetching job card:', error)
      alert('Error loading job card')
    } finally {
      setLoading(false)
    }
  }

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
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-2"
              >
                ← Back to Job Cards
              </button>
              <h1 className="text-3xl font-bold text-gray-800">{jobCard.job_card_number}</h1>
              <p className="text-gray-600 mt-1">
                Created on {new Date(jobCard.created_at).toLocaleDateString()} by {jobCard.creator?.name}
              </p>
            </div>
            <div>
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
              onClick={() => scrollToSection(pricingRef, 'pricing')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'pricing'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Pricing
            </button>
            <button
              onClick={() => scrollToSection(paymentsRef, 'payments')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeSection === 'payments'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💳 Payments ({jobCard.payments?.length || 0})
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">🔧 Tasks</h2>
            {user.permissions.includes('add_tasks') && (
              <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold">
                ➕ Add Task
              </button>
            )}
          </div>

          {jobCard.tasks && jobCard.tasks.length > 0 ? (
            <div className="space-y-4">
              {jobCard.tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{task.task_name}</h3>
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatStatus(task.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Category</div>
                      <div className="font-semibold text-gray-800 capitalize">{task.category}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Labor Hours</div>
                      <div className="font-semibold text-gray-800">{task.labor_hours || '-'} hrs</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Labor Cost</div>
                      <div className="font-semibold text-gray-800">{formatCurrency(task.labor_cost)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Priority</div>
                      <div className="font-semibold text-gray-800">
                        {task.priority === 2 ? '🔴 Urgent' : task.priority === 1 ? '🟡 High' : '🟢 Normal'}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Employees */}
                  {task.assigned_employees && task.assigned_employees.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
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
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-gray-400 text-lg">No tasks added yet</div>
            </div>
          )}
        </section>

        {/* Spare Parts Section */}
        <section ref={partsRef} className="scroll-mt-40">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">🔩 Spare Parts Requests</h2>
            {user.permissions.includes('add_spare_parts') && (
              <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold">
                ➕ Request Parts
              </button>
            )}
          </div>

          {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 ? (
            <div className="space-y-4">
              {jobCard.spare_parts_requests.map((part) => (
                <div key={part.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{part.part_name}</h3>
                      {part.part_number && (
                        <p className="text-gray-600">Part #: {part.part_number}</p>
                      )}
                      <p className="text-gray-600 mt-1">{part.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="text-2xl font-bold text-gray-800">{part.quantity}</div>
                    </div>
                  </div>

                  {/* 3-Level Approval Status */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Employee</div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        part.employee_status === 'approved' ? 'bg-green-100 text-green-800' :
                        part.employee_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {part.employee_status === 'approved' ? '✅ Approved' :
                         part.employee_status === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Admin</div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        part.admin_status === 'approved' ? 'bg-green-100 text-green-800' :
                        part.admin_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {part.admin_status === 'approved' ? '✅ Approved' :
                         part.admin_status === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Customer</div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        part.customer_status === 'approved' ? 'bg-green-100 text-green-800' :
                        part.customer_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {part.customer_status === 'approved' ? '✅ Approved' :
                         part.customer_status === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-600">Unit Cost</div>
                      <div className="font-semibold text-gray-800">{formatCurrency(part.unit_cost)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Selling Price</div>
                      <div className="font-semibold text-gray-800">{formatCurrency(part.selling_price)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="font-bold text-primary text-lg">{formatCurrency(part.total_cost)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-gray-400 text-lg">No spare parts requested yet</div>
            </div>
          )}
        </section>

        {/* Pricing Section */}
        <section ref={pricingRef} className="scroll-mt-40">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Pricing Breakdown</h2>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-700 font-semibold">Labor Charges</span>
                <span className="text-gray-900 font-bold text-lg">{formatCurrency(jobCard.labor_cost)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-700 font-semibold">Parts Charges</span>
                <span className="text-gray-900 font-bold text-lg">{formatCurrency(jobCard.parts_cost)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-700 font-semibold">Other Charges</span>
                <span className="text-gray-900 font-bold text-lg">{formatCurrency(jobCard.other_charges)}</span>
              </div>
              {jobCard.discount > 0 && (
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-red-600 font-semibold">Discount</span>
                  <span className="text-red-600 font-bold text-lg">- {formatCurrency(jobCard.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-4 border-b border-2">
                <span className="text-gray-800 font-bold text-xl">Total Amount</span>
                <span className="text-primary font-bold text-2xl">{formatCurrency(jobCard.total_amount)}</span>
              </div>
              {jobCard.advance_payment > 0 && (
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-green-600 font-semibold">Advance Payment</span>
                  <span className="text-green-600 font-bold text-lg">- {formatCurrency(jobCard.advance_payment)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-800 font-bold text-xl">Balance Due</span>
                <span className={`font-bold text-2xl ${jobCard.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(jobCard.balance_amount)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Payments Section */}
        <section ref={paymentsRef} className="scroll-mt-40">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">💳 Payment History</h2>
            {user.permissions.includes('add_payments') && jobCard.balance_amount > 0 && (
              <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold">
                ➕ Record Payment
              </button>
            )}
          </div>

          {jobCard.payments && jobCard.payments.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Payment #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Method</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobCard.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-primary">{payment.payment_number}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-gray-700 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                          {payment.payment_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{payment.received_by?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-gray-400 text-lg">No payments recorded yet</div>
            </div>
          )}
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
    </div>
  )
}

export default JobCardDetail