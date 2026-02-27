import { useState, useEffect, useRef } from 'react'
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
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuDropup, setMenuDropup] = useState(false)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRefs = useRef({})
  const branchDropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employee_code: '',
    password: '',
    passwordConfirm: '',
    role_id: '',
    branch_id: '',
    is_active: true
  })

  const canAdd = user.permissions.includes('add_users')
  const canUpdate = user.permissions.includes('update_users')
  const canDelete = user.permissions.includes('delete_users')

  const currentRole = roleFilter ? roles.find(r => r.name === roleFilter.name) : null

  useEffect(() => {
    // Load saved branch filter from localStorage (for super admin only)
    // For non-super-admins, automatically set to their own branch
    if (user.role.name === 'super_admin') {
      const savedBranch = localStorage.getItem('selectedBranchId') || ''
      setFilterBranch(savedBranch)
    } else {
      // Non-super-admins always see their own branch
      setFilterBranch(String(user.branch_id || ''))
    }
    fetchRoles()
    fetchBranches()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
      fetchUsers()
    }
  }, [search, filterBranch, roleFilter, roles])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null)
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
      const response = await axiosClient.get('/branches/simple', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBranches(response.data)
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const openAddModal = () => {
    setEditingUser(null)
    // For super admin, use filtered branch if available, otherwise use their own branch
    const initialBranchId = user.role.name === 'super_admin' 
      ? (filterBranch || user.branch?.id || '')
      : (user.branch?.id || '')
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      employee_code: '',
      password: '',
      passwordConfirm: '',
      role_id: currentRole ? currentRole.id : '',
      branch_id: initialBranchId,
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
    setOpenMenuId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate password confirmation
    if (formData.password && formData.password !== formData.passwordConfirm) {
      alert('❌ Passwords do not match')
      return
    }
    
    // For new users, password is required
    if (!editingUser && !formData.password) {
      alert('❌ Password is required for new users')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      
      // Prepare data - exclude empty password on update
      const submitData = { ...formData }
      if (!submitData.password) {
        delete submitData.password
      }
      delete submitData.passwordConfirm // Never send confirmation password to backend
      
      if (editingUser) {
        await axiosClient.put(`/users/${editingUser.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ User updated successfully!')
      } else {
        await axiosClient.post('/users', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ User created successfully!')
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
      setOpenMenuId(null)
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user')
    }
  }

  const getRoleBadgeStyle = (roleName) => {
    const name = (roleName || '').toLowerCase()
    if (name.includes('super') || name.includes('admin')) return 'bg-purple-100 text-purple-700 border border-purple-200'
    if (name.includes('supervisor') || name.includes('manager')) return 'bg-amber-100 text-amber-700 border border-amber-200'
    return 'bg-blue-100 text-blue-700 border border-blue-200'
  }

  const pageTitle = roleFilter ? roleFilter.displayName : 'All Users'
  const addButtonText = roleFilter ? `Add ${roleFilter.displayName.slice(0, -1)}` : 'Add New User'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Branch Filter - Only for Super Admin */}
      {user.role.name === 'super_admin' && (
        <div ref={branchDropdownRef} className="relative w-fit">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-orange-300" />
            <span className="text-sm font-bold text-orange-900 flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-orange-600 transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-orange-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Search in dropdown */}
              <div className="p-3 border-b border-orange-100 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                <input
                  type="text"
                  placeholder="Search branches..."
                  className="w-full px-3.5 py-2.5 text-sm border border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              {/* Dropdown options */}
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterBranch('')
                    localStorage.setItem('selectedBranchId', '')
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                    filterBranch === ''
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-orange-300'}`} />
                    All Branches
                  </div>
                </button>

                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setFilterBranch(String(branch.id))
                      localStorage.setItem('selectedBranchId', String(branch.id))
                      setBranchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-semibold transition-all ${
                      filterBranch === String(branch.id)
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-orange-300'}`} />
                      {branch.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{pageTitle}</h2>
          {roleFilter && (
            <p className="text-sm text-gray-400 mt-0.5">
              Manage {roleFilter.displayName.toLowerCase()} in your organization
            </p>
          )}
        </div>
        {canAdd && (
          <button
            onClick={openAddModal}
            disabled={!roleFilter || (roleFilter?.name === 'branch_admin' && user.role.name !== 'super_admin') || (user.role.name === 'super_admin' && !filterBranch)}
            title={!roleFilter ? 'Select a role to create a user' : roleFilter?.name === 'branch_admin' && user.role.name !== 'super_admin' ? 'Only Super Admin can create Branch Admins' : user.role.name === 'super_admin' && !filterBranch ? 'Select a specific branch to create a user' : ''}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md text-white ${
              !roleFilter || (roleFilter?.name === 'branch_admin' && user.role.name !== 'super_admin') || (user.role.name === 'super_admin' && !filterBranch)
                ? 'bg-gray-300 cursor-not-allowed opacity-60'
                : 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:-translate-y-px active:translate-y-0'
            }`}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            <span className="flex items-center justify-center w-5 h-5 bg-white/25 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            {addButtonText}
          </button>
        )}
      </div>

      {/* Filters - Search & Count */}
      <div className="flex gap-3 items-center">
        <div className="relative max-w-sm w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <span className="text-sm font-semibold text-gray-700">{users.length}</span>
          <span className="text-sm text-gray-400">{users.length === 1 ? 'user' : 'users'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/60">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Code</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                {!roleFilter && (
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                )}
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={roleFilter ? 7 : 8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-400 font-medium text-sm">No users found</p>
                      <p className="text-gray-300 text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {u.employee_code || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{u.name}</span>
                        {u.id === user.id && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-100">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{u.email}</td>
                    <td className="px-5 py-4 text-gray-600">{u.phone || <span className="text-gray-300">—</span>}</td>
                    {!roleFilter && (
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(u.role?.name)}`}>
                          {u.role?.display_name}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 text-gray-600">
                      {u.branch?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.is_active
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(canUpdate || (canDelete && u.id !== user.id)) && (
                        <div className="relative inline-block" ref={openMenuId === u.id ? menuRef : null}>
                          <button
                            ref={el => buttonRefs.current[u.id] = el}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (openMenuId === u.id) {
                                setOpenMenuId(null)
                              } else {
                                const btn = buttonRefs.current[u.id]
                                if (btn) {
                                  const rect = btn.getBoundingClientRect()
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  setMenuDropup(spaceBelow < 120)
                                }
                                setOpenMenuId(u.id)
                              }
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {openMenuId === u.id && (
                            <div className={`absolute right-0 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 ${menuDropup ? 'bottom-full mb-1' : 'mt-1'}`}>
                              {canUpdate && (
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit User
                                </button>
                              )}
                              {canDelete && u.id !== user.id && (
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete User
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingUser ? 'Edit User' : addButtonText}
                </h3>
                {editingUser && (
                  <p className="text-sm text-gray-400 mt-0.5">{editingUser.name}</p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    placeholder="+94771234567"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Employee Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee Code <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                    required
                    placeholder="GAT001"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Password{' '}
                    {editingUser
                      ? <span className="text-gray-400 normal-case font-normal text-xs">(leave blank to keep current)</span>
                      : <span className="text-red-400">*</span>
                    }
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Min 8 characters'}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Password Confirmation */}
                {formData.password && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.passwordConfirm}
                      onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                      required={!!formData.password}
                      placeholder="Re-enter password to confirm"
                      className={`w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        formData.passwordConfirm && formData.password !== formData.passwordConfirm
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-500/10'
                          : 'focus:border-primary focus:ring-primary/10'
                      }`}
                    />
                    {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                      <p className="text-xs text-red-500 font-semibold">❌ Passwords do not match</p>
                    )}
                  </div>
                )}

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Role <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    required
                    disabled={!!roleFilter && !editingUser}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => {
                      // Hide super_admin role - only one super_admin allowed in system
                      if (role.name === 'super_admin') {
                        return null
                      }
                      return (
                        <option key={role.id} value={role.id}>{role.display_name}</option>
                      )
                    })}
                  </select>
                  {roleFilter && !editingUser && (
                    <p className="text-xs text-gray-400">Role pre-selected based on current tab</p>
                  )}
                </div>

                {/* Branch */}
                {user.role.name === 'super_admin' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch <span className="text-red-400">*</span></label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                      required
                      disabled={!!filterBranch && !editingUser}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">No Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                    {filterBranch && !editingUser && (
                      <p className="text-xs text-gray-400">Branch pre-selected based on filter</p>
                    )}
                  </div>
                )}

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors border border-gray-300 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0"
                >
                  {editingUser ? 'Update User' : 'Create User'}
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