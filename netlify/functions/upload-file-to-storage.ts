import { Handler } from '@netlify/functions';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Initialize Firebase (server-side)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);
const db = getFirestore(app);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('=== File Upload to Storage ===');
    
    // Parse multipart form data
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Expected multipart/form-data' }),
      };
    }

    const body = event.body || '';
    
    // Extract boundary
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      console.error('No boundary found in content type');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No boundary found in content type' }),
      };
    }

    const boundary = boundaryMatch[1];
    console.log('Boundary:', boundary);
    
    // Split by boundary and find the file part
    const boundaryStart = `--${boundary}`;
    const parts = body.split(boundaryStart);
    console.log('Found', parts.length, 'parts in multipart data');
    
    let fileData = null;
    let fileName = 'unknown';
    let userId = '';
    
    // Find the file part and userId
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.trim().length === 0) continue;
      
      console.log(`Part ${i} starts with:`, part.substring(0, 200));
      
      // Look for file part - check multiple patterns
      if (part.includes('name="file"') || part.includes("name='file'") || part.includes('name=file')) {
        console.log(`Found file part at index ${i}`);
        
        // Extract filename
        const filenameMatch = part.match(/filename="([^"]*)"/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
          console.log('File name:', fileName);
        }
        
        // Find the end of headers - try multiple patterns
        let headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          headerEnd = part.indexOf('\n\n');
        }
        if (headerEnd === -1) {
          headerEnd = part.indexOf('\r\n\r\n');
        }
        
        if (headerEnd !== -1) {
          // Extract file data
          fileData = part.substring(headerEnd + (part.includes('\r\n\r\n') ? 4 : 2));
          
          // Remove trailing boundary if present
          const boundaryEnd = `--${boundary}--`;
          if (fileData.endsWith(boundaryEnd)) {
            fileData = fileData.substring(0, fileData.length - boundaryEnd.length - 2);
          }
          
          console.log('File data extracted, length:', fileData.length);
          break;
        }
      }
      
      // Look for userId part - check multiple patterns
      if (part.includes('name="userId"') || part.includes("name='userId'") || part.includes('name=userId')) {
        console.log(`Found userId part at index ${i}`);
        
        // Find the end of headers
        let headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          headerEnd = part.indexOf('\n\n');
        }
        
        if (headerEnd !== -1) {
          // Extract userId
          userId = part.substring(headerEnd + (part.includes('\r\n\r\n') ? 4 : 2));
          
          // Remove trailing boundary if present
          const boundaryEnd = `--${boundary}--`;
          if (userId.endsWith(boundaryEnd)) {
            userId = userId.substring(0, userId.length - boundaryEnd.length - 2);
          }
          
          console.log('User ID:', userId);
        }
      }
    }
    
    // If we still haven't found the file part, try a more flexible approach
    if (!fileData) {
      console.log('Trying flexible file part detection...');
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.trim().length === 0) continue;
        
        // Look for any part that contains file content indicators
        if (part.includes('Content-Type:') && (part.includes('.pdf') || part.includes('PDF'))) {
          console.log(`Found potential file part at index ${i} using flexible detection`);
          
          // Extract filename if present
          const filenameMatch = part.match(/filename="([^"]*)"/);
          if (filenameMatch) {
            fileName = filenameMatch[1];
            console.log('File name:', fileName);
          }
          
          // Find the end of headers
          let headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) {
            headerEnd = part.indexOf('\n\n');
          }
          
          if (headerEnd !== -1) {
            // Extract file data
            fileData = part.substring(headerEnd + (part.includes('\r\n\r\n') ? 4 : 2));
            
            // Remove trailing boundary if present
            const boundaryEnd = `--${boundary}--`;
            if (fileData.endsWith(boundaryEnd)) {
              fileData = fileData.substring(0, fileData.length - boundaryEnd.length - 2);
            }
            
            console.log('File data extracted, length:', fileData.length);
            break;
          }
        }
      }
    }
    
    if (!fileData) {
      console.error('No file data found in multipart form');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file provided' }),
      };
    }

    if (!userId) {
      console.error('No userId provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    // Create a unique file ID
    const fileId = `${userId}_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create storage reference
    const storageRef = ref(storage, `uploads/${userId}/${fileId}`);
    
    // Convert file data to Buffer
    const fileBuffer = Buffer.from(fileData, 'binary');
    
    // Upload file to Firebase Storage
    console.log('Uploading file to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Create file metadata
    const fileMetadata = {
      id: fileId,
      fileName: fileName,
      fileUrl: downloadURL,
      fileType: 'application/pdf', // Assuming PDF for now
      fileSize: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      userId: userId,
      status: 'uploaded'
    };
    
    // Save metadata to Firestore
    console.log('Saving metadata to Firestore...');
    const fileDocRef = doc(db, 'uploadedFiles', fileId);
    await setDoc(fileDocRef, fileMetadata);
    
    console.log('File uploaded successfully:', fileId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        file: fileMetadata
      }),
    };
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Failed to upload file to storage',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 