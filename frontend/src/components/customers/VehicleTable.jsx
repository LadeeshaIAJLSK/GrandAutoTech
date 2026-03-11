import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function VehicleTable({
  vehicles,
  onView,
  onEdit,
  onDelete,
  canUpdate,
  canDelete
}) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const buttonRefs = useRef({})

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null)
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    if (openMenuId === id) {
      setOpenMenuId(null)
      return
    }
    const btn = buttonRefs.current[id]
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 100) {
        setMenuPos({ bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, top: undefined })
      } else {
        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right, bottom: undefined })
      }
    }
    setOpenMenuId(id)
  }

  const DropdownMenu = ({ vehicle }) => (
    createPortal(
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: menuPos.top ?? 'auto',
          bottom: menuPos.bottom ?? 'auto',
          right: menuPos.right,
          zIndex: 9999,
          width: '160px',
        }}
        className="bg-white rounded-lg shadow-lg border border-gray-100 py-1"
      >
        <button
          onClick={() => { onView(vehicle); setOpenMenuId(null) }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
        {canUpdate && (
          <button
            onClick={() => { onEdit(vehicle); setOpenMenuId(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Vehicle
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => { onDelete(vehicle.id); setOpenMenuId(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        )}
      </div>,
      document.body
    )
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">License Plate</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Make & Model</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mileage</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <p className="text-gray-400 font-medium">No vehicles found</p>
                    <p className="text-gray-300 text-xs">Register your first vehicle to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              vehicles.map(vehicle => (
                <tr key={vehicle.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-xs tracking-widest">
                      {vehicle.license_plate}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</div>
                      {vehicle.fuel_type && (
                        <div className="text-xs text-gray-400 mt-0.5">{vehicle.fuel_type} · {vehicle.transmission}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{vehicle.year}</td>
                  <td className="px-5 py-4 text-gray-600">{vehicle.customer?.name || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4 text-gray-600">{vehicle.color || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      vehicle.is_active
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vehicle.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {(canUpdate || canDelete) && (
                      <>
                        <button
                          ref={el => buttonRefs.current[vehicle.id] = el}
                          onClick={(e) => toggleMenu(e, vehicle.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === vehicle.id && <DropdownMenu vehicle={vehicle} />}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VehicleTable