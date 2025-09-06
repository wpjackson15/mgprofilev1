import { NextRequest, NextResponse } from 'next/server';
import { 
  handleSummaryHandoff, 
  syncUserSummariesToFirebase, 
  getUserCompleteProfile,
  validateUserDataSync 
} from '@/services/firebaseMongoHandoff';
import { ChildSummaryV1 } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, summary, profileId, runId, module } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'handoff':
        if (!summary || !profileId || !runId || !module) {
          return NextResponse.json(
            { error: 'summary, profileId, runId, and module are required for handoff' },
            { status: 400 }
          );
        }
        
        const handoffResult = await handleSummaryHandoff(
          userId,
          summary as ChildSummaryV1,
          profileId,
          runId,
          module
        );
        
        return NextResponse.json(handoffResult);

      case 'sync':
        const syncResult = await syncUserSummariesToFirebase(userId);
        return NextResponse.json(syncResult);

      case 'getProfile':
        const profileResult = await getUserCompleteProfile(userId);
        return NextResponse.json({ success: true, ...profileResult });

      case 'validate':
        const validationResult = await validateUserDataSync(userId);
        return NextResponse.json({ success: true, ...validationResult });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: handoff, sync, getProfile, validate' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Handoff API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
