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
          color: #6b7280;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        }
        .label { font-size: 10px; color: #9ca3af; font-weight: 500; }
        .value { font-size: 11px; color: #1f2937; font-weight: 600; }
        .table-th {
          background: #f3f4f6;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #4b5563;
          padding: 8px 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        .table-td {
          font-size: 10px;
          color: #374151;
          padding: 7px 10px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }
      `}</style>

      <div className="print-content" style={{ padding: '0', maxWidth: '100%' }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          padding: '20px 28px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
                GRAND AUTO TECH
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Vehicle Repair Shop Management System</p>
            {jobCard.branch && (
              <p style={{ fontSize: '10px', color: '#64748b', margin: '3px 0 0' }}>
                {jobCard.branch.name}{jobCard.branch.phone ? ` · ${jobCard.branch.phone}` : ''}{jobCard.branch.email ? ` · ${jobCard.branch.email}` : ''}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>JOB CARD</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#f97316', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
              {jobCard.job_card_number}
            </div>
            <div style={{
              display: 'inline-block',
              marginTop: '6px',
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px',
              fontSize: '10px',
              color: '#e2e8f0',
              fontWeight: '600',
            }}>
              {formatStatus(jobCard.status)}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 28px' }}>

          {/* ── Meta Row ── */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Created', value: new Date(jobCard.created_at).toLocaleDateString() },
              jobCard.estimated_completion_date && { label: 'Est. Completion', value: new Date(jobCard.estimated_completion_date).toLocaleDateString() },
            ].filter(Boolean).map(item => (
              <div key={item.label} style={{
                flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '10px', padding: '10px 14px',
              }}>
                <div className="label">{item.label}</div>
                <div className="value" style={{ marginTop: '2px' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* ── Customer & Vehicle ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            {/* Customer */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6b7280">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>Customer Details</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {[
                  { label: 'Name', value: jobCard.customer?.name },
                  { label: 'Phone', value: jobCard.customer?.phone },
                  { label: 'Email', value: jobCard.customer?.email || '—' },
                  { label: 'Address', value: jobCard.customer?.address || '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'baseline' }}>
                    <span className="label" style={{ minWidth: '52px' }}>{row.label}</span>
                    <span className="value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6b7280">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h10l1-1zm0 0l1.5-4.5M13 6l1.5-1.5M13 6h5l2 4.5" />
                  </svg>
                  <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>Vehicle Details</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span className="label">License Plate</span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#f97316', fontFamily: 'monospace', letterSpacing: '0.1em', marginTop: '2px' }}>
                    {jobCard.vehicle?.license_plate}
                  </div>
                </div>
                {[
                  { label: 'Make / Model', value: `${jobCard.vehicle?.make} ${jobCard.vehicle?.model}` },
                  { label: 'Year', value: jobCard.vehicle?.year },
                  { label: 'Mileage', value: jobCard.current_mileage ? `${jobCard.current_mileage.toLocaleString()} km` : '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '8px', marginBottom: '5px', alignItems: 'baseline' }}>
                    <span className="label" style={{ minWidth: '68px' }}>{row.label}</span>
                    <span className="value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Customer Complaint ── */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6b7280">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>Customer Complaint</span>
              </div>
            </div>
            <div style={{ padding: '12px 14px', fontSize: '11px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {jobCard.customer_complaint}
            </div>
          </div>

          {/* ── Inspection Notes ── */}
          {jobCard.initial_inspection_notes && (
            <div style={{ border: '1px solid #bfdbfe', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#eff6ff' }}>
              <div style={{ background: '#dbeafe', padding: '10px 14px', borderBottom: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3b82f6' }}>Inspection Notes</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px', fontSize: '11px', color: '#1e40af', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {jobCard.initial_inspection_notes}
              </div>
            </div>
          )}

          {/* ── Work Performed ── */}
          {jobCard.tasks && jobCard.tasks.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Work Performed
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Task Description', 'Category', 'Hours', 'Cost'].map((h, i) => (
                        <th key={i} className="table-th" style={{ textAlign: i >= 3 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.tasks.map((task, index) => (
                      <tr key={task.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="table-td" style={{ color: '#9ca3af', width: '28px' }}>{index + 1}</td>
                        <td className="table-td">
                          <div style={{ fontWeight: '600', color: '#111827' }}>{task.task_name}</div>
                          {task.description && <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>{task.description}</div>}
                        </td>
                        <td className="table-td" style={{ textTransform: 'capitalize', color: '#6b7280' }}>{task.category}</td>
                        <td className="table-td" style={{ textAlign: 'right', color: '#6b7280' }}>{task.labor_hours || '—'}</td>
                        <td className="table-td" style={{ textAlign: 'right', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(task.labor_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Spare Parts ── */}
          {jobCard.spare_parts_requests && jobCard.spare_parts_requests.filter(p => p.overall_status === 'installed').length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Spare Parts Used
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['#', 'Part Name', 'Part Number', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                        <th key={i} className="table-th" style={{ textAlign: i >= 3 ? (i === 3 ? 'center' : 'right') : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.spare_parts_requests.filter(p => p.overall_status === 'installed').map((part, index) => (
                      <tr key={part.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td className="table-td" style={{ color: '#9ca3af', width: '28px' }}>{index + 1}</td>
                        <td className="table-td" style={{ fontWeight: '600', color: '#111827' }}>{part.part_name}</td>
                        <td className="table-td" style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '9px' }}>{part.part_number || '—'}</td>
                        <td className="table-td" style={{ textAlign: 'center' }}>{part.quantity}</td>
                        <td className="table-td" style={{ textAlign: 'right', color: '#6b7280' }}>{formatCurrency(part.selling_price)}</td>
                        <td className="table-td" style={{ textAlign: 'right', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(part.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pricing Summary ── */}
          <div style={{ border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', marginBottom: '28px' }}>
            <div style={{ background: '#1e293b', padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Pricing Summary</span>
              </div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {[
                { label: 'Labor Charges', value: formatCurrency(jobCard.labor_cost || 0) },
                { label: 'Parts Charges', value: formatCurrency(jobCard.parts_cost || 0) },
                ...(jobCard.other_charges > 0 ? [{ label: 'Other Charges', value: formatCurrency(jobCard.other_charges) }] : []),
                ...(jobCard.discount > 0 ? [{ label: 'Discount', value: `- ${formatCurrency(jobCard.discount)}`, red: true }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{row.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: row.red ? '#ef4444' : '#1f2937' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 5px', borderTop: '2px solid #1e293b', marginTop: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827' }}>TOTAL AMOUNT</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#f97316' }}>{formatCurrency(jobCard.total_amount || 0)}</span>
              </div>
              {jobCard.advance_payment > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #d1fae5' }}>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }}>Advance Paid</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669' }}>- {formatCurrency(jobCard.advance_payment)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 0', borderTop: '1px solid #e5e7eb', marginTop: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827' }}>BALANCE DUE</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: jobCard.balance_amount > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(jobCard.balance_amount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Signatures ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '36px', paddingTop: '28px', borderTop: '1px solid #e2e8f0' }}>
            {['Technician', 'Manager', 'Customer'].map(sig => (
              <div key={sig} style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1.5px solid #1e293b', marginBottom: '6px' }} />
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#374151' }}>{sig} Signature</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Date: __________</div>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#374151', margin: '0 0 3px' }}>
              Thank you for choosing Grand Auto Tech!
            </p>
            {jobCard.branch?.phone && (
              <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
                For any queries, please contact us at {jobCard.branch.phone}
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