import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function CustomerTable({
  user,
  customers,
  onEdit,
  onDelete,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  canUpdate,
  canDelete,
  canAddVehicles,
  canUpdateVehicles,
  canDeleteVehicles
}) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const [openVehiclesId, setOpenVehiclesId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const buttonRefs = useRef({})
  const vehiclesRefs = useRef({})

  console.log('CustomerTable Debug:', {
    userRole: user.role.name,
    userBranchId: user.branch_id,
    canUpdate,
    canDelete,
    customersCount: customers.length,
    firstCustomerBranchId: customers[0]?.branch_id
  })

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null)
    document.addEventListener('mousedown', handleClick)

    // Handle responsive breakpoint
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    if (openMenuId === id) {
      setOpenMenuId(null)
      return
    }
    const btn = buttonRefs.current[id]
    if (btn && !isMobile) {
      const rect = btn.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 100) {
        setMenuPos({ bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right })
      } else {
        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
      }
    }
    setOpenMenuId(id)
  }

  const DropdownMenu = ({ customer }) => {
    // Show buttons based on permissions - backend will enforce branch restrictions
    if (isMobile) {
      // Mobile: use absolute positioning relative to document
      return createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setOpenMenuId(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            {canUpdate && (
              <button
                onClick={() => { onEdit(customer); setOpenMenuId(null) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-medium">Edit Customer</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { onDelete(customer.id); setOpenMenuId(null) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="font-medium">Delete Customer</span>
              </button>
            )}
            <button
              onClick={() => setOpenMenuId(null)}
              className="w-full px-4 py-3 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )
    }

    // Desktop: use fixed positioning
    return createPortal(
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
        {canUpdate && (
          <button
            onClick={() => { onEdit(customer); setOpenMenuId(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Customer
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => { onDelete(customer.id); setOpenMenuId(null) }}
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
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* DESKTOP VIEW - Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicles</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-400 font-medium">No customers found</p>
                    <p className="text-gray-300 text-xs">Add your first customer to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{customer.name}</div>
                      {customer.company_name && (
                        <div className="text-xs text-gray-400 mt-0.5">{customer.company_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{customer.phone}</td>
                  <td className="px-5 py-4 text-gray-600">{customer.email || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                      customer.customer_type === 'business'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{customer.city || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                      {customer.branch?.name || <span className="text-gray-300">—</span>}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          {customer.vehicles?.length || 0}
                        </span>
                        {canAddVehicles && (
                          <button
                            onClick={() => onAddVehicle(customer.id)}
                            className="p-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors border border-orange-100"
                            title="Add Vehicle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {customer.vehicles && customer.vehicles.length > 0 && (
                        <div className="space-y-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {customer.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="flex items-start justify-between gap-2 p-2 bg-white rounded border border-gray-100 text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900">{vehicle.license_plate}</div>
                                <div className="text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                                <div className="text-gray-500">{vehicle.color || '—'} • {vehicle.fuel_type || '—'}</div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {canUpdateVehicles && (
                                  <button
                                    onClick={() => onEditVehicle(vehicle)}
                                    className="p-1 rounded text-blue-600 hover:bg-blue-50"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                                {canDeleteVehicles && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete ${vehicle.license_plate}?`)) {
                                        onDeleteVehicle(vehicle.id)
                                      }
                                    }}
                                    className="p-1 rounded text-red-600 hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      customer.is_active
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${customer.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {(canUpdate || canDelete) && (
                      <>
                        <button
                          ref={el => buttonRefs.current[customer.id] = el}
                          onClick={(e) => toggleMenu(e, customer.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === customer.id && <DropdownMenu customer={customer} />}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW - Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {customers.length === 0 ? (
          <div className="px-4 sm:px-6 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-400 font-medium">No customers found</p>
              <p className="text-gray-300 text-xs">Add your first customer to get started</p>
            </div>
          </div>
        ) : (
          customers.map(customer => (
            <div key={customer.id} className="p-4 sm:p-6 space-y-4">
              {/* Header with Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base truncate">{customer.name}</h3>
                  {customer.company_name && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{customer.company_name}</p>
                  )}
                </div>
                {(canUpdate || canDelete) && (
                  <button
                    ref={el => buttonRefs.current[customer.id] = el}
                    onClick={(e) => toggleMenu(e, customer.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                )}
              </div>
              {openMenuId === customer.id && <DropdownMenu customer={customer} />}

              {/* Customer Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer.phone}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer.email || '—'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">City</p>
                  <p className="text-sm font-semibold text-gray-900">{customer.city || '—'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Branch</p>
                  <p className="text-sm font-semibold text-orange-600">{customer.branch?.name || '—'}</p>
                </div>
              </div>

              {/* Type & Status Row */}
              <div className="flex gap-3">
                <span className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border capitalize ${
                  customer.customer_type === 'business'
                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {customer.customer_type}
                </span>
                <span className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${
                  customer.is_active
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${customer.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                  {customer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Vehicles Section */}
              {customer.vehicles && customer.vehicles.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Vehicles ({customer.vehicles.length})
                    </p>
                    {canAddVehicles && (
                      <button
                        onClick={() => onAddVehicle(customer.id)}
                        className="p-1.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors border border-orange-100"
                        title="Add Vehicle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {customer.vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm font-mono bg-gray-200 px-2 py-1 rounded inline-block text-xs">{vehicle.license_plate}</p>
                            <p className="text-xs text-gray-600 mt-1.5">{vehicle.make} {vehicle.model} • {vehicle.year}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{vehicle.color || '—'} • {vehicle.fuel_type || '—'}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {canUpdateVehicles && (
                              <button
                                onClick={() => onEditVehicle(vehicle)}
                                className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canDeleteVehicles && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${vehicle.license_plate}?`)) {
                                    onDeleteVehicle(vehicle.id)
                                  }
                                }}
                                className="p-1.5 rounded text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomerTable