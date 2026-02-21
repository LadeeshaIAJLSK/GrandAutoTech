import { useState, useEffect } from 'react'
import axiosClient from '../api/axios'

function BranchManagement({ user }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    is_active: true,
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axiosClient.get('/branches', {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Branches response:', response.data)
      // Handle both array and { data: [...] } formats
      const branchesData = Array.isArray(response.data) ? response.data : response.data.data || []
      setBranches(branchesData)
    } catch (error) {
      console.error('Error fetching branches:', error.response?.data || error.message)
      alert('Error fetching branches: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingBranch(null)
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      is_active: true,
    })
    setShowModal(true)
  }

  const openEditModal = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      code: branch.code || '',
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email || '',
      is_active: branch.is_active,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      if (editingBranch) {
        // Update existing branch
        await axiosClient.put(`/branches/${editingBranch.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ Branch updated successfully!')
      } else {
        // Create new branch
        await axiosClient.post('/branches', formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('✅ Branch created successfully!')
      }
      
      setShowModal(false)
      fetchBranches()
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving branch')
    }
  }

  const handleToggleStatus = async (branchId) => {
    try {
      const token = localStorage.getItem('token')
      await axiosClient.patch(`/branches/${branchId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchBranches()
    } catch (error) {
      alert(error.response?.data?.message || 'Error toggling status')
    }
  }

  const handleDelete = async (branchId) => {
    if (!confirm('⚠️ Are you sure you want to delete this branch?')) return

    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/branches/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('✅ Branch deleted successfully!')
      fetchBranches()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting branch')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">🏢 Branch Management</h2>
        <button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ➕ Add New Branch
        </button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Branches</div>
          <div className="text-5xl font-bold">{branches.length}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Active Branches</div>
          <div className="text-5xl font-bold">
            {branches.filter(b => b.is_active).length}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Users</div>
          <div className="text-5xl font-bold">
            {branches.reduce((sum, b) => sum + (b.users_count || 0), 0)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-semibold mb-2">Total Job Cards</div>
          <div className="text-5xl font-bold">
            {branches.reduce((sum, b) => sum + (b.job_cards_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className={`p-6 ${branch.is_active ? 'bg-green-50' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{branch.name}</h3>
                  <p className="text-sm text-gray-600">{branch.city}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    branch.is_active 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-400 text-white'
                  }`}>
                    {branch.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">📍</span>
                  <span className="text-gray-700">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">📞</span>
                  <span className="text-gray-700">{branch.phone}</span>
                </div>
                {branch.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">📧</span>
                    <span className="text-gray-700">{branch.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{branch.users_count || 0}</div>
                  <div className="text-xs text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{branch.job_cards_count || 0}</div>
                  <div className="text-xs text-gray-600">Job Cards</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(branch)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(branch.id)}
                  className={`flex-1 ${
                    branch.is_active 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white px-4 py-2 rounded-lg font-semibold transition-colors`}
                >
                  {branch.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </button>
                {branch.users_count === 0 && branch.job_cards_count === 0 && (
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Branches Yet</h3>
          <p className="text-gray-600 mb-6">Create your first branch to get started</p>
          <button
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold"
          >
            ➕ Add First Branch
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingBranch ? '✏️ Edit Branch' : '➕ Create New Branch'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Main Branch Colombo"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Branch Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                  placeholder="e.g., HQ001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                    placeholder="Colombo"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    placeholder="+94 11 234 5678"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                  rows="3"
                  placeholder="123 Main Street, Colombo 03"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="colombo@grandautotech.lk"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5"
                />
                <label htmlFor="is_active" className="text-gray-700 font-semibold">
                  Branch is Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                >
                  {editingBranch ? '💾 Update Branch' : '➕ Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BranchManagement