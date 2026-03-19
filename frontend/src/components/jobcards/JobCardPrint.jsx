import { forwardRef } from 'react'

const JobCardPrint = forwardRef(({ jobCard }, ref) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount)
  }

  const formatStatus = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div ref={ref} className="hidden print:block bg-white">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 1.2cm; }
        }
        .print-content { font-family: 'Segoe UI', system-ui, sans-serif; }
        .section-title {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #000;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 2px solid #000;
        }
        .label { font-size: 10px; color: #000; font-weight: 500; }
        .value { font-size: 11px; color: #000; font-weight: 600; }
        .table-th {
          background: #000;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #fff;
          padding: 8px 10px;
          border-bottom: 2px solid #000;
        }
        .table-td {
          font-size: 9px;
          color: #000;
          padding: 3px 6px;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: top;
        }
      `}</style>

      <div className="print-content" style={{ padding: '0', maxWidth: '100%' }}>

        {/* ── Header ── */}
        <div style={{
          background: '#000',
          padding: '10px 16px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
                GRAND AUTO TECH
              </span>
            </div>
            <p style={{ fontSize: '9px', color: '#fff', margin: 0 }}>Vehicle Repair & Service</p>
            {jobCard.branch && (
              <p style={{ fontSize: '8px', color: '#fff', margin: '1px 0 0' }}>
                {jobCard.branch.name}{jobCard.branch.phone ? ` · ${jobCard.branch.phone}` : ''}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#fff', marginBottom: '2px' }}>JOB CARD</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {jobCard.job_card_number}
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: '3px',
              padding: '2px 8px',
              background: '#333',
              border: '1px solid #fff',
              borderRadius: '12px',
              fontSize: '8px',
              color: '#fff',
              fontWeight: '600',
            }}>
              {formatStatus(jobCard.status)}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>

          {/* ── Customer & Vehicle Details ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
            {/* Customer Details */}
            <div style={{ border: '1px solid #000', borderRadius: '4px', padding: '6px', fontSize: '8px' }}>
              <div style={{ fontWeight: '700', color: '#000', marginBottom: '3px', paddingBottom: '2px', borderBottom: '1px solid #000' }}>CUSTOMER</div>
              <div style={{ display: 'grid', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Name:</span>
                  <span>{jobCard.customer?.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Phone:</span>
                  <span>{jobCard.customer?.phone || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Email:</span>
                  <span style={{ fontSize: '7px' }}>{jobCard.customer?.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Address:</span>
                  <span style={{ textAlign: 'right', fontSize: '7px', maxWidth: '50%' }}>{jobCard.customer?.address || '—'}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div style={{ border: '1px solid #000', borderRadius: '4px', padding: '6px', fontSize: '8px' }}>
              <div style={{ fontWeight: '700', color: '#000', marginBottom: '3px', paddingBottom: '2px', borderBottom: '1px solid #000' }}>VEHICLE</div>
              <div style={{ display: 'grid', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>License:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '9px' }}>{jobCard.vehicle?.license_plate || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Make/Model:</span>
                  <span>{jobCard.vehicle?.make} {jobCard.vehicle?.model || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Year:</span>
                  <span>{jobCard.vehicle?.year || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>Odometer Reading:</span>
                  <span>{jobCard.odometer_reading ? jobCard.odometer_reading.toLocaleString() + ' km' : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Job Details ── */}
          <div style={{ marginBottom: '8px', padding: '4px 6px', fontSize: '8px', border: '1px solid #000', borderRadius: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <span style={{ fontWeight: '600' }}>Created:</span> {new Date(jobCard.created_at).toLocaleDateString()}
            </div>
            {jobCard.estimated_completion_date && (
              <div>
                <span style={{ fontWeight: '600' }}>Est. Completion:</span> {new Date(jobCard.estimated_completion_date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* ── Work Performed ── */}
          {jobCard.tasks && jobCard.tasks.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className="section-title">SERVICES PRICING</div>
              <div style={{ border: '1px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Description', 'Category', 'Employee', 'Status', 'Hours', 'Cost', 'Amount', 'Profit'].map((h, i) => (
                        <th key={i} className="table-th" style={{ padding: '4px 6px', textAlign: i > 3 ? 'right' : 'left', fontSize: '8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.tasks.map((task, index) => {
                      const taskCost = parseFloat(task.cost_price || 0)
                      const taskRevenue = parseFloat(task.amount || 0)
                      const taskProfit = taskRevenue - taskCost
                      return (
                        <tr key={task.id} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          <td className="table-td" style={{ padding: '3px 6px', width: '20px' }}>{index + 1}</td>
                          <td className="table-td" style={{ padding: '3px 6px' }}>
                            <div style={{ fontWeight: '600', fontSize: '9px' }}>{task.task_name}</div>
                            {task.description && <div style={{ fontSize: '8px', color: '#666' }}>{task.description}</div>}
                          </td>
                          <td className="table-td" style={{ padding: '3px 6px', fontSize: '9px', textTransform: 'capitalize' }}>{task.category || '—'}</td>
                          <td className="table-td" style={{ padding: '3px 6px', fontSize: '9px' }}>{task.assigned_employees?.[0]?.name?.substring(0, 8) || '—'}</td>
                          <td className="table-td" style={{ padding: '3px 6px', fontSize: '9px', textTransform: 'capitalize' }}>{task.status?.substring(0, 4) || '—'}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px' }}>
                            {(() => {
                              if (task.time_tracking && task.time_tracking.length > 0) {
                                const minutes = task.time_tracking.filter(t => t.end_time).reduce((s, t) => s + (t.duration_minutes || 0), 0)
                                return (minutes / 60).toFixed(2) + 'h'
                              }
                              return task.labor_hours || '—'
                            })()}
                          </td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '600' }}>{formatCurrency(taskCost)}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '600' }}>{formatCurrency(taskRevenue)}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '700', color: taskProfit >= 0 ? '#000' : '#d32f2f' }}>{formatCurrency(taskProfit)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Spare Parts Used ── */}
          {jobCard.spare_parts_requests && jobCard.spare_parts_requests.filter(p => p.overall_status === 'installed').length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className="section-title">SPARE PARTS USED</div>
              <div style={{ border: '1px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Part Name', 'Part No.', 'Qty', 'Unit Cost', 'Sell Price', 'Total', 'Profit'].map((h, i) => (
                        <th key={i} className="table-th" style={{ padding: '4px 6px', textAlign: i > 2 ? 'right' : 'left', fontSize: '8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.spare_parts_requests.filter(p => p.overall_status === 'installed').map((part, index) => {
                      const unitCost = parseFloat(part.unit_cost || part.cost_price || 0)
                      const sellPrice = parseFloat(part.selling_price || 0)
                      const qty = part.quantity || 1
                      const totalCost = unitCost * qty
                      const totalSell = sellPrice * qty
                      const profit = totalSell - totalCost
                      return (
                        <tr key={part.id} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                          <td className="table-td" style={{ padding: '3px 6px', width: '20px' }}>{index + 1}</td>
                          <td className="table-td" style={{ padding: '3px 6px', fontSize: '9px', fontWeight: '600' }}>{part.part_name}</td>
                          <td className="table-td" style={{ padding: '3px 6px', fontSize: '8px', fontFamily: 'monospace', color: '#666' }}>{part.part_number || '—'}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'center', fontSize: '9px' }}>{qty}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(unitCost)}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '600' }}>{formatCurrency(sellPrice)}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '600' }}>{formatCurrency(totalSell)}</td>
                          <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '700', color: profit >= 0 ? '#000' : '#d32f2f' }}>{formatCurrency(profit)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
          {/* ── Spare Parts Pricing ── */}
          {jobCard.spare_parts_requests && jobCard.spare_parts_requests.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className="section-title">SPARE PARTS PRICING</div>
              <div style={{ border: '1px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Part', 'Part No.', 'Qty', 'Unit Cost', 'Sell Price', 'Total'].map((h, i) => (
                        <th key={i} className="table-th" style={{ padding: '4px 6px', textAlign: i > 2 ? 'right' : 'left', fontSize: '8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.spare_parts_requests.map((part, index) => (
                      <tr key={part.id} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td className="table-td" style={{ padding: '3px 6px', width: '20px' }}>{index + 1}</td>
                        <td className="table-td" style={{ padding: '3px 6px', fontSize: '9px', fontWeight: '600' }}>{part.part_name}</td>
                        <td className="table-td" style={{ padding: '3px 6px', fontSize: '8px', fontFamily: 'monospace', color: '#666' }}>{part.part_number || '—'}</td>
                        <td className="table-td" style={{ padding: '3px 6px', textAlign: 'center', fontSize: '9px' }}>{part.quantity}</td>
                        <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px' }}>{formatCurrency(part.unit_cost || part.cost_price || 0)}</td>
                        <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '600' }}>{formatCurrency(part.selling_price || 0)}</td>
                        <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '700' }}>{formatCurrency((part.selling_price || 0) * (part.quantity || 1))}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f9f9f9', borderTop: '2px solid #000' }}>
                      <td colSpan="4" style={{ fontSize: '9px', fontWeight: '700', color: '#000', padding: '3px 6px', textAlign: 'right' }}>SUBTOTAL</td>
                      <td style={{ fontSize: '9px', fontWeight: '700', color: '#000', padding: '3px 6px', textAlign: 'right' }}>{formatCurrency(jobCard.spare_parts_requests.reduce((sum, p) => sum + (p.unit_cost || p.cost_price || 0), 0))}</td>
                      <td colSpan="2" style={{ fontSize: '9px', fontWeight: '700', color: '#000', padding: '3px 6px', textAlign: 'right' }}>{formatCurrency(jobCard.spare_parts_requests.reduce((sum, p) => sum + ((p.selling_price || 0) * (p.quantity || 1)), 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Advance Payments ── */}
          {jobCard.advance_payment > 0 && jobCard.payments && jobCard.payments.filter(p => p.payment_type === 'advance').length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className="section-title">ADVANCE PAYMENTS</div>
              <div style={{ border: '1px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Date', 'Amount', 'Method'].map((h, i) => (
                        <th key={i} className="table-th" style={{ padding: '4px 6px', textAlign: i > 0 ? 'right' : 'left', fontSize: '8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.payments.filter(p => p.payment_type === 'advance').map((payment, index) => (
                      <tr key={payment.id} style={{ background: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td className="table-td" style={{ padding: '3px 6px', fontSize: '9px' }}>{new Date(payment.created_at).toLocaleDateString()}</td>
                        <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', fontWeight: '600' }}>{formatCurrency(payment.amount)}</td>
                        <td className="table-td" style={{ padding: '3px 6px', textAlign: 'right', fontSize: '9px', textTransform: 'capitalize' }}>{payment.payment_method}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f9f9f9', borderTop: '2px solid #000' }}>
                      <td style={{ fontSize: '9px', fontWeight: '700', color: '#000', padding: '3px 6px', textAlign: 'right' }}>TOTAL</td>
                      <td colSpan="2" style={{ fontSize: '9px', fontWeight: '700', color: '#000', padding: '3px 6px', textAlign: 'right' }}>{formatCurrency(jobCard.advance_payment)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Job Card History ── */}
          <div style={{ marginBottom: '12px', padding: '8px', border: '1px solid #000', borderRadius: '4px', fontSize: '8px' }}>
            <div className="section-title" style={{ marginBottom: '4px' }}>ACTIVITY LOG</div>
            {jobCard.activity_log && jobCard.activity_log.length > 0 ? (
              <div style={{ maxHeight: '60px', overflowY: 'auto' }}>
                {jobCard.activity_log.slice(-5).map((activity, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', borderBottom: idx < jobCard.activity_log.slice(-5).length - 1 ? '1px solid #e0e0e0' : 'none', fontSize: '8px' }}>
                    <span>{new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                    <span style={{ fontWeight: '600' }}>{activity.activity_description || activity.description || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '4px', color: '#666' }}>No activity recorded</div>
            )}
          </div>

          {/* ── Pricing Summary ── */}
          <div style={{ border: '2px solid #000', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ background: '#000', padding: '6px 12px' }}>
              <span style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}>PAYMENT SUMMARY</span>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {(() => {
                const servicesTotal = jobCard.tasks ? jobCard.tasks.reduce((sum, t) => sum + (t.amount || 0), 0) : 0
                const partsTotal = jobCard.spare_parts_requests ? jobCard.spare_parts_requests.reduce((sum, p) => sum + ((p.selling_price || 0) * (p.quantity || 1)), 0) : 0
                const otherTotal = jobCard.otherCharges ? jobCard.otherCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) : jobCard.other_charges || 0
                const subtotal = servicesTotal + partsTotal + otherTotal
                const discount = jobCard.discount || 0
                const total = subtotal - discount
                
                return (
                  <>
                    {[
                      { label: 'Services', value: formatCurrency(servicesTotal) },
                      { label: 'Parts', value: formatCurrency(partsTotal) },
                      ...(otherTotal > 0 ? [{ label: 'Other', value: formatCurrency(otherTotal) }] : []),
                      ...(discount > 0 ? [{ label: 'Discount', value: `- ${formatCurrency(discount)}`, bold: true }] : []),
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #e0e0e0' }}>
                        <span style={{ fontSize: '9px', color: '#000', fontWeight: '500' }}>{row.label}</span>
                        <span style={{ fontSize: '9px', fontWeight: row.bold ? '700' : '600', color: '#000' }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 0', borderTop: '2px solid #000', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#000' }}>TOTAL</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#000' }}>{formatCurrency(total)}</span>
                    </div>
                  </>
                )
              })()}
              {jobCard.advance_payment > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #000', marginTop: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#000', fontWeight: '500' }}>Advance</span>
                  <span style={{ fontSize: '9px', fontWeight: '600', color: '#000' }}>- {formatCurrency(jobCard.advance_payment)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 0', borderTop: '1px solid #000', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#000' }}>DUE</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#000' }}>
                  {(() => {
                    const servicesTotal = jobCard.tasks ? jobCard.tasks.reduce((sum, t) => sum + (t.amount || 0), 0) : 0
                    const partsTotal = jobCard.spare_parts_requests ? jobCard.spare_parts_requests.reduce((sum, p) => sum + ((p.selling_price || 0) * (p.quantity || 1)), 0) : 0
                    const otherTotal = jobCard.otherCharges ? jobCard.otherCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0) : jobCard.other_charges || 0
                    const subtotal = servicesTotal + partsTotal + otherTotal
                    const discount = jobCard.discount || 0
                    const total = subtotal - discount
                    const advance = jobCard.advance_payment || 0
                    return formatCurrency(Math.max(0, total - advance))
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #000', textAlign: 'center', fontSize: '9px' }}>
            <p style={{ fontWeight: '600', color: '#000', margin: '2px 0' }}>
              Thank you for choosing Grand Auto Tech!
            </p>
            {jobCard.branch?.phone && (
              <p style={{ color: '#666', margin: '1px 0', fontSize: '8px' }}>
                Contact: {jobCard.branch.phone}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
})

JobCardPrint.displayName = 'JobCardPrint'

export default JobCardPrint