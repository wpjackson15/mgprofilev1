import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, getDb } from '@/services/mongodb';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing MongoDB connection...');
  
  try {
    // Test 1: Check if MONGODB_URI_NEW is set
    const hasUri = !!process.env.MONGODB_URI_NEW;
    console.log('MONGODB_URI_NEW available:', hasUri);
    
    if (!hasUri) {
      return NextResponse.json({
        error: 'MONGODB_URI_NEW not set',
        test: 'environment'
      }, { status: 500 });
    }
    
    // Test 2: Try to connect with timeout
    console.log('Attempting MongoDB connection...');
    const startTime = Date.now();
    
    await Promise.race([
      connectToMongoDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ]);
    
    const connectionTime = Date.now() - startTime;
    console.log('✅ MongoDB connected successfully in', connectionTime, 'ms');
    
    // Test 3: Try a simple database operation
    console.log('Testing database operation...');
    const db = getDb();
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({
      success: true,
      connectionTime: `${connectionTime}ms`,
      collections: collections.map(c => c.name),
      message: 'MongoDB connection and operations working'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MongoDB test failed:', errorMessage);
    
    return NextResponse.json({
      error: 'MongoDB connection failed',
      details: errorMessage,
      test: 'connection'
    }, { status: 500 });
  }
}
