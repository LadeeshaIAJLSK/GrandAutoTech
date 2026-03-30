# Granular User Management Permissions - Testing Guide

## Overview
Granular permissions for the Users management section have been successfully implemented. Users can now have fine-grained control over which user role tabs they can view and what actions (add/edit/delete) they can perform on each tab.

## Implementation Summary

### Backend (Already Complete)
✅ 30 new permissions created in the Permission seeder table
✅ All roles updated with appropriate permissions via RolePermissionSeeder
✅ Permissions are properly filtered by role and technician_type

### Frontend Changes

#### 1. Layout.jsx - Tab Visibility
**Location**: `frontend/src/components/Layout.jsx` (lines 207-228)
**Change**: Each user role tab under Users menu now has conditional rendering based on permissions:
- All Users → requires `view_all_users`
- Branch Admins → requires `view_branch_admins`
- Accountants → requires `view_accountants`
- Technicians → requires `view_technicians`
- Support Staff → requires `view_support_staff`

#### 2. UserManagement.jsx - Granular Action Permissions
**Location**: `frontend/src/pages/UserManagement.jsx`
**Changes**:
- Added `authUser` state to track user permissions in real-time
- Created `hasPermission()` helper function
- Created `getPermissionName()` to map actions to granular permission names
- Updated permission checks:
  - `canAdd`: Checks `add_[role]` permission for current tab
  - `canUpdate`: Checks `edit_[role]` permission for current tab
  - `canDelete`: Checks `delete_[role]` permission for current tab
  - `canView`: Checks `view_[role]` permission for current tab
- Added event listener for real-time permission updates

## Permission Names Reference

### All Users Tab
- `view_all_users` - View All Users tab
- `add_all_users` - Add new users
- `edit_all_users` - Edit users
- `delete_all_users` - Delete users

### Branch Admins Tab
- `view_branch_admins` - View Branch Admins tab
- `add_branch_admins` - Add Branch Admins
- `edit_branch_admins` - Edit Branch Admins
- `delete_branch_admins` - Delete Branch Admins

### Accountants Tab
- `view_accountants` - View Accountants tab
- `add_accountants` - Add Accountants
- `edit_accountants` - Edit Accountants
- `delete_accountants` - Delete Accountants

### Technicians Tab
- `view_technicians` - View Technicians tab
- `add_technicians` - Add Technicians
- `edit_technicians` - Edit Technicians
- `delete_technicians` - Delete Technicians

### Support Staff Tab
- `view_support_staff` - View Support Staff tab
- `add_support_staff` - Add Support Staff
- `edit_support_staff` - Edit Support Staff
- `delete_support_staff` - Delete Support Staff

## Testing Scenarios

### Test 1: Hide Tab Based on View Permission
**Steps**:
1. Go to Access Rights Management
2. Find a role (e.g., Accountant)
3. Uncheck the `view_technicians` permission
4. Save permissions
5. Log in as an Accountant user (or refresh if same user)
6. Go to Users menu in sidebar

**Expected Result**:
- Technicians tab should NOT appear in the Users submenu
- Only visible tabs should be those where the role has `view_` permissions

### Test 2: Restrict Actions While Allowing View
**Steps**:
1. Go to Access Rights Management
2. Find a role (e.g., Support Staff)
3. Make sure they have `view_technicians` permission
4. Remove `edit_technicians` and `delete_technicians` permissions
5. Keep `add_technicians` permission enabled
6. Save permissions
7. Go to Users > Technicians tab as a Support Staff user

**Expected Result**:
- Technicians tab is visible
- "Add" button is enabled
- "Edit" button is disabled/hidden for all users
- "Delete" button is disabled/hidden for all users
- "View Details" button is available
- Action menu (three dots) on each row is visible only for View and Add

### Test 3: No Access Scenario
**Steps**:
1. Go to Access Rights Management
2. Find a role and remove all user management permissions
3. Save permissions
4. Try to access Users section

**Expected Result**:
- Users menu item should still appear (if `view_users` permission is present)
- When clicked, no tabs should be visible
- OR if `view_users` is also removed, the entire Users submenu disappears

