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
    // Handle ISO date format (YYYY-MM-DD) properly to avoid timezone issues
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

  const getDateColor = (date) => {
    const jobs = getJobsForDate(date)
    if (!jobs.length) return 'text-gray-400'
    
    const expectedDate = parseDate(jobs[0].estimated_completion_date)
    const today = new Date()
    
    if (expectedDate < today) return 'text-red-600 font-bold' // Overdue
    if (expectedDate.toDateString() === today.toDateString()) return 'text-green-600 font-bold' // Today
    return 'text-blue-600 font-semibold' // Upcoming
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="text-gray-600 hover:text-primary font-bold text-lg transition-colors"
        >
          ‹
        </button>
        <h3 className="text-sm font-bold text-gray-800">{monthName}</h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="text-gray-600 hover:text-primary font-bold text-lg transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {blanks.map((_, idx) => (
          <div key={`blank-${idx}`} className="aspect-square"></div>
        ))}
        
        {days.map(day => {
          const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const isToday = cellDate.toDateString() === new Date().toDateString()
          const jobs = getJobsForDate(cellDate)
          const hasJobs = jobs.length > 0

          return (
            <div
              key={day}
              className={`
                min-h-16 p-1.5 rounded-lg border-2 flex flex-col transition-all relative group
                ${isToday ? 'bg-primary/10 border-primary' : hasJobs ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className={`text-xs font-bold mb-0.5 ${getDateColor(cellDate)}`}>
                {day}
              </div>
              
              {/* Job Card Numbers */}
              <div className="space-y-0.5 flex-1 min-w-0">
                {jobs.slice(0, 2).map((job, idx) => (
                  <div
                    key={job.id}
                    className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 truncate hover:bg-gradient-to-r hover:from-orange-200 hover:to-amber-200 transition-colors cursor-help"
                    title={job.job_card_number}
                  >
                    {job.job_card_number}
                  </div>
                ))}
                {jobs.length > 2 && (
                  <div className="text-xs font-semibold px-1.5 py-0.5 text-gray-500 text-center">
                    +{jobs.length - 2}
                  </div>
                )}
              </div>

              {/* Tooltip on hover */}
              {hasJobs && (
                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                    {jobs.map(j => j.job_card_number).join(', ')}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          <span className="text-xs text-gray-600 font-medium">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-xs text-gray-600 font-medium">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-xs text-gray-600 font-medium">Upcoming</span>
        </div>
      </div>
    </div>
  )
}

export default MiniCalendar
