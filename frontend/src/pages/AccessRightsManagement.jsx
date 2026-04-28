import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'
import Notification from '../components/common/Notification'

function AccessRightsManagement({ user }) {
  const [roles, setRoles] = useState([])
  const [groupedPermissions, setGroupedPermissions] = useState({})
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [employeePermissions, setEmployeePermissions] = useState([])
  const [supervisorPermissions, setSupervisorPermissions] = useState([])
  const [technicianType, setTechnicianType] = useState('employee') // 'employee' or 'supervisor'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchRolesAndPermissions()
  }, [])

  const fetchRolesAndPermissions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/access-rights/roles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRoles(response.data.roles)
      setGroupedPermissions(response.data.grouped_permissions)
      if (response.data.roles.length > 0) selectRole(response.data.roles[0])
    } catch (error) {
      console.error('Error:', error)
      setNotification({ type: 'error', title: 'Error', message: 'Error loading access rights' })
    } finally {
      setLoading(false)
    }
  }

  const selectRole = (role) => {
    setSelectedRole(role)
    setTechnicianType('employee')
    
    if (role.is_technician) {
      // For technician role, set employee and supervisor permissions separately
      const employeePerms = role.permissions_employee.map(p => p.id)
      const supervisorPerms = role.permissions_supervisor.map(p => p.id)
      setEmployeePermissions(employeePerms)
      setSupervisorPermissions(supervisorPerms)
      setSelectedPermissions(employeePerms)
    } else {
      // For regular roles, use the permissions array
      setSelectedPermissions(role.permissions.map(p => p.id))
    }
  }

  const togglePermission = (permissionId) => {
    // Calculate new permissions first
    let newPermissions
    if (selectedPermissions.includes(permissionId)) {
      newPermissions = selectedPermissions.filter(id => id !== permissionId)
    } else {
      newPermissions = [...selectedPermissions, permissionId]
    }
    
    // Update selectedPermissions
    setSelectedPermissions(newPermissions)

    // Update employee/supervisor permissions based on current tab
    if (selectedRole.is_technician) {
      if (technicianType === 'employee') {
        setEmployeePermissions(newPermissions)
      } else {
        setSupervisorPermissions(newPermissions)
      }
    }
  }

  const toggleAllInModule = (module) => {
    const modulePermissions = groupedPermissions[module]
    const modulePermissionIds = modulePermissions.map(p => p.id)
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
    
    // Calculate new permissions first
    let newPermissions
    if (allSelected) {
      newPermissions = selectedPermissions.filter(id => !modulePermissionIds.includes(id))
    } else {
      newPermissions = [...new Set([...selectedPermissions, ...modulePermissionIds])]
    }
    
    // Update selectedPermissions
    setSelectedPermissions(newPermissions)

    // Update employee/supervisor permissions based on current tab
    if (selectedRole.is_technician) {
      if (technicianType === 'employee') {
        setEmployeePermissions(newPermissions)
      } else {
        setSupervisorPermissions(newPermissions)
      }
    }
  }

  const switchTechnicianType = (type) => {
    setTechnicianType(type)
    if (type === 'employee') {
      setSelectedPermissions(employeePermissions)
    } else {
      setSelectedPermissions(supervisorPermissions)
    }
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      
      let payload
      if (selectedRole.is_technician) {
        payload = {
          employee_permissions: employeePermissions,
          supervisor_permissions: supervisorPermissions
        }
      } else {
        payload = {
          permission_ids: selectedPermissions
        }
      }

      await axiosClient.put(`/access-rights/roles/${selectedRole.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Refresh current user's permissions from server
      try {
        const meResponse = await axiosClient.get('/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        // Update localStorage with fresh permissions
        const userData = JSON.parse(localStorage.getItem('user') || '{}')
        userData.permissions = meResponse.data.user.permissions
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Dispatch storage event to trigger updates in other components
        window.dispatchEvent(new Event('userPermissionsUpdated'))
      } catch (e) {
        console.warn('Could not refresh permissions from server:', e)
      }
      
      setNotification({ 
        type: 'success', 
        title: 'Success', 
        message: 'Permissions updated successfully! Changes visible immediately.' 
      })
      
      // Refresh the data after a short delay to ensure server is updated
      setTimeout(() => {
        fetchRolesAndPermissions()
      }, 500)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error saving permissions' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Access Rights Management
        </h2>
        <p className="text-xs text-gray-400">Configure permissions for each role</p>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* Roles Sidebar */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Roles
          </p>
          <div className="space-y-1.5">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`w-full text-left px-3.5 py-3 rounded-lg transition-all ${
                  selectedRole?.id === role.id
                    ? 'text-white shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
                style={selectedRole?.id === role.id ? { backgroundColor: '#2563A8' } : {}}
              >
                <div className="text-sm font-semibold">{role.display_name}</div>
                <div className={`text-xs mt-0.5 ${selectedRole?.id === role.id ? 'text-white/70' : 'text-gray-400'}`}>
                  {role.is_technician ? 'With subtypes' : `${role.permissions?.length || 0} permissions`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="col-span-9 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {selectedRole ? (
            <>
              {/* Panel Header */}
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedRole.display_name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-semibold text-primary">{selectedPermissions.length}</span> permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px disabled:bg-gray-400 disabled:translate-y-0 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: saving ? undefined : '#2563A8',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#1e4a8e')}
                  onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#2563A8')}
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              {/* Technician Type Tabs */}
              {selectedRole.is_technician && (
                <div className="flex gap-3 mb-5 pb-4 border-b border-gray-100">
                  <button
                    onClick={() => switchTechnicianType('employee')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      technicianType === 'employee'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Employee Technician
                  </button>
                  <button
                    onClick={() => switchTechnicianType('supervisor')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      technicianType === 'supervisor'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Supervisor Technician
                  </button>
                </div>
              )}

              {/* Permission Modules */}
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([module, permissions]) => {
                  const modulePermissionIds = permissions.map(p => p.id)
                  const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                  const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id))
                  const selectedCount = modulePermissionIds.filter(id => selectedPermissions.includes(id)).length

                  return (
                    <div key={module} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Module Header */}
                      <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/60 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider capitalize">{module}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            allSelected
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : someSelected
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {selectedCount}/{permissions.length}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleAllInModule(module)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                            allSelected
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                              : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                          }`}
                        >
                          {allSelected ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              Unselect All
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Select All
                            </>
                          )}
                        </button>
                      </div>

                      {/* Permission Items */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 p-4">
                        {permissions.map(permission => {
                          const isSelected = selectedPermissions.includes(permission.id)
                          return (
                            <label
                              key={permission.id}
                              className={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/10'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(permission.id)}
                                className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 leading-snug">{permission.display_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{permission.name}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-sm text-gray-400">Select a role to manage permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-bold text-gray-800">Important</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Changes to permissions will affect all users with this role immediately in the database.
            <br />
            • Your own permissions (you're currently logged in) will refresh automatically after saving.
            <br />
            • Other users with the modified role must <strong>refresh their page or log out and log back in</strong> to see the new permissions.
            <br />
            • Dashboard components will automatically hide/show based on permissions after page refresh.
            <br />
            Be careful when removing critical permissions like "view_dashboard" or "view_job_cards".
            {selectedRole?.is_technician && (
              <>
                <br />Employee and Supervisor technicians have separate permission sets. Employee permissions are for basic task execution, while Supervisor permissions include approval and management capabilities.
              </>
            )}
          </p>
        </div>
      </div>

      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default AccessRightsManagement