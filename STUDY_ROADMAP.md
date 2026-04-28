# Grand Auto Tech - Complete Study Roadmap

## 📋 Project Overview
**Grand Auto Tech** is a comprehensive **Automobile Service Management System** built with:
- **Backend**: Laravel 12 + Sanctum (API authentication)
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Database**: MySQL
- **Architecture**: REST API + SPA (Single Page Application)

---

## 🎯 Phase 1: Foundation & Architecture (1-2 days)

### 1.1 Understand the Project Structure
```
grand-auto-tech/
├── backend/          (Laravel REST API)
├── frontend/         (React SPA)
└── docs/            (Documentation)
```

**Files to Read First:**
- [README.md](backend/README.md) - Backend setup
- [frontend/README.md](frontend/README.md) - Frontend setup

### 1.2 Tech Stack Overview
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Laravel 12 | REST API server |
| **Authentication** | Sanctum | Token-based auth |
| **Database** | MySQL | Data persistence |
| **Frontend** | React 19 | UI framework |
| **Build Tool** | Vite | Fast development server |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **HTTP Client** | Axios | API communication |
| **Routing** | React Router v7 | Client-side routing |

### 1.3 Key Concepts to Learn
- ✅ REST API principles
- ✅ SPA (Single Page Application) architecture
- ✅ Token-based authentication
- ✅ Component-based UI design
- ✅ MVC pattern (Models, Controllers, Views)

---

## 🔧 Phase 2: Backend Architecture Deep Dive (2-3 days)

### 2.1 Laravel Project Structure
Start here: `backend/app/`

```
app/
├── Http/
│   ├── Controllers/     👈 API endpoints
│   ├── Middleware/      👈 Request/response handling
│   └── Requests/        👈 Input validation
├── Models/              👈 Database models
├── Enums/               👈 Enumerated types
├── Traits/              👈 Reusable code
└── Providers/           👈 Application setup
```

### 2.2 Database Models to Study (In Order of Importance)
1. **User.php** - Core user model with permissions
   - Location: `app/Models/User.php`
   - Key concepts: Roles, permissions, technician_type, branch_id
   
2. **Role.php** & **Permission.php** - Permission system
   - Location: `app/Models/Role.php`, `app/Models/Permission.php`
   - Key concepts: Role-based access control (RBAC)

3. **Branch.php** - Multi-branch organization
   - Location: `app/Models/Branch.php`
   - Key concepts: Branch management, data isolation

4. **JobCard.php** - Main service record
   - Location: `app/Models/JobCard.php`
   - Related: Task.php, TaskAssignment.php

5. **Customer.php** & **Vehicle.php** - Customer management
   - Location: `app/Models/Customer.php`, `app/Models/Vehicle.php`

6. **Invoice.php**, **Payment.php** - Financial tracking
   - Location: `app/Models/Invoice.php`, `app/Models/Payment.php`

7. **Other Models**: Task, SparePartsRequest, Quotation, PettyCashFund, etc.

### 2.3 Key Controllers to Study
| Controller | Purpose | Priority |
|-----------|---------|----------|
| AuthController | Login, user info, permissions | 🔴 HIGH |
| UserController | User CRUD + permissions | 🔴 HIGH |
| JobCardController | Job card management | 🔴 HIGH |
| TaskController | Task assignment & tracking | 🟡 MEDIUM |
| InvoiceController | Invoice generation | 🟡 MEDIUM |
| CustomerController | Customer management | 🟡 MEDIUM |
| PaymentController | Payment processing | 🟡 MEDIUM |
| AccessRightsController | Permission management | 🟠 LOW |

**Study Path:**
- Start: `app/Http/Controllers/Api/AuthController.php`
- Then: `app/Http/Controllers/Api/UserController.php`
- Then: `app/Http/Controllers/Api/JobCardController.php`

### 2.4 API Routes
**File**: `routes/api.php`

Key routes to understand:
```
POST   /login                          - User authentication
GET    /me                             - Current user info
GET    /users                          - List users (with permissions check)
POST   /users                          - Create user
GET    /job-cards                      - List job cards
POST   /job-cards                      - Create job card
POST   /job-cards/{id}/tasks           - Add task to job card
POST   /tasks/{id}/assign              - Assign task to technicians
```

