import { useState } from 'react'

function MiniCalendar({ jobCards = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const parseDate = (dateString) => {
    if (!dateString) return null
    const parts = dateString.split('T')[0].split('-')
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    return new Date(dateString)
  }

  const getJobsForDate = (date) => {
    return jobCards.filter(jc => {
      const expectedDate = jc.estimated_completion_date ? parseDate(jc.estimated_completion_date) : null
      return expectedDate && expectedDate.toDateString() === date.toDateString()
    })
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => null)
  const today = new Date()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 w-full">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xs font-bold text-gray-700">{monthName}</h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className={`text-center text-xs font-bold py-0.5 rounded ${
            i === 0 || i === 6 ? 'text-slate-400' : 'text-gray-400'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {blanks.map((_, idx) => {
          const dow = idx % 7
          const isWknd = dow === 0 || dow === 6
          return <div key={`blank-${idx}`} className={`h-12 rounded-lg border ${isWknd ? 'bg-slate-100 border-slate-200' : 'bg-gray-50 border-gray-100'}`} />
        })}

        {days.map(day => {
          const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const isToday = cellDate.toDateString() === today.toDateString()
          const jobs = getJobsForDate(cellDate)
          const hasJobs = jobs.length > 0
          const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6

          let cellCls = ''
          if (isToday) {
            cellCls = 'bg-[#2563A8] border-[#2563A8] shadow-sm'
          } else if (hasJobs) {
            const d = parseDate(jobs[0].estimated_completion_date)
            cellCls = d < today ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          } else if (isWeekend) {
            cellCls = 'bg-slate-100 border-slate-200'
          } else {
            cellCls = 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-300'
          }

          return (
            <div key={day} className={`relative group h-12 rounded-lg border flex flex-col p-1 transition-all ${cellCls}`}>
              <span className={`text-xs leading-none ${
                isToday ? 'text-white font-bold'
                : hasJobs ? (() => { const d = parseDate(jobs[0].estimated_completion_date); return d < today ? 'text-red-500 font-bold' : 'text-[#2563A8] font-bold' })()
                : isWeekend ? 'text-slate-400' : 'text-gray-400'
              }`}>
                {day}
              </span>

              {hasJobs && (
                <div className="mt-auto">
                  {jobs.slice(0, 1).map((job) => {
                    const d = parseDate(job.estimated_completion_date)
                    const isOverdue = d < today
                    return (
                      <div
                        key={job.id}
                        className={`text-xs font-semibold px-1 rounded truncate leading-tight ${
                          isToday ? 'bg-white/20 text-white'
                          : isOverdue ? 'bg-red-100 text-red-600'
                          : 'bg-[#2563A8]/15 text-[#2563A8]'
                        }`}
                        style={{ fontSize: '9px' }}
                        title={job.job_card_number}
                      >
                        {job.job_card_number}
                      </div>
                    )
                  })}
                  {jobs.length > 1 && (
                    <div className={`leading-tight px-1 font-medium ${isToday ? 'text-white/70' : 'text-gray-400'}`} style={{ fontSize: '9px' }}>
                      +{jobs.length - 1}
                    </div>
                  )}
                </div>
              )}

              {/* Tooltip */}
              {hasJobs && (
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    {jobs.map(j => j.job_card_number).join(', ')}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default MiniCalendar
