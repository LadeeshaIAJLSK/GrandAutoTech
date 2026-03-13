import { useState, useRef } from 'react'

function ThirdPartyServiceTable({ services, branches, onEdit, onDelete }) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const buttonRefs = useRef({})

  const getBranchName = (branchId) => {
    return branches.find(b => b.id == branchId)?.name || '—'
  }

  const toggleMenu = (id) => {
    if (openMenuId === id) { setOpenMenuId(null); return }
    const btn = buttonRefs.current[id]
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const dropdownHeight = 100
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < dropdownHeight + 8 ? rect.top - dropdownHeight - 4 : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  // Close on outside click
  const handleDocClick = (e) => {
    const menuEl = document.getElementById('tps-action-menu')
    const btnEl = openMenuId ? buttonRefs.current[openMenuId] : null
    if (menuEl && !menuEl.contains(e.target) && btnEl && !btnEl.contains(e.target)) {
      setOpenMenuId(null)
    }
  }
  if (typeof window !== 'undefined') {
    // attach once via useEffect would be cleaner but this keeps logic contained
  }

  return (
    <>
      {/* Fixed portal dropdown — escapes overflow clipping */}
      {openMenuId !== null && (
        <div
          id="tps-action-menu"
          className="fixed w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[9999]"
          style={{ top: menuPos.top, right: menuPos.right }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onEdit(services.find(s => s.id === openMenuId)); setOpenMenuId(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => { onDelete(openMenuId); setOpenMenuId(null) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm" onClick={handleDocClick}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-400 font-medium text-sm">No service providers found</p>
                      <p className="text-gray-300 text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Company */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{service.company_name}</p>
                      {service.created_at && (
                        <p className="text-xs text-gray-400 mt-0.5">Added {new Date(service.created_at).toLocaleDateString()}</p>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {service.telephone_number}
                        </div>
                        {service.email_address && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {service.email_address}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Services */}
                    <td className="px-5 py-4">
                      {Array.isArray(service.services_offered) && service.services_offered.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {service.services_offered.map((svc, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {svc}
                            </span>
                          ))}
                        </div>
                      ) : service.services_offered ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {service.services_offered}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Branch */}
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {getBranchName(service.branch_id)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        service.is_active
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${service.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <button
                        ref={el => buttonRefs.current[service.id] = el}
                        onClick={() => toggleMenu(service.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default ThirdPartyServiceTable
