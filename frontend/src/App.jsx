import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Login from './pages/Login'
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard'
import UserManagement from './pages/UserManagement'
import CustomerManagement from './pages/CustomerManagement'
import JobCardManagement from './pages/JobCardManagement'
import JobCardDetail from './pages/JobCardDetail'
import QuotationManagement from './pages/QuotationManagement'
import InvoiceManagement from './pages/InvoiceManagement'
import InvoiceDetail from './pages/InvoiceDetail'
import InvoicePrint from './pages/InvoicePrint'
import FinancialReports from './pages/FinancialReports'
import PettyCashManagement from './pages/PettyCashManagement'
import AccessRightsManagement from './pages/AccessRightsManagement'
import BranchManagement from './pages/BranchManagement'
import BranchOverview from './pages/BranchOverview'
import ThirdPartyServiceManagement from './pages/ThirdPartyServiceManagement'
import Settings from './pages/Settings'
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
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_job_cards_tab')) ? <Layout user={user} onLogout={handleLogout}><JobCardManagement user={user} /></Layout> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/job-cards/:id" 
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_job_cards_tab')) ? <Layout user={user} onLogout={handleLogout}><JobCardDetail user={user} /></Layout> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/quotations" 
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_quotations_tab')) ? <Layout user={user} onLogout={handleLogout}><QuotationManagement user={user} /></Layout> : <Navigate to="/dashboard" />} 
        />
        
        <Route 
          path="/invoices" 
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_invoices_tab')) ? (
            <Layout user={user} onLogout={handleLogout}><InvoiceManagement user={user} /></Layout>
          ) : (
            user ? <Navigate to="/" /> : <Navigate to="/login" />
          )} 
        />

        <Route 
          path="/invoice/:jobCardId" 
          element={user ? <Layout user={user} onLogout={handleLogout}><InvoiceDetail user={user} /></Layout> : <Navigate to="/login" />} 
        />

        <Route 
          path="/invoice-print/:jobCardId" 
          element={user ? <Layout user={user} onLogout={handleLogout}><InvoicePrint user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/reports" 
          element={user ? <Layout user={user} onLogout={handleLogout}><FinancialReports user={user} /></Layout> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/petty-cash" 
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_petty_cash_tab')) ? (
            <Layout user={user} onLogout={handleLogout}><PettyCashManagement user={user} /></Layout>
          ) : (
            user ? <Navigate to="/" /> : <Navigate to="/login" />
          )} 
        />

        {/* My Tasks (Super Admin & Technicians with view_my_tasks_tab permission) */}
        <Route
          path="/my-tasks"
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_my_tasks_tab')) ? (
            <Layout user={user} onLogout={handleLogout}>
              <MyTasks user={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />}
        />

        {/* Task Approval (Super Admin & users with view_task_approval_tab permission) */}
        <Route
          path="/task-approval"
          element={user && (user.role.name === 'super_admin' || user.permissions.includes('view_task_approval_tab')) ? (
            <Layout user={user} onLogout={handleLogout}>
              <TaskApproval user={user} />
            </Layout>
          ) : <Navigate to="/dashboard" />}
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
          path="/settings" 
          element={user && user.role.name === 'super_admin' ? <Layout user={user} onLogout={handleLogout}><Settings /></Layout> : <Navigate to="/dashboard" />} 
        />

        <Route 
          path="/third-party-services" 
          element={user ? <Layout user={user} onLogout={handleLogout}><ThirdPartyServiceManagement user={user} /></Layout> : <Navigate to="/login" />} 
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
    'employee': { name: 'technician', displayName: 'Technicians' },
    'support_staff': { name: 'support_staff', displayName: 'Support Staff' }
  }
  const roleFilter = roleMap[role] || null
  return <UserManagement user={user} roleFilter={roleFilter} />
}

export default App