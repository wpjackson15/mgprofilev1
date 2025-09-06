/**
 * Constants for chatbot functionality
 * Eliminates magic numbers and hardcoded values
 */

// Child information collection step indices in Interest Awareness module
export const CHILD_INFO_STEPS = {
  NAME_STEP_INDEX: 3,
  PRONOUNS_STEP_INDEX: 4,
} as const;

// Random ID generation constants
export const ID_GENERATION = {
  RANDOM_ID_LENGTH: 9,
  RANDOM_ID_BASE: 36,
  RANDOM_ID_START_INDEX: 2,
} as const;

// Module names for consistent referencing
export const MODULE_NAMES = {
  INTEREST_AWARENESS: 'Interest Awareness',
} as const;

// Summary generation constants
export const SUMMARY_CONFIG = {
  SCHEMA_VERSION: '1.0.0',
  DEFAULT_CONFIDENCE: 1.0,
} as const;
