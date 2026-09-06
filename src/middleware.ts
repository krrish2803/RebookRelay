import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Define public paths
  const isPublicAuthPage = pathname.startsWith('/auth/');
  const isPublicConfirmPage = pathname.startsWith('/confirm/');
  const isPublicApi = pathname.startsWith('/api/auth/') || pathname.startsWith('/api/calls/webhook/') || pathname.startsWith('/api/sms/webhook') || pathname.startsWith('/api/confirm') || pathname.startsWith('/api/inngest');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isDashboardApi = pathname.startsWith('/api/') && !isPublicApi;

  // 2. CSRF Protection for mutating methods on non-public API paths
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (mutatingMethods.includes(method) && !isPublicApi) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host') || '';

    // Verify origin matches the host
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return NextResponse.json({ error: 'CSRF validation failed: Invalid Origin' }, { status: 403 });
      }
    } else if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return NextResponse.json({ error: 'CSRF validation failed: Invalid Referer' }, { status: 403 });
      }
    } else {
      // Block mutating requests without origin/referer headers for strict protection
      return NextResponse.json({ error: 'CSRF validation failed: Missing origin/referer headers' }, { status: 403 });
    }
  }

  // 3. Auth Guard
  const sessionToken = request.cookies.get('session')?.value;

  if (isDashboardPage && !isPublicConfirmPage && !sessionToken) {
    // Redirect to login if trying to access dashboard pages without a session
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isDashboardApi && !sessionToken) {
    // Return 401 Unauthorized for private API routes
    return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
  }

  // Allow auth pages if they have a session already (redirect to dashboard)
  if (isPublicAuthPage && sessionToken) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Match all dashboard routes and API routes
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/auth/:path*'],
};