### 2.5 Permission System Architecture
**Key Files:**
- `database/seeders/PermissionSeeder.php` - All available permissions
- `database/seeders/RolePermissionSeeder.php` - Role-permission mapping
- `app/Models/User.php` (hasPermission method) - Permission checking

**Permission Categories:**
1. **Dashboard** - View stats, analytics
2. **Users** - Manage users by role (technicians, branch admins, etc.)
3. **Job Cards** - Create, edit, view job cards
4. **Tasks** - Task creation, assignment, approval
5. **Invoices** - Invoice generation, viewing
6. **Payments** - Payment recording and tracking
7. **Reports** - Financial and operational reports
8. **Settings** - System configuration

---

## 💻 Phase 3: Frontend Architecture Deep Dive (2-3 days)

### 3.1 React Project Structure
**Location**: `frontend/src/`

```
src/
├── api/                 👈 API communication
│   └── axios.js        - API client configuration
├── components/         👈 Reusable React components
│   ├── common/         - Shared components (Modal, Notification, etc.)
│   ├── dashboard/      - Dashboard widgets
│   ├── jobcards/       - Job card related components
│   └── Layout.jsx      - Main layout component
├── pages/              👈 Page-level components
│   ├── UserManagement.jsx
│   ├── JobCardDetail.jsx
│   ├── Dashboard.jsx
│   ├── InvoiceManagement.jsx
│   └── AccessRightsManagement.jsx
├── context/            👈 Global state management
├── App.jsx             👈 Router configuration
└── main.jsx            👈 Entry point
```

### 3.2 Key Files to Study

#### Entry Point & Routing
1. **main.jsx** - Application entry point
2. **App.jsx** - Route definitions & authentication guard
   - Understand protected routes pattern
   - Learn how permissions control page access

#### Core Pages (Study in Order)
1. **pages/Login.jsx** - Authentication
2. **components/Layout.jsx** - Main layout + sidebar navigation
3. **pages/AnalyticsDashboard.jsx** - Dashboard data visualization
4. **pages/UserManagement.jsx** - User CRUD with granular permissions
5. **pages/JobCardManagement.jsx** - Job card listing
6. **pages/JobCardDetail.jsx** - Job card detailed view
7. **components/jobcards/TaskManagement.jsx** - Task assignment & tracking

#### API Communication
- **api/axios.js** - Axios instance with token management
- How requests include authentication headers
- Error handling patterns

### 3.3 Component Architecture Pattern
Every component follows this pattern:
```jsx
function ComponentName({ user, ...props }) {
  // 1. State management with useState
  const [data, setData] = useState([])
  
  // 2. Permission checking
  const canEdit = user.role.name === 'super_admin' 
    || user.permissions.includes('edit_something')
  
  // 3. Effects for data fetching
  useEffect(() => {
    fetchData()
  }, [])
  
  // 4. API calls
  const fetchData = async () => { /* ... */ }
  
  // 5. UI rendering
  return (/* JSX */)
}
```

### 3.4 Important Patterns to Learn

#### A. Protected Routes Pattern
```jsx
// Only show if user has permission
<Route 
  path="/users" 
  element={
    user && (
      user.role.name === 'super_admin' 
      || user.permissions.includes('view_users')
    ) 
      ? <UserManagement user={user} /> 
      : <Navigate to="/not-authorized" />
  }
/>
```

#### B. Permission Checking in Components
```jsx
const canDelete = user.role.name === 'super_admin' 
  || user.permissions.includes('delete_users')

if (canDelete) {
  // Show delete button
}
```

#### C. API Communication
```jsx
const response = await axiosClient.get('/users', {
  headers: { Authorization: `Bearer ${token}` }
})
```

#### D. Form Handling with Modals
Most complex operations use modal dialogs:
- Modal state management
- Form data state
- Validation
- API submission
- Notification feedback

---

## 📊 Phase 4: Key Features & Data Flow (2-3 days)

### 4.1 Authentication Flow
```
1. User submits login form
   ↓
2. Frontend POST /login with credentials
   ↓
3. Backend validates & returns token + user data + permissions
   ↓
4. Frontend stores token in localStorage
   ↓
5. Frontend includes token in all subsequent requests
```

