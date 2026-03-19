import { useState, useEffect, useRef } from 'react'
import axiosClient from '../api/axios'
import Notification from '../components/common/Notification'

function UserManagement({ user, roleFilter }) {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingUser, setViewingUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuDropup, setMenuDropup] = useState(false)
  const [menuButtonPosition, setMenuButtonPosition] = useState(null)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [notification, setNotification] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [deleteMultipleConfirm, setDeleteMultipleConfirm] = useState(false)
  const menuRef = useRef(null)
  const buttonRefs = useRef({})
  const branchDropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    first_name: '',
    email: '',
    phone: '',
    employee_code: '',
    password: '',
    passwordConfirm: '',
    role_id: '',
    technician_type: '',
    branch_id: '',
    is_active: true,
    gender: 'male',
    date_of_birth: '',
    join_date: new Date().toISOString().slice(0, 10),
    left_date: '',
    emergency_contact_name: '',
    emergency_contact_no: '',
    special_notes: '',
    profile_image: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [existingProfileImage, setExistingProfileImage] = useState(null)

  const canAdd = user.role.name === 'super_admin' || user.permissions.includes('add_users')
  const canUpdate = user.role.name === 'super_admin' || user.permissions.includes('update_users')
  const canDelete = user.role.name === 'super_admin' || user.permissions.includes('delete_users')

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

  // Notification persists until user clicks OK - no auto-dismiss

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

  const generateEmployeeCodePreview = (branchId) => {
    if (!branchId) return ''
    const selectedBranch = branches.find(b => String(b.id) === String(branchId))
    if (!selectedBranch) return ''
    
    const branchCode = selectedBranch.code ? selectedBranch.code.toUpperCase().substring(0, 3) : selectedBranch.name.toUpperCase().substring(0, 3)
    const branchUsers = users.filter(u => u.branch_id === parseInt(branchId))
    let highestNumber = 0
    branchUsers.forEach(u => {
      const match = u.employee_code?.match(new RegExp(`^${branchCode}(\\d+)$`, 'i'))
      if (match) {
        const num = parseInt(match[1])
        if (num > highestNumber) highestNumber = num
      }
    })
    
    const nextNumber = String(highestNumber + 1).padStart(3, '0')
    return `${branchCode}${nextNumber}`
  }

  const openAddModal = () => {
    setEditingUser(null)
    const initialBranchId = user.role.name === 'super_admin' 
      ? (filterBranch || user.branch?.id || '')
      : (user.branch?.id || '')
    
    const previewCode = generateEmployeeCodePreview(initialBranchId)
    
    setFormData({
      name: '',
      first_name: '',
      email: '',
      phone: '',
      employee_code: previewCode,
      password: '',
      passwordConfirm: '',
      role_id: currentRole ? currentRole.id : '',
      technician_type: '',
      branch_id: initialBranchId,
      is_active: true,
      gender: 'male',
      date_of_birth: '',
      join_date: new Date().toISOString().slice(0, 10),
      left_date: '',
      emergency_contact_name: '',
      emergency_contact_no: '',
      special_notes: '',
      profile_image: null
    })
    setShowModal(true)
  }

  // Helper function to format ISO date to yyyy-MM-dd
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    // If it's already in yyyy-MM-dd format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
    // If it's ISO format or other format, extract just the date part
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 10)
    } catch (e) {
      return ''
    }
  }

  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit)
    setExistingProfileImage(userToEdit.profile_image || null)
    setFormData({
      name: userToEdit.name,
      first_name: userToEdit.first_name || '',
      email: userToEdit.email,
      phone: userToEdit.phone || '',
      employee_code: userToEdit.employee_code || '',
      password: '',
      passwordConfirm: '',
      role_id: userToEdit.role_id,
      technician_type: userToEdit.technician_type || '',
      branch_id: userToEdit.branch_id || '',
      is_active: userToEdit.is_active,
      gender: userToEdit.gender || 'male',
      date_of_birth: formatDateForInput(userToEdit.date_of_birth),
      join_date: formatDateForInput(userToEdit.join_date) || new Date().toISOString().slice(0, 10),
      left_date: formatDateForInput(userToEdit.left_date),
      emergency_contact_name: userToEdit.emergency_contact_name || '',
      emergency_contact_no: userToEdit.emergency_contact_no || '',
      special_notes: userToEdit.special_notes || '',
      profile_image: null
    })
    setShowModal(true)
    setOpenMenuId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate password confirmation
    if (formData.password && formData.password !== formData.passwordConfirm) {
      setNotification({ type: 'error', title: 'Validation Error', message: 'Passwords do not match' })
      return
    }
    
    // For new users, password is required
    if (!editingUser && !formData.password) {
      setNotification({ type: 'error', title: 'Validation Error', message: 'Password is required for new users' })
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const hasImage = formData.profile_image instanceof File
      console.log('Before submitting - hasImage:', hasImage, 'profile_image:', formData.profile_image, 'type:', typeof formData.profile_image)
      
      let submitData
      let headers = { Authorization: `Bearer ${token}` }
      
      if (hasImage) {
        // Use FormData only if we have a file to upload
        submitData = new FormData()
        submitData.append('name', formData.name)
        submitData.append('first_name', formData.first_name)
        submitData.append('email', formData.email)
        submitData.append('phone', formData.phone)
        if (formData.password) submitData.append('password', formData.password)
        submitData.append('role_id', formData.role_id)
        if (formData.technician_type) submitData.append('technician_type', formData.technician_type)
        submitData.append('branch_id', formData.branch_id)
        submitData.append('is_active', formData.is_active ? 1 : 0)
        submitData.append('gender', formData.gender)
        submitData.append('date_of_birth', formData.date_of_birth)
        submitData.append('join_date', formData.join_date)
        submitData.append('left_date', formData.left_date || '')
        submitData.append('emergency_contact_name', formData.emergency_contact_name)
        submitData.append('emergency_contact_no', formData.emergency_contact_no)
        submitData.append('special_notes', formData.special_notes || '')
        // Only append if it's actually a File object
        if (formData.profile_image instanceof File) {
          submitData.append('profile_image', formData.profile_image)
          console.log('FormData with image - appending file:', formData.profile_image.name)
        } else {
          console.warn('WARNING: hasImage is true but profile_image is not a File!', typeof formData.profile_image)
        }
        // IMPORTANT: Remove Content-Type header for FormData so axios can set multipart/form-data automatically
        headers['Content-Type'] = undefined
      } else {
        // Use JSON when no file - don't include profile_image field at all
        const jsonData = {
          name: formData.name,
          first_name: formData.first_name,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.role_id,
          branch_id: formData.branch_id,
          is_active: formData.is_active ? 1 : 0,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
          join_date: formData.join_date,
          left_date: formData.left_date || '',
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_no: formData.emergency_contact_no,
          special_notes: formData.special_notes || ''
        }
        if (formData.password) {
          jsonData.password = formData.password
        }
        if (formData.technician_type) {
          jsonData.technician_type = formData.technician_type
        }
        submitData = jsonData
        headers['Content-Type'] = 'application/json'
        console.log('Sending JSON - no image, profile_image:', formData.profile_image)
      }
      
      if (editingUser) {
        // For updates, use proper PUT method or POST with _method
        const updateUrl = `/users/${editingUser.id}`
        const response = submitData instanceof FormData
          ? await axiosClient.post(`${updateUrl}?_method=PUT`, submitData, { headers })
          : await axiosClient.put(updateUrl, submitData, { headers })
        setNotification({ type: 'success', title: 'Success', message: 'User updated successfully' })
      } else {
        // For creation, use POST
        await axiosClient.post('/users', submitData, { headers })
        setNotification({ type: 'success', title: 'Success', message: 'User created successfully' })
      }

      setShowModal(false)
      setExistingProfileImage(null)
      setTimeout(fetchUsers, 500)
    } catch (error) {
      console.error('Submit error:', error)
      console.error('Error response:', error.response?.data)
      
      // Build detailed error message from validation errors
      let message = error.response?.data?.message || 'Error saving user'
      if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
        const errors = error.response.data.errors
        const errorList = Object.entries(errors)
          .map(([field, msgs]) => {
            const fieldMsg = Array.isArray(msgs) ? msgs[0] : msgs
            return fieldMsg
          })
          .join('\n')
        if (errorList) {
          message = errorList
        }
      }
      
      setNotification({ type: 'error', title: 'Validation Error', message })
    }
  }

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotification({ type: 'success', title: 'Success', message: 'User deleted successfully' })
      fetchUsers()
      setDeleteConfirm(null)
      setOpenMenuId(null)
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error deleting user' })
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleDeleteMultiple = async () => {
    try {
      const token = localStorage.getItem('token')
      await Promise.all(
        selectedUsers.map(userId =>
          axiosClient.delete(`/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      )
      setNotification({ type: 'success', title: 'Success', message: `${selectedUsers.length} user(s) deleted successfully` })
      setSelectedUsers([])
      setDeleteMultipleConfirm(false)
      fetchUsers()
    } catch (error) {
      setNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Error deleting users' })
    }
  }

  const getRoleBadgeStyle = (roleName) => {
    const name = (roleName || '').toLowerCase().trim()
    
    // Specific role colors
    const roleColors = {
      'super_admin': 'bg-red-100 text-red-700 border border-red-200',
      'admin': 'bg-purple-100 text-purple-700 border border-purple-200',
      'branch_admin': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      'technician': 'bg-green-100 text-green-700 border border-green-200',
      'accountant': 'bg-orange-100 text-orange-700 border border-orange-200'
      
    }
    
    return roleColors[name] || 'bg-blue-100 text-blue-700 border border-blue-200'
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
            className="flex items-center gap-3 bg-gradient-to-r from-[#2563A8]/10 to-[#2563A8]/30 border border-[#2563A8]/50 shadow-sm hover:shadow-md hover:border-[#2563A8]/70 rounded-xl px-4 py-3 transition-all duration-200 min-w-[280px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#2563A8] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="w-px h-5 bg-[#2563A8]/50" />
            <span className="text-sm font-bold text-[#2563A8] flex-1 text-left">
              {filterBranch ? branches.find(b => b.id === parseInt(filterBranch))?.name : 'All Branches'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-[#2563A8] transition-transform duration-200 flex-shrink-0 ${branchDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-[#2563A8]/50 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Search in dropdown */}
              <div className="p-3 border-b border-[#2563A8]/30 bg-gradient-to-r from-[#2563A8]/10 to-[#2563A8]/20">
                <input
                  type="text"
                  placeholder="Search branches..."
                  className="w-full px-3.5 py-2.5 text-sm border border-[#2563A8]/200 rounded-lg focus:border-[#2563A8]/500 focus:outline-none focus:ring-2 focus:ring-[#2563A8]/500/20 transition-all"
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
                      ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                      : 'text-gray-700 hover:bg-[#2563A8]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === '' ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
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
                        ? 'bg-gradient-to-r from-[#2563A8] to-[#2563A8]/80 text-white'
                        : 'text-gray-700 hover:bg-[#2563A8]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${filterBranch === String(branch.id) ? 'bg-white' : 'bg-[#2563A8]/30'}`} />
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
                : 'bg-[#2563A8] hover:bg-[#1E4E8C] hover:shadow-lg hover:-translate-y-px active:translate-y-0'
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
      <div className="flex gap-3 items-center flex-wrap">
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

        {selectedUsers.length > 0 && (
          <button
            onClick={() => setDeleteMultipleConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected ({selectedUsers.length})
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary opacity-80" />
          <span className="text-sm font-semibold text-gray-700">{users.length}</span>
          <span className="text-sm text-gray-400">{users.length === 1 ? 'user' : 'users'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100" style={{ backgroundColor: '#2563A8' }}>
                <th className="px-3 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary border-gray-300 rounded cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Employee Code</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                {!roleFilter && (
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Role</th>
                )}
                {roleFilter?.name === 'employee' && (
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Position</th>
                )}
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Branch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-white uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={!roleFilter ? 9 : roleFilter.name === 'employee' ? 9 : 8} className="px-5 py-16 text-center">
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
                  <tr key={u.id} className={`hover:bg-gray-50/70 transition-colors ${selectedUsers.includes(u.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="w-4 h-4 text-primary border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {u.employee_code || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{u.name}</span>
                          {u.id === user.id && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-100">
                              You
                            </span>
                          )}
                        </div>
                        
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm">{u.email}</td>
                    <td className="px-5 py-4 text-gray-600 text-sm">{u.phone || <span className="text-gray-300">—</span>}</td>
                    {!roleFilter && (
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(u.role?.name)}`}>
                          {u.role?.display_name}
                        </span>
                        {u.technician_type && (
                          <span className="block text-center text-[11px] text-gray-500 font-medium">
                            {u.technician_type === 'employee' ? 'Employee' : u.technician_type === 'supervisor' ? 'Supervisor' : u.technician_type}
                          </span>
                        )}
                      </td>
                    )}
                    
                    <td className="px-5 py-4 text-gray-600 text-sm">
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
                        <button
                          ref={el => buttonRefs.current[u.id] = el}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (openMenuId === u.id) {
                              setOpenMenuId(null)
                              setMenuButtonPosition(null)
                            } else {
                              const btn = buttonRefs.current[u.id]
                              if (btn) {
                                const rect = btn.getBoundingClientRect()
                                const spaceBelow = window.innerHeight - rect.bottom
                                setMenuDropup(spaceBelow < 120)
                                setMenuButtonPosition({
                                  top: rect.top,
                                  right: window.innerWidth - rect.right,
                                  bottom: rect.bottom
                                })
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
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Menu Portal */}
      {openMenuId && menuButtonPosition && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setOpenMenuId(null)
              setMenuButtonPosition(null)
            }} 
          />
          <div
            className="fixed w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
            style={{
              top: menuDropup ? `${menuButtonPosition.top - 160}px` : `${menuButtonPosition.bottom + 4}px`,
              right: `${menuButtonPosition.right}px`
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                const currentUser = users.find(u => u.id === openMenuId)
                if (currentUser) {
                  setViewingUser(currentUser)
                  setShowViewModal(true)
                }
                setOpenMenuId(null)
                setMenuButtonPosition(null)
              }}
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
                onClick={(e) => {
                  e.stopPropagation()
                  const currentUser = users.find(u => u.id === openMenuId)
                  if (currentUser) {
                    openEditModal(currentUser)
                  }
                  setOpenMenuId(null)
                  setMenuButtonPosition(null)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit User
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteConfirm(openMenuId)
                  setOpenMenuId(null)
                  setMenuButtonPosition(null)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete User
              </button>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false)
            setExistingProfileImage(null)
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 sm:px-7 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingUser ? 'Edit User' : addButtonText}
                </h3>
                {editingUser && (
                  <p className="text-sm text-gray-400 mt-0.5">{editingUser.name}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setExistingProfileImage(null)
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-4 sm:px-7 py-6 space-y-5">
              {/* Main Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

                {/* Full Name */}
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* First Name */}
                <div className="col-span-1 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Enter first name"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="col-span-1 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Email <span className="text-red-400">*</span></label>
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
                <div className="col-span-1 space-y-1.5">
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
                <div className="col-span-1 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    readOnly
                    placeholder={editingUser ? 'Auto-assigned' : 'Auto-generated'}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed read-only:opacity-75"
                  />
                  <p className="text-xs text-gray-400">{editingUser ? 'Cannot be changed' : 'Auto-generated based on branch'}</p>
                </div>

                {/* Password */}
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Password {editingUser ? <span className="text-gray-400 normal-case font-normal text-xs">(leave blank to keep)</span> : <span className="text-red-400">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!editingUser}
                      placeholder={editingUser ? 'Leave blank to keep' : 'Min 8 characters'}
                      autoComplete={editingUser ? 'current-password' : 'new-password'}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all pr-10"
                    />
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Confirmation */}
                {formData.password && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password <span className="text-red-400">*</span></label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.passwordConfirm}
                      onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                      required={!!formData.password}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className={`w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        formData.passwordConfirm && formData.password !== formData.passwordConfirm
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-500/10'
                          : 'focus:border-primary focus:ring-primary/10'
                      }`}
                    />
                    {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                      <p className="text-xs text-red-500 font-semibold">Passwords do not match</p>
                    )}
                  </div>
                )}

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Role <span className="text-red-400">*</span></label>

                  {roleFilter?.name === 'technician' ? (
                    /* Technician tab: single dropdown merging role + subtype */
                    <select
                      value={formData.technician_type}
                      onChange={(e) => setFormData({...formData, technician_type: e.target.value})}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      <option value="">Select Technician Type</option>
                      <option value="employee">Technician (Employee)</option>
                      <option value="supervisor">Technician (Supervisor)</option>
                    </select>
                  ) : (
                    /* Other tabs or general users page: normal role dropdown */
                    <select
                      value={formData.role_id}
                      onChange={(e) => setFormData({...formData, role_id: e.target.value, technician_type: ''})}
                      required
                      disabled={!!roleFilter && !editingUser}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => {
                        if (role.name === 'super_admin') return null
                        return <option key={role.id} value={role.id}>{role.display_name}</option>
                      })}
                    </select>
                  )}
                </div>

                {/* Technician Type - Only on general page when technician role is selected manually */}
                {!roleFilter && formData.role_id && roles.find(r => r.id === parseInt(formData.role_id))?.name === 'technician' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Technician Type <span className="text-red-400">*</span></label>
                    <select
                      value={formData.technician_type}
                      onChange={(e) => setFormData({...formData, technician_type: e.target.value})}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      <option value="">Select Type</option>
                      <option value="employee">Employee</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                    <p className="text-xs text-gray-400">Employee technician can perform basic tasks. Supervisor can approve tasks and manage employees.</p>
                  </div>
                )}

                {/* Branch - Super Admin Only */}
                {user.role.name === 'super_admin' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch <span className="text-red-400">*</span></label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => {
                        const newBranchId = e.target.value
                        const previewCode = generateEmployeeCodePreview(newBranchId)
                        setFormData({...formData, branch_id: newBranchId, employee_code: previewCode})
                      }}
                      required
                      disabled={!!filterBranch && !editingUser}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                    {filterBranch && !editingUser && <p className="text-xs text-gray-400">Pre-selected</p>}
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

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender <span className="text-red-400">*</span></label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Join Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Join Date <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Left Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Left Date</label>
                  <input
                    type="date"
                    value={formData.left_date}
                    onChange={(e) => setFormData({...formData, left_date: e.target.value})}
                    placeholder="If employee has left"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Emergency Contact Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    required
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Emergency Contact Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact Number <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={formData.emergency_contact_no}
                    onChange={(e) => setFormData({...formData, emergency_contact_no: e.target.value})}
                    required
                    placeholder="+94771234567"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Profile Image */}
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile Image</label>
                  
                  {existingProfileImage && !formData.profile_image && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                      <img 
                        src={`http://localhost:8000/storage/${existingProfileImage}`}
                        alt="Current profile"
                        className="w-12 h-12 rounded-full object-cover border border-blue-300"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-900">Current Image</p>
                        <p className="text-xs text-blue-700">Upload a new image to replace</p>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({...formData, profile_image: e.target.files?.[0] || null})}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all file:mr-2 file:py-1 file:px-3 file:rounded file:border file:border-gray-400 file:text-xs file:font-semibold file:bg-primary file:text-black"
                  />
                  {formData.profile_image && <p className="text-xs text-green-600 font-semibold">New image selected: {formData.profile_image.name}</p>}
                  {existingProfileImage && !formData.profile_image && <p className="text-xs text-blue-600 font-semibold">Current image will be kept if no new image is selected</p>}
                </div>

                {/* Special Notes */}
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Special Notes</label>
                  <textarea
                    value={formData.special_notes}
                    onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                    placeholder="Any additional notes about the employee"
                    rows="3"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>

              </div>
             

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setExistingProfileImage(null)
                  }}
                  className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors border border-red-700 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm bg-[#2563A8] hover:bg-[#1E4E8C] text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">User Details</h3>
                <p className="text-sm text-gray-500 mt-0.5">{viewingUser.name}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-7 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Profile Photo Section */}
              {viewingUser.profile_image && (
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <img 
                      src={`http://localhost:8000/storage/${viewingUser.profile_image}`}
                      alt={viewingUser.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.name}</p>
                </div>

                {/* First Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">First Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.first_name || 'Not provided'}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.email}</p>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.phone || 'Not provided'}</p>
                </div>

                {/* Employee Code */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Employee Code</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{viewingUser.employee_code || 'Not assigned'}</p>
                </div>

                {/* Gender */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gender</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{viewingUser.gender || 'Not provided'}</p>
                </div>

                {/* Date of Birth */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.date_of_birth ? new Date(viewingUser.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                </div>

                {/* Join Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Join Date</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.join_date ? new Date(viewingUser.join_date).toLocaleDateString() : 'Not provided'}</p>
                </div>

                {/* Left Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Left Date</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.left_date ? new Date(viewingUser.left_date).toLocaleDateString() : 'Still employed'}</p>
                </div>

                {/* Role */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Role</p>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(viewingUser.role?.name)}`}>
                      {viewingUser.role?.display_name}
                    </span>
                  </div>
                </div>

                {/* Technician Type */}
                {viewingUser.technician_type && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Technician Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {viewingUser.technician_type === 'employee' ? 'Employee' : viewingUser.technician_type === 'supervisor' ? 'Supervisor' : viewingUser.technician_type}
                    </p>
                  </div>
                )}

                {/* Branch */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Branch</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.branch?.name || 'No branch assigned'}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      viewingUser.is_active
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${viewingUser.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {viewingUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Emergency Contact Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emergency Contact Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.emergency_contact_name || 'Not provided'}</p>
                </div>

                {/* Emergency Contact Number */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emergency Contact Number</p>
                  <p className="text-sm font-medium text-gray-900">{viewingUser.emergency_contact_no || 'Not provided'}</p>
                </div>

                {/* Special Notes */}
                {viewingUser.special_notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Special Notes</p>
                    <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{viewingUser.special_notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => setShowViewModal(false)} className="px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold border border-red-700 transition-colors">
                  Close
                </button>
                {canUpdate && (
                  <button
                    onClick={() => {
                      openEditModal(viewingUser)
                      setShowViewModal(false)
                    }}
                    className="px-5 py-2.5 text-sm bg-[#2563A8] hover:bg-[#1E4E8C] text-white rounded-lg font-bold transition-all shadow-md"
                  >
                    Edit User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 6H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this user? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Multiple Users Confirmation Modal */}
      {deleteMultipleConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteMultipleConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Delete {selectedUsers.length} User(s)</h3>
                <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete the selected {selectedUsers.length} user(s)? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setDeleteMultipleConfirm(false)} className="flex-1 px-4 py-2.5 text-sm bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold border border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteMultiple} className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal - More Noticeable */}
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  )
}

export default UserManagement