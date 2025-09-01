import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB, deleteReferenceDocument } from '@/services/mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();
    
    const documentId = params.id;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteReferenceDocument(documentId);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Document not found or could not be deleted' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
