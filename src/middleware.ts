import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Exclude login page from loop
    if (req.nextUrl.pathname === '/crm360/login') {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname === '/crm360/login') {
          return true;
        }
        return !!token;
      }
    },
    pages: {
      signIn: '/crm360/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths for:
     * - /crm360 and children
     * - /api/* except public APIs
     */
    '/crm360/:path*',
    // Match all APIs except those starting with /api/public, /api/auth, /api/ai
    '/api/((?!public|auth|ai).*)',
  ],
};
