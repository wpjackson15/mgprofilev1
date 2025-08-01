import { Handler } from '@netlify/functions';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { events, sessionId, userId }: { 
      events: AnalyticsEvent[], 
      sessionId: string, 
      userId?: string 
    } = JSON.parse(event.body || '{}');

    if (!events || !Array.isArray(events)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid events data' })
      };
    }

    // Log analytics events (in production, you'd store these in a database)
    console.log('Analytics Events Received:', {
      sessionId,
      userId,
      eventCount: events.length,
      events: events.map(e => ({
        event: e.event,
        timestamp: new Date(e.timestamp).toISOString(),
        properties: e.properties
      }))
    });

    // In a real implementation, you would:
    // 1. Store events in a database (Firestore, PostgreSQL, etc.)
    // 2. Process events for real-time analytics
    // 3. Generate reports and insights
    // 4. Trigger paywall logic based on usage

    // For now, we'll just acknowledge receipt
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
        message: `Received ${events.length} analytics events`,
        sessionId,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Analytics processing error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Failed to process analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 