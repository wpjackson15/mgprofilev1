import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, saveSummaryV2, getSummaryV2ByRunId } from '../../../../../services/mongodb';
import { ChildSummaryV1 } from '../../../../../lib/schemas';
import { lintNoPrescriptions } from '../../../../../lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.profileId || !body.runId || !body.summary) {
      return NextResponse.json(
        { error: 'Missing required fields: profileId, runId, summary' },
        { status: 400 }
      );
    }

    // Check for duplicate runId
    await connectToMongoDB();
    const existing = await getSummaryV2ByRunId(body.runId);
    if (existing) {
      return NextResponse.json(
        { error: 'Duplicate runId' },
        { status: 409 }
      );
    }

    // Validate summary schema
    const validationResult = ChildSummaryV1.safeParse(body.summary);
    if (!validationResult.success) {
      console.log('Schema validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid summary schema',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // Run linter on all section text
    const allText = validationResult.data.sections 
      ? Object.values(validationResult.data.sections)
          .map(section => section.text)
          .join(' ')
      : '';
    
    const lintResult = lintNoPrescriptions(allText);
    if (!lintResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Summary contains prescriptive content',
          violations: lintResult.violations 
        },
        { status: 400 }
      );
    }

    // Save to database
    const summaryData = {
      profileId: body.profileId,
      runId: body.runId,
      summary: validationResult.data,
      tokens: body.tokens,
      model: body.model,
      contextSnapshot: body.contextSnapshot
    };

    const id = await saveSummaryV2(summaryData);

    return NextResponse.json({ 
      ok: true, 
      id,
      schemaVersion: "1.0.0"
    });

  } catch (error) {
    console.error('Summary V2 finalize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
