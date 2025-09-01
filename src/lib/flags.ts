/**
 * Feature flags for the application
 * All new features should be behind flags to ensure MVP stability
 */

export const FEATURE_FLAGS = {
  // Shadow mode for V2 summary generation
  // When true, generates structured Black Genius summaries in addition to MVP summaries
  SUMMARY_SHADOW: process.env.NEXT_PUBLIC_SUMMARY_SHADOW === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all feature flags (useful for debugging)
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...FEATURE_FLAGS };
}
