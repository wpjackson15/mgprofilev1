import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, getDb } from '@/services/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const moduleId = searchParams.get('moduleId') || 'default';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectToMongoDB();
    const db = getDb();
    const collection = db.collection('userProgress');

    const progress = await collection.findOne({ userId, moduleId });

    if (!progress) {
      return NextResponse.json(null);
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error loading user progress:', error);
    return NextResponse.json(
      { error: 'Failed to load user progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, moduleId = 'default', ...data } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectToMongoDB();
    const db = getDb();
    const collection = db.collection('userProgress');

    const now = new Date();
    const progressData = {
      userId,
      moduleId,
      ...data,
      updatedAt: now,
      createdAt: now
    };

    // Upsert: update if exists, insert if not
    await collection.updateOne(
      { userId, moduleId },
      { $set: progressData },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'User progress saved successfully' 
    });
  } catch (error) {
    console.error('Error saving user progress:', error);
    return NextResponse.json(
      { error: 'Failed to save user progress' },
      { status: 500 }
    );
  }
}
