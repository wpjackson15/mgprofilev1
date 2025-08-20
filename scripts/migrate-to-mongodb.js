const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

// Firebase Admin SDK setup
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateToMongoDB() {
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔄 Starting migration from Firebase to MongoDB...');
    
    // Connect to MongoDB
    await mongoClient.connect();
    const mongoDb = mongoClient.db('mgprofilev1');
    
    // Migrate User Progress
    console.log('📊 Migrating user progress...');
    const progressSnapshot = await db.collection('progress').get();
    const progressData = [];
    
    progressSnapshot.forEach(doc => {
      const data = doc.data();
      progressData.push({
        userId: data.userId,
        moduleId: data.moduleId,
        completed: data.completed || false,
        answers: data.answers || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    if (progressData.length > 0) {
      await mongoDb.collection('progress').insertMany(progressData);
      console.log(`✅ Migrated ${progressData.length} progress records`);
    }
    
    // Migrate Lesson Plans
    console.log('📚 Migrating lesson plans...');
    const lessonPlansSnapshot = await db.collection('lessonPlans').get();
    const lessonPlansData = [];
    
    lessonPlansSnapshot.forEach(doc => {
      const data = doc.data();
      lessonPlansData.push({
        userId: data.userId,
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        duration: data.duration,
        objectives: data.objectives || [],
        standards: data.standards || [],
        materials: data.materials || [],
        procedures: data.procedures || [],
        assessment: data.assessment,
        differentiation: data.differentiation || [],
        culturalResponsiveness: data.culturalResponsiveness || [],
        calesCriteria: data.calesCriteria || [],
        ragContext: data.ragContext,
        selectedProfiles: data.selectedProfiles || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        googleDocUrl: data.googleDocUrl
      });
    });
    
    if (lessonPlansData.length > 0) {
      await mongoDb.collection('lessonPlans').insertMany(lessonPlansData);
      console.log(`✅ Migrated ${lessonPlansData.length} lesson plans`);
    }
    
    // Migrate Student Profiles
    console.log('👥 Migrating student profiles...');
    const profilesSnapshot = await db.collection('studentProfiles').get();
    const profilesData = [];
    
    profilesSnapshot.forEach(doc => {
      const data = doc.data();
      profilesData.push({
        userId: data.userId,
        name: data.name,
        grade: data.grade,
        age: data.age,
        learningStyle: data.learningStyle,
        interests: data.interests || [],
        strengths: data.strengths || [],
        challenges: data.challenges || [],
        goals: data.goals || [],
        culturalBackground: data.culturalBackground,
        languageNeeds: data.languageNeeds,
        specialNeeds: data.specialNeeds,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    if (profilesData.length > 0) {
      await mongoDb.collection('studentProfiles').insertMany(profilesData);
      console.log(`✅ Migrated ${profilesData.length} student profiles`);
    }
    
    // Migrate Uploaded Files (metadata only - files will need to be re-uploaded)
    console.log('📁 Migrating uploaded files metadata...');
    const filesSnapshot = await db.collection('uploadedFiles').get();
    const filesData = [];
    
    filesSnapshot.forEach(doc => {
      const data = doc.data();
      filesData.push({
        userId: data.userId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize || 0,
        fileData: '', // Will need to be re-uploaded
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        processedAt: data.processedAt?.toDate(),
        status: data.status || 'pending',
        errorMessage: data.errorMessage,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    if (filesData.length > 0) {
      await mongoDb.collection('uploadedFiles').insertMany(filesData);
      console.log(`✅ Migrated ${filesData.length} file metadata records`);
      console.log('⚠️  Note: File contents need to be re-uploaded from Firebase Storage');
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Print summary
    console.log('\n📋 Migration Summary:');
    console.log(`- Progress records: ${progressData.length}`);
    console.log(`- Lesson plans: ${lessonPlansData.length}`);
    console.log(`- Student profiles: ${profilesData.length}`);
    console.log(`- File metadata: ${filesData.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoClient.close();
    process.exit(0);
  }
}

// Run migration
migrateToMongoDB().catch(console.error);
