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
      const response = await axiosClient.get('/branches', { headers: { Authorization: `Bearer ${token}` } })
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
    setFormData({ name: '', code: '', address: '', city: '', phone: '', email: '', is_active: true })
    setShowModal(true)
  }

  const openEditModal = (branch) => {
    setEditingBranch(branch)
    setFormData({ name: branch.name, code: branch.code || '', address: branch.address, city: branch.city, phone: branch.phone, email: branch.email || '', is_active: branch.is_active })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (editingBranch) {
        await axiosClient.put(`/branches/${editingBranch.id}`, formData, { headers: { Authorization: `Bearer ${token}` } })
        alert('Branch updated successfully!')
      } else {
        await axiosClient.post('/branches', formData, { headers: { Authorization: `Bearer ${token}` } })
        alert('Branch created successfully!')
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
      await axiosClient.patch(`/branches/${branchId}/toggle-status`, {}, { headers: { Authorization: `Bearer ${token}` } })
      fetchBranches()
    } catch (error) {
      alert(error.response?.data?.message || 'Error toggling status')
    }
  }

  const handleDelete = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch?')) return
    try {
      const token = localStorage.getItem('token')
      await axiosClient.delete(`/branches/${branchId}`, { headers: { Authorization: `Bearer ${token}` } })
      alert('Branch deleted successfully!')
      fetchBranches()
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting branch')
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Branch Management
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-px border-2 border-orange-600"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          <span className="flex items-center justify-center w-4 h-4 bg-white/25 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </span>
          Add New Branch
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Branches',  value: branches.length,                                                   color: 'blue',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
          { label: 'Active Branches', value: branches.filter(b => b.is_active).length,                          color: 'green',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: 'Total Users',     value: branches.reduce((s, b) => s + (b.users_count || 0), 0),            color: 'purple', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
          { label: 'Total Job Cards', value: branches.reduce((s, b) => s + (b.job_cards_count || 0), 0),        color: 'orange', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-${s.color}-50 flex items-center justify-center flex-shrink-0`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 text-${s.color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{s.icon}</svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold text-${s.color}-600 mt-0.5`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Cards Grid */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="font-bold text-gray-800 mb-1">No Branches Yet</h3>
          <p className="text-sm text-gray-400 mb-5">Create your first branch to get started</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            Add First Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Card Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{branch.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{branch.city}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  branch.is_active
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${branch.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Card Body */}
              <div className="px-5 py-4 space-y-2">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{branch.phone}</span>
                </div>
                {branch.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{branch.email}</span>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
                <div className="px-5 py-3 text-center border-r border-gray-100">
                  <p className="text-lg font-bold text-primary">{branch.users_count || 0}</p>
                  <p className="text-xs text-gray-400">Users</p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-lg font-bold text-purple-600">{branch.job_cards_count || 0}</p>
                  <p className="text-xs text-gray-400">Job Cards</p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-gray-100 flex gap-1.5">
                <button
                  onClick={() => openEditModal(branch)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(branch.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                    branch.is_active
                      ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                  }`}
                >
                  {branch.is_active ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Deactivate
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Activate
                    </>
                  )}
                </button>
                {branch.users_count === 0 && branch.job_cards_count === 0 && (
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="inline-flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors ml-auto"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingBranch ? 'Edit Branch' : 'Create New Branch'}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{editingBranch ? `Editing ${editingBranch.name}` : 'Fill in the branch details below'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Branch Name <span className="text-red-400">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="e.g., Main Branch Colombo" className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Branch Code <span className="text-red-400">*</span></label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required placeholder="e.g., HQ001" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>City <span className="text-red-400">*</span></label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required placeholder="Colombo" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required placeholder="+94 11 234 5678" className={inputCls} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Address <span className="text-red-400">*</span></label>
                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required rows="3" placeholder="123 Main Street, Colombo 03" className={`${inputCls} resize-none`} />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="colombo@grandautotech.lk" className={inputCls} />
              </div>

              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-primary" />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Branch is Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold border border-gray-300 shadow-sm transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-px" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
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