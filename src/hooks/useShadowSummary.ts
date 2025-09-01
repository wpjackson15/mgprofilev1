import { useCallback } from 'react';
import { isFeatureEnabled } from '../lib/flags';
import { ClaudeSummarizerV2 } from '../services/ClaudeSummarizerV2';

interface ShadowSummaryOptions {
  profileId: string;
  userId: string;
}

export function useShadowSummary(options: ShadowSummaryOptions) {
  const generateShadowSummary = useCallback(async (
    module: string, 
    answers: string[]
  ): Promise<void> => {
    // Only run if shadow mode is enabled
    if (!isFeatureEnabled('SUMMARY_SHADOW')) {
      return;
    }

    try {
      // Generate unique runId
      const runId = `${options.profileId}-${module}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create V2 summarizer
      const summarizer = new ClaudeSummarizerV2({
        runId,
        profileId: options.profileId,
      });

      // Generate structured summary
      const summary = await summarizer.generateSummary(answers);
      
      if (summary) {
        // Update summary with proper metadata
        summary.studentId = options.profileId;
        summary.meta.runId = runId;
        summary.meta.model = 'claude-3-5-sonnet-20240620';
        summary.meta.createdAt = new Date().toISOString();

        // Finalize and store
        const success = await summarizer.finalizeSummary(summary);
        
        if (success) {
          console.log(`Shadow summary generated and stored for ${module}`, { runId });
        } else {
          console.error(`Failed to finalize shadow summary for ${module}`, { runId });
        }
      } else {
        console.error(`Failed to generate shadow summary for ${module}`, { runId });
      }

    } catch (error) {
      console.error('Shadow summary generation error:', error);
      // Don't throw - this is shadow mode, shouldn't affect main flow
    }
  }, [options.profileId]);

  return {
    generateShadowSummary,
    isShadowEnabled: isFeatureEnabled('SUMMARY_SHADOW')
  };
}
