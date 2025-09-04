import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';
import { ChildSummaryV1 } from '../lib/schemas';

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
  if (!process.env.MONGODB_URI_NEW) {
    throw new Error('MONGODB_URI_NEW environment variable is not set');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI_NEW, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1,
      retryWrites: true,
      w: "majority"
    });
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("MongoDB connection timeout")), 10000))
    ]);
    db = client.db('mgprofilev1');

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectToMongoDB() first.');
  }
  return db;
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (client) {
    await client.close();

  }
}

// Helper function to get collection
function getCollection<T extends Document>(name: string): Collection<T> {
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

// V2 Summary Functions
export interface SummaryV2 {
  _id?: ObjectId;
  profileId: string;
  runId: string;
  summary: ChildSummaryV1;
  tokens?: {
    input: number;
    output: number;
  };
  model?: string;
  contextSnapshot?: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export async function saveSummaryV2(summary: SummaryV2): Promise<string> {
  const collection = getCollection<SummaryV2>('summaries_v2');
  
  const summaryWithMetadata = {
    ...summary,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await collection.insertOne(summaryWithMetadata);
  return result.insertedId.toString();
}

export async function getSummaryV2ByRunId(runId: string): Promise<SummaryV2 | null> {
  const collection = getCollection<SummaryV2>('summaries_v2');
  return await collection.findOne({ runId });
}

export async function getSummariesV2ByProfileId(profileId: string): Promise<SummaryV2[]> {
  const collection = getCollection<SummaryV2>('summaries_v2');
  return await collection.find({ profileId }).sort({ createdAt: -1 }).toArray();
}

// Initialize indexes for summaries_v2 collection
export async function initializeSummaryV2Indexes(): Promise<void> {
  const collection = getCollection<SummaryV2>('summaries_v2');
  
  // Create indexes
  await collection.createIndex({ profileId: 1, createdAt: -1 });
  await collection.createIndex({ runId: 1 }, { unique: true });
  
  
}

// Document Functions (for reference materials)
export interface ReferenceDocument {
  _id?: ObjectId;
  title: string;
  content: string;
  category: string;
  tags: string[];
  documentType: 'lesson-plan' | 'profile' | 'general' | 'both';
  usageTags: {
    lessonPlans: boolean;
    profiles: boolean;
    examples: boolean;
    bestPractices: boolean;
  };
  priority: {
    lessonPlans: number;
    profiles: number;
  };
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function saveReferenceDocument(doc: ReferenceDocument): Promise<string> {
  const collection = getCollection<ReferenceDocument>('referenceDocuments');
  
  const docWithMetadata = {
    ...doc,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await collection.insertOne(docWithMetadata);
  return result.insertedId.toString();
}

export async function deleteReferenceDocument(documentId: string): Promise<boolean> {
  try {
    const collection = getCollection<ReferenceDocument>('referenceDocuments');
    const result = await collection.deleteOne({ _id: new ObjectId(documentId) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting reference document:', error);
    return false;
  }
}

export async function getReferenceDocuments(category?: string): Promise<ReferenceDocument[]> {
  const collection = getCollection<ReferenceDocument>('referenceDocuments');
  
  const filter = category ? { category } : {};
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function searchReferenceDocuments(query: string, limit: number = 5, documentType?: 'lesson-plan' | 'profile' | 'general' | 'both'): Promise<ReferenceDocument[]> {
  const collection = getCollection<ReferenceDocument>('referenceDocuments');
  
  // Simple client-side filtering without requiring text index
  // Increased limit to ensure we search through all documents
  const allDocuments = await collection.find({}).limit(100).toArray();
  
  const searchTerms = query.toLowerCase().split(' ');
  
  let relevantDocuments = allDocuments.filter(doc => {
    const searchableText = `${doc.title} ${doc.content} ${doc.category} ${doc.tags.join(' ')}`.toLowerCase();
    return searchTerms.some(term => searchableText.includes(term));
  });
  
  // Filter by document type if specified
  if (documentType) {
    relevantDocuments = relevantDocuments.filter(doc => {
      if (documentType === 'both') {
        return doc.documentType === 'both' || doc.documentType === 'lesson-plan' || doc.documentType === 'profile';
      }
      return doc.documentType === documentType || doc.documentType === 'both';
    });
  }
  
  return relevantDocuments.slice(0, limit);
}

// User Role Management Functions
export interface UserRoleRecord {
  _id?: ObjectId;
  email: string;
  role: 'admin' | 'premium' | 'basic' | 'guest';
  assignedBy?: string;
  assignedAt: Date;
  updatedAt: Date;
  notes?: string;
}

export async function saveUserRole(roleRecord: UserRoleRecord): Promise<string> {
  const collection = getCollection<UserRoleRecord>('userRoles');
  
  // Check if role already exists for this email
  const existing = await collection.findOne({ email: roleRecord.email });
  
  if (existing) {
    // Update existing role
    const result = await collection.updateOne(
      { email: roleRecord.email },
      { 
        $set: { 
          role: roleRecord.role,
          assignedBy: roleRecord.assignedBy,
          updatedAt: new Date(),
          notes: roleRecord.notes
        }
      }
    );
    return existing._id?.toString() || '';
  } else {
    // Create new role record
    const result = await collection.insertOne(roleRecord);
    return result.insertedId.toString();
  }
}

export async function getUserRoleByEmail(email: string): Promise<UserRoleRecord | null> {
  const collection = getCollection<UserRoleRecord>('userRoles');
  return await collection.findOne({ email: email.toLowerCase() });
}

export async function getAllUserRoles(): Promise<UserRoleRecord[]> {
  const collection = getCollection<UserRoleRecord>('userRoles');
  return await collection.find({}).sort({ updatedAt: -1 }).toArray();
}

export async function deleteUserRoleByEmail(email: string): Promise<void> {
  const collection = getCollection<UserRoleRecord>('userRoles');
  await collection.deleteOne({ email: email.toLowerCase() });
}

export async function getRoleChangeHistory(email: string): Promise<UserRoleRecord[]> {
  const collection = getCollection<UserRoleRecord>('userRoles');
  return await collection.find({ email: email.toLowerCase() }).sort({ updatedAt: -1 }).toArray();
}
