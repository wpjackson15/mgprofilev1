import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, saveReferenceDocument } from '@/services/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB();
    
    const body = await request.json();
    const { title, content, category, tags, status, priority, documentType, usageTags, priorityScores } = body;
    
    // Validate required fields
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, category' },
        { status: 400 }
      );
    }
    
    // Create document object
    const document = {
      title,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status: status || 'published',
      priority: priority || 'medium',
      documentType: documentType || 'both',
      usageTags: usageTags || {
        lessonPlans: true,
        profiles: true,
        examples: false,
        bestPractices: false
      },
      priorityScores: priorityScores || {
        lessonPlans: 7,
        profiles: 7
      },
      userId: 'admin' // For now, all documents are admin-uploaded
    };
    
    // Save to database
    const documentId = await saveReferenceDocument(document);
    
    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
