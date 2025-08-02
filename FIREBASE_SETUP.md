# Firebase Setup for Lesson Plan Generator

This guide will help you set up Firebase for the My Genius Lesson Plan Generator.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Firebase CLI installed: `npm install -g firebase-tools`

## Setup Steps

### 1. Initialize Firebase in your project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

When prompted, select:
- Firestore
- Storage
- Emulators (optional, for local development)

### 2. Configure Environment Variables

Create a `.env.local` file in your project root with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Other required environment variables
CLAUDE_API_KEY=your_claude_api_key
```

### 3. Enable Authentication

1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Enable Email/Password authentication
4. Add your first user or enable sign-up

### 4. Set up Firestore Database

1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users

### 5. Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

### 6. Create Firestore Indexes

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

## Features Enabled

With this setup, your lesson plan generator now supports:

### ✅ User Authentication
- Email/password sign-in
- User session management
- Protected routes

### ✅ Lesson Plan Storage
- Save generated lesson plans to Firestore
- Load user's saved lesson plans
- Update and delete lesson plans
- Automatic user association

### ✅ Student Profile Management
- Save student profiles per user
- Load saved profiles
- Persistent storage across sessions

### ✅ Security
- Users can only access their own data
- Firestore security rules enforce data isolation
- Storage rules protect user files

## Usage

1. **Sign In**: Users must sign in to access lesson plans
2. **Create Profiles**: Add student profiles (saved automatically)
3. **Generate Plans**: Create lesson plans (saved to Firebase)
4. **View History**: Access all previously created lesson plans
5. **Manage Data**: Edit or delete saved lesson plans and profiles

## Development

For local development with Firebase emulators:

```bash
# Start emulators
firebase emulators:start

# Use emulator configuration in your app
# The Firebase SDK will automatically connect to emulators when running locally
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Firebase Auth is enabled and configured
2. **Permission Denied**: Check Firestore security rules
3. **Missing Environment Variables**: Verify all Firebase config variables are set
4. **Index Errors**: Deploy Firestore indexes if queries fail

### Debug Mode

Enable Firebase debug logging:

```bash
# Set debug environment variable
export FIREBASE_DEBUG=true

# Or add to your .env.local
FIREBASE_DEBUG=true
```

## Security Notes

- All user data is isolated by user ID
- Firestore rules prevent cross-user data access
- Authentication is required for all operations
- Environment variables should be kept secure

## Next Steps

1. Set up Firebase Analytics (optional)
2. Configure Firebase Hosting for production deployment
3. Set up automated backups
4. Monitor usage and performance 