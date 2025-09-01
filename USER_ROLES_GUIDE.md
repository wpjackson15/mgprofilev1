# User Role System Guide

## 👥 **User Role Overview**

The My Genius Profile application now has a comprehensive user role system that differentiates between different types of users and their permissions.

## 🏷️ **User Role Types**

### **1. Administrator (Admin)**
- **Color**: Red badge
- **Emails**: `wpjackson@villageofwisdom.org`, `admin@mygeniusprofile.com`
- **Permissions**:
  - ✅ Access admin panel (`/admin/*`)
  - ✅ Upload reference documents
  - ✅ Unlimited summary generation
  - ✅ Access all advanced features
  - ✅ Export profiles
  - ✅ View analytics

### **2. Premium User**
- **Color**: Purple badge
- **Emails**: `premium@example.com`, `teacher@school.edu`
- **Permissions**:
  - ❌ No admin access
  - ❌ Cannot upload documents
  - ✅ Unlimited summary generation
  - ✅ Access advanced features
  - ✅ Export profiles
  - ❌ No analytics access

### **3. Basic User**
- **Color**: Blue badge
- **Default**: All authenticated users
- **Permissions**:
  - ❌ No admin access
  - ❌ Cannot upload documents
  - ❌ Limited summaries (5 per month)
  - ❌ Basic features only
  - ❌ No profile export
  - ❌ No analytics access

### **4. Guest User**
- **Color**: Gray badge
- **Default**: Unauthenticated users
- **Permissions**:
  - ❌ No admin access
  - ❌ Cannot upload documents
  - ❌ Very limited summaries (3 per month)
  - ❌ Basic features only
  - ❌ No profile export
  - ❌ No analytics access

## 🔧 **How to Configure User Roles**

### **Adding Admin Users**
Edit `src/lib/userRoles.ts` and add emails to `ADMIN_EMAILS`:

```typescript
const ADMIN_EMAILS = [
  'wpjackson@villageofwisdom.org',
  'admin@mygeniusprofile.com',
  'newadmin@domain.com' // Add new admin emails here
];
```

### **Adding Premium Users**
Edit `src/lib/userRoles.ts` and add emails to `PREMIUM_EMAILS`:

```typescript
const PREMIUM_EMAILS = [
  'premium@example.com',
  'teacher@school.edu',
  'newpremium@domain.com' // Add new premium emails here
];
```

### **Customizing Permissions**
Modify the `getUserPermissions()` function to change what each role can do:

```typescript
case 'premium':
  return {
    canAccessAdmin: false,
    canUploadDocuments: true, // Change this to true
    canGenerateUnlimitedSummaries: true,
    canAccessAdvancedFeatures: true,
    maxSummariesPerMonth: -1,
    canExportProfiles: true,
    canAccessAnalytics: true // Change this to true
  };
```

## 🎯 **Usage Examples**

### **Check User Role**
```typescript
import { getUserRole } from '@/lib/userRoles';

const role = getUserRole(user); // Returns 'admin', 'premium', 'basic', or 'guest'
```

### **Check Specific Permission**
```typescript
import { hasPermission } from '@/lib/userRoles';

const canAccessAdmin = hasPermission(user, 'canAccessAdmin');
const canExportProfiles = hasPermission(user, 'canExportProfiles');
```

### **Get User Usage Info**
```typescript
import { getUserUsage } from '@/lib/userRoles';

const usage = getUserUsage(user, summariesUsed);
console.log(usage.summariesRemaining); // Number of summaries left
console.log(usage.isUnlimited); // Boolean for unlimited users
```

### **Display Role Badge**
```typescript
import UserRoleBadge from '@/components/UserRoleBadge';

<UserRoleBadge user={user} showEmail={true} size="md" />
```

## 🎨 **Visual Components**

### **UserRoleBadge Component**
- Shows user role with color-coded badge
- Optional email display
- Three sizes: `sm`, `md`, `lg`

### **UserProfile Component**
- Complete user profile view
- Shows usage statistics
- Displays permissions
- Upgrade prompts for basic users

## 🔒 **Security Features**

### **Route Protection**
- Admin routes automatically check permissions
- Unauthorized users redirected to login
- Role-based component rendering

### **API Protection**
- Server-side permission checks
- Usage limits enforced
- Feature access controlled

## 📊 **Usage Tracking**

### **Summary Limits**
- **Admin**: Unlimited (-1)
- **Premium**: Unlimited (-1)
- **Basic**: 5 per month
- **Guest**: 3 per month

### **Tracking Implementation**
```typescript
// Check if user can generate summary
const canGenerate = hasPermission(user, 'canGenerateUnlimitedSummaries') || 
                   usage.summariesRemaining > 0;

if (!canGenerate) {
  // Show upgrade prompt or error
}
```

## 🚀 **Production Deployment**

### **Environment Variables**
Consider moving role configurations to environment variables:

```bash
# .env.local
NEXT_PUBLIC_ADMIN_EMAILS=wpjackson@villageofwisdom.org,admin@mygeniusprofile.com
NEXT_PUBLIC_PREMIUM_EMAILS=premium@example.com,teacher@school.edu
```

### **Database Integration**
For production, consider storing user roles in the database:

```typescript
// Future enhancement
interface UserRecord {
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔄 **Migration from Old System**

The new role system is backward compatible:
- Existing admin functionality still works
- `isAdmin()` function still available
- No breaking changes to existing code

## 🆘 **Troubleshooting**

### **Common Issues**
1. **User not getting correct role**: Check email spelling in role arrays
2. **Permissions not working**: Verify `hasPermission()` calls
3. **Badge not showing**: Check UserRoleBadge component imports

### **Testing Different Roles**
1. Create Firebase users with different emails
2. Test each role's permissions
3. Verify UI shows correct badges and limits
