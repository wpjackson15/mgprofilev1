import { useEffect } from 'react';
import { useShadowSummary } from '../hooks/useShadowSummary';
import { isFeatureEnabled } from '../lib/flags';

interface ShadowSummaryWrapperProps {
  profileId: string;
  userId: string;
  module: string;
  answers: string[];
  onSummaryGenerated?: (success: boolean) => void;
}

/**
 * Wrapper component that generates shadow summaries when enabled
 * This can be integrated into existing components without changing their behavior
 */
export function ShadowSummaryWrapper({
  profileId,
  userId,
  module,
  answers,
  onSummaryGenerated
}: ShadowSummaryWrapperProps) {
  const { generateShadowSummary, isShadowEnabled } = useShadowSummary({
    profileId,
    userId
  });

  useEffect(() => {
    // Only run if shadow mode is enabled and we have answers
    if (isShadowEnabled && answers.length > 0) {
      generateShadowSummary(module, answers)
        .then(() => {
          onSummaryGenerated?.(true);
        })
        .catch((error) => {
          console.error('Shadow summary generation failed:', error);
          onSummaryGenerated?.(false);
        });
    }
  }, [module, answers, generateShadowSummary, isShadowEnabled, onSummaryGenerated]);

  // This component doesn't render anything - it's purely for side effects
  return null;
}

/**
 * Hook for easy integration into existing components
 * Usage: useShadowSummaryTrigger({ profileId, userId, module, answers })
 */
export function useShadowSummaryTrigger({
  profileId,
  userId,
  module,
  answers
}: {
  profileId: string;
  userId: string;
  module: string;
  answers: string[];
}) {
  const { generateShadowSummary, isShadowEnabled } = useShadowSummary({
    profileId,
    userId
  });

  const triggerShadowSummary = async () => {
    if (isShadowEnabled && answers.length > 0) {
      try {
        await generateShadowSummary(module, answers);
        console.log(`Shadow summary triggered for ${module}`);
        return true;
      } catch (error) {
        console.error('Shadow summary generation failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    triggerShadowSummary,
    isShadowEnabled
  };
}
