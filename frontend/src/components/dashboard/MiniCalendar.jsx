import { useState } from 'react'

function MiniCalendar({ jobCards = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getJobsForDate = (date) => {
    return jobCards.filter(jc => {
      const expectedDate = jc.expected_completion_date ? new Date(jc.expected_completion_date) : null
      return expectedDate && expectedDate.toDateString() === date.toDateString()
    })
  }

  const getDateColor = (date) => {
    const jobs = getJobsForDate(date)
    if (!jobs.length) return 'text-gray-400'
    
    const expectedDate = new Date(jobs[0].expected_completion_date)
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
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-xs">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="text-gray-600 hover:text-primary font-bold text-lg"
        >
          ‹
        </button>
        <h3 className="text-sm font-bold text-gray-800">{monthName}</h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="text-gray-600 hover:text-primary font-bold text-lg"
        >
          ›
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
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
                aspect-square flex items-center justify-center rounded text-xs font-semibold
                ${isToday ? 'bg-primary text-white' : hasJobs ? 'bg-blue-100' : 'hover:bg-gray-100'}
                ${getDateColor(cellDate)} cursor-default relative group
              `}
              title={hasJobs ? jobs.map(j => j.job_card_number).join(', ') : ''}
            >
              {day}
              {hasJobs && <div className="absolute bottom-0.5 w-1 h-1 bg-orange-500 rounded-full"></div>}
              
              {/* Tooltip */}
              {hasJobs && (
                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                  {jobs[0].job_card_number}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          <span className="text-gray-600">Overdue</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-gray-600">Upcoming</span>
        </div>
      </div>
    </div>
  )
}

export default MiniCalendar
