import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, getReferenceDocuments } from '@/services/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToMongoDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const documents = await getReferenceDocuments(category || undefined);
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