### Test 4: Real-Time Permission Updates
**Steps**:
1. Open two browser tabs: one in Access Rights Management, one in Users management
2. In Tab 1 (Access Rights Management): Modify a role's permissions
3. Save permissions
4. Look at Tab 2 (Users management)

**Expected Result**:
- Tabs and action buttons update immediately without page refresh
- Permission changes are visible in real-time

### Test 5: Super Admin Access
**Steps**:
1. Log in as Super Admin
2. Go to Access Rights Management
3. Verify all permissions are available to assign
4. Go to Users section

**Expected Result**:
- All tabs visible regardless of permission settings
- All action buttons (Add, Edit, View, Delete) always enabled for Super Admin
- Super Admin bypass system works correctly

## Permission Assignment Examples

### Example 1: Support Staff Should Only View Technicians
**Grant these permissions to Support Staff role**:
- ✓ `view_technicians` - Let them see Technician tab
- ✗ `add_technicians` - Cannot add technicians
- ✗ `edit_technicians` - Cannot edit technicians
- ✗ `delete_technicians` - Cannot delete technicians

**Also grant** (for other tabs they need):
- ✓ `view_all_users` - Can see All Users tab
- ✓ `view_support_staff` - Can see Support Staff tab
- etc.

**Result**: Support Staff can view Technician details but cannot modify them; they can also view All Users but actions are restricted by their permissions on those tabs.

### Example 2: Branch Admin - Full Control on Technicians, View-Only on Rest
**Grant these permissions to Branch Admin role**:
- ✓ `view_technicians`, `add_technicians`, `edit_technicians`, `delete_technicians` - Full control
- ✓ `view_all_users` - Can see and manage other roles
- ✓ `add_all_users`, `edit_all_users`, `delete_all_users` - Full CRUD
- ✓ `view_branch_admins`, `add_branch_admins`, `edit_branch_admins`, `delete_branch_admins` - Full control
- etc.

**Result**: Branch Admin has granular, specific permissions per tab and action.

## Browser Testing
1. **Test in Chrome** - Verify all permission checks work
2. **Test in Firefox** - Verify event listeners work across browsers
3. **Test with localStorage disabled** - Verify graceful fallback
4. **Test with rapid permission changes** - Verify state updates correctly

## Troubleshooting

### Tabs not showing when they should be visible
- Verify permissions are correctly assigned in Role Permissions (RolePermissionSeeder)
- Check browser console for errors
- Clear browser cache and localStorage
- Verify `user.permissions` array contains the correct permission names

### Action buttons not updating after permission change
- Verify `userPermissionsUpdated` event is being dispatched by AccessRightsManagement
- Check browser console for JavaScript errors
- Verify event listener is registered in UserManagement component

### Super Admin not seeing all tabs
- Verify `user.role.name === 'super_admin'` check is working
- Check if user object is properly loaded from localStorage

## Database Verification

Run these queries to verify permissions exist in database:

```sql
-- Check all user management permissions exist
SELECT * FROM permissions WHERE module = 'users' ORDER BY name;

-- Verify permissions assigned to roles
SELECT rp.*, r.display_name as role_name, p.display_name as permission_name 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.module = 'users'
ORDER BY r.display_name, p.name;

-- Check a specific role's permissions
SELECT r.display_name as role_name, p.name as permission_name 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'accountant' AND p.module = 'users'
ORDER BY p.name;
```

## Files Modified
1. `frontend/src/components/Layout.jsx` - Added tab visibility conditions
2. `frontend/src/pages/UserManagement.jsx` - Added granular permission checks and real-time updates
3. `backend/database/seeders/PermissionSeeder.php` - Already has 30 permissions
4. `backend/database/seeders/RolePermissionSeeder.php` - Already has role assignments

## Rollback (if needed)
All changes are in the frontend only. To revert:
1. Restore `Layout.jsx` to version without permission checks
2. Restore `UserManagement.jsx` to version without granular permissions
3. Backend database changes are additive and don't break existing functionality
