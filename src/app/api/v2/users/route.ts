import { NextResponse } from 'next/server';
import { getAllUserRoles } from '@/lib/userRoleManager';

export async function GET() {
  try {
    const users = await getAllUserRoles();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
