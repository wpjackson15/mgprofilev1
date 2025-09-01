import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Linter function that rejects text containing prescriptive verbs and phrases
 * Used to ensure summaries are child-only and don't contain strategies or prescriptions
 */
export function lintNoPrescriptions(text: string): { isValid: boolean; violations: string[] } {
  // Very permissive patterns - only block the most egregious prescriptive content
  const prescriptivePatterns = [
    // Block explicit recommendations to adults
    /\b(teacher|educator|parent|caregiver)\s+(should|must|need|will)\b/i,
    // Block explicit next steps or recommendations
    /\b(next\s+steps?|recommendations?|suggestions?)\b/i,
    // Block explicit lesson/activity creation instructions
    /\b(provide|create|develop|design)\s+(a|an|the)\s+(lesson|activity|strategy|plan)\b/i
  ];

  const violations: string[] = [];
  
  for (const pattern of prescriptivePatterns) {
    if (pattern.test(text)) {
      violations.push(`Contains prescriptive pattern: ${pattern.source}`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}
