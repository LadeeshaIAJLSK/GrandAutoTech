import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function FinancialReports({ user }) {
  const [financialData, setFinancialData] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [outstandingDues, setOutstandingDues] = useState(null)
  const [loading, setLoading] = useState(true)

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate])

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const [financial, methods, dues] = await Promise.all([
        axiosClient.get('/reports/financial-summary', {
          params: { start_date: startDate, end_date: endDate },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosClient.get('/reports/payment-methods', {
          params: { start_date: startDate, end_date: endDate },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosClient.get('/reports/outstanding-dues', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setFinancialData(financial.data)
      setPaymentMethods(methods.data)
      setOutstandingDues(dues.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reports...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">💰 Financial Reports</h2>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-gray-800 mb-4">📅 Report Period</h3>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border-2 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Revenue</div>
          <div className="text-4xl font-bold">{formatCurrency(financialData?.total_revenue || 0)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Outstanding Dues</div>
          <div className="text-4xl font-bold">{formatCurrency(outstandingDues?.total_outstanding || 0)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Paid Job Cards</div>
          <div className="text-4xl font-bold">{financialData?.paid_job_cards || 0}</div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">💳 Revenue by Payment Method</h3>
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const percentage = financialData?.total_revenue > 0 
              ? (method.total_amount / financialData.total_revenue * 100).toFixed(1) 
              : 0

            return (
              <div key={method.payment_method} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {method.payment_method === 'cash' ? '💵' :
                       method.payment_method === 'card' ? '💳' :
                       method.payment_method === 'bank_transfer' ? '🏦' :
                       method.payment_method === 'cheque' ? '📝' :
                       method.payment_method === 'mobile_payment' ? '📱' : '💰'}
                    </span>
                    <span className="font-semibold capitalize">
                      {method.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">{formatCurrency(method.total_amount)}</div>
                    <div className="text-sm text-gray-600">{method.count} transactions</div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 text-right">{percentage}% of total</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Outstanding Dues List */}
      {outstandingDues && outstandingDues.job_cards.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            ⚠️ Outstanding Dues ({outstandingDues.count} Job Cards)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Job Card #</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outstandingDues.job_cards.map(jc => (
                  <tr key={jc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-primary">{jc.job_card_number}</td>
                    <td className="px-4 py-3">{jc.customer?.name}</td>
                    <td className="px-4 py-3">{jc.vehicle?.license_plate}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(jc.total_amount)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(jc.advance_payment)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(jc.balance_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialReports