import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getUserRoleSync } from './userRoles';

// Admin authentication state
let currentAdminUser: User | null = null;
let authStateListeners: ((user: User | null) => void)[] = [];

// This function is now imported from userRoles.ts

/**
 * Sign in as admin
 */
export async function signInAsAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user is admin using the sync role system (more reliable)
    const role = getUserRoleSync(user);
    console.log(`Admin login attempt for ${email}, role: ${role}`);
    
    if (role !== 'admin') {
      await signOut(auth);
      return { success: false, error: `Access denied. Role: ${role}. Admin privileges required.` };
    }
    
    currentAdminUser = user;
    notifyAuthStateListeners(user);
    return { success: true };
  } catch (error) {
    console.error('Admin sign in error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    };
  }
}

/**
 * Sign out admin
 */
export async function signOutAdmin(): Promise<void> {
  try {
    await signOut(auth);
    currentAdminUser = null;
    notifyAuthStateListeners(null);
  } catch (error) {
    console.error('Admin sign out error:', error);
  }
}

/**
 * Get current admin user
 */
export function getCurrentAdminUser(): User | null {
  return currentAdminUser;
}

/**
 * Listen to admin auth state changes
 */
export function onAdminAuthStateChanged(callback: (user: User | null) => void): () => void {
  authStateListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all auth state listeners
 */
function notifyAuthStateListeners(user: User | null) {
  authStateListeners.forEach(callback => callback(user));
}

/**
 * Initialize admin auth state listener
 */
export function initializeAdminAuth(): void {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      try {
        const role = getUserRoleSync(user);
        if (role === 'admin') {
          currentAdminUser = user;
        } else {
          currentAdminUser = null;
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        currentAdminUser = null;
      }
    } else {
      currentAdminUser = null;
    }
    notifyAuthStateListeners(currentAdminUser);
  });
}
