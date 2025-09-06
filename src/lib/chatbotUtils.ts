import { CHILD_INFO_STEPS, MODULE_NAMES, ID_GENERATION } from './chatbotConstants';

/**
 * Extracts child information from chatbot answers
 * Centralizes the logic for getting child name and pronouns
 */
export function extractChildInfo(answers: Record<string, string[]>): {
  name: string;
  pronouns: string;
} {
  const childNameAnswers = answers[`${MODULE_NAMES.INTEREST_AWARENESS}-${CHILD_INFO_STEPS.NAME_STEP_INDEX}`] || [];
  const childPronounsAnswers = answers[`${MODULE_NAMES.INTEREST_AWARENESS}-${CHILD_INFO_STEPS.PRONOUNS_STEP_INDEX}`] || [];
  
  return {
    name: childNameAnswers[0] || "",
    pronouns: childPronounsAnswers[0] || ""
  };
}

/**
 * Generates unique IDs for profiles and runs
 * Replaces magic number usage with named constants
 */
export function generateUniqueIds(userId: string, module: string): {
  userPrefix: string;
  profileId: string;
  runId: string;
} {
  const userPrefix = `user-${userId}`;
  const profileId = `${userPrefix}-${module}-${Date.now()}`;
  const runId = `${profileId}-${Math.random().toString(ID_GENERATION.RANDOM_ID_BASE).substr(ID_GENERATION.RANDOM_ID_START_INDEX, ID_GENERATION.RANDOM_ID_LENGTH)}`;
  
  return { userPrefix, profileId, runId };
}

/**
 * Creates a summary object for handoff operations
 * Centralizes the summary object creation logic
 */
export function createSummaryObject(
  profileId: string,
  runId: string,
  module: string,
  summaryText: string
) {
  return {
    schemaVersion: "1.0.0",
    studentId: profileId,
    sections: {
      [module.toLowerCase().replace(/\s+/g, '_')]: {
        text: summaryText,
        evidence: [],
        confidence: 1.0
      }
    },
    meta: {
      runId,
      model: 'claude-sonnet-4-20250514',
      createdAt: new Date().toISOString()
    }
  };
}
