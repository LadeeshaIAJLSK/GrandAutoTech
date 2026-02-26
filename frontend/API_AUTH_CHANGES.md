# API Authorization Changes - User Controller

## Summary
The UserController now enforces **branch-specific permissions and role-based access control**. All users except Super Admin are restricted to their assigned branch.

---

## Key Changes

### 1. **Permission + Branch Checking**
All endpoints now validate:
- ✅ Does the user have the required permission?
- ✅ Is the permission available in their branch?
- ✅ Are they trying to access data from their assigned branch?

### 2. **Who Can Access What?**

| Role | Can View Users | Can Add Users | Can Edit Users | Can Delete Users |
|------|---|---|---|---|
| **Super Admin** | ✅ All branches | ✅ All branches | ✅ All branches | ✅ All branches |
| **Branch Admin (Kandy)** | ✅ Kandy only | ✅ Kandy only | ✅ Kandy only | ✅ Kandy only |
| **Branch Admin (Colombo)** | ✅ Colombo only | ✅ Colombo only | ✅ Colombo only | ✅ Colombo only |
| **Manager (Branch-specific)** | Depends on branch permissions | Depends on branch permissions | Depends on branch permissions | Depends on branch permissions |

---

## API Responses

### Success Response (200-201)
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": { "id": 2, "name": "branch_admin" },
    "branch": { "id": 1, "name": "Kandy" }
  }
}
```

### Permission Denied (403)
```json
{
  "message": "Unauthorized - Permission denied in your branch"
}
```
**When:** User doesn't have the permission in their branch

### Branch Access Denied (403)
```json
{
  "message": "Unauthorized - You can only access data from your assigned branch"
}
```
**When:** User tries to access data from a different branch

### Invalid Role (403)
```json
{
  "message": "Unauthorized - Invalid role"
}
```
**When:** User has an unrecognized role (only super_admin and branch_admin are valid, others inherit branch checks)

### Cannot Delete Self (400)
```json
{
  "message": "Cannot delete yourself"
}
```
**When:** User tries to delete their own account

---

## Endpoints Affected

### 1. **GET /api/users** - List All Users
- **New Behavior:** Returns only users from the authenticated user's branch (if not super_admin)
- **Required Permission:** `view_users` (branch-specific)
- **Possible Error Codes:** 403

### 2. **GET /api/users/{id}** - Get Single User
- **New Behavior:** Can only view users from same branch
- **Required Permission:** `view_users` (branch-specific)
- **Possible Error Codes:** 403

### 3. **POST /api/users** - Create User
- **New Behavior:** Can only create users in own branch
- **Required Permission:** `add_users` (branch-specific)
- **Note:** `branch_id` field is automatically set to user's branch for branch_admins
- **Possible Error Codes:** 403

### 4. **PUT /api/users/{id}** - Update User
- **New Behavior:** Can only update users from same branch; branch_id cannot be changed by branch_admins
- **Required Permission:** `update_users` (branch-specific)
- **Possible Error Codes:** 403

### 5. **DELETE /api/users/{id}** - Delete User
- **New Behavior:** Can only delete users from same branch; cannot delete self
- **Required Permission:** `delete_users` (branch-specific)
- **Possible Error Codes:** 400, 403

---

## Frontend Implementation Guide

### 1. **Handle 403 Errors**
```javascript
// Catch unauthorized errors
if (response.status === 403) {
  if (response.data.message.includes('Permission denied')) {
    // Show: "You don't have permission to do this"
  } else if (response.data.message.includes('your assigned branch')) {
    // Show: "You can only access data from your branch"
  }
}
```

### 2. **Filter UI Based on User Role**
```javascript
const canViewUsers = user.role === 'super_admin' || 
                      user.role === 'branch_admin';
const canAddUsers = user.role === 'super_admin' || 
                     user.role === 'branch_admin';
```

### 3. **Show Branch Context**
```javascript
// Always display user's current branch
<div>You are viewing: <strong>{currentUser.branch.name}</strong></div>

// When listing users, show they belong to this branch
{users.map(user => (
  <div key={user.id}>
    {user.name} - {user.branch.name}
  </div>
))}
```

### 4. **Prevent Cross-Branch Actions**
- Don't allow user to select a different branch when creating/editing users (for branch_admins)
- Filter branch dropdown to only show current user's branch

### 5. **Error Messages to Display**
```javascript
const errorMessages = {
  'Permission denied in your branch': 'You don't have permission for this action in your branch',
  'your assigned branch': 'You can only access data from your assigned branch',
  'Cannot delete yourself': 'You cannot delete your own account',
  'Invalid role': 'Invalid user role - contact administrator'
};
```

---

## Database Notes

### Permissions Table Structure
```
permissions
├── id
├── name (e.g., 'view_users', 'add_users')
└── ...

role_permissions
├── id
├── role_id
├── permission_id
├── branch_id  ← KEY CHANGE: Now branch-specific!
└── ...
```

**Important:** Make sure your `role_permissions` table has a `branch_id` column to support branch-specific permissions.

---

## Testing Checklist

- [ ] Super Admin can view all users from all branches
- [ ] Branch Admin (Kandy) can only view Kandy users
- [ ] Branch Admin (Kandy) cannot view Colombo users (403)
- [ ] Branch Admin cannot create users in other branches
- [ ] Branch Admin cannot edit their branch_id field
- [ ] Staff with limited permissions get 403 if they lack permission
- [ ] Users cannot delete themselves
- [ ] Permission errors show proper messages

---

## Questions for Backend?
- Verify `role_permissions` table has `branch_id` column
- Check if all role-branch-permission combinations are seeded
- Confirm Super Admin permissions work globally

