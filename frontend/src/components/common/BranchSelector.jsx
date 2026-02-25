import { useState, useEffect } from 'react'
import axiosClient from '../../api/axios'

function BranchSelector({ user, onBranchChange }) {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all')

  useEffect(() => {
    if (user.role.name === 'super_admin') {
      fetchBranches()
    }
  }, [user])

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

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId)
    localStorage.setItem('selectedBranchId', branchId)
    if (onBranchChange) {
      onBranchChange(branchId)
    }
  }

  if (user.role.name !== 'super_admin') {
    return null
  }

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-md">
      <span className="text-sm font-semibold text-gray-700">🏢 Branch:</span>
      <select
        value={selectedBranch}
        onChange={(e) => handleBranchChange(e.target.value)}
        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none font-semibold"
      >
        <option value="all">🌍 All Branches</option>
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default BranchSelector