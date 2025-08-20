import { Handler } from '@netlify/functions';
import { connectToMongoDB } from './mongodb-connection';
import { ObjectId } from 'mongodb';

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get file ID from path
    const fileId = event.path.split('/').pop();
    if (!fileId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'File ID is required' }),
      };
    }

    // Connect to MongoDB
    const db = await connectToMongoDB();
    const collection = db.collection('uploadedFiles');

    // Get file from MongoDB
    const file = await collection.findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file.fileData, 'base64');

    // Return file with appropriate headers
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': file.fileType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${file.fileName}"`,
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error serving file:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
