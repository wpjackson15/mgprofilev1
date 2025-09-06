"use client";
import { User } from 'firebase/auth';
import { getUserUsage } from '@/lib/userRoles';
import UserRoleBadge from './UserRoleBadge';
import { Crown, Zap, Lock, BarChart3 } from 'lucide-react';

interface UserProfileProps {
  user: User | null;
  summariesUsed?: number;
}

export default function UserProfile({ user, summariesUsed = 0 }: UserProfileProps) {
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h3>
        <p className="text-gray-600">Please sign in to view your profile</p>
      </div>
    );
  }

  const usage = getUserUsage(user, summariesUsed);
  const permissions = usage.permissions;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
        <UserRoleBadge user={user} size="md" />
      </div>

      {/* User Info */}
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Email</p>
          <p className="font-medium text-gray-900">{user.email}</p>
        </div>

        {/* Usage Stats */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Summary Usage</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Used this month</p>
              <p className="text-2xl font-bold text-gray-900">{usage.summariesUsed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                {usage.isUnlimited ? '∞' : usage.summariesRemaining}
              </p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Your Permissions</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {permissions.canGenerateUnlimitedSummaries ? (
                <Zap className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-700">
                {permissions.canGenerateUnlimitedSummaries ? 'Unlimited summaries' : 'Limited summaries'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {permissions.canExportProfiles ? (
                <Crown className="w-4 h-4 text-purple-600" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-700">
                {permissions.canExportProfiles ? 'Profile export' : 'No profile export'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {permissions.canAccessAdvancedFeatures ? (
                <BarChart3 className="w-4 h-4 text-blue-600" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-700">
                {permissions.canAccessAdvancedFeatures ? 'Advanced features' : 'Basic features only'}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Info */}
        {usage.role === 'basic' && (
          <div className="border-t pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Upgrade to Premium</h5>
              <p className="text-sm text-blue-700 mb-3">
                Get unlimited summaries, profile exports, and advanced features.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
