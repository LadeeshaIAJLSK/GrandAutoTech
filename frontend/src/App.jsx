import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Login from './pages/Login'
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard'
import UserManagement from './pages/UserManagement'
import CustomerManagement from './pages/CustomerManagement'
import JobCardManagement from './pages/JobCardManagement'
import JobCardDetail from './pages/JobCardDetail'
import QuotationManagement from './pages/QuotationManagement'
import FinancialReports from './pages/FinancialReports'
import PettyCashManagement from './pages/PettyCashManagement'
import AccessRightsManagement from './pages/AccessRightsManagement'
import BranchManagement from './pages/BranchManagement'
import BranchOverview from './pages/BranchOverview'
import Layout from './components/Layout'
import MyTasks from './pages/MyTasks'
import TaskApproval from './pages/TaskApproval'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    
    setLoading(false)
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLoginSuccess} />} 
        />
        
        {/* Protected Routes with Layout */}
        <Route 
          path="/dashboard" 
          element={user ? <Layout user={user} onLogout={handleLogout}><AnalyticsDashboard user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/users" 
          element={user ? <Layout user={user} onLogout={handleLogout}><UserManagement user={user} roleFilter={null} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/users/:role" 
          element={user ? <Layout user={user} onLogout={handleLogout}><UserManagementRoute user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/customers" 
          element={user ? <Layout user={user} onLogout={handleLogout}><CustomerManagement user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/job-cards" 
          element={user ? <Layout user={user} onLogout={handleLogout}><JobCardManagement user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/job-cards/:id" 
          element={user ? <Layout user={user} onLogout={handleLogout}><JobCardDetail user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/quotations" 
          element={user ? <Layout user={user} onLogout={handleLogout}><QuotationManagement user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/reports" 
          element={user ? <Layout user={user} onLogout={handleLogout}><FinancialReports user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/petty-cash" 
          element={user ? <Layout user={user} onLogout={handleLogout}><PettyCashManagement user={user} /></Layout> : <Navigate to="/login" />} 
        />

        {/* My Tasks (Employee & Super Admin) */}
        <Route
          path="/my-tasks"
          element={user && ['employee', 'super_admin'].includes(user.role.name) ? (
            <Layout user={user} onLogout={handleLogout}>
              <MyTasks user={user} />
            </Layout>
          ) : <Navigate to="/login" />}
        />

        {/* Task Approval (Admin/Supervisor) */}
        <Route
          path="/task-approval"
          element={user && ['super_admin', 'branch_admin'].includes(user.role.name) ? (
            <Layout user={user} onLogout={handleLogout}>
              <TaskApproval user={user} />
            </Layout>
          ) : <Navigate to="/login" />}
        />

        <Route 
          path="/access-rights" 
          element={user ? <Layout user={user} onLogout={handleLogout}><AccessRightsManagement user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/branch-management" 
          element={user ? <Layout user={user} onLogout={handleLogout}><BranchManagement user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/branch-overview" 
          element={user ? <Layout user={user} onLogout={handleLogout}><BranchOverview user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="*" 
          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  )
}

// Wrapper component to extract role from URL params
function UserManagementRoute({ user }) {
  const { role } = useParams()
  const roleMap = {
    'branch_admin': { name: 'branch_admin', displayName: 'Branch Admins' },
    'accountant': { name: 'accountant', displayName: 'Accountants' },
    'employee': { name: 'employee', displayName: 'Technicians' },
    'support_staff': { name: 'support_staff', displayName: 'Support Staff' }
  }
  const roleFilter = roleMap[role] || null
  return <UserManagement user={user} roleFilter={roleFilter} />
}

export default App