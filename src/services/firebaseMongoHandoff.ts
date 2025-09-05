import { saveUserProgress, loadUserProgress, ProfileProgress } from './firestore';
import { saveSummaryV2, getSummariesV2ByUserId, SummaryV2 } from './mongodb';
import { ChildSummaryV1 } from '../lib/schemas';

export interface HandoffResult {
  success: boolean;
  summaryId?: string;
  error?: string;
  firebaseUpdated?: boolean;
}

/**
 * Handles the Firebase to MongoDB handoff when a summary is generated
 * This ensures Firebase progress is updated with MongoDB summary references
 */
export async function handleSummaryHandoff(
  userId: string,
  summary: ChildSummaryV1,
  profileId: string,
  runId: string,
  module: string
): Promise<HandoffResult> {
  try {
    console.log(`Starting Firebase-MongoDB handoff for user ${userId}, module ${module}`);
    
    // 1. Save summary to MongoDB
    const summaryData: SummaryV2 = {
      profileId,
      runId,
      summary,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const summaryId = await saveSummaryV2(summaryData);
    console.log(`Summary saved to MongoDB with ID: ${summaryId}`);
    
    // 2. Update Firebase progress with summary reference
    const firebaseProgress = await loadUserProgress(userId);
    if (firebaseProgress) {
      const updatedProgress: ProfileProgress = {
        ...firebaseProgress,
        summaryIds: [...(firebaseProgress.summaryIds || []), summaryId],
        lastSummarySync: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveUserProgress(userId, updatedProgress);
      console.log(`Firebase progress updated with summary ID: ${summaryId}`);
      
      return {
        success: true,
        summaryId,
        firebaseUpdated: true
      };
    } else {
      // If no Firebase progress exists, create a minimal record
      const newProgress: ProfileProgress = {
        answers: {},
        lastStep: 0,
        summaryIds: [summaryId],
        lastSummarySync: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveUserProgress(userId, newProgress);
      console.log(`New Firebase progress created with summary ID: ${summaryId}`);
      
      return {
        success: true,
        summaryId,
        firebaseUpdated: true
      };
    }
    
  } catch (error) {
    console.error('Firebase-MongoDB handoff failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Syncs all MongoDB summaries for a user back to Firebase progress
 * Useful for migration or data consistency checks
 */
export async function syncUserSummariesToFirebase(userId: string): Promise<HandoffResult> {
  try {
    console.log(`Syncing MongoDB summaries to Firebase for user ${userId}`);
    
    // Get all summaries for this user from MongoDB
    const summaries = await getSummariesV2ByUserId(userId);
    
    if (summaries.length === 0) {
      return {
        success: true,
        error: 'No summaries found for user'
      };
    }
    
    // Get current Firebase progress
    const firebaseProgress = await loadUserProgress(userId);
    
    // Extract summary IDs
    const summaryIds = summaries.map(s => s._id?.toString()).filter(Boolean) as string[];
    
    // Update Firebase progress
    const updatedProgress: ProfileProgress = {
      ...firebaseProgress,
      summaryIds,
      lastSummarySync: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await saveUserProgress(userId, updatedProgress);
    console.log(`Synced ${summaryIds.length} summaries to Firebase for user ${userId}`);
    
    return {
      success: true,
      firebaseUpdated: true
    };
    
  } catch (error) {
    console.error('Failed to sync summaries to Firebase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets the complete profile data for a user from both Firebase and MongoDB
 */
export async function getUserCompleteProfile(userId: string): Promise<{
  firebaseProgress: ProfileProgress | null;
  mongodbSummaries: SummaryV2[];
  summaryCount: number;
}> {
  try {
    const [firebaseProgress, mongodbSummaries] = await Promise.all([
      loadUserProgress(userId),
      getSummariesV2ByUserId(userId)
    ]);
    
    return {
      firebaseProgress,
      mongodbSummaries,
      summaryCount: mongodbSummaries.length
    };
    
  } catch (error) {
    console.error('Failed to get complete user profile:', error);
    return {
      firebaseProgress: null,
      mongodbSummaries: [],
      summaryCount: 0
    };
  }
}

/**
 * Validates that Firebase and MongoDB data are in sync for a user
 */
export async function validateUserDataSync(userId: string): Promise<{
  isSynced: boolean;
  firebaseSummaryIds: string[];
  mongodbSummaryIds: string[];
  missingInFirebase: string[];
  missingInMongoDB: string[];
}> {
  try {
    const { firebaseProgress, mongodbSummaries } = await getUserCompleteProfile(userId);
    
    const firebaseSummaryIds = firebaseProgress?.summaryIds || [];
    const mongodbSummaryIds = mongodbSummaries.map(s => s._id?.toString()).filter(Boolean) as string[];
    
    const missingInFirebase = mongodbSummaryIds.filter(id => !firebaseSummaryIds.includes(id));
    const missingInMongoDB = firebaseSummaryIds.filter(id => !mongodbSummaryIds.includes(id));
    
    const isSynced = missingInFirebase.length === 0 && missingInMongoDB.length === 0;
    
    return {
      isSynced,
      firebaseSummaryIds,
      mongodbSummaryIds,
      missingInFirebase,
      missingInMongoDB
    };
    
  } catch (error) {
    console.error('Failed to validate user data sync:', error);
    return {
      isSynced: false,
      firebaseSummaryIds: [],
      mongodbSummaryIds: [],
      missingInFirebase: [],
      missingInMongoDB: []
    };
  }
}
