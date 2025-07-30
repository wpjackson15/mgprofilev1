import { google } from 'googleapis';
import type { Handler } from '@netlify/functions';

interface CreateGoogleDocRequest {
  title: string;
  content: string;
  studentProfiles: Array<{
    name: string;
    grade: string;
    subject: string;
    profile: string;
  }>;
}

interface CreateGoogleDocResponse {
  success: boolean;
  documentUrl?: string;
  error?: string;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { title, content, studentProfiles }: CreateGoogleDocRequest = JSON.parse(event.body || '{}');

    if (!title || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Title and content are required' })
      };
    }

    // Initialize Google Docs API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/documents']
    });

    const docs = google.docs({ version: 'v1', auth });

    // Create the document
    const document = await docs.documents.create({
      requestBody: {
        title: title
      }
    });

    const documentId = document.data.documentId;

    if (!documentId) {
      throw new Error('Failed to create document');
    }

    // Prepare the content for the document
    const requests = [
      {
        insertText: {
          location: {
            index: 1
          },
          text: title + '\n\n'
        }
      },
      {
        updateParagraphStyle: {
          range: {
            startIndex: 1,
            endIndex: title.length + 1
          },
          paragraphStyle: {
            namedStyleType: 'TITLE'
          },
          fields: 'namedStyleType'
        }
      }
    ];

    // Add the main content
    const contentIndex = title.length + 3;
    requests.push({
      insertText: {
        location: {
          index: contentIndex
        },
        text: content + '\n\n'
      }
    });

    // Add student profiles if provided
    if (studentProfiles && studentProfiles.length > 0) {
      let profileIndex = contentIndex + content.length + 2;
      
      requests.push({
        insertText: {
          location: {
            index: profileIndex
          },
          text: 'Student Profiles:\n'
        }
      });

      profileIndex += 'Student Profiles:\n'.length;

      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: profileIndex - 'Student Profiles:\n'.length,
            endIndex: profileIndex
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_2'
          },
          fields: 'namedStyleType'
        }
      });

      studentProfiles.forEach((profile, index) => {
        const profileText = `${profile.name} (${profile.grade})\nSubject: ${profile.subject}\nProfile: ${profile.profile.substring(0, 200)}${profile.profile.length > 200 ? '...' : ''}\n\n`;
        
        requests.push({
          insertText: {
            location: {
              index: profileIndex
            },
            text: profileText
          }
        });

        profileIndex += profileText.length;
      });
    }

    // Apply the requests to the document
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: requests
      }
    });

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        documentUrl: documentUrl
      } as CreateGoogleDocResponse)
    };

  } catch (error) {
    console.error('Error creating Google Doc:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create Google Doc'
      } as CreateGoogleDocResponse)
    };
  }
};

export { handler }; 