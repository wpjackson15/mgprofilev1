import { handleSummaryHandoff } from './firebaseMongoHandoff';
import { generateUniqueIds, createSummaryObject } from '@/lib/chatbotUtils';
import { ChildSummaryV1 } from '@/lib/schemas';

/**
 * Service for handling summary handoff operations
 * Extracts complex handoff logic from the main chatbot component
 */
export class SummaryHandoffService {
  /**
   * Handles the complete handoff process for a generated summary
   * @param userId - The user's ID
   * @param module - The module name
   * @param summaryText - The generated summary text
   * @returns Promise with handoff result
   */
  static async processSummaryHandoff(
    userId: string,
    module: string,
    summaryText: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Processing summary handoff for user ${userId}, module ${module}`);
      
      // Generate unique IDs
      const { profileId, runId } = generateUniqueIds(userId, module);
      
      // Create summary object
      const summaryObject = createSummaryObject(profileId, runId, module, summaryText);
      
      // Perform the handoff
      const handoffResult = await handleSummaryHandoff(
        userId,
        summaryObject as ChildSummaryV1,
        profileId,
        runId,
        module
      );
      
      if (handoffResult.success) {
        console.log("Summary handoff successful:", handoffResult);
        return { success: true };
      } else {
        console.warn("Summary handoff failed:", handoffResult.error);
        return { success: false, error: handoffResult.error };
      }
    } catch (error) {
      console.error("Summary handoff service error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown handoff error' 
      };
    }
  }
}
