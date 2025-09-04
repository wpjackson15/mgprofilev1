import { NextRequest, NextResponse } from 'next/server';
import { ClaudeSummarizerV2 } from '../../../../../services/ClaudeSummarizerV2';
import { connectToMongoDB } from '../../../../../services/mongodb';

export async function POST(request: NextRequest) {
  console.log('🚀 FUNCTION CALLED - BEFORE TRY BLOCK');
  try {
    console.log('=== API ROUTE START ===');
    
    // Debug: Check if API key is available
    console.log('CLAUDE_API_KEY available:', !!process.env.CLAUDE_API_KEY);
    
    
    const body = await request.json();
    console.log('Request body parsed successfully');
    
    // Validate input
    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid answers array' },
        { status: 400 }
      );
    }

    if (!body.runId || !body.profileId) {
      return NextResponse.json(
        { error: 'Missing runId or profileId' },
        { status: 400 }
      );
    }

    console.log('Input validation passed');

    // Create V2 summarizer
    const summarizer = new ClaudeSummarizerV2({
      runId: body.runId,
      profileId: body.profileId,
      includeDocuments: false, // Temporarily disabled RAG to test performance
    });

    console.log('Summarizer created, calling generateSummary...');

    // Generate summary
    console.log('Generating summary with answers:', body.answers.length, 'answers');
    const summary = await summarizer.generateSummary(body.module || 'Interest Awareness', body.answers);
    
    await connectToMongoDB();
    console.log("MongoDB connected, proceeding to save summary");
    
    if (!summary) {
      console.error('Summary generation returned null');
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Update summary with proper metadata
    summary.studentId = body.profileId;
    summary.meta.runId = body.runId;
    summary.meta.model = 'claude-sonnet-4-20250514';
    summary.meta.createdAt = new Date().toISOString();

    // Store in database
    const success = await summarizer.finalizeSummary(summary);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to store summary' },
        { status: 500 }
      );
    }

    // Convert to readable text for display
    const summaryText = summary.sections 
      ? Object.entries(summary.sections)
          .map(([element, section]) => {
            const elementName = element.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${elementName}:\n${section.text}`;
          })
          .join('\n\n')
      : 'No sections available';

    return NextResponse.json({ 
      success: true,
      summary: summaryText,
      structuredSummary: summary
    });

  } catch (error) {
    console.error('V2 summary generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
