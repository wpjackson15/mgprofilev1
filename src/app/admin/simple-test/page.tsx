"use client";
import * as React from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserRoleSync } from '@/lib/userRoles';

export default function SimpleAdminTest() {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<string>('Loading...');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userRole = getUserRoleSync(firebaseUser);
          setRole(userRole);
        } catch (error) {
          console.error('Error getting role:', error);
          setRole('Error');
        }
      } else {
        setRole('Not signed in');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Simple Admin Test
          </h1>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">User Status</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Signed In:</strong> {user ? 'Yes' : 'No'}</p>
                {user && (
                  <>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> <span className="font-mono">{role}</span></p>
                  </>
                )}
              </div>
            </div>

            {role === 'admin' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-medium mb-2">✅ Admin Access Granted!</h3>
                <p className="text-green-700 text-sm">
                  You have admin privileges. You can now access the admin panel.
                </p>
                <div className="mt-4">
                  <a
                    href="/admin"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-center block"
                  >
                    Go to Admin Dashboard
                  </a>
                </div>
              </div>
            ) : user ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium mb-2">❌ Not Admin</h3>
                <p className="text-red-700 text-sm">
                  You're signed in but don't have admin privileges. Your role is: {role}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-yellow-800 font-medium mb-2">⚠️ Not Signed In</h3>
                <p className="text-yellow-700 text-sm">
                  Please sign in first to test admin access.
                </p>
                <div className="mt-4">
                  <a
                    href="/firebase-test"
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-center block"
                  >
                    Go to Firebase Test
                  </a>
                </div>
              </div>
            )}

            <div className="text-center">
              <a
                href="/admin/login"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Try Admin Login →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
