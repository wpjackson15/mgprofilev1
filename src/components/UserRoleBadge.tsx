"use client";
import * as React from 'react';
import { User } from 'firebase/auth';
import { getUserRoleSync, getRoleDisplayName, getRoleBadgeColor } from '@/lib/userRoles';

interface UserRoleBadgeProps {
  user: User | null;
  showEmail?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserRoleBadge({ user, showEmail = false, size = 'md' }: UserRoleBadgeProps) {
  const [role, setRole] = React.useState<UserRole>('guest');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setRole('guest');
      setLoading(false);
      return;
    }

    try {
      const userRole = getUserRoleSync(user);
      setRole(userRole);
    } catch (error) {
      console.error('Error loading user role:', error);
      setRole('guest');
    } finally {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          Guest
        </span>
      </div>
    );
  }

  const roleName = getRoleDisplayName(role);
  const badgeColor = getRoleBadgeColor(role);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`font-medium rounded-full ${badgeColor} ${sizeClasses[size]}`}>
        {roleName}
      </span>
      {showEmail && (
        <span className="text-sm text-gray-600">
          {user.email}
        </span>
      )}
    </div>
  );
}
