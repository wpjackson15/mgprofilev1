# Shadow Mode for V2 Summary Generation

This document explains how to enable and use the shadow mode functionality that generates structured Black Genius summaries alongside the existing MVP summary generation.

## Overview

Shadow mode runs in parallel with the existing MVP summary generation, creating structured summaries organized by Black Genius elements without affecting the current user experience.

## Features

- **Child-only summaries**: Focuses on describing the child's strengths and characteristics
- **Black Genius framework**: Organizes insights under 6 key elements
- **Strict validation**: Uses Zod schemas and linter to ensure quality
- **Non-prescriptive**: Rejects content that suggests strategies or activities
- **Shadow operation**: Runs alongside MVP without UI changes

## Black Genius Elements

1. **Interest Awareness** - Child's natural curiosities and passions
2. **Can-Do Attitude** - Persistence, help-seeking, and growth mindset
3. **Racial Identity** - Positive racial self-concept and pride
4. **Multicultural Navigation** - Comfort across different cultural contexts
5. **Selective Trust** - Discernment about who to trust and when
6. **Social Justice** - Awareness of fairness and equity (only if evidence exists)

## Enabling Shadow Mode

### Environment Variable

Set the feature flag in your environment:

```bash
# .env.local
SUMMARY_SHADOW=true
```

### Netlify Environment Variables

For production deployment, add to Netlify environment variables:

```
SUMMARY_SHADOW = true
```

## Data Storage

Shadow summaries are stored in the `summaries_v2` MongoDB collection with the following structure:

```javascript
{
  _id: ObjectId,
  profileId: string,        // Links to student profile
  runId: string,           // Unique identifier for this generation
  summary: ChildSummaryV1, // Structured summary data
  tokens: {                // Optional token usage
    input: number,
    output: number
  },
  model: string,           // AI model used
  contextSnapshot: any[],  // Optional context data
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Health Check
```
GET /api/v2/summary/ping
```
Returns: `{ ok: true, schemaVersion: "1.0.0" }`

### Finalize Summary
```
POST /api/v2/summary/finalize
```
Body:
```javascript
{
  profileId: string,
  runId: string,
  summary: ChildSummaryV1,
  tokens?: { input: number, output: number },
  model?: string,
  contextSnapshot?: any[]
}
```

## Integration

The shadow mode is automatically integrated into the existing summary generation flow when enabled. It runs in the background and logs its activity to the console.

### Manual Integration

To manually trigger shadow summaries:

```javascript
import { useShadowSummary } from '../hooks/useShadowSummary';

const { generateShadowSummary } = useShadowSummary({
  profileId: 'student-123',
  userId: 'user-456'
});

// Generate shadow summary
await generateShadowSummary('module-name', ['answer1', 'answer2']);
```

## Monitoring

### Metrics

The system tracks the following metrics (logged to console):

- `summary_v2_attempt_total` - Total generation attempts
- `summary_v2_success_total` - Successful generations
- `summary_v2_schema_mismatch_total` - Schema validation failures
- `summary_v2_linter_block_total` - Prescriptive content blocked
- `summary_v2_api_error_total` - API call failures

### Logs

Look for console logs with:
- `Shadow summary generated and stored for [module]`
- `Failed to generate shadow summary for [module]`
- `METRIC: [metric_name] = [value]`

## Validation

### Schema Validation

Summaries must conform to the `ChildSummaryV1` schema:
- Each section has 80-220 words of text
- Evidence array contains 0-5 short quotes
- Confidence score between 0-1
- Required metadata (runId, model, createdAt)

### Content Linter

The linter rejects content containing:
- Prescriptive verbs: use, assign, plan, try, implement
- Strategy words: lesson, strategy, worksheet, activity
- Prescriptive phrases: "teacher should", "next steps", "recommendations"

## Troubleshooting

### Shadow Mode Not Running

1. Check `SUMMARY_SHADOW=true` is set
2. Verify console logs show "Shadow summary generated"
3. Check MongoDB for `summaries_v2` collection

### Validation Errors

1. Check console for schema validation errors
2. Review linter violations in logs
3. Verify Claude API responses are valid JSON

### Database Issues

1. Ensure MongoDB connection is working
2. Check `summaries_v2` collection exists
3. Verify indexes are created (runId unique, profileId + createdAt)

## Future Enhancements

- Enhanced evidence categorization by question content
- Vector search integration for context retrieval
- Webhook integration with n8n
- Advanced metrics and monitoring
- UI for viewing structured summaries
