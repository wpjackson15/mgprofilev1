# Flexible User Role System

## 🔄 **Overview**

The My Genius Profile application now supports **flexible user roles** that allow the same email address to change between different user types without code changes or redeployment.

## 🎯 **Key Features**

### **Database-Driven Roles**
- User roles stored in MongoDB
- Real-time role changes without code deployment
- Fallback to hardcoded roles if database is unavailable
- Role change history tracking

### **Admin Management Interface**
- Web-based user role management at `/admin/users`
- Add, edit, and delete user roles
- View role change history
- Add notes for role assignments

### **Backward Compatibility**
- Existing hardcoded roles still work
- Gradual migration to database-driven system
- No breaking changes to existing functionality

## 🏗️ **How It Works**

### **1. Role Resolution Priority**
```
1. Database Role (if exists)
2. Hardcoded Role (fallback)
3. Default Role (basic/guest)
```

### **2. Database Schema**
```typescript
interface UserRoleRecord {
  email: string;
  role: 'admin' | 'premium' | 'basic' | 'guest';
  assignedBy?: string;
  assignedAt: Date;
  updatedAt: Date;
  notes?: string;
}
```

### **3. Role Change Process**
1. Admin logs into `/admin/users`
2. Selects user to modify
3. Changes role and adds notes
4. Changes take effect immediately
5. User's permissions update on next login

## 🎛️ **Admin Interface**

### **Accessing User Management**
1. Go to `/admin/login`
2. Sign in with admin credentials
3. Click "Users" in the navigation
4. Manage user roles through the web interface

### **Available Actions**
- **Add User**: Create new role assignment
- **Edit Role**: Change user's role and add notes
- **Delete Role**: Remove custom role (reverts to fallback)
- **View History**: See role change history

### **Role Types**
- **Administrator**: Full system access
- **Premium User**: Unlimited summaries, advanced features
- **Basic User**: Limited summaries (5/month)
- **Guest User**: Very limited summaries (3/month)

## 🔧 **Implementation Details**

### **Core Functions**

#### **Get User Role (Async)**
```typescript
import { getUserRole } from '@/lib/userRoles';

const role = await getUserRole(user); // Returns Promise<UserRole>
```

#### **Set User Role**
```typescript
import { setUserRole } from '@/lib/userRoleManager';

const success = await setUserRole(
  'user@example.com',
  'premium',
  'admin@domain.com',
  'Upgraded for beta testing'
);
```

#### **Check Permissions**
```typescript
import { hasPermission } from '@/lib/userRoles';

const canAccessAdmin = await hasPermission(user, 'canAccessAdmin');
```

### **Component Updates**

#### **UserRoleBadge Component**
- Now handles async role loading
- Shows loading spinner while fetching role
- Graceful fallback to guest role on error

#### **UserProfile Component**
- Displays current role and permissions
- Shows usage statistics
- Upgrade prompts for basic users

## 📊 **Use Cases**

### **Scenario 1: Teacher Promotion**
```
1. Teacher signs up with basic account
2. Admin promotes teacher to premium
3. Teacher gets unlimited summaries immediately
4. No code changes or redeployment needed
```

### **Scenario 2: Temporary Admin Access**
```
1. Regular user needs admin access for testing
2. Admin temporarily assigns admin role
3. User can access admin panel
4. Admin removes role when testing complete
```

### **Scenario 3: Role Downgrade**
```
1. Premium user's subscription expires
2. Admin changes role to basic
3. User loses premium features immediately
4. Usage limits apply on next summary generation
```

## 🚀 **Migration Strategy**

### **Phase 1: Setup (Complete)**
- ✅ Database schema created
- ✅ Admin interface implemented
- ✅ Backward compatibility maintained

### **Phase 2: Gradual Migration**
- Move existing hardcoded roles to database
- Test with small user groups
- Monitor performance and reliability

### **Phase 3: Full Migration**
- Remove hardcoded role fallbacks
- Implement role-based analytics
- Add automated role management

## 🔒 **Security Considerations**

### **Admin Access Control**
- Only hardcoded admin emails can manage roles
- Role changes are logged with admin attribution
- Confirmation required for role deletions

### **Data Protection**
- Email addresses stored in lowercase
- Role history maintained for audit trails
- No sensitive data in role records

### **Rate Limiting**
- Consider implementing rate limits on role changes
- Prevent rapid role switching abuse
- Monitor for suspicious activity

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Role Not Updating**
1. Check if user is logged out and back in
2. Verify database connection
3. Check admin permissions

#### **Database Errors**
1. Fallback to hardcoded roles
2. Check MongoDB connection
3. Verify collection permissions

#### **Admin Interface Not Loading**
1. Check admin authentication
2. Verify route permissions
3. Check browser console for errors

### **Debugging Commands**

#### **Check User Role**
```typescript
// In browser console
const user = firebase.auth().currentUser;
const role = await getUserRole(user);
console.log('User role:', role);
```

#### **Check Database Role**
```typescript
// In admin interface
const dbRole = await getUserRoleByEmail('user@example.com');
console.log('Database role:', dbRole);
```

## 📈 **Future Enhancements**

### **Planned Features**
- **Role Expiration**: Automatic role downgrades
- **Bulk Operations**: Mass role assignments
- **Role Templates**: Predefined role configurations
- **Analytics**: Role usage and change tracking
- **API Endpoints**: Programmatic role management

### **Integration Opportunities**
- **Payment Systems**: Automatic premium role assignment
- **School Districts**: Bulk teacher role management
- **Beta Testing**: Temporary role assignments
- **A/B Testing**: Role-based feature testing

## 🎯 **Best Practices**

### **Role Management**
1. **Document Changes**: Always add notes when changing roles
2. **Test Changes**: Verify permissions after role changes
3. **Monitor Usage**: Track role change patterns
4. **Backup Data**: Regular database backups

### **User Communication**
1. **Notify Users**: Inform users of role changes
2. **Clear Expectations**: Explain what each role provides
3. **Support Channels**: Provide help for role-related issues
4. **Feedback Loop**: Collect user feedback on role system

This flexible system ensures your application can grow and adapt to changing user needs without requiring code changes or redeployment!
