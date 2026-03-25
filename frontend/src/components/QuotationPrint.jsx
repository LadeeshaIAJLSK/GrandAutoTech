function QuotationPrint({ showPrintPreview, setShowPrintPreview, currentQuotation, quotationItems, calculatePriceByType: parentCalculatePriceByType, calculateCurrentTotal: parentCalculateCurrentTotal, formatCurrency: parentFormatCurrency }) {
  // Use functions from parent or create local versions
  const formatCurrency = parentFormatCurrency || ((amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(num)
  })

  const calculatePriceByType = parentCalculatePriceByType || (() => {
    if (!quotationItems || quotationItems.length === 0) {
      return { task: 0, spare_part: 0, other_charges: 0, subtotal: 0 }
    }
    let task = 0, spare_part = 0, other_charges = 0
    quotationItems.forEach(item => {
      const amount = item.amount || (parseFloat(item.quantity_or_hours) || 0) * (parseFloat(item.unit_price) || 0)
      if (item.item_type === 'task') task += amount
      else if (item.item_type === 'spare_part') spare_part += amount
      else other_charges += amount
    })
    return { task, spare_part, other_charges, subtotal: task + spare_part + other_charges }
  })

  const calculateCurrentTotal = parentCalculateCurrentTotal || (() => calculatePriceByType().subtotal)

  if (!showPrintPreview || !currentQuotation) return null

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }

          /* Hide everything */
          body * { visibility: hidden !important; }

          /* Show only the quotation content */
          #quotation-print-content,
          #quotation-print-content * { visibility: visible !important; }

          /* Fixed positioning escapes the modal stacking context */
          #quotation-print-content {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: 99999 !important;
          }

          html, body {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">

          {/* Toolbar — hidden on print */}
          <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 print:hidden">
            <h3 className="text-lg font-bold text-gray-900">Print Preview — Quotation #{currentQuotation.quotation_number}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563A8] hover:bg-[#2563A8] text-white rounded-lg text-sm font-bold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Quotation
              </button>
            </div>
          </div>

          {/* === PRINTABLE CONTENT === */}
          <div id="quotation-print-content" className="p-8 bg-white text-gray-900 space-y-6">

            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 pb-4">
              <h1 className="text-3xl font-bold">QUOTATION</h1>
              <p className="text-sm text-gray-600 mt-2 font-semibold">{currentQuotation.branch?.name || 'GRAND AUTO TECH'}</p>
              {currentQuotation.branch?.address && (
                <p className="text-xs text-gray-600 mt-1">
                  {currentQuotation.branch.address}
                  {currentQuotation.branch.city && `, ${currentQuotation.branch.city}`}
                </p>
              )}
              {currentQuotation.branch?.phone && (
                <p className="text-xs text-gray-600">Tel: {currentQuotation.branch.phone}</p>
              )}
              {currentQuotation.branch?.email && (
                <p className="text-xs text-gray-600">Email: {currentQuotation.branch.email}</p>
              )}
            </div>

            {/* Quotation Details */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-600 uppercase font-bold">Branch</p>
                <p className="text-lg font-bold mt-1">{currentQuotation.branch?.name || 'GRAND AUTO TECH'}</p>
                {currentQuotation.insurance_company && (
                  <>
                    <p className="text-xs text-gray-600 uppercase font-bold mt-3">Insurance Company</p>
                    <p className="text-sm font-semibold mt-1 text-gray-900">{currentQuotation.insurance_company}</p>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{currentQuotation.quotation_number}</p>
                <p className="text-xs text-gray-500 mt-1">Quotation Date: {new Date(currentQuotation.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-xs text-gray-500">Valid Until: {new Date(currentQuotation.valid_until).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Customer & Vehicle Details */}
            <div className="grid grid-cols-2 gap-8 p-4 bg-gray-50 rounded border border-gray-200">
              <div>
                <p className="text-xs text-gray-600 uppercase font-bold mb-1">Customer Details</p>
                <p className="text-sm font-bold text-gray-900">{currentQuotation.customer?.name}</p>
                <p className="text-sm text-gray-700">{currentQuotation.customer?.phone}</p>
                <p className="text-sm text-gray-700">{currentQuotation.customer?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-bold mb-1">Vehicle Details</p>
                <p className="text-sm font-bold text-gray-900">{currentQuotation.vehicle?.license_plate}</p>
                <p className="text-sm text-gray-700">{currentQuotation.vehicle?.make} {currentQuotation.vehicle?.model}</p>
                <p className="text-sm text-gray-700">Year: {currentQuotation.vehicle?.year}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary">
                    <th className="px-4 py-3 text-left font-bold text-primary">Description</th>
                    <th className="px-4 py-3 text-right font-bold text-primary">Qty/Hours</th>
                    <th className="px-4 py-3 text-right font-bold text-primary">Unit Price (LKR)</th>
                    <th className="px-4 py-3 text-right font-bold text-primary">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationItems.filter(i => i.item_type === 'task').length > 0 && (
                    <>
                      <tr className="bg-blue-50">
                        <td colSpan="4" className="px-4 py-2 font-bold text-blue-900 text-sm">LABOR & SERVICES</td>
                      </tr>
                      {quotationItems.filter(i => i.item_type === 'task').map((item) => {
                        const amount = item.amount || (parseFloat(item.quantity_or_hours) || 0) * (parseFloat(item.unit_price) || 0)
                        return (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">
                              {
                                Number(item.quantity_or_hours) % 1 === 0
                                  ? Number(item.quantity_or_hours)
                                  : parseFloat(item.quantity_or_hours)
                              } hrs</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(amount)}</td>
                          </tr>
                        )
                      })}
                    </>
                  )}

                  {quotationItems.filter(i => i.item_type === 'spare_part').length > 0 && (
                    <>
                      <tr className="bg-orange-50">
                        <td colSpan="4" className="px-4 py-2 font-bold text-orange-900 text-sm">SPARE PARTS & MATERIALS</td>
                      </tr>
                      {quotationItems.filter(i => i.item_type === 'spare_part').map((item) => {
                        const amount = item.amount || (parseFloat(item.quantity_or_hours) || 0) * (parseFloat(item.unit_price) || 0)
                        return (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">
                              {
                                Number(item.quantity_or_hours) % 1 === 0
                                  ? Number(item.quantity_or_hours)
                                  : parseFloat(item.quantity_or_hours)
                              } qty</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(amount)}</td>
                          </tr>
                        )
                      })}
                    </>
                  )}

                  {quotationItems.filter(i => i.item_type === 'other_charges').length > 0 && (
                    <>
                      <tr className="bg-red-50">
                        <td colSpan="4" className="px-4 py-2 font-bold text-red-900 text-sm">OTHER CHARGES</td>
                      </tr>
                      {quotationItems.filter(i => i.item_type === 'other_charges').map((item) => {
                        const amount = item.amount || (parseFloat(item.quantity_or_hours) || 0) * (parseFloat(item.unit_price) || 0)
                        return (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">
                              {
                                Number(item.quantity_or_hours) % 1 === 0
                                  ? Number(item.quantity_or_hours)
                                  : parseFloat(item.quantity_or_hours)
                              }
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(amount)}</td>
                          </tr>
                        )
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-3 p-4 bg-gray-50 rounded border border-gray-300">
                {calculatePriceByType().task > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Task Price:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(calculatePriceByType().task)}</span>
                  </div>
                )}
                {calculatePriceByType().spare_part > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Spare Part Price:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(calculatePriceByType().spare_part)}</span>
                  </div>
                )}
                {calculatePriceByType().other_charges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Other Charges:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(calculatePriceByType().other_charges)}</span>
                  </div>
                )}
                <div className="border-t border-gray-400 pt-2 flex justify-between text-base font-bold text-primary">
                  <span>Sub Total</span>
                  <span>{formatCurrency(calculateCurrentTotal())}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-300 text-xs text-gray-500">
              <p>This quotation is valid until {new Date(currentQuotation.valid_until).toLocaleDateString('en-LK')}</p>
              <p>For insurance claim purposes. Please contact us for approval.</p>
            </div>

          </div>
          {/* === END PRINTABLE CONTENT === */}

        </div>
      </div>
    </>
  )
}

export default QuotationPrint
