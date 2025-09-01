import { User } from 'firebase/auth';
import { UserRole, UserPermissions, getUserPermissions } from './userRoles';

// Database interface for user roles
export interface UserRoleRecord {
  email: string;
  role: UserRole;
  assignedBy?: string;
  assignedAt: Date;
  updatedAt: Date;
  notes?: string;
}

// Default roles for specific emails (fallback)
const DEFAULT_ADMIN_EMAILS = [
  'wpjackson@villageofwisdom.org',
  'admin@mygeniusprofile.com'
];

const DEFAULT_PREMIUM_EMAILS = [
  'premium@example.com',
  'teacher@school.edu'
];

/**
 * Get user role with database fallback
 */
export async function getUserRoleWithFallback(user: User | null): Promise<UserRole> {
  if (!user || !user.email) return 'guest';
  
  const email = user.email.toLowerCase();
  
  try {
    // Try to get role from database first
    const dbRole = await getUserRoleFromDatabase(email);
    if (dbRole) {
      console.log(`Found database role for ${email}: ${dbRole}`);
      return dbRole;
    }
  } catch (error) {
    console.error('Error fetching user role from database:', error);
  }
  
  // Fallback to hardcoded roles
  const fallbackRole = getDefaultRole(email);
  console.log(`Using fallback role for ${email}: ${fallbackRole}`);
  return fallbackRole;
}

/**
 * Get default role based on email (fallback)
 */
function getDefaultRole(email: string): UserRole {
  if (DEFAULT_ADMIN_EMAILS.includes(email)) {
    return 'admin';
  }
  
  if (DEFAULT_PREMIUM_EMAILS.includes(email)) {
    return 'premium';
  }
  
  return 'basic';
}

/**
 * Set user role in database
 */
export async function setUserRole(email: string, role: UserRole, assignedBy?: string, notes?: string): Promise<boolean> {
  try {
    const { saveUserRole } = await import('../services/mongodb');
    
    const roleRecord: UserRoleRecord = {
      email: email.toLowerCase(),
      role,
      assignedBy,
      assignedAt: new Date(),
      updatedAt: new Date(),
      notes
    };
    
    await saveUserRole(roleRecord);
    return true;
  } catch (error) {
    console.error('Error setting user role:', error);
    return false;
  }
}

/**
 * Get user role from database
 */
async function getUserRoleFromDatabase(email: string): Promise<UserRole | null> {
  try {
    const { getUserRoleByEmail } = await import('../services/mongodb');
    const roleRecord = await getUserRoleByEmail(email.toLowerCase());
    return roleRecord?.role || null;
  } catch (error) {
    console.error('Error getting user role from database:', error);
    return null;
  }
}

/**
 * Get all user roles (admin function)
 */
export async function getAllUserRoles(): Promise<UserRoleRecord[]> {
  try {
    const { getAllUserRoles } = await import('../services/mongodb');
    return await getAllUserRoles();
  } catch (error) {
    console.error('Error getting all user roles:', error);
    return [];
  }
}

/**
 * Delete user role (admin function)
 */
export async function deleteUserRole(email: string): Promise<boolean> {
  try {
    const { deleteUserRoleByEmail } = await import('../services/mongodb');
    await deleteUserRoleByEmail(email.toLowerCase());
    return true;
  } catch (error) {
    console.error('Error deleting user role:', error);
    return false;
  }
}

/**
 * Check if user can change roles (admin only)
 */
export function canChangeUserRoles(user: User | null): boolean {
  if (!user || !user.email) return false;
  return DEFAULT_ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/**
 * Get role change history for an email
 */
export async function getRoleChangeHistory(email: string): Promise<UserRoleRecord[]> {
  try {
    const { getRoleChangeHistory } = await import('../services/mongodb');
    return await getRoleChangeHistory(email.toLowerCase());
  } catch (error) {
    console.error('Error getting role change history:', error);
    return [];
  }
}