**Study Files:**
- Backend: `app/Http/Controllers/Api/AuthController.php`
- Frontend: `pages/Login.jsx`
- API Client: `api/axios.js`

### 4.2 Permission System Flow
```
1. User logs in
   ↓
2. Backend queries database for user's role
   ↓
3. Backend queries all permissions for that role
   ↓
4. Backend returns permissions array to frontend
   ↓
5. Frontend uses permissions array to:
   - Show/hide menu items
   - Show/hide page sections
   - Enable/disable buttons
   ↓
6. For API calls, backend ALSO checks permissions
```

**Study Files:**
- Backend: `app/Models/User.php` (hasPermission method)
- Backend: `app/Http/Controllers/Api/UserController.php` (checkReadPermission method)
- Frontend: All page components (permission checking logic)

### 4.3 Job Card Lifecycle
```
CREATE → ASSIGN → IN PROGRESS → INSPECTION → COMPLETED
  ↑                                                    ↓
  └─────────────────── CAN EDIT/DELETE ──────────────┘
```

**Key Data:**
- Status: pending, assigned, accepted, in_progress, awaiting_approval, completed
- Tasks: Add multiple tasks to a job card
- Assignments: Assign tasks to technicians
- Time Tracking: Track time spent on each task

### 4.4 User Role Hierarchy
```
1. super_admin (System administrator)
   ↓ Can manage everything
   
2. branch_admin (Branch manager)
   ↓ Can manage their branch
   
3. technician (Employee or Supervisor)
   ↓ Can view/manage their assigned tasks
   
4. accountant
   ↓ Can view invoices and payments
   
5. support_staff
   ↓ Can create job cards and manage customers
   
6. customer
   ↓ Can view their own data only
```

### 4.5 Multi-Branch Data Isolation
- Every user has `branch_id`
- Non-super-admins only see their branch's data
- Super admins can filter by branch

**Study Example:** `app/Http/Controllers/Api/UserController.php` (index method)

---

## 🗄️ Phase 5: Database Schema Understanding (1 day)

### 5.1 Key Tables
**Location**: `database/migrations/`

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| users | User accounts | id, name, email, role_id, branch_id, technician_type |
| roles | User roles | id, name, display_name |
| permissions | System permissions | id, name, module, action |
| role_permissions | Role-permission mapping | role_id, permission_id, technician_type |
| branches | Organization branches | id, name, code |
| job_cards | Service records | id, customer_id, vehicle_id, status, branch_id |
| tasks | Job card tasks | id, job_card_id, status, assigned_employees |
| task_assignments | Employee task assignments | id, task_id, user_id |
| task_time_tracking | Time tracking | id, task_id, user_id, start_time, end_time |
| invoices | Financial invoices | id, job_card_id, amount |
| payments | Payment records | id, invoice_id, amount |
| customers | Customer data | id, name, email, phone |
| vehicles | Customer vehicles | id, customer_id, make, model |

### 5.2 Key Relationships
```
User → Role → Permissions
User → Branch
User → Tasks (as assignee)
User → TaskTimeTracking

Customer → Vehicles
Customer → JobCards

JobCard → Tasks
JobCard → Invoice
JobCard → Quotation

Task → TaskAssignment
Task → TaskTimeTracking

Invoice → Payments
```

### 5.3 Data Isolation Security
- All queries filter by `branch_id` for non-super-admins
- Permissions checked at both frontend AND backend
- Users cannot see/edit data from other branches

---

## 🧪 Phase 6: Testing & Verification (1 day)

### 6.1 Manual Testing Checklist
- [ ] Login with different roles
- [ ] Verify menu items show/hide based on permissions
- [ ] Verify API calls are rejected without permission
- [ ] Create and edit various records
- [ ] Test branch filtering for non-super-admins
- [ ] Check pagination and search
- [ ] Test form validation
- [ ] Test error handling

### 6.2 Key Test Scenarios
1. **Authentication**
   - Test login with correct/incorrect credentials
   - Test token expiration
   - Test logout

