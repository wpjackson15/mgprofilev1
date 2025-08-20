# MongoDB Setup Guide

This guide will help you set up MongoDB to replace Firebase Firestore and Storage.

## 🚀 **Step 1: Create MongoDB Atlas Account**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Get Started Free"
3. Create an account or sign in

## 🗄️ **Step 2: Create Your First Cluster**

1. **Choose "FREE" tier** (M0 Sandbox)
2. **Select cloud provider** (AWS, Google Cloud, or Azure - your choice)
3. **Choose region** (pick closest to your users)
4. **Click "Create"**

## 🔐 **Step 3: Set Up Database Access**

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. **Username:** `mgprofile-admin`
4. **Password:** Create a strong password (save this!)
5. **Database User Privileges:** Select "Read and write to any database"
6. Click "Add User"

## 🌐 **Step 4: Set Up Network Access**

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. **For development:** Click "Allow Access from Anywhere" (0.0.0.0/0)
4. **For production:** Add your specific IP addresses
5. Click "Confirm"

## 🔗 **Step 5: Get Your Connection String**

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. **Copy the connection string** (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## ⚙️ **Step 6: Set Environment Variables**

Add these to your `.env.local` file:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://mgprofile-admin:your_password@your_cluster.mongodb.net/mgprofilev1?retryWrites=true&w=majority

# Keep Firebase Auth (for now)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 🔄 **Step 7: Run Migration Script**

1. **Get Firebase Service Account Key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in your project root

2. **Run the migration:**
   ```bash
   node scripts/migrate-to-mongodb.js
   ```

## 📊 **Step 8: Verify Migration**

The migration script will show you:
- ✅ Progress records migrated
- ✅ Lesson plans migrated  
- ✅ Student profiles migrated
- ✅ File metadata migrated

## 🚀 **Step 9: Test Your App**

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test these features:
   - ✅ User authentication (still uses Firebase)
   - ✅ Lesson plan creation and loading
   - ✅ Student profile upload and management
   - ✅ File uploads (now stored in MongoDB)

## 🗂️ **Database Collections**

Your MongoDB database will have these collections:

```
mgprofilev1 (Database)
├── progress (user progress tracking)
├── lessonPlans (generated lesson plans)
├── studentProfiles (uploaded student profiles)
├── uploadedFiles (file metadata and base64 data)
└── knowledgeBase (for RAG system)
```

## 🔧 **Troubleshooting**

### **Connection Issues:**
- Verify your connection string is correct
- Check that your IP is whitelisted
- Ensure database user has correct permissions

### **Migration Issues:**
- Make sure `firebase-service-account.json` is in the project root
- Check that Firebase project has the correct collections
- Verify environment variables are set

### **File Upload Issues:**
- Files are now stored as base64 in MongoDB
- Large files may take longer to upload
- Consider implementing file size limits

## 🎯 **Next Steps**

After successful migration:

1. **Test all functionality** thoroughly
2. **Remove Firebase dependencies** (except Auth)
3. **Update deployment** with new environment variables
4. **Monitor performance** and optimize if needed

## 📝 **Notes**

- **Firebase Auth** is still used for user authentication
- **File storage** is now in MongoDB (base64 encoded)
- **All other data** is migrated to MongoDB
- **Migration is one-way** - make sure to backup Firebase data first

---

**Need help?** Check the MongoDB Atlas documentation or create an issue in your repository.
