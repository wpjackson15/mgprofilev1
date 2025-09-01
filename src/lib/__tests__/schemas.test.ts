import { ChildSummaryV1 } from '../schemas';
import { lintNoPrescriptions } from '../utils';

describe('ChildSummaryV1 Schema', () => {
  const validSummary = {
    schemaVersion: "1.0.0" as const,
    studentId: "student-123",
    sections: {
      interest_awareness: {
        text: "This child shows a natural curiosity about the world around them. They frequently ask questions about how things work and demonstrate enthusiasm when learning about new topics. Their eyes light up when discussing their favorite subjects, and they often spend extended periods exploring topics that capture their attention.",
        evidence: ["'I love learning about space!'", "'How does that work?'"],
        confidence: 0.85
      },
      can_do_attitude: {
        text: "When faced with challenges, this child demonstrates persistence and a positive approach to problem-solving. They don't give up easily and often ask for help when needed. They show excitement about trying new things and celebrate their successes with genuine joy.",
        evidence: ["'I can do this!'", "'Can you help me figure this out?'"],
        confidence: 0.9
      }
    },
    meta: {
      runId: "run-123",
      model: "claude-3-5-sonnet-20240620",
      createdAt: new Date().toISOString()
    }
  };

  it('should validate a correct summary', () => {
    const result = ChildSummaryV1.safeParse(validSummary);
    expect(result.success).toBe(true);
  });

  it('should reject summary with wrong schema version', () => {
    const invalidSummary = {
      ...validSummary,
      schemaVersion: "2.0.0"
    };
    const result = ChildSummaryV1.safeParse(invalidSummary);
    expect(result.success).toBe(false);
  });

  it('should reject summary with missing studentId', () => {
    const invalidSummary = {
      ...validSummary,
      studentId: ""
    };
    const result = ChildSummaryV1.safeParse(invalidSummary);
    expect(result.success).toBe(false);
  });

  it('should reject section with text too short', () => {
    const invalidSummary = {
      ...validSummary,
      sections: {
        interest_awareness: {
          text: "Too short",
          evidence: [],
          confidence: 0.5
        }
      }
    };
    const result = ChildSummaryV1.safeParse(invalidSummary);
    expect(result.success).toBe(false);
  });

  it('should reject section with text too long', () => {
    const longText = "a".repeat(300);
    const invalidSummary = {
      ...validSummary,
      sections: {
        interest_awareness: {
          text: longText,
          evidence: [],
          confidence: 0.5
        }
      }
    };
    const result = ChildSummaryV1.safeParse(invalidSummary);
    expect(result.success).toBe(false);
  });

  it('should reject section with too many evidence items', () => {
    const invalidSummary = {
      ...validSummary,
      sections: {
        interest_awareness: {
          text: "Valid text that meets the minimum length requirement for testing purposes.",
          evidence: ["quote1", "quote2", "quote3", "quote4", "quote5", "quote6"],
          confidence: 0.5
        }
      }
    };
    const result = ChildSummaryV1.safeParse(invalidSummary);
    expect(result.success).toBe(false);
  });

  it('should reject section with confidence outside range', () => {
    const invalidSummary = {
      ...validSummary,
      sections: {
        interest_awareness: {
          text: "Valid text that meets the minimum length requirement for testing purposes.",
          evidence: [],
          confidence: 1.5
        }
      }
    };
    const result = ChildSummaryV1.safeParse(invalidSummary);
    expect(result.success).toBe(false);
  });
});

describe('No Prescriptions Linter', () => {
  it('should accept child-only text', () => {
    const text = "This child shows interest in science and asks many questions about how things work.";
    const result = lintNoPrescriptions(text);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should reject text with prescriptive verbs', () => {
    const text = "The teacher should use hands-on activities to engage this child.";
    const result = lintNoPrescriptions(text);
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should reject text with strategy words', () => {
    const text = "This child would benefit from a lesson plan focused on their interests.";
    const result = lintNoPrescriptions(text);
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should reject text with prescriptive phrases', () => {
    const text = "Next steps should include providing worksheets for practice.";
    const result = lintNoPrescriptions(text);
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should reject text with teacher recommendations', () => {
    const text = "The teacher must implement strategies to support this child's learning.";
    const result = lintNoPrescriptions(text);
    expect(result.isValid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
