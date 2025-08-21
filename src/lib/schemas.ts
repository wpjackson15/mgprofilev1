import { z } from "zod";

// Core input schemas
export const StepInput = z.object({
  profileId: z.string().min(10),
  userId: z.string().min(1),
  idx: z.number().int().nonnegative(),
  element: z.enum([
    "interestAwareness",
    "racialPride", 
    "canDoAttitude",
    "multiculturalNavigation",
    "selectiveTrust",
    "socialJustice"
  ]),
  question: z.string().min(3),
  answer: z.string().min(1),
  ts: z.string().datetime()
});

export const ProfileReadyEvent = z.object({
  profileId: z.string(),
  userId: z.string(),
  contentHash: z.string().length(64),
  schemaVersion: z.string()
});

export const ClaudeSummaryRequest = z.object({
  runId: z.string(),
  profileId: z.string(),
  userId: z.string(),
  normalized: z.object({
    interestAwareness: z.array(z.string()).min(1),
    racialPride: z.array(z.string()).min(1),
    canDoAttitude: z.array(z.string()).min(1),
    multiculturalNavigation: z.array(z.string()).min(1),
    selectiveTrust: z.array(z.string()).min(1),
    socialJustice: z.array(z.string()).min(1),
  }),
  retrievalContext: z.array(z.object({
    source: z.string(),
    title: z.string(),
    chunk: z.string()
  })).max(12),
  schemaVersion: z.string()
});

export const ClaudeSummaryResponse = z.object({
  geniusElements: z.object({
    interestAwareness: z.string().min(20),
    racialPride: z.string().min(20),
    canDoAttitude: z.string().min(20),
    multiculturalNavigation: z.string().min(20),
    selectiveTrust: z.string().min(20),
    socialJustice: z.string().min(20),
  }),
  strengths: z.array(z.string()).max(8),
  growthEdges: z.array(z.string()).max(8),
  relationshipMovesForAdults: z.array(z.string()).max(10),
  cautions: z.array(z.string()).max(6),
  flags: z.object({
    missingData: z.array(z.string()),
    offTopic: z.boolean().default(false),
    safetyConcerns: z.boolean().default(false)
  })
});

// Type exports
export type StepInput = z.infer<typeof StepInput>;
export type ProfileReadyEvent = z.infer<typeof ProfileReadyEvent>;
export type ClaudeSummaryRequest = z.infer<typeof ClaudeSummaryRequest>;
export type ClaudeSummaryResponse = z.infer<typeof ClaudeSummaryResponse>;
