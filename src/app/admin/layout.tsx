"use client";
import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, FileText, Filter, TestTube, BookOpen, Database, Users, LogOut } from 'lucide-react';
import { onAdminAuthStateChanged, signOutAdmin, getCurrentAdminUser } from '@/lib/adminAuth';
import UserRoleBadge from '@/components/UserRoleBadge';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminUser, setAdminUser] = React.useState(getCurrentAdminUser());
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const unsubscribe = onAdminAuthStateChanged((user) => {
      setAdminUser(user);
      setLoading(false);
      
      // Redirect to login if not authenticated
      if (!user && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return unsubscribe;
  }, [router, pathname]);

  const handleSignOut = async () => {
    await signOutAdmin();
    router.push('/admin/login');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show login page without admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show admin layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </div>
              
                                   <nav className="flex space-x-4">
                       <a
                         href="/admin"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <Shield className="w-4 h-4" />
                         <span>Dashboard</span>
                       </a>
                       <a
                         href="/admin/documents"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/documents'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <FileText className="w-4 h-4" />
                         <span>Documents</span>
                       </a>
                       <a
                         href="/admin/documents/enhanced"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/documents/enhanced'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <Filter className="w-4 h-4" />
                         <span>Enhanced</span>
                       </a>
                       <a
                         href="/admin/documents/test-rag"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/documents/test-rag'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <TestTube className="w-4 h-4" />
                         <span>Test RAG</span>
                       </a>
                       <a
                         href="/admin/lesson-plan-rag-test"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/lesson-plan-rag-test'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <BookOpen className="w-4 h-4" />
                         <span>Lesson Plan RAG</span>
                       </a>
                       <a
                         href="/admin/mongodb-test"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/mongodb-test'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <Database className="w-4 h-4" />
                         <span>Test MongoDB</span>
                       </a>
                       <a
                         href="/admin/summaries"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/summaries'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <FileText className="w-4 h-4" />
                         <span>Parent Summaries</span>
                       </a>
                       <a
                         href="/admin/handoff"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/handoff'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <Database className="w-4 h-4" />
                         <span>Firebase-MongoDB Handoff</span>
                       </a>
                       <a
                         href="/admin/users"
                         className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                           pathname === '/admin/users'
                             ? 'bg-blue-100 text-blue-700'
                             : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                         }`}
                       >
                         <Users className="w-4 h-4" />
                         <span>Users</span>
                       </a>
                     </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {adminUser && (
                <div className="flex items-center space-x-3">
                  <UserRoleBadge user={adminUser} showEmail={true} size="sm" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
