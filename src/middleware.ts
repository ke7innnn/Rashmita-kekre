import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth checks on login page
  if (pathname === '/crm360/login') {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-key-12345';
  const token = await getToken({ req, secret, secureCookie: process.env.NODE_ENV === 'production' });

  // 1. CRM Page Routes protection
  if (pathname.startsWith('/crm360')) {
    if (!token) {
      const loginUrl = new URL('/crm360/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string)?.toUpperCase();
    const isPhysio = role === 'PHYSIO' || role === 'RECEPTIONIST';

    if (isPhysio) {
      const allowedPaths = ['/crm360', '/crm360/attendance', '/crm360/patients', '/crm360/assessments', '/crm360/billing', '/crm360/appointments'];
      const isExactOverview = pathname === '/crm360';
      const isAllowed = isExactOverview || allowedPaths.some(p => p !== '/crm360' && pathname.startsWith(p));
      if (!isAllowed) {
        const overviewUrl = new URL('/crm360', req.url);
        return NextResponse.redirect(overviewUrl);
      }
    }
  }

  // 2. API Routes protection
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/public') && !pathname.startsWith('/api/auth')) {
    if (!token) {
      // Allow unauthenticated website API requests or internal public widgets if handled by route handler
      return NextResponse.next();
    }

    const role = (token.role as string)?.toUpperCase();
    const isPhysio = role === 'PHYSIO' || role === 'RECEPTIONIST';

    if (isPhysio) {
      const allowedApiPrefixes = ['/api/attendance', '/api/patients', '/api/appointments', '/api/modalities', '/api/settings', '/api/assessments', '/api/billing', '/api/referring-doctors'];
      const isAllowedApi = allowedApiPrefixes.some(p => pathname.startsWith(p));

      if (!isAllowedApi) {
        return NextResponse.json({ error: 'Forbidden. Access restricted for PHYSIO role.' }, { status: 403 });
      }

      // Restrict DELETE actions for PHYSIO role
      if (pathname.startsWith('/api/patients') && req.method === 'DELETE') {
        return NextResponse.json({ error: 'Forbidden. Only ADMIN can delete patient records.' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/crm360/:path*', '/api/:path*'],
};
