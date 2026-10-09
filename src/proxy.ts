import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Route protection lives in the /dashboard layout via `auth.protect()`.
// clerkMiddleware() attaches the auth context to every request.
//
// Forced-org funnel (Nivå 1): an authenticated user without an active
// organization is routed to /dashboard/workspaces — where the org is
// auto-created and activated (zero manual setup). /dashboard/workspaces
// itself is exempt (it hosts the bootstrap UI).
export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith('/dashboard');
  const isWorkspaces = path.startsWith('/dashboard/workspaces');
  if (isDashboard && !isWorkspaces) {
    const { userId, orgId } = await auth();
    if (userId && !orgId) {
      return NextResponse.redirect(
        new URL('/dashboard/workspaces', request.url)
      );
    }
  }
});
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
