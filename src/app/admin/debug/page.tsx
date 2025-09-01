"use client";
import * as React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getCurrentAdminUser } from '@/lib/adminAuth';
import { getUserRoleSync } from '@/lib/userRoles';

export default function AdminDebug() {
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [adminUser, setAdminUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [debugInfo, setDebugInfo] = React.useState<Record<string, unknown>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      const admin = getCurrentAdminUser();
      setAdminUser(admin);
      
      // Gather debug information
      const info = {
        firebaseUser: {
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          emailVerified: firebaseUser.emailVerified,
          providerData: firebaseUser.providerData
        },
        adminUser: admin ? {
          email: admin.email,
          uid: admin.uid
        } : null,
        syncRole: getUserRoleSync(firebaseUser),
        adminEmails: ['wpjackson@villageofwisdom.org', 'admin@mygeniusprofile.com'],
        isInAdminList: firebaseUser.email ? ['wpjackson@villageofwisdom.org', 'admin@mygeniusprofile.com'].includes(firebaseUser.email.toLowerCase()) : false
      };
      
      setDebugInfo(info);
    }
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Access Debug</h1>
        <p className="text-gray-600 mt-2">Diagnosing admin access issues</p>
      </div>

      {/* Firebase User Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Firebase Authentication</h2>
        
        {firebaseUser ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="text-sm text-green-600 font-medium">✅ Authenticated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <span className="text-sm text-gray-900 font-mono">{firebaseUser.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">UID:</span>
              <span className="text-sm text-gray-900 font-mono text-xs">{firebaseUser.uid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Email Verified:</span>
              <span className={`text-sm font-medium ${firebaseUser.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {firebaseUser.emailVerified ? '✅ Yes' : '⚠️ No'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-red-600 font-medium">❌ Not authenticated</p>
            <p className="text-sm text-gray-600 mt-1">Please sign in first</p>
          </div>
        )}
      </div>

      {/* Admin User Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Authentication</h2>
        
        {adminUser ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="text-sm text-green-600 font-medium">✅ Admin Authenticated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Admin Email:</span>
              <span className="text-sm text-gray-900 font-mono">{adminUser.email}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-red-600 font-medium">❌ Not admin authenticated</p>
            <p className="text-sm text-gray-600 mt-1">This is the issue!</p>
          </div>
        )}
      </div>

      {/* Role Check */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Check</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sync Role:</span>
            <span className="text-sm text-gray-900">{debugInfo.syncRole || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">In Admin List:</span>
            <span className={`text-sm font-medium ${debugInfo.isInAdminList ? 'text-green-600' : 'text-red-600'}`}>
              {debugInfo.isInAdminList ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Admin Emails:</span>
            <span className="text-sm text-gray-900 font-mono text-xs">
              {debugInfo.adminEmails?.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis</h2>
        
        {!firebaseUser ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">❌ Issue: Not Authenticated</h3>
            <p className="text-red-700 text-sm">
              You need to sign in with Firebase first. Go to the main app and sign in.
            </p>
          </div>
        ) : !adminUser ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">❌ Issue: Admin Authentication Failed</h3>
            <p className="text-red-700 text-sm">
              You're signed in with Firebase, but admin authentication failed. This usually means:
            </p>
            <ul className="text-red-700 text-sm mt-2 space-y-1">
              <li>• Your email is not in the admin list</li>
              <li>• There's a case sensitivity issue</li>
              <li>• The admin auth system isn't working</li>
            </ul>
          </div>
        ) : debugInfo.syncRole !== 'admin' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">❌ Issue: Wrong Role</h3>
            <p className="text-red-700 text-sm">
              You're authenticated but your role is '{debugInfo.syncRole}' instead of 'admin'.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-medium mb-2">✅ Everything Looks Good!</h3>
            <p className="text-green-700 text-sm">
              All systems are working correctly. You should have admin access.
            </p>
          </div>
        )}
      </div>

      {/* Solutions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-blue-800 font-medium mb-4">🔧 Solutions</h2>
        
        <div className="space-y-4 text-sm text-blue-700">
          <div>
            <h3 className="font-medium mb-2">If not authenticated:</h3>
            <ul className="space-y-1 ml-4">
              <li>• Go to the main app and sign in</li>
              <li>• Make sure Firebase is configured correctly</li>
              <li>• Check your environment variables</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">If authenticated but not admin:</h3>
            <ul className="space-y-1 ml-4">
              <li>• Check if your email is in the admin list</li>
              <li>• Verify email spelling (case sensitive)</li>
              <li>• Create Firebase user if it doesn't exist</li>
              <li>• Try logging out and back in</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">If everything looks good but still denied:</h3>
            <ul className="space-y-1 ml-4">
              <li>• Clear browser cache and cookies</li>
              <li>• Try a different browser</li>
              <li>• Check browser console for errors</li>
              <li>• Restart the development server</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-gray-800 font-medium mb-4">⚡ Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            Go to Main App
          </Link>
          <Link
            href="/admin/login"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-center"
          >
            Try Admin Login
          </Link>
          <Link
            href="/admin/test"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-center"
          >
            Admin Test Page
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
