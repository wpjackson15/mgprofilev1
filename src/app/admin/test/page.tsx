"use client";
import * as React from 'react';
import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/adminAuth';
import { getUserRole } from '@/lib/userRoles';
import UserRoleBadge from '@/components/UserRoleBadge';

export default function AdminTest() {
  const [adminUser, setAdminUser] = React.useState(getCurrentAdminUser());
  const [userRole, setUserRole] = React.useState<string>('Loading...');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function checkAdminStatus() {
      if (adminUser) {
        try {
          const role = await getUserRole(adminUser);
          setUserRole(role);
        } catch (error) {
          setUserRole('Error loading role');
        }
      } else {
        setUserRole('No admin user found');
      }
      setLoading(false);
    }

    checkAdminStatus();
  }, [adminUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Setup Test</h1>
        <p className="text-gray-600 mt-2">Verify your admin configuration</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Status</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Admin User:</span>
            <span className="text-sm text-gray-900">
              {adminUser ? adminUser.email : 'Not logged in'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">User Role:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900">{userRole}</span>
              {adminUser && <UserRoleBadge user={adminUser} size="sm" />}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Admin Access:</span>
            <span className={`text-sm font-medium ${
              userRole === 'admin' ? 'text-green-600' : 'text-red-600'
            }`}>
              {userRole === 'admin' ? '✅ Granted' : '❌ Denied'}
            </span>
          </div>
        </div>
      </div>

      {userRole === 'admin' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-medium mb-2">✅ Admin Setup Successful!</h3>
          <p className="text-green-700 text-sm">
            You have full admin access. You can now:
          </p>
          <ul className="text-green-700 text-sm mt-2 space-y-1">
            <li>• Access the admin dashboard</li>
            <li>• Manage reference documents</li>
            <li>• Manage user roles</li>
            <li>• View system analytics</li>
          </ul>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">❌ Admin Setup Issue</h3>
          <p className="text-red-700 text-sm">
            You don't have admin access. Please check:
          </p>
          <ul className="text-red-700 text-sm mt-2 space-y-1">
            <li>• Your email is in the ADMIN_EMAILS array</li>
            <li>• You're logged in with the correct account</li>
            <li>• Firebase user exists and is active</li>
            <li>• No typos in your email address</li>
          </ul>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium mb-2">🔧 Next Steps</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>If admin access is working:</p>
          <ul className="space-y-1 ml-4">
            <li>• Go to <a href="/admin" className="underline">Admin Dashboard</Link></li>
            <li>• Upload reference documents</li>
            <li>• Manage user roles</li>
          </ul>
          <p className="mt-3">If admin access is not working:</p>
          <ul className="space-y-1 ml-4">
            <li>• Check Firebase Console for user account</li>
            <li>• Verify email spelling in code</li>
            <li>• Try logging out and back in</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
