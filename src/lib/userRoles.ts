import { User } from 'firebase/auth';

// User role types
export type UserRole = 'admin' | 'premium' | 'basic' | 'guest';

// User permissions interface
export interface UserPermissions {
  canAccessAdmin: boolean;
  canUploadDocuments: boolean;
  canGenerateUnlimitedSummaries: boolean;
  canAccessAdvancedFeatures: boolean;
  maxSummariesPerMonth: number;
  canExportProfiles: boolean;
  canAccessAnalytics: boolean;
}

// Admin email addresses
const ADMIN_EMAILS = [
  'wpjackson@villageofwisdom.org',
  'admin@mygeniusprofile.com',
  'newadmin@yourdomain.com'  // Add more admin emails here
];

// Premium user emails (for testing)
const PREMIUM_EMAILS = [
  'premium@example.com',
  'teacher@school.edu'
];

/**
 * Get user role based on email and other criteria
 * This function now supports both database and fallback roles
 */
export async function getUserRole(user: User | null): Promise<UserRole> {
  if (!user || !user.email) return 'guest';
  
  const email = user.email.toLowerCase();
  
  // Try database first, then fallback to hardcoded roles
  try {
    const { getUserRoleWithFallback } = await import('./userRoleManager');
    return await getUserRoleWithFallback(user);
  } catch (error) {
    console.error('Error getting user role, using fallback:', error);
    return getFallbackRole(email);
  }
}

/**
 * Get fallback role based on email (for backward compatibility)
 */
function getFallbackRole(email: string): UserRole {
  if (ADMIN_EMAILS.includes(email)) {
    return 'admin';
  }
  
  if (PREMIUM_EMAILS.includes(email)) {
    return 'premium';
  }
  
  return 'basic';
}

/**
 * Synchronous version for backward compatibility
 * Use this only when you need immediate role checking without database
 */
export function getUserRoleSync(user: User | null): UserRole {
  if (!user || !user.email) return 'guest';
  
  const email = user.email.toLowerCase();
  return getFallbackRole(email);
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canAccessAdmin: true,
        canUploadDocuments: true,
        canGenerateUnlimitedSummaries: true,
        canAccessAdvancedFeatures: true,
        maxSummariesPerMonth: -1, // Unlimited
        canExportProfiles: true,
        canAccessAnalytics: true
      };
    
    case 'premium':
      return {
        canAccessAdmin: false,
        canUploadDocuments: false,
        canGenerateUnlimitedSummaries: true,
        canAccessAdvancedFeatures: true,
        maxSummariesPerMonth: -1, // Unlimited
        canExportProfiles: true,
        canAccessAnalytics: false
      };
    
    case 'basic':
      return {
        canAccessAdmin: false,
        canUploadDocuments: false,
        canGenerateUnlimitedSummaries: false,
        canAccessAdvancedFeatures: false,
        maxSummariesPerMonth: 5, // Limited
        canExportProfiles: false,
        canAccessAnalytics: false
      };
    
    case 'guest':
    default:
      return {
        canAccessAdmin: false,
        canUploadDocuments: false,
        canGenerateUnlimitedSummaries: false,
        canAccessAdvancedFeatures: false,
        maxSummariesPerMonth: 3, // Very limited
        canExportProfiles: false,
        canAccessAnalytics: false
      };
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User | null, permission: keyof UserPermissions): boolean {
  const role = getUserRole(user);
  const permissions = getUserPermissions(role);
  return permissions[permission];
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'premium': return 'Premium User';
    case 'basic': return 'Basic User';
    case 'guest': return 'Guest';
    default: return 'Unknown';
  }
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'premium': return 'bg-purple-100 text-purple-800';
    case 'basic': return 'bg-blue-100 text-blue-800';
    case 'guest': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Check if user is admin (for backward compatibility)
 */
export function isAdmin(user: User | null): boolean {
  return getUserRole(user) === 'admin';
}

/**
 * Get user summary usage info
 */
export interface UserUsage {
  role: UserRole;
  permissions: UserPermissions;
  summariesUsed: number;
  summariesRemaining: number;
  isUnlimited: boolean;
}

export function getUserUsage(user: User | null, summariesUsed: number = 0): UserUsage {
  const role = getUserRole(user);
  const permissions = getUserPermissions(role);
  
  return {
    role,
    permissions,
    summariesUsed,
    summariesRemaining: permissions.maxSummariesPerMonth === -1 
      ? -1 
      : Math.max(0, permissions.maxSummariesPerMonth - summariesUsed),
    isUnlimited: permissions.maxSummariesPerMonth === -1
  };
}
