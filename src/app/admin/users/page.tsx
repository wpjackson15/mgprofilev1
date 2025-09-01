"use client";
import * as React from 'react';
import { getAllUserRoles, setUserRole, deleteUserRole, UserRoleRecord } from '@/lib/userRoleManager';
import { canChangeUserRoles } from '@/lib/userRoleManager';
import { getCurrentAdminUser } from '@/lib/adminAuth';
import { UserRole, getRoleDisplayName, getRoleBadgeColor } from '@/lib/userRoles';
import { Shield, UserPlus, Trash2, Edit, Save, X } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = React.useState<UserRoleRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<string | null>(null);
  const [newRole, setNewRole] = React.useState<UserRole>('basic');
  const [notes, setNotes] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userRoles = await getAllUserRoles();
      setUsers(userRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (email: string, currentRole: UserRole, currentNotes?: string) => {
    setEditingUser(email);
    setNewRole(currentRole);
    setNotes(currentNotes || '');
  };

  const handleSaveUser = async (email: string) => {
    try {
      const adminUser = getCurrentAdminUser();
      const success = await setUserRole(
        email, 
        newRole, 
        adminUser?.email || 'unknown',
        notes
      );

      if (success) {
        setMessage('User role updated successfully!');
        setEditingUser(null);
        setNewRole('basic');
        setNotes('');
        loadUsers(); // Refresh the list
      } else {
        setMessage('Error updating user role');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage('Error updating user role');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to delete the role for ${email}?`)) {
      return;
    }

    try {
      await deleteUserRole(email);
      setMessage('User role deleted successfully!');
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user role');
    }
  };

  const handleAddUser = async () => {
    const email = prompt('Enter email address:');
    if (!email) return;

    try {
      const adminUser = getCurrentAdminUser();
      const success = await setUserRole(
        email, 
        newRole, 
        adminUser?.email || 'unknown',
        notes
      );

      if (success) {
        setMessage('User added successfully!');
        setNewRole('basic');
        setNotes('');
        loadUsers(); // Refresh the list
      } else {
        setMessage('Error adding user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage('Error adding user');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Role Management</h1>
        <button
          onClick={handleAddUser}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Roles</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage user roles and permissions. Changes take effect immediately.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.email}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.email ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="admin">Administrator</option>
                        <option value="premium">Premium User</option>
                        <option value="basic">Basic User</option>
                        <option value="guest">Guest</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.assignedBy || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingUser === user.email ? (
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full"
                        placeholder="Add notes..."
                      />
                    ) : (
                      <span className="truncate max-w-xs block">
                        {user.notes || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUser === user.email ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveUser(user.email)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user.email, user.role, user.notes)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.email)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No custom user roles found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Users will use default roles based on their email addresses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
