import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function AccessRightsManagement({ user }) {
  const [roles, setRoles] = useState([])
  const [groupedPermissions, setGroupedPermissions] = useState({})
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      
      if (response.data.roles.length > 0) {
        selectRole(response.data.roles[0])
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error loading access rights')
    } finally {
      setLoading(false)
    }
  }

  const selectRole = (role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions.map(p => p.id))
  }

  const togglePermission = (permissionId) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId))
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId])
    }
  }

  const toggleAllInModule = (module) => {
    const modulePermissions = groupedPermissions[module]
    const modulePermissionIds = modulePermissions.map(p => p.id)
    
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
    
    if (allSelected) {
      // Unselect all
      setSelectedPermissions(selectedPermissions.filter(id => !modulePermissionIds.includes(id)))
    } else {
      // Select all
      const newPermissions = [...new Set([...selectedPermissions, ...modulePermissionIds])]
      setSelectedPermissions(newPermissions)
    }
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      await axiosClient.put(`/access-rights/roles/${selectedRole.id}`, {
        permission_ids: selectedPermissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Permissions updated successfully!')
      fetchRolesAndPermissions()
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving permissions')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">🔐 Access Rights Management</h2>
        <div className="text-sm text-gray-600">
          Configure permissions for each role
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Roles List */}
        <div className="col-span-3 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Roles</h3>
          <div className="space-y-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedRole?.id === role.id
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-semibold">{role.display_name}</div>
                <div className="text-xs opacity-75">
                  {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="col-span-9 bg-white rounded-xl shadow-md p-6">
          {selectedRole ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedRole.display_name}</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  onClick={savePermissions}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([module, permissions]) => {
                  const modulePermissionIds = permissions.map(p => p.id)
                  const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))
                  const someSelected = modulePermissionIds.some(id => selectedPermissions.includes(id))

                  return (
                    <div key={module} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                        <h4 className="text-lg font-bold text-gray-800 capitalize">{module}</h4>
                        <button
                          onClick={() => toggleAllInModule(module)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            allSelected
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-primary hover:bg-primary-dark text-white'
                          }`}
                        >
                          {allSelected ? '✖️ Unselect All' : '✓ Select All'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-6">
                        {permissions.map(permission => {
                          const isSelected = selectedPermissions.includes(permission.id)
                          
                          return (
                            <label
                              key={permission.id}
                              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary bg-opacity-10'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(permission.id)}
                                className="w-5 h-5"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 text-sm">
                                  {permission.display_name}
                                </div>
                                <div className="text-xs text-gray-500">{permission.name}</div>
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
            <div className="text-center py-12 text-gray-500">
              Select a role to manage permissions
            </div>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-gray-800">Important</div>
            <div className="text-sm text-gray-700">
              Changes to permissions will affect all users with this role immediately. 
              Be careful when removing critical permissions like "view_dashboard" or "view_job_cards".
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccessRightsManagement