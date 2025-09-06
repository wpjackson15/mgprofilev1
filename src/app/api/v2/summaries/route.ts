import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, getAllSummariesV2, getSummariesV2ByUserId } from '@/services/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    await connectToMongoDB();

    let summaries;
    if (userId) {
      summaries = await getSummariesV2ByUserId(userId);
    } else {
      summaries = await getAllSummariesV2();
    }

    return NextResponse.json({ 
      success: true,
      summaries,
      count: summaries.length
    });

  } catch (error) {
    console.error('Error fetching summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    );
  }
}
