# Admin Panel Setup Guide

## 🔐 **Admin Authentication System**

The admin panel is now secured with Firebase authentication and role-based access control.

### **Admin Access URLs:**
- **Login**: `http://localhost:3000/admin/login`
- **Dashboard**: `http://localhost:3000/admin`
- **Documents**: `http://localhost:3000/admin/documents`

### **Security Features:**
- ✅ **Firebase Authentication** - Secure login with email/password
- ✅ **Role-Based Access** - Only authorized admin emails can access
- ✅ **Automatic Redirects** - Unauthorized users redirected to login
- ✅ **Session Management** - Persistent login state
- ✅ **Secure Logout** - Proper session cleanup

## 👤 **Setting Up Admin Users**

### **1. Configure Admin Emails**
Edit `src/lib/adminAuth.ts` and update the `ADMIN_EMAILS` array:

```typescript
const ADMIN_EMAILS = [
  'your-email@domain.com',     // Replace with your email
  'admin@mygeniusprofile.com', // Add additional admin emails
];
```

### **2. Create Admin Accounts**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Authentication → Users
3. Click "Add User"
4. Enter admin email and password
5. The user will automatically have admin access if their email is in the `ADMIN_EMAILS` list

### **3. Test Admin Access**
1. Visit `http://localhost:3000/admin/login`
2. Sign in with admin credentials
3. You'll be redirected to the admin dashboard

## 🛡️ **Security Best Practices**

### **Production Deployment:**
1. **Environment Variables**: Store admin emails in environment variables
2. **IP Restrictions**: Consider adding IP whitelisting for admin access
3. **Strong Passwords**: Use complex passwords for admin accounts
4. **Regular Audits**: Monitor admin access logs

### **Additional Security Options:**
- **Two-Factor Authentication**: Enable 2FA for admin accounts
- **Session Timeout**: Implement automatic logout after inactivity
- **Access Logging**: Track all admin actions for audit purposes

## 📊 **Admin Panel Features**

### **Dashboard (`/admin`)**
- System status overview
- Quick statistics
- Navigation to admin functions

### **Documents Management (`/admin/documents`)**
- Upload reference documents
- Categorize by type (format/style vs content/processing)
- View and manage existing documents
- Color-coded category badges

### **Document Categories:**
- **Format & Style** (Blue badges): Structure, tone, presentation
- **Content & Processing** (Green badges): Guidelines, frameworks, cultural context
- **Other** (Gray badges): Research, examples, best practices

## 🔧 **Customization Options**

### **Adding New Admin Features:**
1. Create new admin pages in `src/app/admin/`
2. Add navigation links in `src/app/admin/layout.tsx`
3. Implement authentication checks using `isAdmin()` function

### **Modifying Admin Permissions:**
- Edit the `isAdmin()` function in `src/lib/adminAuth.ts`
- Add additional role checks as needed
- Implement different permission levels

## 🚀 **Deployment Notes**

### **Environment Variables:**
```bash
# Add to your .env.local or production environment
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# ... other Firebase config
```

### **Firebase Rules:**
Ensure your Firestore rules allow admin access:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access to all collections
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email in ['admin@domain.com', 'your-email@domain.com'];
    }
  }
}
```

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **"Access denied" error**: Check if email is in `ADMIN_EMAILS` array
2. **Login not working**: Verify Firebase authentication is enabled
3. **Redirect loops**: Clear browser cache and cookies

### **Support:**
- Check Firebase Console for authentication errors
- Review browser console for JavaScript errors
- Verify environment variables are set correctly
