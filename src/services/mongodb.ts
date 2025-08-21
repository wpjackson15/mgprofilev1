import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Types
export interface UserProgress {
  userId: string;
  moduleId: string;
  completed: boolean;
  answers: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  age: number;
  learningStyle: string;
  interests: string[];
  strengths: string[];
  challenges: string[];
  goals: string[];
  culturalBackground?: string;
  languageNeeds?: string;
  specialNeeds?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonPlan {
  id: string;
  userId: string;
  title: string;
  subject: string;
  grade: string;
  duration: string;
  objectives: string[];
  standards: string[];
  materials: string[];
  procedures: string[];
  assessment: string | string[] | Record<string, unknown>;
  differentiation: string[];
  culturalResponsiveness: string[];
  calesCriteria?: string[];
  ragContext?: string;
  selectedProfiles?: StudentProfile[];
  createdAt: Date;
  updatedAt: Date;
  googleDocUrl?: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64 encoded
  uploadedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processed' | 'error';
  errorMessage?: string;
}

// MongoDB connection
let client: MongoClient;
let db: Db;

export async function connectToMongoDB(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('mgprofilev1');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Helper function to get collection
function getCollection<T>(name: string): Collection<T> {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectToMongoDB() first.');
  }
  return db.collection<T>(name);
}

// User Progress Functions
export async function saveUserProgress(progress: UserProgress): Promise<void> {
  const collection = getCollection<UserProgress>('progress');
  
  const filter = { userId: progress.userId, moduleId: progress.moduleId };
  const update = { 
    $set: { 
      ...progress, 
      updatedAt: new Date() 
    },
    $setOnInsert: { createdAt: new Date() }
  };
  
  await collection.updateOne(filter, update, { upsert: true });
}

export async function loadUserProgress(userId: string, moduleId: string): Promise<UserProgress | null> {
  const collection = getCollection<UserProgress>('progress');
  return await collection.findOne({ userId, moduleId });
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const collection = getCollection<UserProgress>('progress');
  return await collection.find({ userId }).toArray();
}

// Lesson Plan Functions
export async function saveLessonPlan(lessonPlan: LessonPlan): Promise<void> {
  const collection = getCollection<LessonPlan>('lessonPlans');
  
  // Filter out undefined values to prevent MongoDB errors
  const cleanLessonPlan = Object.fromEntries(
    Object.entries(lessonPlan).filter(([, value]) => value !== undefined)
  ) as LessonPlan;
  
  if (lessonPlan.id) {
    // Update existing lesson plan
    const filter = { _id: new ObjectId(lessonPlan.id) };
    const update = { 
      $set: { 
        ...cleanLessonPlan, 
        updatedAt: new Date() 
      }
    };
    await collection.updateOne(filter, update);
  } else {
    // Create new lesson plan
    const newLessonPlan = {
      ...cleanLessonPlan,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await collection.insertOne(newLessonPlan);
    lessonPlan.id = result.insertedId.toString();
  }
}

export async function loadLessonPlan(lessonPlanId: string): Promise<LessonPlan | null> {
  const collection = getCollection<LessonPlan>('lessonPlans');
  return await collection.findOne({ _id: new ObjectId(lessonPlanId) });
}

export async function getUserLessonPlans(userId: string): Promise<LessonPlan[]> {
  const collection = getCollection<LessonPlan>('lessonPlans');
  return await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function updateLessonPlan(lessonPlanId: string, updates: Partial<LessonPlan>): Promise<void> {
  const collection = getCollection<LessonPlan>('lessonPlans');
  const filter = { _id: new ObjectId(lessonPlanId) };
  const update = { 
    $set: { 
      ...updates, 
      updatedAt: new Date() 
    }
  };
  await collection.updateOne(filter, update);
}

export async function deleteLessonPlan(lessonPlanId: string): Promise<void> {
  const collection = getCollection<LessonPlan>('lessonPlans');
  await collection.deleteOne({ _id: new ObjectId(lessonPlanId) });
}

// Student Profile Functions
export async function saveStudentProfiles(profiles: StudentProfile[], userId: string): Promise<void> {
  const collection = getCollection<StudentProfile>('studentProfiles');
  
  // Delete existing profiles for this user
  await collection.deleteMany({ userId });
  
  // Add userId and timestamps to each profile
  const profilesWithMetadata = profiles.map(profile => ({
    ...profile,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  if (profilesWithMetadata.length > 0) {
    await collection.insertMany(profilesWithMetadata);
  }
}

export async function loadStudentProfiles(userId: string): Promise<StudentProfile[]> {
  const collection = getCollection<StudentProfile>('studentProfiles');
  return await collection.find({ userId }).toArray();
}

// File Upload Functions
export async function saveUploadedFile(file: UploadedFile): Promise<string> {
  const collection = getCollection<UploadedFile>('uploadedFiles');
  
  const fileWithMetadata = {
    ...file,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await collection.insertOne(fileWithMetadata);
  return result.insertedId.toString();
}

export async function getUploadedFile(fileId: string): Promise<UploadedFile | null> {
  const collection = getCollection<UploadedFile>('uploadedFiles');
  return await collection.findOne({ _id: new ObjectId(fileId) });
}

export async function getUserUploadedFiles(userId: string): Promise<UploadedFile[]> {
  const collection = getCollection<UploadedFile>('uploadedFiles');
  return await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function updateFileStatus(fileId: string, status: UploadedFile['status'], errorMessage?: string): Promise<void> {
  const collection = getCollection<UploadedFile>('uploadedFiles');
  const filter = { _id: new ObjectId(fileId) };
  const update = { 
    $set: { 
      status, 
      errorMessage,
      processedAt: new Date(),
      updatedAt: new Date()
    }
  };
  await collection.updateOne(filter, update);
}

// Knowledge Base Functions (for RAG)
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export async function saveKnowledgeDocument(doc: KnowledgeDocument): Promise<string> {
  const collection = getCollection<KnowledgeDocument>('knowledgeBase');
  
  const docWithMetadata = {
    ...doc,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await collection.insertOne(docWithMetadata);
  return result.insertedId.toString();
}

export async function searchKnowledgeBase(query: string, limit: number = 5): Promise<KnowledgeDocument[]> {
  const collection = getCollection<KnowledgeDocument>('knowledgeBase');
  
  // Simple text search - can be enhanced with vector search later
  return await collection.find({
    $text: { $search: query }
  }).limit(limit).toArray();
}

export async function getKnowledgeDocumentsByCategory(category: string): Promise<KnowledgeDocument[]> {
  const collection = getCollection<KnowledgeDocument>('knowledgeBase');
  return await collection.find({ category }).toArray();
}
