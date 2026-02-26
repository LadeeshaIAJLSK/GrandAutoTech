// Example: How Frontend Should Handle New Authorization Logic
// Place this in your api/ folder for reference

/**
 * USER API CALLS - With New Authorization Handling
 */

// ============================================
// GET ALL USERS (with branch filtering)
// ============================================
const fetchUsers = async (searchTerm = '') => {
  try {
    const response = await fetch(
      `/api/users?search=${searchTerm}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 403) {
      // User doesn't have view_users permission in their branch
      showError('You do not have permission to view users');
      return [];
    }

    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// ============================================
// GET SINGLE USER (with branch check)
// ============================================
const fetchSingleUser = async (userId) => {
  try {
    const response = await fetch(
      `/api/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 403) {
      const data = await response.json();
      if (data.message.includes('your assigned branch')) {
        showError('This user is from a different branch. You can only access users from your branch.');
      } else {
        showError('You do not have permission to view users');
      }
      return null;
    }

    if (!response.ok) throw new Error('Failed to fetch user');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// ============================================
// CREATE USER (branch-locked for branch admins)
// ============================================
const createUser = async (userData) => {
  try {
    // Fort branch admins, remove ability to change branch
    const payload = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      employee_code: userData.employee_code,
      password: userData.password,
      role_id: userData.role_id,
      branch_id: userData.branch_id, // Backend will override for branch_admin
      is_active: userData.is_active || true
    };

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 403) {
      const data = await response.json();
      showError(`Unable to create user: ${data.message}`);
      return null;
    }

    if (!response.ok) {
      const errors = await response.json();
      showError(`Validation error: ${JSON.stringify(errors)}`);
      return null;
    }

    showSuccess('User created successfully');
    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// ============================================
// UPDATE USER (branch check + no branch change)
// ============================================
const updateUser = async (userId, userData) => {
  try {
    // Don't send branch_id if user is branch_admin (backend will reject it)
    const payload = { ...userData };
    // Backend will strip branch_id for branch_admins
    
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 403) {
      const data = await response.json();
      if (data.message.includes('your assigned branch')) {
        showError('You can only edit users from your own branch');
      } else {
        showError('You do not have permission to edit users');
      }
      return null;
    }

    if (!response.ok) {
      const errors = await response.json();
      showError(`Validation error: ${JSON.stringify(errors)}`);
      return null;
    }

    showSuccess('User updated successfully');
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

// ============================================
// DELETE USER (with self-delete prevention)
// ============================================
const deleteUser = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 400) {
      // Cannot delete yourself
      showError('You cannot delete your own account');
      return false;
    }

    if (response.status === 403) {
      const data = await response.json();
      if (data.message.includes('your assigned branch')) {
        showError('You can only delete users from your own branch');
      } else {
        showError('You do not have permission to delete users');
      }
      return false;
    }

    if (!response.ok) throw new Error('Failed to delete user');

    showSuccess('User deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// ============================================
// PERMISSION-BASED UI RENDERING
// ============================================
const CanAccessUserData = ({ user, permission, children }) => {
  // user.role could be: 'super_admin', 'branch_admin', 'manager', etc.
  
  const hasPermission = () => {
    if (user.role === 'super_admin') return true;
    
    // For all other roles, check if it's a branch-specific permission
    // This should ideally come from backend auth token claims
    // For now, check against route permissions
    return checkUserPermission(user, permission);
  };

  return hasPermission() ? children : null;
};

// ============================================
// BRANCH CONTEXT DISPLAY
// ============================================
const UserManagementPage = ({ currentUser }) => {
  return (
    <div>
      <div className="branch-header">
        <h2>User Management</h2>
        <p className="branch-info">
          Branch: <strong>{currentUser.branch.name}</strong>
          {currentUser.role === 'branch_admin' && 
            <span className="badge"> (Branch Admin)</span>
          }
        </p>
      </div>

      {/* Only show create button if user has add_users permission */}
      <CanAccessUserData user={currentUser} permission="add_users">
        <button onClick={() => openCreateUserModal()}>
          Add User to {currentUser.branch.name}
        </button>
      </CanAccessUserData>

      {/* User list will auto-filter to user's branch via API */}
      <UserList branch={currentUser.branch} />
    </div>
  );
};

// Export all functions
export {
  fetchUsers,
  fetchSingleUser,
  createUser,
  updateUser,
  deleteUser,
  CanAccessUserData,
  UserManagementPage
};
