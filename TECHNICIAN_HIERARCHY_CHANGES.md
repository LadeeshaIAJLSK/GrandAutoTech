# Technician Role Hierarchy Implementation - Change Summary

## Overview
Successfully implemented a two-tier technician system where technicians can be either **Employee** or **Supervisor** types, each with separate access rights and permissions.

## Database Changes

### 1. New Migration: `2026_03_06_000000_add_technician_type_to_users_table.php`
- Added `technician_type` enum column to `users` table
- Values: `'employee'`, `'supervisor'`, or `null` (for non-technicians)
- Only applicable when user's role is "technician"

### 2. New Migration: `2026_03_06_000001_add_technician_type_to_role_permissions_table.php`
- Added `technician_type` enum column to `role_permissions` table
- Allows different permissions for technician employees vs supervisors
- Separates the unique constraint to include technician_type

## Backend Changes

### 1. Model Updates

**User Model** (`app/Models/User.php`)
- Added `'technician_type'` to `$fillable` array

**Role Model** (`app/Models/Role.php`)
- Updated `permissions()` relationship to include `'technician_type'` in `withPivot()`

### 2. UserController (`app/Http/Controllers/Api/UserController.php`)

**store() method:**
- Added validation for `technician_type` (nullable, accepts 'employee' or 'supervisor')
- Validates that `technician_type` is REQUIRED when creating a technician user
- Sets `technician_type` to null for non-technician roles

**update() method:**
- Similar validation for updating technician_type
- Ensures technician_type is only set for technician role
- Clears technician_type when changing to a non-technician role

**checkReadPermission() method:**
- Updated to filter permissions by user's `technician_type`
- Only returns permissions that apply to the user's technician type or have no type restriction

**checkWritePermission() method:**
- Updated to filter permissions by user's `technician_type`
- Ensures users can only perform actions their technician type allows

### 3. AccessRightsController (`app/Http/Controllers/Api/AccessRightsController.php`)

**getAllRolesWithPermissions() method:**
- For technician role, separates permissions into:
  - `permissions_employee`: Permissions for employee technicians
  - `permissions_supervisor`: Permissions for supervisor technicians
- Returns `is_technician: true` flag for technician role

**updateRolePermissions() method:**
- For technician role, expects separate `employee_permissions` and `supervisor_permissions` arrays
- For other roles, works with `permission_ids` as before
- Stores permissions with appropriate `technician_type`

## Frontend Changes

### 1. UserManagement.jsx

**Form Data:**
- Added `technician_type: ''` to form state

**openAddModal():**
- Initializes `technician_type: ''`

**openEditModal():**
- Loads existing `technician_type` from user data

**Form Submission:**
- Includes `technician_type` in both FormData (with image) and JSON submissions
- Conditionally includes the field only if not empty

**Form UI:**
- Added conditional field that shows when role is "technician"
- Dropdown with options: "Employee" and "Supervisor"
- Displays helpful description: "Employee technician can perform basic tasks. Supervisor can approve tasks and manage employees."
- Field is required when technician role is selected
- Clears technician_type when switching away from technician role

### 2. AccessRightsManagement.jsx

**State Management:**
- Added separate state for `employeePermissions` and `supervisorPermissions`
- Added `technicianType` state to track current view ('employee' or 'supervisor')

**selectRole() method:**
- For technician roles, separates permissions into employee and supervisor sets
- For other roles, works as before

**switchTechnicianType() method:**
- Allows switching between employee and supervisor tabs
- Updates `selectedPermissions` based on selected technician type

**Permission Toggle Methods:**
- Updated to maintain separate permission lists for employee and supervisor
- synchrionizes updates with appropriate type

**savePermissions() method:**
- For technician role: Sends separate `employee_permissions` and `supervisor_permissions` arrays
- For other roles: Sends `permission_ids` array as before

**UI Changes:**
- Added tabs for "Employee Technician" and "Supervisor Technician" when technician role is selected
- Tabs appear only for technician role
- Each tab shows/edits permissions for that technician type separately
- Updated warning banner to explain employee vs supervisor distinction

## How to Use

### Creating a Technician User:
1. Go to User Management
2. Click "Add User"
3. Fill in basic information
4. Select "Technician" from Role dropdown
5. **NEW:** A "Technician Type" field appears
6. Choose "Employee" or "Supervisor"
7. Save user

### Setting Up Technician Permissions:
1. Go to Access Rights Management
2. Select "Technician" role from sidebar
3. **NEW:** Two tabs appear: "Employee Technician" and "Supervisor Technician"
4. Select the tab for which you want to configure permissions
5. Toggle permissions for that type
6. Switch to other tab and configure its permissions
7. Save (saves both employee and supervisor permissions together)

### Permission Hierarchy:
- **Employee Technician:** Typically can view and execute tasks, add spare parts requests, etc.
- **Supervisor Technician:** Can do everything an employee can, plus approve tasks, manage other employees, etc.
- Each type has completely separate permission sets configured in Access Rights

## API Endpoints Affected

- `POST /users` - Now accepts `technician_type`
- `PUT /users/{id}` - Now accepts `technician_type`
- `GET /access-rights/roles` - Returns separated permissions for technician role
- `PUT /access-rights/roles/{id}` - Expects different format for technician role

## Testing Checklist

- [ ] Run migrations: `php artisan migrate`
- [ ] Create a technician employee user via frontend
- [ ] Create a technician supervisor user via frontend
- [ ] Try to create technician without selecting type (should fail)
- [ ] Try to create non-technician with technician_type (should be cleared)
- [ ] Go to Access Rights Management
- [ ] Select Technician role - verify tabs appear
- [ ] Switch between tabs - verify permissions stay separate
- [ ] Assign different permissions to employee and supervisor
- [ ] Create test users and verify permission enforcement
- [ ] Login as employee technician - verify they only see their permissions
- [ ] Login as supervisor technician - verify they see their permissions

## Database Backup Recommendation

Run backup before applying migrations:
```bash
mysqldump -u [user] -p [database] > backup_before_technician_hierarchy.sql
```

## Notes

- Technician_type is nullable and only applies to users with technician role
- When checking permissions, the system automatically filters by technician_type
- The permission system is backward compatible - existing users without technician_type will have full access if role is technician
- To be safe, set all technician users to either 'employee' or 'supervisor' type after migration
