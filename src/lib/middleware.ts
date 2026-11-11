import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { AuthPayload } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthPayload;
}

/**
 * Middleware to verify JWT token from cookies or headers
 */
export async function withAuth(req: NextRequest): Promise<{
  user: AuthPayload | null;
  error?: string;
}> {
  try {
    // Try to get token from cookies
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return { user: null, error: 'No token provided' };
    }

    const user = verifyToken(token);

    if (!user) {
      return { user: null, error: 'Invalid token' };
    }

    return { user };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

/**
 * Middleware to verify admin access
 */
export async function withAdminAuth(req: NextRequest): Promise<{
  user: AuthPayload | null;
  error?: string;
}> {
  const { user, error } = await withAuth(req);

  if (!user) {
    return { user: null, error: error || 'Unauthorized' };
  }

  if (user.tipo_usuario !== 'admin') {
    return { user: null, error: 'Admin access required' };
  }

  return { user };
}

/**
 * Create an authenticated response
 */
export function createAuthResponse<T>(
  data: T,
  token?: string
): NextResponse<{ success: boolean; data: T }> {
  const response = NextResponse.json({ success: true, data });

  if (token) {
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  }

  return response;
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}
