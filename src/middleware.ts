import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log(`[Middleware] Processing path: ${req.nextUrl.pathname}`);

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Refresh the session if needed
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[Middleware] Session error:', error.message)
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        return redirectToLogin(req)
      }
      return response
    }

    // Protected routes logic
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        return redirectToLogin(req)
      }
    }

    // Login page redirect logic
    if (req.nextUrl.pathname === '/login') {
      if (session) {
        console.log('[Middleware] User is authenticated, redirecting from login to dashboard')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return response
  } catch (e) {
    console.error('[Middleware] Unexpected error:', e)
    // On unexpected error in protected routes, redirect to login
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      return redirectToLogin(req)
    }
    return response
  }
}

// Helper function to handle login redirects
function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
  console.log('[Middleware] Redirecting to login:', loginUrl.toString())
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*?)',
  ],
} 