2. **Permissions**
   - Login as super_admin → should see all
   - Login as branch_admin → should see only their branch
   - Login as technician → should see tasks only
   - Try to access unauthorized page → should redirect

3. **CRUD Operations**
   - Create new record
   - Read/view record
   - Update record
   - Delete record
   - Verify backend rejects unauthorized deletes

---

## 📚 Recommended Study Order

### Week 1: Foundation
- **Day 1**: Project overview + tech stack
- **Day 2**: Database schema + relationships
- **Day 3**: Backend architecture + models
- **Day 4**: Frontend architecture + components
- **Day 5**: Authentication & permission system

### Week 2: Deep Dive
- **Day 1**: User management feature
- **Day 2**: Job card management feature
- **Day 3**: Task management + time tracking
- **Day 4**: Invoice + payment system
- **Day 5**: Permissions & access control

### Week 3: Mastery
- **Day 1**: Debug existing issues
- **Day 2**: Add new features
- **Day 3**: Optimize performance
- **Day 4**: Write documentation
- **Day 5**: Code review practice

---

## 🔍 Quick Reference: How to Find Things

### "How does login work?"
1. Check: `frontend/pages/Login.jsx`
2. Then: `backend/app/Http/Controllers/Api/AuthController.php`
3. Database: `users` table + `roles` table

### "How do permissions work?"
1. Check: `database/seeders/PermissionSeeder.php`
2. Then: `database/seeders/RolePermissionSeeder.php`
3. Then: `app/Models/User.php` (hasPermission method)
4. Frontend: Any page component (canAdd, canEdit, canDelete variables)

### "How does job card creation work?"
1. Check: `frontend/pages/JobCardManagement.jsx`
2. Then: `backend/app/Http/Controllers/Api/JobCardController.php` (store method)
3. Database: `job_cards`, `tasks`, `task_assignments` tables

### "How are tasks assigned?"
1. Check: `frontend/components/jobcards/TaskManagement.jsx`
2. Then: `backend/app/Http/Controllers/Api/TaskController.php` (assign method)
3. Database: `tasks`, `task_assignments` tables

### "How do I add a new permission?"
1. Add to: `database/seeders/PermissionSeeder.php`
2. Grant to roles: `database/seeders/RolePermissionSeeder.php`
3. Check in component: `user.permissions.includes('new_permission')`
4. Check in controller: `$this->checkReadPermission($user, 'new_permission')`
5. Run: `php artisan db:seed --class=PermissionSeeder`

---

## 💡 Key Insights & Patterns

### 1. Permission Checking Happens Twice
- **Frontend**: Guards routes and shows/hides UI elements
- **Backend**: Validates API requests (CRITICAL for security)

### 2. Branch Filtering is Automatic
- Non-super-admins' queries automatically filtered by `branch_id`
- Prevents accidental data leakage

### 3. Modal-Driven UI
- Complex operations use modal dialogs
- Keeps page state clean
- Better UX for forms

### 4. Token-Based Auth
- Token stored in localStorage
- Included in all API requests
- Backend validates token + checks permissions

### 5. Component Reusability
- Common components: `Notification`, `ConfirmDialog`, `Modal`
- Used across all pages
- Consistent UX

---

## 🎓 Learning Resources

### Videos to Watch
- Laravel REST API fundamentals
- React hooks & state management
- JWT/Token authentication
- Permission systems & RBAC

### Documentation to Read
- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)

### Code to Review
- All files in `backend/app/Http/Controllers/Api/`
- All files in `frontend/src/pages/`
- All files in `frontend/src/components/`

---

## 🚀 Next Steps

1. **Start with setup**:
   ```bash
   # Backend
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   
   # Frontend
   cd frontend
   npm install
   npm run dev
   ```

2. **Login and explore**:
   - Try different user roles
   - Observe what changes
   - Read the code for each page

3. **Make small changes**:
   - Modify button colors (you just did this!)
   - Add new validation rules
   - Change error messages

4. **Debug issues**:
   - Use browser DevTools
   - Check Laravel logs: `storage/logs/`
   - Use `php artisan tinker` for database queries

---

**Last Updated:** April 27, 2026  
**Status:** Ready for study! 🎉
