import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    schemaVersion: "1.0.0",
    timestamp: new Date().toISOString()
  });
}
