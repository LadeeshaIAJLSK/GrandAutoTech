import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function UserManagement({ user, roleFilter }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employee_code: '',
    password: '',
    role_id: '',
    branch_id: '',
    is_active: true
  })

  const canAdd = user.permissions.includes('add_users')
  const canUpdate = user.permissions.includes('update_users')
  const canDelete = user.permissions.includes('delete_users')

  const currentRole = roleFilter ? roles.find(r => r.name === roleFilter.name) : null

  useEffect(() => {
    fetchRoles()
    fetchBranches()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
      fetchUsers()
    }
  }, [search, filterBranch, roleFilter, roles])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = {}
      if (search) params.search = search
      if (filterBranch) params.branch_id = filterBranch
      if (roleFilter && currentRole) params.role_id = currentRole.id

      const response = await axiosClient.get('/users', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/roles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRoles(response.data)
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const openAddModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      employee_code: '',
      password: '',
      role_id: currentRole ? currentRole.id : '',
      branch_id: user.branch?.id || '',
      is_active: true
    })
    setShowModal(true)
  }

  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit)
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      phone: userToEdit.phone || '',
      employee_code: userToEdit.employee_code || '',
      password: '',
      role_id: userToEdit.role_id,
      branch_id: userToEdit.branch_id || '',
      is_active: userToEdit.is_active
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      if (editingUser) {
        await axiosClient.put(`/users/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('User updated successfully!')
      } else {
        await axiosClient.post('/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('User created successfully!')
      }
      
      setShowModal(false)
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving user')
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('User deleted successfully!')
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    )
  }

  const pageTitle = roleFilter ? `👥 ${roleFilter.displayName}` : '👥 All Users'
  const addButtonText = roleFilter ? `➕ Add ${roleFilter.displayName.slice(0, -1)}` : '➕ Add New User'

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{pageTitle}</h2>
          {roleFilter && (
            <p className="text-gray-600 mt-1">
              Manage {roleFilter.displayName.toLowerCase()} in your organization
            </p>
          )}
        </div>
        {canAdd && (
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {addButtonText}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-5">
        <input
          type="text"
          placeholder="🔍 Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
        />

        {user.role.name === 'super_admin' && (
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none min-w-[200px]"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Users Count */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg mb-5">
        <span className="text-primary text-xl font-bold">{users.length}</span>
        <span className="text-gray-600 ml-2">{users.length === 1 ? 'user' : 'users'} found</span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Employee Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Phone</th>
                {!roleFilter && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Role</th>}
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Branch</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={roleFilter ? "7" : "8"} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg">📭 No users found</div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700">{u.employee_code || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{u.name}</span>
                        {u.id === user.id && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 text-gray-700">{u.phone || '-'}</td>
                    {!roleFilter && (
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {u.role?.display_name}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-gray-700">{u.branch?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        u.is_active 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                            title="Edit User"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {canDelete && u.id !== user.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                            title="Delete User"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b-2 border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingUser ? `Edit ${editingUser.name}` : addButtonText}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✖️
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="email@example.com"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+94771234567"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Employee Code */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                    placeholder="GAT001"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Password {editingUser && '(leave blank to keep current)'} *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? "Leave blank to keep current" : "Min 8 characters"}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Role *</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    required
                    disabled={!!roleFilter && !editingUser}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-100"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.display_name}</option>
                    ))}
                  </select>
                  {roleFilter && !editingUser && (
                    <p className="text-xs text-gray-500 mt-1">Role pre-selected based on current tab</p>
                  )}
                </div>

                {/* Branch */}
                {user.role.name === 'super_admin' && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Branch</label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                    >
                      <option value="">No Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Status</label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                >
                  {editingUser ? '💾 Update User' : '✅ Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement