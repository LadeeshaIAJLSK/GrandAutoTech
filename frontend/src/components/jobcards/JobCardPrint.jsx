import { forwardRef } from 'react'

const JobCardPrint = forwardRef(({ jobCard }, ref) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount)
  }

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div ref={ref} className="hidden print:block bg-white p-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 1cm; }
        }
      `}</style>

      <div className="print-content">
        {/* Header */}
        <div className="text-center border-b-4 border-primary pb-4 mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">🚗 GRAND AUTO TECH</h1>
          <p className="text-lg text-gray-600">Vehicle Repair Shop Management System</p>
          <p className="text-sm text-gray-500 mt-1">
            {jobCard.branch?.name} • {jobCard.branch?.phone} • {jobCard.branch?.email}
          </p>
        </div>

        {/* Job Card Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">JOB CARD</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Job Card #:</span>
                <span className="ml-2 text-xl text-primary font-bold">{jobCard.job_card_number}</span>
              </div>
              <div>
                <span className="font-semibold">Date:</span>
                <span className="ml-2">{new Date(jobCard.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-semibold">Status:</span>
                <span className="ml-2 font-bold">{formatStatus(jobCard.status)}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            {jobCard.estimated_completion_date && (
              <div className="bg-yellow-50 border border-yellow-300 p-3 rounded">
                <div className="text-sm text-gray-600">Estimated Completion</div>
                <div className="text-lg font-bold text-gray-800">
                  {new Date(jobCard.estimated_completion_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-lg border-b pb-2">👤 CUSTOMER DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {jobCard.customer?.name}</div>
              <div><strong>Phone:</strong> {jobCard.customer?.phone}</div>
              <div><strong>Email:</strong> {jobCard.customer?.email || '-'}</div>
              <div><strong>Address:</strong> {jobCard.customer?.address || '-'}</div>
            </div>
          </div>

          <div className="border-2 border-gray-300 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-lg border-b pb-2">🚗 VEHICLE DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div><strong>License Plate:</strong> <span className="text-xl font-bold text-primary">{jobCard.vehicle?.license_plate}</span></div>
              <div><strong>Make/Model:</strong> {jobCard.vehicle?.make} {jobCard.vehicle?.model}</div>
              <div><strong>Year:</strong> {jobCard.vehicle?.year}</div>
              <div><strong>Mileage:</strong> {jobCard.current_mileage ? `${jobCard.current_mileage.toLocaleString()} km` : '-'}</div>
            </div>
          </div>
        </div>

        {/* Customer Complaint */}
        <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-2 text-lg">📝 CUSTOMER COMPLAINT</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{jobCard.customer_complaint}</p>
        </div>

        {/* Inspection Notes */}
        {jobCard.initial_inspection_notes && (
          <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-2 text-lg">🔍 INSPECTION NOTES</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{jobCard.initial_inspection_notes}</p>
          </div>
        )}

        {/* Tasks */}
        {jobCard.tasks && jobCard.tasks.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 text-lg border-b-2 pb-2">🔧 WORK PERFORMED</h3>
            <table className="w-full border-collapse border-2 border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Task Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Hours</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {jobCard.tasks.map((task, index) => (
                  <tr key={task.id}>
                    <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="font-semibold">{task.task_name}</div>
                      {task.description && <div className="text-sm text-gray-600">{task.description}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 capitalize">{task.category}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{task.labor_hours || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      {formatCurrency(task.labor_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Spare Parts */}
        {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3 text-lg border-b-2 pb-2">🔩 SPARE PARTS USED</h3>
            <table className="w-full border-collapse border-2 border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Part Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Part Number</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {jobCard.spare_parts_requests
                  .filter(part => part.overall_status === 'installed')
                  .map((part, index) => (
                  <tr key={part.id}>
                    <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 font-semibold">{part.part_name}</td>
                    <td className="border border-gray-300 px-3 py-2">{part.part_number || '-'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{part.quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {formatCurrency(part.selling_price)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                      {formatCurrency(part.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="border-4 border-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3 text-xl">💰 PRICING SUMMARY</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Labor Charges:</span>
              <span className="font-bold">{formatCurrency(jobCard.labor_cost || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Parts Charges:</span>
              <span className="font-bold">{formatCurrency(jobCard.parts_cost || 0)}</span>
            </div>
            {jobCard.other_charges > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-semibold">Other Charges:</span>
                <span className="font-bold">{formatCurrency(jobCard.other_charges)}</span>
              </div>
            )}
            {jobCard.discount > 0 && (
              <div className="flex justify-between py-2 border-b text-red-600">
                <span className="font-semibold">Discount:</span>
                <span className="font-bold">- {formatCurrency(jobCard.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-4 border-gray-800 text-xl">
              <span className="font-bold">TOTAL AMOUNT:</span>
              <span className="font-bold text-primary">{formatCurrency(jobCard.total_amount || 0)}</span>
            </div>
            {jobCard.advance_payment > 0 && (
              <div className="flex justify-between py-2 border-b text-green-600">
                <span className="font-semibold">Paid:</span>
                <span className="font-bold">- {formatCurrency(jobCard.advance_payment)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 text-xl">
              <span className="font-bold">BALANCE DUE:</span>
              <span className={`font-bold ${jobCard.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(jobCard.balance_amount || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t-2 border-gray-300">
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2 mt-12">
              <div className="font-bold">Technician Signature</div>
              <div className="text-sm text-gray-600">Date: __________</div>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2 mt-12">
              <div className="font-bold">Manager Signature</div>
              <div className="text-sm text-gray-600">Date: __________</div>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-800 pt-2 mt-12">
              <div className="font-bold">Customer Signature</div>
              <div className="text-sm text-gray-600">Date: __________</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600 border-t pt-4">
          <p>Thank you for choosing Grand Auto Tech!</p>
          <p className="mt-1">For any queries, please contact us at {jobCard.branch?.phone}</p>
        </div>
      </div>
    </div>
  )
})

JobCardPrint.displayName = 'JobCardPrint'

export default JobCardPrint